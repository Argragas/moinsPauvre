import { readFileSync } from 'node:fs'
import { admin, fetchAllEnseignes, SCRAPE_USER_ID } from './client.ts'
import { canonicalName, normalizeName } from './normalize.ts'
import type { EnseigneRef, ScrapedOffer } from './types.ts'

const RESULTS = process.argv[2] ?? 'scripts/cashback/results.json'

function numEq(a: unknown, b: unknown): boolean {
  const na = a == null ? null : Number(a)
  const nb = b == null ? null : Number(b)
  return na === nb
}

function normMontants(m: unknown): number[] | null {
  if (!Array.isArray(m) || m.length === 0) return null
  return m.map(Number).sort((x, y) => x - y)
}

function arrEq(a: unknown, b: unknown): boolean {
  return JSON.stringify(normMontants(a)) === JSON.stringify(normMontants(b))
}

function strEq(a: unknown, b: unknown): boolean {
  return (a ?? null) === (b ?? null)
}

async function upsertEnseigne(nom_site: string, byName: Map<string, EnseigneRef>): Promise<EnseigneRef> {
  const key = canonicalName(nom_site)
  const hit = byName.get(key)
  if (hit) return hit

  const { data, error } = await admin
    .from('enseignes')
    .insert({ nom: nom_site, user_id: SCRAPE_USER_ID })
    .select('id, nom, cashback_source')
    .single()
  if (error) throw error

  const ref: EnseigneRef = {
    id: data.id,
    nom: data.nom,
    nom_normalise: normalizeName(data.nom),
    cashback_source: data.cashback_source,
  }
  byName.set(key, ref)
  return ref
}

async function ingestRate(ref: EnseigneRef, offer: ScrapedOffer) {
  const kind = offer.kind as 'cashback' | 'giftcard'

  const { data: last, error } = await admin
    .from('offres')
    .select('remise_pct, montants, conditions')
    .eq('enseigne_id', ref.id)
    .eq('source', offer.source)
    .eq('kind', kind)
    .order('scraped_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error

  const changed =
    !last ||
    !numEq(last.remise_pct, offer.remise_pct) ||
    !arrEq(last.montants, offer.montants) ||
    !strEq(last.conditions, offer.conditions)

  if (changed) {
    const { error: insErr } = await admin.from('offres').insert({
      enseigne_id: ref.id,
      source: offer.source,
      kind,
      remise_pct: offer.remise_pct ?? null,
      montants: normMontants(offer.montants),
      conditions: offer.conditions ?? null,
    })
    if (insErr) throw insErr
  }

  // Dénormalisation du cashback courant sur l'enseigne (jamais par-dessus une saisie manuelle)
  if (kind === 'cashback' && ref.cashback_source !== 'manual') {
    const { error: updErr } = await admin
      .from('enseignes')
      .update({
        cashback_pct: offer.remise_pct ?? null,
        cashback_source: offer.source,
        cashback_conditions: offer.conditions ?? null,
        cashback_updated_at: new Date().toISOString(),
      })
      .eq('id', ref.id)
    if (updErr) throw updErr
  }

  return changed
}

async function ingestPromo(ref: EnseigneRef, offer: ScrapedOffer): Promise<boolean> {
  if (!offer.code) return false

  const { data: existing, error } = await admin
    .from('codes_promo')
    .select('id')
    .eq('enseigne_id', ref.id)
    .eq('code', offer.code)
    .is('archived_at', null)
    .limit(1)
  if (error) throw error
  if (existing && existing.length > 0) return false // déjà présent

  const { error: insErr } = await admin.from('codes_promo').insert({
    enseigne_id: ref.id,
    user_id: SCRAPE_USER_ID,
    code: offer.code,
    format_barcode: 'CODE128',
    valeur: offer.valeur ?? null,
    type_valeur: offer.type_valeur ?? null,
    visibility: 'personal',
  })
  if (insErr) throw insErr
  return true
}

async function main() {
  const offers: ScrapedOffer[] = JSON.parse(readFileSync(RESULTS, 'utf8'))

  // Charger les enseignes existantes depuis la DB (paginé : > 1000 possibles)
  const existing = await fetchAllEnseignes()

  const byName = new Map<string, EnseigneRef>()
  for (const e of existing) {
    byName.set(canonicalName(e.nom), {
      id: e.id,
      nom: e.nom,
      nom_normalise: normalizeName(e.nom),
      cashback_source: e.cashback_source,
    })
  }

  let ratesChanged = 0
  let ratesUnchanged = 0
  let promosAdded = 0
  let promosSkipped = 0
  let enseignesCreated = 0

  for (const offer of offers) {
    const existedBefore = byName.has(canonicalName(offer.nom_site))
    const ref = await upsertEnseigne(offer.nom_site, byName)
    if (!existedBefore) enseignesCreated++

    if (offer.kind === 'promo') {
      if (await ingestPromo(ref, offer)) promosAdded++
      else promosSkipped++
    } else {
      if (await ingestRate(ref, offer)) ratesChanged++
      else ratesUnchanged++
    }
  }

  console.log(`Enseignes créées : ${enseignesCreated}`)
  console.log(`Taux : ${ratesChanged} mis à jour, ${ratesUnchanged} inchangés`)
  console.log(`Codes promo : ${promosAdded} ajoutés, ${promosSkipped} déjà présents`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
