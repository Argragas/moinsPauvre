---
name: scrape-cashback
description: >-
  Récupère les taux de cashback et les remises sur cartes cadeaux par enseigne
  en pilotant un navigateur (Chrome DevTools MCP) sur iGraal, Joko et Unéo, puis
  ingère les résultats dans Supabase. À utiliser quand l'utilisateur veut mettre
  à jour / rafraîchir les réductions de la base MoinsPauvre.
---

# Skill : scrape-cashback

Routine locale, semi-manuelle : Claude pilote un vrai navigateur via le serveur MCP
`chrome-devtools` pour lire les réductions par enseigne, puis deux scripts Node lisent/écrivent
dans Supabase. Les sites sont anti-bot (403 sans navigateur) → un navigateur réel est obligatoire.

## Pré-requis (à vérifier au démarrage)
- `.env.local` (ou `.env`) renseigné : `SUPABASE_SERVICE_ROLE_KEY`, `SCRAPE_USER_ID`, et les
  identifiants de sites nécessaires (voir `.env.example`).
- Serveur MCP `chrome-devtools` disponible (déclaré dans `.mcp.json`).

## Étape 1 — Lister les enseignes cibles
Exécuter :
```
npm run cashback:list
```
Produit `scripts/cashback/enseignes.json` : `[{ id, nom, nom_normalise, cashback_source }]`.
Ne scraper QUE ces enseignes (ciblage poli, pas le catalogue entier).

## Étape 2 — Scraper chaque source via le navigateur
Sources définies dans `scripts/cashback/config.ts` :

| Source | URL | Login | Types |
|---|---|---|---|
| iGraal | https://www.igraal.com | non | cashback |
| Joko | https://home.joko.com | oui | cashback |
| Unéo | https://www.groupe-uneo.fr/avantage-avec-uneo | oui (sans 2FA) | giftcard, promo |

Pour chaque source :
1. Ouvrir l'URL avec les outils `chrome-devtools` MCP.
2. Si `requiresLogin`, se connecter avec les identifiants d'env (`<SOURCE>_EMAIL` / `<SOURCE>_PASSWORD`).
   Si un défi (captcha / vérification) bloque, demander à l'utilisateur de se connecter manuellement
   dans la fenêtre, puis continuer.
3. Pour chaque enseigne de `enseignes.json` : utiliser la recherche du site, ouvrir la fiche,
   lire la réduction et ses conditions.
4. **Temporiser 2 à 4 s entre les requêtes** pour rester respectueux du site.

Accumuler toutes les offres trouvées dans `scripts/cashback/results.json`.

## Schéma de `results.json`
Tableau d'objets. Champs selon `kind` :
```jsonc
[
  // Cashback (iGraal, Joko) : un pourcentage
  { "source": "igraal", "nom_site": "Carrefour", "kind": "cashback", "remise_pct": 4, "conditions": null },

  // Carte cadeau à remise (Unéo) : % de remise + montants dispo si connus
  { "source": "uneo", "nom_site": "Carrefour", "kind": "giftcard", "remise_pct": 5, "montants": [25, 50, 100], "conditions": "via espace adhérent" },

  // Code promo : code + valeur
  { "source": "uneo", "nom_site": "Sephora", "kind": "promo", "code": "ETE10", "valeur": 10, "type_valeur": "pct", "conditions": null }
]
```
- `nom_site` = nom exact affiché sur le site (le matching avec la DB est fait par l'ingestion).
- Omettre les champs non pertinents pour le `kind` concerné.
- Ne PAS inventer de valeur : si une réduction est introuvable pour une enseigne, ne pas créer d'entrée.

## Étape 3 — Ingestion en base
Exécuter :
```
npm run cashback:ingest
```
(ou `npm run cashback:ingest -- chemin/vers/results.json` pour un autre fichier).

Le script :
- matche `nom_site` ↔ enseigne (normalisation + alias) ;
- route par `kind` : `cashback`/`giftcard` → table `offres` (nouvelle ligne **seulement si la
  valeur change**) ; `cashback` met aussi à jour `enseignes.cashback_pct` (sauf source `manual`) ;
  `promo` → table `codes_promo` (dédupliqué par enseigne + code) ;
- affiche un résumé : taux mis à jour / inchangés, codes ajoutés, et la liste des **non matchés**.

## Étape 4 — Rapport
Restituer à l'utilisateur le résumé de l'ingestion. Pour chaque enseigne **non matchée**, proposer
d'ajouter un alias dans `scripts/cashback/normalize.ts` (`ALIASES`) puis de relancer l'étape 3.
