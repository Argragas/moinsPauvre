import type { BarcodeFormat, CashbackSource, TypeValeur, Visibility } from './types'

/* ----------------------------- Display types -----------------------------
   Shapes used purely for rendering the UI. Until the Supabase data layer is
   wired up, screens read from this in-memory mock dataset.
*/

export interface EnseigneDisplay {
  id: string
  nom: string
  mark: string
  color: string
  fg: string
  cashbackPct: number | null
  cashbackSource: CashbackSource | null
  cashbackConditions?: string | null
  cashbackUpdatedAt?: string | null
}

export interface OffreDisplay {
  id: string
  enseigneId: string
  source: CashbackSource
  remisePct: number
  montants: number[]
  conditions: string | null
}

export interface CarteCadeauDisplay {
  id: string
  enseigneId: string
  label: string
  code: string
  format: BarcodeFormat
  montantInitial: number
  montantRestant: number
  visibility: Visibility
}

export interface CodePromoDisplay {
  id: string
  enseigneId: string
  code: string
  format: BarcodeFormat
  valeur: number
  typeValeur: TypeValeur
  label: string
  visibility: Visibility
}

export interface UtilisationDisplay {
  id: string
  montant: number
  note: string
  date: string
}

export interface MembreFamille {
  id: string
  name: string
  initials: string
  color: string
  role: 'owner' | 'member'
}

export interface CashbackSourceInfo {
  id: CashbackSource
  nom: string
  color: string
  connected: boolean
  enseignes: number
  maj: string
}

export interface ArchiveItem {
  id: string
  type: 'carte' | 'code'
  enseigneId: string
  label: string
  sub: string
  date: string
  by: string
}

/* ----------------------------- Mock data ----------------------------- */

export const ME = { id: 'u1', name: 'Camille', initials: 'CM', color: '#3E7BFA' }

export const ENSEIGNES: EnseigneDisplay[] = [
  { id: 'e1', nom: 'Sephora', mark: 'S', color: '#1A1A1A', fg: '#fff', cashbackPct: 6, cashbackSource: 'igraal', cashbackConditions: 'Hors French Days', cashbackUpdatedAt: '12 juin' },
  { id: 'e2', nom: 'Decathlon', mark: 'D', color: '#0082C3', fg: '#fff', cashbackPct: 4, cashbackSource: 'widilo' },
  { id: 'e3', nom: 'Fnac', mark: 'F', color: '#E8C400', fg: '#1A1A1A', cashbackPct: 3, cashbackSource: 'manual' },
  { id: 'e4', nom: 'IKEA', mark: 'IK', color: '#0058A3', fg: '#FFDB00', cashbackPct: 2.5, cashbackSource: 'igraal' },
  { id: 'e5', nom: 'Zara', mark: 'Z', color: '#000000', fg: '#fff', cashbackPct: null, cashbackSource: null },
  { id: 'e6', nom: 'Carrefour', mark: 'C', color: '#0058A9', fg: '#fff', cashbackPct: 1.5, cashbackSource: 'igraal', cashbackConditions: 'Hors produits high-tech', cashbackUpdatedAt: '10 juin' },
  { id: 'e7', nom: 'Leroy Merlin', mark: 'LM', color: '#78BE20', fg: '#0E3A12', cashbackPct: 4.5, cashbackSource: 'manual' },
  { id: 'e8', nom: 'Naturalia', mark: 'N', color: '#5B8C2A', fg: '#fff', cashbackPct: 5, cashbackSource: 'widilo' },
]

export const OFFRES: OffreDisplay[] = [
  { id: 'o1', enseigneId: 'e6', source: 'uneo', remisePct: 5, montants: [25, 50, 100], conditions: 'Carte cadeau multi-enseignes' },
  { id: 'o2', enseigneId: 'e2', source: 'uneo', remisePct: 8, montants: [30, 50], conditions: 'Valable 1 an' },
  { id: 'o3', enseigneId: 'e4', source: 'uneo', remisePct: 6, montants: [25, 50, 100, 200], conditions: null },
]

export const CARTES: CarteCadeauDisplay[] = [
  { id: 'c1', enseigneId: 'e1', label: 'Cadeau anniversaire', code: '357890001234', format: 'EAN13', montantInitial: 50, montantRestant: 32.40, visibility: 'personal' },
  { id: 'c2', enseigneId: 'e4', label: 'Carte Family', code: 'IK22918847', format: 'CODE128', montantInitial: 100, montantRestant: 100, visibility: 'family' },
  { id: 'c3', enseigneId: 'e6', label: 'Carte fidélité', code: 'CRF99883011425', format: 'CODE128', montantInitial: 25, montantRestant: 8.50, visibility: 'family' },
  { id: 'c4', enseigneId: 'e2', label: 'Avoir retour', code: 'https://dkt.fr/g/88470012', format: 'QR', montantInitial: 40, montantRestant: 40, visibility: 'personal' },
]

export const CODES: CodePromoDisplay[] = [
  { id: 'p1', enseigneId: 'e1', code: 'SEPHO20', format: 'CODE128', valeur: 20, typeValeur: 'pct', label: '−20% dès 60€', visibility: 'personal' },
  { id: 'p2', enseigneId: 'e1', code: 'BIENVENUE', format: 'CODE128', valeur: 10, typeValeur: 'eur', label: '−10€ 1re commande', visibility: 'personal' },
  { id: 'p3', enseigneId: 'e2', code: 'DKT10NOEL', format: 'CODE128', valeur: 10, typeValeur: 'eur', label: '−10€ dès 50€', visibility: 'personal' },
  { id: 'p4', enseigneId: 'e3', code: 'FNAC5', format: 'CODE128', valeur: 5, typeValeur: 'pct', label: 'Adhérent −5%', visibility: 'family' },
  { id: 'p5', enseigneId: 'e5', code: 'ZARA15', format: 'CODE128', valeur: 15, typeValeur: 'pct', label: '−15% nouvelle co.', visibility: 'personal' },
  { id: 'p6', enseigneId: 'e7', code: 'LM10MERCI', format: 'QR', valeur: 10, typeValeur: 'eur', label: '−10€ dès 80€', visibility: 'family' },
  { id: 'p7', enseigneId: 'e6', code: 'CRF5FIDEL', format: 'CODE128', valeur: 5, typeValeur: 'eur', label: '5€ fidélité', visibility: 'family' },
]

export const UTILISATIONS: Record<string, UtilisationDisplay[]> = {
  c1: [
    { id: 'u_a', montant: 9.00, note: 'Vernis à ongles', date: '28 avr.' },
    { id: 'u_b', montant: 8.60, note: 'Parfum mini', date: '12 mars' },
  ],
  c3: [
    { id: 'u_c', montant: 6.50, note: 'Courses', date: '02 mai' },
    { id: 'u_d', montant: 10.00, note: 'Courses', date: '19 avr.' },
  ],
}

export const FAMILLE = {
  nom: 'Famille Martin',
  invite: 'X7K2',
  membres: [
    { id: 'u1', name: 'Camille', initials: 'CM', color: '#3E7BFA', role: 'owner' },
    { id: 'u2', name: 'Lucas', initials: 'LM', color: '#FF8A4C', role: 'member' },
    { id: 'u3', name: 'Léa', initials: 'LB', color: '#34D49A', role: 'member' },
  ] satisfies MembreFamille[],
}

export const SOURCES: CashbackSourceInfo[] = [
  { id: 'igraal', nom: 'iGraal', color: '#E2007A', connected: true, enseignes: 24, maj: 'il y a 2 h' },
  { id: 'widilo', nom: 'Widilo', color: '#00B5A5', connected: true, enseignes: 11, maj: 'hier' },
  { id: 'uneo', nom: 'Unéo', color: '#0F8A5F', connected: true, enseignes: 6, maj: 'il y a 3 j' },
  { id: 'manual', nom: 'Saisie manuelle', color: '#5A6479', connected: true, enseignes: 2, maj: '—' },
]

export const ARCHIVES: ArchiveItem[] = [
  { id: 'a1', type: 'code', enseigneId: 'e5', label: '−10% soldes hiver', sub: 'Expiré', date: '14 févr.', by: 'Toi' },
  { id: 'a2', type: 'carte', enseigneId: 'e3', label: 'Carte cadeau Fnac', sub: 'Solde épuisé', date: '03 janv.', by: 'Camille' },
]

/* ----------------------------- Helpers ----------------------------- */

export const ens = (id: string): EnseigneDisplay =>
  ENSEIGNES.find(e => e.id === id) ?? ENSEIGNES[0]

export const giftcardOffres = (enseigneId: string): OffreDisplay[] =>
  OFFRES.filter(o => o.enseigneId === enseigneId)

export const euro = (n: number) => {
  const s = n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })
  return `${s} €`
}

export const fmtLabel: Record<BarcodeFormat, string> = {
  EAN13: 'EAN-13',
  CODE128: 'Code 128',
  QR: 'QR Code',
  AZTEC: 'Aztec',
}

export const valeurTxt = (c: { typeValeur: TypeValeur; valeur: number }) =>
  c.typeValeur === 'pct' ? `−${c.valeur}%` : `−${euro(c.valeur)}`

export const sourceLabel: Record<CashbackSource, string> = {
  igraal: 'iGraal',
  widilo: 'Widilo',
  joko: 'Joko',
  uneo: 'Unéo',
  manual: 'Saisie manuelle',
}
