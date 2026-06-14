-- Étend les sources de cashback (ajout joko, uneo) et ajoute des métadonnées
alter table enseignes drop constraint enseignes_cashback_source_check;
alter table enseignes add constraint enseignes_cashback_source_check
  check (cashback_source in ('manual', 'igraal', 'widilo', 'joko', 'uneo'));

alter table enseignes add column if not exists cashback_conditions text;
alter table enseignes add column if not exists cashback_updated_at timestamptz;

-- Offres scrapées : cashback (%) et cartes cadeaux à remise.
-- Historique intégré : une ligne est insérée seulement quand la valeur change.
-- La "valeur courante" est la ligne la plus récente par (enseigne, source, kind).
create table offres (
  id uuid primary key default gen_random_uuid(),
  enseigne_id uuid references enseignes on delete cascade not null,
  source text not null
    check (source in ('manual', 'igraal', 'widilo', 'joko', 'uneo')),
  kind text not null check (kind in ('cashback', 'giftcard')),
  remise_pct numeric,
  montants numeric[],
  conditions text,
  scraped_at timestamptz default now()
);

create index offres_courant_idx on offres (enseigne_id, source, kind, scraped_at desc);

-- Lecture limitée aux enseignes de l'utilisateur ; insertion via service_role (bypass RLS)
alter table offres enable row level security;
create policy "owner_read" on offres for select
  using (enseigne_id in (select id from enseignes where user_id = auth.uid()));
