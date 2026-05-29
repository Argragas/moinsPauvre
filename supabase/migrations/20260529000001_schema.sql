create extension if not exists "pgcrypto";

-- Familles
create table familles (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  created_by uuid references auth.users not null,
  invite_code text unique not null default upper(substring(gen_random_uuid()::text, 1, 4)),
  created_at timestamptz default now()
);

create table famille_membres (
  famille_id uuid references familles on delete cascade,
  user_id uuid references auth.users not null,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  primary key (famille_id, user_id)
);

-- Enseignes
create table enseignes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  nom text not null,
  logo_url text,
  cashback_pct numeric,
  cashback_source text check (cashback_source in ('manual', 'igraal', 'widilo')),
  cashback_source_id text,
  created_at timestamptz default now()
);

-- Cartes cadeaux
create table cartes_cadeaux (
  id uuid primary key default gen_random_uuid(),
  enseigne_id uuid references enseignes on delete cascade not null,
  user_id uuid references auth.users not null,
  label text,
  code text not null,
  format_barcode text not null check (format_barcode in ('EAN13', 'CODE128', 'QR', 'AZTEC')),
  montant_initial numeric not null check (montant_initial >= 0),
  montant_restant numeric not null check (montant_restant >= 0),
  visibility text not null default 'personal' check (visibility in ('personal', 'family')),
  famille_id uuid references familles,
  archived_at timestamptz,
  archived_by uuid references auth.users,
  created_at timestamptz default now()
);

-- Utilisations
create table utilisations (
  id uuid primary key default gen_random_uuid(),
  carte_id uuid references cartes_cadeaux on delete cascade not null,
  user_id uuid references auth.users not null,
  montant numeric not null check (montant > 0),
  note text,
  date date not null,
  created_at timestamptz default now()
);

-- Codes promo
create table codes_promo (
  id uuid primary key default gen_random_uuid(),
  enseigne_id uuid references enseignes on delete cascade not null,
  user_id uuid references auth.users not null,
  code text not null,
  format_barcode text not null check (format_barcode in ('EAN13', 'CODE128', 'QR', 'AZTEC')),
  valeur numeric,
  type_valeur text check (type_valeur in ('pct', 'eur')),
  visibility text not null default 'personal' check (visibility in ('personal', 'family')),
  famille_id uuid references familles,
  archived_at timestamptz,
  archived_by uuid references auth.users,
  created_at timestamptz default now()
);
