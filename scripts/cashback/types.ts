export type ScrapeSource = 'igraal' | 'joko' | 'uneo'
export type ScrapedKind = 'cashback' | 'giftcard' | 'promo'

/** Une offre telle que lue sur un site (avant matching avec une enseigne). */
export interface ScrapedOffer {
  source: ScrapeSource
  /** Nom de l'enseigne tel qu'affiché sur le site. */
  nom_site: string
  kind: ScrapedKind
  /** % de cashback ('cashback') ou % de remise sur carte cadeau ('giftcard'). */
  remise_pct?: number | null
  /** Montants de cartes cadeaux disponibles ('giftcard'). */
  montants?: number[] | null
  /** Code à saisir ('promo'). */
  code?: string | null
  /** Valeur du code ('promo'). */
  valeur?: number | null
  type_valeur?: 'pct' | 'eur' | null
  conditions?: string | null
}

/** Enseigne de l'utilisateur, cible du scraping. */
export interface EnseigneRef {
  id: string
  nom: string
  nom_normalise: string
  cashback_source: string | null
}
