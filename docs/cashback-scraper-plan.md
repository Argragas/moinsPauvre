# Plan — Routine de scraping cashback → Supabase

**Date :** 2026-06-01
**Statut :** Proposition (à valider)
**Branche :** `claude/cashback-scraper-plan-PfZG4`

---

## 1. Objectif

Construire une routine **locale et manuelle** qui visite des sites de cashback (sans API
publique), extrait le taux de cashback par enseigne en **pilotant un navigateur via un LLM**
(Chrome MCP ou `browser-use`), puis met à jour la base Supabase de MoinsPauvre — en conservant
un **historique uniquement lorsque le taux change**.

### Décisions validées

| Sujet | Choix |
|---|---|
| Hébergement / exécution | Local, lancé à la main |
| Extraction | Assistée par LLM via **Chrome MCP** (piloté par Claude Code) ou **browser-use** |
| Sites cibles v1 | **iGraal**, **Joko**, **Unéo** ([groupe-uneo.fr/avantage-avec-uneo](https://www.groupe-uneo.fr/avantage-avec-uneo)) |
| Stockage | Valeur courante sur `enseignes` + table d'historique, **insert seulement si le taux change** |

---

## 2. Contraintes techniques importantes

1. **Pas d'Edge Function pour le scraping.** Les Edge Functions Supabase tournent sur Deno et ne
   peuvent pas piloter un vrai navigateur headless. Le spec d'origine (§7) prévoyait du scraping
   en Edge Function : ce point est révisé — l'extraction se fait **en local**.
2. **Écriture en base via `service_role`.** Les `enseignes` sont liées à un `user_id` et protégées
   par RLS. Un script local qui écrit pour le compte de l'utilisateur a besoin de la clé
   `service_role` (qui contourne la RLS). Elle ne doit **jamais** être commitée ni embarquée dans
   le front (`.env` est déjà gitignoré).
3. **Ciblage, pas catalogue complet.** La routine ne scrape pas l'intégralité des catalogues : elle
   lit d'abord les enseignes déjà présentes dans la DB de l'utilisateur, puis cherche chacune sur
   chaque site. Moins de requêtes, plus respectueux des sites.
4. **Légal / ToS.** Le scraping de ces sites peut être contraire à leurs CGU. Usage personnel,
   faible volume, délais entre requêtes, pas de revente des données. À assumer côté utilisateur.
5. **Sites anti-bot.** Vérifié le 2026-06-01 : `groupe-uneo.fr` **et** `home.joko.com` renvoient
   **403 Forbidden** à une requête HTTP simple (sans navigateur). Confirme qu'un vrai navigateur
   headless est obligatoire et qu'il faut un comportement « humain » : login réel, en-têtes/UA
   navigateur, délais entre actions. Une approche `fetch`/`curl` est exclue d'emblée.
6. **Types d'offres hétérogènes.** iGraal/Joko exposent un **taux de cashback %**. Unéo est un
   **portail d'avantages de mutuelle** : ses offres sont surtout des **remises € ou codes promo
   partenaires**, pas un cashback %. Le pipeline doit gérer ces deux natures de données
   (voir §4.4 et §6.4).

---

## 3. Architecture d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│  Commande locale : skill Claude Code  /scrape-cashback           │
└───────────────┬─────────────────────────────────────────────────┘
                │
   ┌────────────▼────────────┐   1. liste les enseignes de l'utilisateur
   │ npm run cashback:list   │──────────────────────────────────────────┐
   │ (Node + service_role)   │   → enseignes.json {id, nom normalisé}    │
   └─────────────────────────┘                                           │
                │                                                          │
   ┌────────────▼─────────────────────────────────────────┐               │
   │ Claude Code pilote le navigateur (Chrome MCP)         │               │
   │  pour chaque site (iGraal, Joko, Uneo) :              │               │
   │   - login si nécessaire (creds depuis .env)           │               │
   │   - recherche chaque enseigne                         │               │
   │   - lit le taux + conditions depuis la page           │               │
   │   - écrit results.json {source, nom, pct, conditions} │               │
   └────────────┬──────────────────────────────────────────┘               │
                │                                                          │
   ┌────────────▼────────────┐   3. matching nom ↔ enseigne_id            │
   │ npm run cashback:ingest │◄──────────────────────────────────────────┘
   │ (Node + service_role)   │   4. route par kind (cashback/giftcard/promo)
   └─────────────────────────┘   5. INSERT offres SI valeur change ; codes→codes_promo
```

Le « LLM qui extrait » est **Claude Code lui-même** lisant les pages via Chrome MCP. L'ingestion
(matching + écriture) reste un script Node déterministe et testable.

---

## 4. Modèle de données

### 4.1 Migration `enseignes`

Étendre la contrainte `cashback_source` et ajouter deux colonnes utiles :

```sql
-- supabase/migrations/20260601000001_cashback_sources.sql
alter table enseignes drop constraint enseignes_cashback_source_check;
alter table enseignes add constraint enseignes_cashback_source_check
  check (cashback_source in ('manual', 'igraal', 'widilo', 'joko', 'uneo'));

alter table enseignes add column if not exists cashback_conditions text;
alter table enseignes add column if not exists cashback_updated_at timestamptz;
```

> `manual` et `widilo` sont conservés (déjà présents dans le schéma). On ajoute `joko` et `uneo`.
> Les types TS (`src/lib/types.ts`, `CashbackSource`) seront mis à jour en conséquence.

### 4.2 Trois natures d'offres scrapées

Une enseigne peut cumuler plusieurs types de réduction selon les sources :

| `kind` | Définition | Exemple | Donnée clé |
|---|---|---|---|
| `cashback` | % rendu après achat | iGraal Carrefour 4% | `remise_pct` |
| `giftcard` | **carte cadeau à prix réduit** : carte 100€ payée 95€ | Unéo Carrefour −5% | `remise_pct` (+ montants dispo) |
| `promo` | code de réduction à saisir | Code « ÉTÉ10 » | `code` + `valeur` |

`cashback` et `giftcard` sont **des taux** (mêmes mécaniques, table commune §4.3). `promo` a un
**code** → va dans la table existante `codes_promo` (§4.5). Les `cartes_cadeaux` (cartes
*possédées*, avec solde) restent **saisies manuellement** : un site ne te donne le vrai code
qu'après achat — le scraper ne stocke que **l'offre** (« carte Carrefour dispo à −5% chez Unéo »).

### 4.3 Table unifiée des taux scrapés `offres`

Remplace l'idée d'une table `cashback_history` dédiée : une seule table couvre cashback **et**
remises carte cadeau, avec l'historique intégré (append-on-change).

```sql
-- supabase/migrations/20260601000001_cashback_sources.sql
create table offres (
  id uuid primary key default gen_random_uuid(),
  enseigne_id uuid references enseignes on delete cascade not null,
  source text not null
    check (source in ('manual', 'igraal', 'widilo', 'joko', 'uneo')),
  kind text not null check (kind in ('cashback', 'giftcard')),
  remise_pct numeric,            -- % cashback OU % remise sur la carte cadeau
  montants numeric[],            -- montants de cartes dispo (giftcard), nullable
  conditions text,
  scraped_at timestamptz default now()
);

-- "valeur courante" = ligne la plus récente par (enseigne, source, kind)
create index offres_courant_idx on offres (enseigne_id, source, kind, scraped_at desc);

alter table offres enable row level security;
create policy "offres_select_own" on offres for select
  using (exists (
    select 1 from enseignes e
    where e.id = offres.enseigne_id and e.user_id = auth.uid()
  ));
-- INSERT via service_role (bypass RLS), pas de policy d'insert côté client.
```

> `enseignes.cashback_pct` reste alimentée (dénormalisation) pour `kind='cashback'`, afin que les
> écrans actuels continuent de fonctionner sans refonte. Les remises `giftcard` se lisent depuis
> `offres`.

### 4.4 Règle « historique seulement si la valeur change »

À l'ingestion, pour chaque `(enseigne_id, source, kind)` :
1. lire la ligne la plus récente (`order by scraped_at desc limit 1`) ;
2. comparer `remise_pct` (+ `montants`, `conditions`) à la valeur scrapée ;
3. **INSERT dans `offres` uniquement si différent** (ou s'il n'existe aucune ligne) — d'où un
   historique qui ne grossit qu'aux vrais changements ;
4. pour `kind='cashback'` : `UPDATE enseignes.cashback_pct` + `cashback_updated_at = now()`,
   **sauf** si `cashback_source = 'manual'` (on ne piétine pas une saisie manuelle).

### 4.5 Codes promo

`kind='promo'` → table existante **`codes_promo`** (`code`, `valeur`, `type_valeur` `'pct'|'eur'`,
`format_barcode`), cohérent avec l'écran « Codes promo » de l'app.

---

## 5. Arborescence des fichiers à créer

```
.mcp.json                              # config serveur MCP navigateur (Chrome DevTools MCP)
.claude/skills/scrape-cashback/SKILL.md# procédure pas-à-pas suivie par Claude Code
scripts/cashback/
  ├── config.ts                        # sources : URL, motif de recherche, login requis ?
  ├── types.ts                         # ScrapedOffer, EnseigneRef
  ├── client.ts                        # client Supabase service_role (Node)
  ├── list-enseignes.ts                # → enseignes.json (cible du scraping)
  ├── ingest.ts                        # matching + update + history (diff)
  └── normalize.ts                     # normalisation des noms d'enseignes
docs/cashback-scraper-plan.md          # ce document
supabase/migrations/20260601000001_cashback_sources.sql
```

Ajouts à `package.json` (scripts) :

```json
"cashback:list":   "tsx scripts/cashback/list-enseignes.ts",
"cashback:ingest": "tsx scripts/cashback/ingest.ts"
```

Ajouts à `.env.example` (jamais de vraies valeurs commitées) :

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SCRAPE_USER_ID=uuid-de-ton-compte
# Identifiants des sites (optionnels selon login requis)
IGRAAL_EMAIL=
IGRAAL_PASSWORD=
JOKO_EMAIL=
JOKO_PASSWORD=
UNEO_EMAIL=
UNEO_PASSWORD=
```

Dépendances dev à ajouter : `tsx` (exécution TS), `dotenv`. Le serveur Chrome MCP
(`chrome-devtools-mcp` ou `@playwright/mcp`) est lancé par Claude Code, pas une dépendance npm
du projet.

---

## 6. Détail des composants

### 6.1 `list-enseignes.ts`
Lit toutes les `enseignes` du `SCRAPE_USER_ID` via service_role, écrit `enseignes.json`
(`[{id, nom, nom_normalise, cashback_source}]`). Sert de liste de cibles au navigateur.

### 6.2 Étape navigateur (pilotée par Claude via Chrome MCP)
Décrite dans le skill `scrape-cashback`. Pour chaque site de `config.ts` :
- ouvrir l'URL, se logger si `requiresLogin` (creds env, gestion du 2FA en manuel — voir §9) ;
- pour chaque enseigne de `enseignes.json` : utiliser la recherche du site, ouvrir la fiche,
  lire taux + conditions ;
- temporiser entre requêtes (ex. 2–4 s) ;
- accumuler dans `results.json` : `[{source, nom_site, kind, remise_pct?, montants?, code?, valeur?, conditions}]`
  où `kind ∈ 'cashback'|'giftcard'|'promo'` (§4.2).

### 6.3 `normalize.ts`
Normalisation pour le matching nom site ↔ nom DB : minuscules, sans accents, sans espaces/
ponctuation, suppression de suffixes (`.fr`, `france`, `store`…). Table d'alias manuelle pour
les cas tordus (ex. « Fnac.com » → « fnac »).

### 6.4 `ingest.ts`
- charge `results.json` + `enseignes.json` ;
- matche chaque offre à une enseigne (exact normalisé, puis alias ; sinon → rapport « non matché ») ;
- route par `kind` : `cashback`/`giftcard` → table `offres` (diff §4.4) ; `promo` → `codes_promo` ;
- pour `cashback`, met aussi à jour `enseignes.cashback_pct` (sauf source `manual`) ;
- affiche un résumé : N taux mis à jour, M inchangés, K non matchés, P codes promo ajoutés.

---

## 7. Déroulé d'une exécution (UX cible)

```
1. $ npm run cashback:list            # génère enseignes.json
2. Dans Claude Code :  /scrape-cashback
     → Claude ouvre Chrome (MCP), parcourt iGraal/Joko/Uneo, remplit results.json
3. $ npm run cashback:ingest          # met à jour Supabase + historique
4. L'app PWA affiche les nouveaux taux (écran Cashback / fiche Enseigne)
```

Une variante 100 % autonome avec **browser-use** (script Python + clé LLM) est documentée en
option (§8) si tu préfères ne pas garder Claude Code dans la boucle à chaque run.

---

## 8. Option alternative : `browser-use` (autonome)

Au lieu du pilotage via Chrome MCP par Claude Code, un script `scripts/cashback/agent.py`
utilisant la lib `browser-use` + un modèle Claude conduit le navigateur en autonomie et écrit
`results.json`. Avantage : pas besoin d'ouvrir Claude Code. Inconvénient : dépendance Python +
clé API LLM + coût par run. Le reste du pipeline (migration, ingest, historique) est identique.

À choisir au moment de l'implémentation ; je partirais d'abord sur **Chrome MCP** (colle à
« automatiser un navigateur avec Claude Code »).

---

## 9. Points ouverts / à confirmer avant implémentation

1. **Unéo — résolu.** URL : `groupe-uneo.fr/avantage-avec-uneo`. Login requis, **sans 2FA**.
   Portail d'avantages de mutuelle → offres = remises/codes promo (voir §4.4, option A
   recommandée : alimenter `codes_promo`). Site **anti-bot (403)** → navigateur obligatoire.
2. **Joko — résolu.** Site web : `home.joko.com` (anti-bot 403, navigateur requis). Reste en v1.
3. **Stockage — résolu (§4).** Cashback % et **cartes cadeaux à remise** → table `offres`
   (avec `enseignes.cashback_pct` dénormalisée) ; codes promo → `codes_promo` ; cartes cadeaux
   possédées → manuelles, non scrapées.
4. **`SCRAPE_USER_ID`** — confirmer qu'on scrape pour un seul compte (le tien) en v1.
5. **Identifiants** — logins iGraal / Joko / Unéo à fournir via `.env` local au moment de
   l'implémentation/des tests (jamais commités).

---

## 10. Lot de livraison (ordre d'implémentation)

1. Migration SQL (`enseignes` étendu + table `offres` + RLS) et MAJ `src/lib/types.ts`.
2. Scripts Node : `client.ts`, `list-enseignes.ts`, `normalize.ts`, `ingest.ts` + scripts npm.
3. `.mcp.json` (Chrome MCP) + skill `.claude/skills/scrape-cashback/SKILL.md`.
4. MAJ `.env.example` + section README « Mettre à jour les taux de cashback ».
5. Test de bout en bout sur 2–3 enseignes réelles, ajustement des alias de normalisation.

---

*Aucun code n'est encore écrit : ce document est le plan à valider. Dis-moi quelles options tu
retiens (notamment §9) et je passe à l'implémentation lot par lot.*
