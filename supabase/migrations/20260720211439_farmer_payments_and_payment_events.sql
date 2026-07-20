-- Phase 2: Farmer Payment ledger. amount_owed is set once at batch-logging
-- time and never edited (confirmed against real practice). amount_paid is
-- intentionally NOT a stored column — it's sum(payment_events.amount),
-- computed at query time, so it's structurally impossible for a stored
-- total to drift from the actual events.

create table farmer_payments (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references farmers (id) on delete cascade,
  batch_id uuid not null unique references batches (id) on delete cascade,
  amount_owed numeric not null,
  created_at timestamptz not null default now()
);

create table payment_events (
  id uuid primary key default gen_random_uuid(),
  farmer_payment_id uuid not null references farmer_payments (id) on delete cascade,
  amount numeric not null,
  paid_date date not null,
  created_at timestamptz not null default now()
);

alter table farmer_payments enable row level security;
alter table payment_events enable row level security;

grant select, insert, update, delete on farmer_payments, payment_events to authenticated;

create policy "authenticated full access" on farmer_payments
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on payment_events
  for all to authenticated using (true) with check (true);
