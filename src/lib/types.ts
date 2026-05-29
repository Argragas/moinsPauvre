export type BarcodeFormat = 'EAN13' | 'CODE128' | 'QR' | 'AZTEC'
export type Visibility = 'personal' | 'family'
export type FamilleRole = 'owner' | 'member'
export type CashbackSource = 'manual' | 'igraal' | 'widilo'
export type TypeValeur = 'pct' | 'eur'

export interface Enseigne {
  id: string
  user_id: string
  nom: string
  logo_url: string | null
  cashback_pct: number | null
  cashback_source: CashbackSource | null
  cashback_source_id: string | null
  created_at: string
}

export interface CarteCadeau {
  id: string
  enseigne_id: string
  user_id: string
  label: string | null
  code: string
  format_barcode: BarcodeFormat
  montant_initial: number
  montant_restant: number
  visibility: Visibility
  famille_id: string | null
  archived_at: string | null
  archived_by: string | null
  created_at: string
}

export interface Utilisation {
  id: string
  carte_id: string
  user_id: string
  montant: number
  note: string | null
  date: string
  created_at: string
}

export interface CodePromo {
  id: string
  enseigne_id: string
  user_id: string
  code: string
  format_barcode: BarcodeFormat
  valeur: number | null
  type_valeur: TypeValeur | null
  visibility: Visibility
  famille_id: string | null
  archived_at: string | null
  archived_by: string | null
  created_at: string
}

export interface Famille {
  id: string
  nom: string
  created_by: string
  invite_code: string
  created_at: string
}

export interface FamilleMembre {
  famille_id: string
  user_id: string
  role: FamilleRole
  joined_at: string
}
