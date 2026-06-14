import type { ScrapeSource } from './types.ts'

export interface SourceConfig {
  id: ScrapeSource
  nom: string
  url: string
  requiresLogin: boolean
  /** Types d'offres généralement disponibles sur la source. */
  kinds: Array<'cashback' | 'giftcard' | 'promo'>
  notes: string
}

/** Sources scrapées en v1. URLs vérifiées le 2026-06-01 (toutes anti-bot → navigateur requis). */
export const SOURCES: SourceConfig[] = [
  {
    id: 'igraal',
    nom: 'iGraal',
    url: 'https://www.igraal.com',
    requiresLogin: false,
    kinds: ['cashback'],
    notes: "Cashback %. Recherche d'enseigne via la barre de recherche du site.",
  },
  // {
  //   id: 'joko',
  //   nom: 'Joko',
  //   url: 'https://home.joko.com',
  //   requiresLogin: true,
  //   kinds: ['cashback'],
  //   notes: 'Cashback %. Site anti-bot (403), login requis.',
  // },
  {
    id: 'uneo',
    nom: 'Unéo',
    url: 'https://www.groupe-uneo.fr/avantage-avec-uneo',
    requiresLogin: true,
    kinds: ['giftcard', 'promo'],
    notes: 'Portail avantages mutuelle : cartes cadeaux à remise + codes promo. Login sans 2FA, anti-bot.',
  },
]
