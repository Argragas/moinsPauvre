import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charge .env.local en priorité (override), puis .env
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url) {
  throw new Error('SUPABASE_URL (ou VITE_SUPABASE_URL) manquant dans .env / .env.local')
}
if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY manquant dans .env / .env.local')
}

/** Compte pour lequel on scrape (v1 : un seul compte). */
export const SCRAPE_USER_ID = process.env.SCRAPE_USER_ID
if (!SCRAPE_USER_ID) {
  throw new Error('SCRAPE_USER_ID manquant dans .env / .env.local')
}

/** Client service_role : contourne la RLS, à usage local uniquement. */
export const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** Ligne d'enseigne minimale, partagée par l'ingestion et les utilitaires. */
export interface EnseigneRow {
  id: string
  nom: string
  cashback_source: string | null
}

/**
 * Récupère TOUTES les enseignes de l'utilisateur en paginant.
 * PostgREST plafonne un `select` à 1000 lignes : sans pagination, les enseignes
 * au-delà de 1000 seraient invisibles (→ doublons créés au prochain ingest).
 */
export async function fetchAllEnseignes(): Promise<EnseigneRow[]> {
  const pageSize = 1000
  const all: EnseigneRow[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from('enseignes')
      .select('id, nom, cashback_source')
      .eq('user_id', SCRAPE_USER_ID)
      .order('nom')
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...(data as EnseigneRow[]))
    if (data.length < pageSize) break
  }
  return all
}
