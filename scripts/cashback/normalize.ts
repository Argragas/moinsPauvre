/**
 * Normalise un nom d'enseigne pour le matching site ↔ DB :
 * minuscules, sans accents, sans ponctuation/espaces, suffixes courants retirés.
 */
export function normalizeName(raw: string): string {
  let s = raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

  // Retire les suffixes/qualificatifs fréquents
  s = s.replace(/\b(fr|com|france|store|shop|officiel|official)\b/g, ' ').trim()

  return s.replace(/\s+/g, '')
}

/**
 * Alias manuels pour les cas où la normalisation ne suffit pas.
 * Clé et valeur sont comparées sous forme normalisée.
 */
export const ALIASES: Record<string, string> = {
  fnacdarty: 'fnac',
  laredoute: 'redoute',
  // Doublons cross-source confirmés (Unéo ↔ iGraal pour le même marchand)
  nintendoeshopcard: 'nintendoeshop', // Unéo "Nintendo Eshop Card" = iGraal "Nintendo eShop"
  cartecadeausteamviastartselect: 'steam', // iGraal "Carte Cadeau Steam (via Startselect)" = Unéo "Steam"
}

/** Applique la normalisation puis un éventuel alias. */
export function canonicalName(raw: string): string {
  const n = normalizeName(raw)
  return ALIASES[n] ?? n
}
