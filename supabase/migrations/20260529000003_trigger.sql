create or replace function update_montant_restant()
returns trigger language plpgsql as $$
begin
  update cartes_cadeaux
  set montant_restant = montant_restant - NEW.montant
  where id = NEW.carte_id;
  return NEW;
end;
$$;

create trigger trg_update_montant_restant
after insert on utilisations
for each row execute function update_montant_restant();
