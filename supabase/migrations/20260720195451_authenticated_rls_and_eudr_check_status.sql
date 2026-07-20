-- Phase 1: first real RLS policies. There is exactly one authenticated
-- role in use right now (the founder, via /admin) — no per-row scoping
-- since there's nothing to scope against yet. anon gets no new grants,
-- unchanged from Phase 0.

grant usage on schema public to authenticated;
grant select, insert, update, delete on farmers, plots to authenticated;

create policy "authenticated full access" on farmers
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on plots
  for all to authenticated using (true) with check (true);

-- Tracks the Whisp check's own progress, separate from eudr_risk_status
-- (which only ever holds a real Whisp-derived value, never a sentinel).
alter table plots
  add column eudr_check_status text not null default 'not_configured'
  check (eudr_check_status in ('not_configured', 'pending', 'failed', 'complete'));
