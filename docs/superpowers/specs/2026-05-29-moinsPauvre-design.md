# MoinsPauvre — Design Spec

**Date:** 2026-05-29
**Statut:** Approuvé

---

## 1. Objectif

PWA mobile permettant de stocker et afficher des codes de réduction et cartes cadeaux sous forme de code-barre, groupés par enseigne. L'app stocke aussi les taux de cashback par enseigne (importés ou saisis manuellement). Un mode famille permet le partage de codes entre membres d'un foyer.

---

## 2. Stack technique

| Couche | Choix |
|---|---|
| Frontend | React + Vite (PWA), TailwindCSS |
| Auth / DB / Backend | Supabase (PostgreSQL, Auth, Edge Functions, RLS) |
| Génération barcode | `bwip-js` (côté client) |
| Import cashback | Edge Functions Supabase → scraping/API iGraal & Widilo |
| Déploiement | Vercel ou Netlify |

---

## 3. Modèle de données

```sql
-- Familles
familles (
  id uuid PK,
  nom text,
  created_by uuid FK users,
  invite_code text UNIQUE,  -- court, ex: "X7K2"
  created_at timestamptz
)

famille_membres (
  famille_id uuid FK familles,
  user_id uuid FK users,
  role text CHECK (role IN ('owner', 'member')),
  joined_at timestamptz,
  PRIMARY KEY (famille_id, user_id)
)

-- Enseignes
enseignes (
  id uuid PK,
  user_id uuid FK users,
  nom text NOT NULL,
  logo_url text,  -- auto-fetch via Clearbit API ou favicon du domaine enseigne
  cashback_pct numeric,
  cashback_source text,       -- 'manual' | 'igraal' | 'widilo'
  cashback_source_id text,    -- identifiant enseigne chez la source
  created_at timestamptz
)

-- Cartes cadeaux
cartes_cadeaux (
  id uuid PK,
  enseigne_id uuid FK enseignes,
  user_id uuid FK users,
  label text,
  code text NOT NULL,
  format_barcode text NOT NULL,  -- 'EAN13' | 'CODE128' | 'QR' | 'AZTEC'
  montant_initial numeric NOT NULL,
  montant_restant numeric NOT NULL,
  visibility text DEFAULT 'personal' CHECK (visibility IN ('personal', 'family')),
  famille_id uuid FK familles,
  archived_at timestamptz,
  archived_by uuid FK users,
  created_at timestamptz
)

-- Utilisations de cartes cadeaux
utilisations (
  id uuid PK,
  carte_id uuid FK cartes_cadeaux,
  user_id uuid FK users,
  montant numeric NOT NULL,
  note text,
  date date NOT NULL,
  created_at timestamptz
)

-- Codes promo
codes_promo (
  id uuid PK,
  enseigne_id uuid FK enseignes,
  user_id uuid FK users,
  code text NOT NULL,
  format_barcode text NOT NULL,
  valeur numeric,
  type_valeur text CHECK (type_valeur IN ('pct', 'eur')),
  visibility text DEFAULT 'personal' CHECK (visibility IN ('personal', 'family')),
  famille_id uuid FK familles,
  archived_at timestamptz,
  archived_by uuid FK users,
  created_at timestamptz
)
```

**Row Level Security :**
- Codes/cartes `personal` : visibles par `user_id` uniquement.
- Codes/cartes `family` : visibles par tous les membres de `famille_id`.
- Archivage autorisé à tout membre de la famille (pas seulement le créateur).

---

## 4. Navigation — Architecture Centré Enseigne

```
Accueil
├── Recherche live par nom d'enseigne
├── Liste enseignes (avec compteur codes + cartes + cashback)
└── → Fiche Enseigne
    ├── Taux cashback (source + %)
    ├── Cartes cadeaux (solde restant, badge Famille si partagée)
    │   └── → Affichage Barcode (plein écran, luminosité max)
    │   └── → Historique utilisations
    ├── Codes promo (valeur, badge Famille si partagé)
    │   └── → Affichage Barcode
    └── → Ajout carte / code

Ma Famille
├── Membres
├── Invite code à partager
└── Codes & cartes partagés (tous types)

Cashback
├── Sources connectées (iGraal, Widilo, Manuel)
└── Taux importés par enseigne

Archives
└── Codes/cartes archivés, restaurables
```

---

## 5. Écrans principaux

### ① Accueil
Liste des enseignes sauvegardées par l'utilisateur. Barre de recherche live en haut. Chaque enseigne affiche un résumé (nb cartes, nb codes, cashback %). Bouton d'ajout d'enseigne.

### ② Fiche Enseigne
Affiche le taux cashback de l'enseigne (source indiquée). Liste des cartes cadeaux avec solde restant. Liste des codes promo avec valeur. Les items familiaux portent un badge "👨‍👩‍👧". Accès rapide à l'ajout de carte ou code.

### ③ Affichage Barcode
Plein écran, fond blanc, luminosité montée au max automatiquement. Affiche le barcode généré par `bwip-js` au format choisi. Bouton "Marquer une utilisation" pour les cartes cadeaux.

### ④ Ajout Code / Carte
Formulaire : type (carte/code), enseigne (sélection ou création), code saisi manuellement, format barcode (EAN-13 / Code 128 / QR / Aztec), montant initial (carte uniquement), visibilité (Personnel / Famille).

### ⑤ Historique Carte Cadeau
Solde initial, solde restant, liste des utilisations (date, montant, note). Bouton "Ajouter utilisation" — saisie du montant dépensé. Un trigger PostgreSQL met à jour `montant_restant` sur `cartes_cadeaux` à chaque INSERT dans `utilisations`.

### ⑥ Ma Famille
Créer une famille ou rejoindre via code court. Voir les membres. Code d'invitation à partager. Liste des codes/cartes familiaux.

### ⑦ Cashback
Connexion aux sources (iGraal, Widilo). Import automatique des taux. Possibilité de saisir un taux manuel sur n'importe quelle enseigne.

### ⑧ Archives
Liste des codes/cartes archivés. Bouton "Restaurer" par item.

---

## 6. Mode Famille — détail

- Un utilisateur peut appartenir à une seule famille.
- La famille est créée par un `owner`, rejointe par les `members` via `invite_code`.
- Tout membre peut archiver un code/carte familial — pas de suppression.
- Les codes archivés sont masqués par défaut, visibles dans la section Archives.
- L'archivage enregistre `archived_at` et `archived_by`.

---

## 7. Import Cashback

- Edge Function Supabase planifiée (cron) ou déclenchée à la demande.
- Sources : iGraal et Widilo (scraping ou API partenaire si disponible).
- Résultat : mise à jour de `cashback_pct` et `cashback_source` sur les enseignes correspondantes.
- L'utilisateur peut toujours écraser avec une valeur manuelle (`cashback_source = 'manual'`).

---

## 8. PWA / Offline

- Service Worker met en cache les données de l'accueil et des fiches.
- Affichage des barcodes fonctionne offline (code stocké localement via cache).
- Sync au retour de connexion.

---

## 9. Hors scope (v1)

- Scan caméra de barcode
- Notifications d'expiration
- Partage public de codes
- Plusieurs familles par compte
- Paiement / abonnement
