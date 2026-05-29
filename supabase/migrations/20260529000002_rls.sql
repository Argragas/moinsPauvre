-- Helper: famille_id de l'utilisateur courant
create or replace function get_user_famille_id()
returns uuid language sql security definer stable as $$
  select famille_id from famille_membres where user_id = auth.uid() limit 1;
$$;

-- Enseignes
alter table enseignes enable row level security;
create policy "owner" on enseignes for all using (user_id = auth.uid());

-- Familles
alter table familles enable row level security;
create policy "member_read" on familles for select
  using (id in (select famille_id from famille_membres where user_id = auth.uid()));
create policy "owner_all" on familles for all using (created_by = auth.uid());

-- Famille membres
alter table famille_membres enable row level security;
create policy "member_read" on famille_membres for select
  using (famille_id in (select famille_id from famille_membres where user_id = auth.uid()));
create policy "owner_manage" on famille_membres for all
  using (famille_id in (select id from familles where created_by = auth.uid()));
create policy "self_insert" on famille_membres for insert with check (user_id = auth.uid());

-- Cartes cadeaux
alter table cartes_cadeaux enable row level security;
create policy "personal_owner" on cartes_cadeaux for all
  using (visibility = 'personal' and user_id = auth.uid());
create policy "family_member" on cartes_cadeaux for all
  using (
    visibility = 'family'
    and famille_id = get_user_famille_id()
  );

-- Utilisations
alter table utilisations enable row level security;
create policy "carte_owner" on utilisations for all
  using (
    carte_id in (
      select id from cartes_cadeaux
      where user_id = auth.uid()
         or (visibility = 'family' and famille_id = get_user_famille_id())
    )
  );

-- Codes promo
alter table codes_promo enable row level security;
create policy "personal_owner" on codes_promo for all
  using (visibility = 'personal' and user_id = auth.uid());
create policy "family_member" on codes_promo for all
  using (
    visibility = 'family'
    and famille_id = get_user_famille_id()
  );
