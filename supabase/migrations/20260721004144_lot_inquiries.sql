-- Phase 4: buyer inquiries tied to a specific lot.
--
-- on delete restrict matches the existing sales -> lots pattern: a lot with
-- real buyer interest attached shouldn't be silently deletable, and inquiry
-- data (a real lead) shouldn't be destroyed as a side effect of deleting the
-- lot it was about. This protects the data; it does NOT make an inquiry as
-- consequential as a Sale (inquiry != Sale is a separate, deliberate call).

create table lot_inquiries (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references lots (id) on delete restrict,
  company text not null,
  contact_name text not null,
  email text not null,
  country text,
  message text,
  -- null until an admin opens the lot's detail page (see the admin
  -- "N new inquiries" indicator).
  viewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table lot_inquiries enable row level security;

-- Public writes go through the submitInquiry Server Action using the
-- service-role client (which bypasses RLS) — anon deliberately gets no
-- INSERT policy, so unauthenticated input can never reach the table
-- without passing through the Server Action's validation first.
--
-- authenticated needs select (to view inquiries in the admin UI) and
-- update (to mark them viewed). service_role also granted, matching the
-- pattern used for the other Phase 2+ tables.
grant select, update on lot_inquiries to authenticated;
grant select, insert, update, delete on lot_inquiries to service_role;

create policy "authenticated read" on lot_inquiries
  for select to authenticated using (true);

create policy "authenticated mark viewed" on lot_inquiries
  for update to authenticated using (true) with check (true);
