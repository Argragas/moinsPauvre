---
name: scrape-cashback
description: >-
  Récupère les taux de cashback et les remises sur cartes cadeaux sur iGraal et Unéo
  en pilotant un navigateur (Chrome DevTools MCP), ingère les résultats dans Supabase
  et crée automatiquement les enseignes manquantes. À utiliser quand l'utilisateur veut
  mettre à jour / rafraîchir les réductions de la base MoinsPauvre.
---

# Skill : scrape-cashback

Routine locale, semi-manuelle : Claude pilote un vrai navigateur via le serveur MCP
`chrome-devtools` pour parcourir le catalogue complet de chaque site, puis un script Node
ingère les résultats dans Supabase en créant automatiquement les enseignes absentes.
Les sites sont anti-bot (403 sans navigateur) → un navigateur réel est obligatoire.

## Pré-requis (à vérifier au démarrage)
- `.env` renseigné : `SUPABASE_SERVICE_ROLE_KEY`, `SCRAPE_USER_ID`, et les identifiants
  de sites nécessaires (voir `.env.example`).
- Serveur MCP `chrome-devtools` disponible (déclaré dans `.mcp.json`).

## Étape 1 — Scraper chaque source via le navigateur
Sources définies dans `scripts/cashback/config.ts` :

| Source | URL | Login | Types |
|---|---|---|---|
| iGraal | https://www.igraal.com | non | cashback |
| Unéo | https://www.groupe-uneo.fr/avantage-avec-uneo | oui (sans 2FA) | giftcard, promo |

Objectif : parcourir le **catalogue complet** de chaque site et collecter toutes les enseignes
disponibles (pas uniquement celles déjà en base).

Pour chaque source :
1. Ouvrir l'URL avec les outils `chrome-devtools` MCP.
2. Si `requiresLogin`, se connecter avec les identifiants d'env (`<SOURCE>_EMAIL` / `<SOURCE>_PASSWORD`).
   Si un défi (captcha / vérification) bloque, demander à l'utilisateur de se connecter manuellement
   dans la fenêtre, puis continuer.
3. Naviguer sur la page listant toutes les enseignes / parcourir les pages du catalogue.
   Pour chaque enseigne listée : lire le nom affiché, le taux de réduction, les conditions.
4. **Temporiser 2 à 4 s entre les pages** pour rester respectueux du site.

Accumuler toutes les offres trouvées dans `scripts/cashback/results.json`.

## Schéma de `results.json`
Tableau d'objets. Champs selon `kind` :
```jsonc
[
  // Cashback (iGraal) : un pourcentage
  { "source": "igraal", "nom_site": "Carrefour", "kind": "cashback", "remise_pct": 4, "conditions": null },

  // Carte cadeau à remise (Unéo) : % de remise + montants dispo si connus
  { "source": "uneo", "nom_site": "Carrefour", "kind": "giftcard", "remise_pct": 5, "montants": [25, 50, 100], "conditions": "via espace adhérent" },

  // Code promo : code + valeur
  { "source": "uneo", "nom_site": "Sephora", "kind": "promo", "code": "ETE10", "valeur": 10, "type_valeur": "pct", "conditions": null }
]
```
- `nom_site` = nom exact affiché sur le site.
- Omettre les champs non pertinents pour le `kind` concerné.
- Ne PAS inventer de valeur : si le taux est absent ou ambigu, ne pas créer d'entrée.

## Étape 2 — Ingestion en base
Exécuter :
```
npm run cashback:ingest
```
(ou `npm run cashback:ingest -- chemin/vers/results.json` pour un autre fichier).

Le script :
- charge les enseignes existantes depuis la DB ;
- pour chaque offre : matche `nom_site` ↔ enseigne (normalisation + alias) ;
  **si absente → crée l'enseigne automatiquement** (`INSERT INTO enseignes`) ;
- route par `kind` : `cashback`/`giftcard` → table `offres` (nouvelle ligne **seulement si la
  valeur change**) ; `cashback` met aussi à jour `enseignes.cashback_pct` (sauf source `manual`) ;
  `promo` → table `codes_promo` (dédupliqué par enseigne + code) ;
- affiche un résumé : enseignes créées, taux mis à jour / inchangés, codes ajoutés.

## Étape 3 — Détection des doublons d'enseignes
iGraal et Unéo nomment parfois différemment le même marchand ("E.Leclerc" vs "E Leclerc",
"Bouygues Telecom" vs "Bouygues Telecom - Smart TV"…) → la normalisation ne les fusionne pas
toujours, créant deux enseignes pour un seul marchand.

Lancer la détection :
```
npm run cashback:dedup
```
Le script liste :
- les **doublons exacts** (même nom canonique) — fusionnables sans risque ;
- les **doublons probables** (heuristique : inclusion de sous-chaîne / distance ≤ 1), avec pour
  chacun une ligne `ALIASES['…'] = '…'` à copier.

**Important — le taux par source est toujours conservé.** Les % de cashback / remise vivent dans
la table `offres` (une ligne par `source` : `igraal`, `uneo`…). Fusionner ne fait que ré-pointer
ces lignes (et les `codes_promo`) sur l'enseigne canonique : les taux iGraal **et** Unéo restent
distincts et consultables via `offres.source`. Seul `enseignes.cashback_pct` (valeur dénormalisée
unique) est recalculé depuis l'offre cashback la plus récente (jamais par-dessus une source `manual`).

Pour appliquer la fusion des doublons confirmés :
1. Copier les paires retenues dans `ALIASES` (`scripts/cashback/normalize.ts`).
2. Relancer `npm run cashback:dedup -- --apply` : les enseignes désormais canoniquement
   identiques sont fusionnées (offres par source préservées). On peut aussi relancer
   l'étape 2 pour ré-ingérer avec les nouveaux alias.

### Nettoyage France-only (optionnel)
Le catalogue contient des variantes pays étrangères ("Dyson Belgique", "Europcar Belgique"…)
qui font doublon avec la marque FR. Pour une base destinée à la France :
```
npm run cashback:drop-foreign            # liste les enseignes étrangères (dry-run)
npm run cashback:drop-foreign -- --apply # les supprime (offres + codes_promo inclus)
```
Détection par marqueur pays dans le nom (Belgique, Suisse, Espagne, Italie…). **Toujours
relire la liste en dry-run avant `--apply`** (suppression définitive).

## Étape 4 — Rapport
Restituer à l'utilisateur le résumé de l'ingestion et, le cas échéant, la liste des doublons
détectés avec les alias proposés.
