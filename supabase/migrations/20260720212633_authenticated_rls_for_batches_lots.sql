-- Phase 0 only granted service_role access to batches/lots/lot_batches/
-- buyers/sales. Phase 1 extended authenticated access to farmers/plots
-- (all it needed), but batches/lots/lot_batches were never extended —
-- Phase 2's admin UI needs authenticated access to log batches and
-- create lots. buyers/sales stay untouched; nothing in Phase 2 needs them.

grant select, insert, update, delete on batches, lots, lot_batches to authenticated;

create policy "authenticated full access" on batches
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on lots
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on lot_batches
  for all to authenticated using (true) with check (true);
