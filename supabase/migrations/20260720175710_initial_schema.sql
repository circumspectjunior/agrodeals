-- Phase 0 foundation schema (plan.md Section 4).
-- Farmer Payment is intentionally excluded here — deferred to Phase 2
-- pending the farmer-payment funding-model decision (plan.md Section 10.2,
-- CLAUDE.md "Payment-gap handling").

create table farmers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  village text not null,
  phone_whatsapp text,
  photo_url text,
  created_at timestamptz not null default now()
);

create table plots (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references farmers (id) on delete cascade,
  -- Simple point for v1. A boundary polygon column is added in a Phase 1
  -- migration once field GPS capture (Open Foris Ground) happens and
  -- Whisp's polygon-vs-point requirement is confirmed.
  center_lat double precision not null,
  center_lng double precision not null,
  area numeric,
  -- Populated by the Whisp integration in Phase 1; null until then.
  eudr_risk_status text,
  created_at timestamptz not null default now()
);

create table batches (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references farmers (id) on delete cascade,
  plot_id uuid not null references plots (id) on delete cascade,
  weight numeric not null,
  moisture_pct numeric,
  fermentation_days integer,
  grade text,
  harvest_date date not null,
  photos text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table lots (
  id uuid primary key default gen_random_uuid(),
  total_weight numeric,
  blended_grade text,
  eudr_status_rollup text,
  price_offered numeric,
  created_at timestamptz not null default now()
);

-- A lot aggregates multiple batches (many-to-many).
create table lot_batches (
  lot_id uuid not null references lots (id) on delete cascade,
  batch_id uuid not null references batches (id) on delete cascade,
  primary key (lot_id, batch_id)
);

create table buyers (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  country text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  volume_needs text,
  certifications_required text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table sales (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references lots (id) on delete restrict,
  buyer_id uuid not null references buyers (id) on delete restrict,
  agreed_price numeric not null,
  payment_status text not null default 'pending',
  shipment_status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- RLS on, default-deny. No policies yet — Phase 0 has no public pages and
-- admin access goes through the service-role key, which bypasses RLS.
-- Per-phase access patterns (e.g. public lot catalog reads in Phase 4) get
-- their own policies when those phases are built.
alter table farmers enable row level security;
alter table plots enable row level security;
alter table batches enable row level security;
alter table lots enable row level security;
alter table lot_batches enable row level security;
alter table buyers enable row level security;
alter table sales enable row level security;
