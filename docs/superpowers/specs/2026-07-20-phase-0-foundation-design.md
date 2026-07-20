# Phase 0 — Foundation: Design Spec

Date: 2026-07-20
Status: Approved

## Purpose

Establish the technical foundation AgroDeal's later phases build on: a
Next.js + Supabase project, the Section 4 core data model (minus Payment —
see Scope Cuts), shared layout components, and admin authentication.
Nothing here is public-facing or farmer-facing yet — this phase exists so
Phase 1 (Farmer/Plot Registry) has somewhere to write real data.

Reference: `plan.md` Sections 4–6, `CLAUDE.md`.

## Scaffolding

- `create-next-app` at the **repo root** (no monorepo — see CLAUDE.md "Repo
  structure"), with:
  - App Router
  - TypeScript
  - Tailwind CSS
  - ESLint
  - `src/` directory (keeps app code separate from `CLAUDE.md`, `plan.md`,
    `/scripts`, `supabase/` at root)
- Package manager: npm (already present on the machine; no reason to add
  pnpm/yarn as a second toolchain for a single-app repo).

## Database (Supabase, local dev)

Local development via the Supabase CLI (Docker-backed), not a cloud project
yet:

- `supabase init` creates `supabase/` config at repo root.
- `supabase start` brings up local Postgres + Auth + Studio.
- Schema defined as SQL migrations under `supabase/migrations/`.
- `.env.local` holds the local instance's URL + anon key (from `supabase
  start` output). Real cloud project keys get swapped in later, whenever a
  hosted Supabase project is linked — that's a founder action, not part of
  this phase.

### Schema (Section 4 entities, Payment excluded — see Scope Cuts)

```
farmers
  id, name, village, phone_whatsapp, photo_url, created_at

plots
  id, farmer_id -> farmers, center_lat, center_lng (simple point for v1;
    Whisp needs a boundary polygon, but that's captured in Phase 1 via Open
    Foris Ground — Phase 0 just needs a column to hold it, added then as
    `boundary geography(Polygon)` via a Phase 1 migration), area,
    eudr_risk_status (nullable until Whisp integration in Phase 1),
    created_at

batches
  id, farmer_id -> farmers, plot_id -> plots, weight, moisture_pct,
  fermentation_days, grade, harvest_date, photos (array of urls), created_at

lots
  id, total_weight, blended_grade, eudr_status_rollup, price_offered,
  created_at

lot_batches (join table — a lot aggregates multiple batches)
  lot_id -> lots, batch_id -> batches

buyers
  id, company, country, contact_name, contact_email, contact_phone,
  volume_needs, certifications_required, created_at

sales
  id, lot_id -> lots, buyer_id -> buyers, agreed_price, payment_status,
  shipment_status, created_at
```

Notes:
- `eudr_risk_status` / `eudr_status_rollup` are nullable text/enum fields
  populated later by the Whisp integration (Phase 1) — Phase 0 just creates
  the column, it does not call Whisp.
- `lot_batches` exists because a Lot aggregates multiple Batches (many-to-
  many), per plan.md Section 4.
- Row Level Security: enabled on all tables, default-deny, with policies
  added as each phase's admin/public access patterns become concrete. Phase
  0 does not need public-read policies yet since there are no public pages.

## Shared Layout

`src/app/layout.tsx` as the root layout, plus reusable components under
`src/components/`:

- `Nav` — top navigation, minimal (links can be placeholder/disabled until
  the pages they point to exist)
- `Footer`
- `Container` — max-width/padding wrapper used by every page

These are functional, not final visual design — Tailwind used for
structure/spacing, not brand styling. Real visual design work happens in
Phase 3 (public Home + Transparency), once there's real data to show.

## Admin Auth

- Supabase Auth, email/password.
- Single admin account (the founder). No public sign-up flow — the account
  is created directly via Supabase Studio (or a one-off seed script), not a
  registration form, since there is exactly one admin user for the
  foreseeable future.
- `/admin` routes gated by Next.js middleware that checks for a valid
  Supabase session and redirects to a login page if absent.

## Scope Cuts (explicit)

- **Farmer Payment table is not part of Phase 0.** CLAUDE.md flags that the
  ledger schema depends on which farmer-payment funding model is in use
  (personal advance vs. buyer-funded vs. cooperative advance) — an open
  business decision (plan.md Section 10, item 2). Payment is also
  explicitly scoped to Phase 2 in the phase breakdown (plan.md Section 6),
  not Phase 0. Building the table now risks guessing wrong and having to
  redo it once the funding model is decided.
- No data-entry UI for farmers/plots/batches (Phase 1).
- No Whisp API integration (Phase 1) — the `eudr_risk_status` column exists
  but is not populated by this phase.
- No public-facing pages (Phase 3+).
- No cloud Supabase project creation — that requires the founder's own
  Supabase account and is done whenever they're ready to move past local
  dev.

## Testing

- Migrations should run cleanly via `supabase db reset` (drops and
  re-applies all migrations) as the basic correctness check for Phase 0 —
  there's no application logic yet to unit test.
- Manual check: root layout renders with Nav/Footer/Container on a blank
  page; `/admin` redirects to login when unauthenticated; login succeeds
  with the seeded admin account and reaches an admin placeholder page.

## Open Items Carried Forward (not blockers for Phase 0)

- Linking a real cloud Supabase project — founder action, whenever ready.
- Farmer payment funding model decision (plan.md Section 10.2) — needed
  before Phase 2's Payment table is designed, not before Phase 0.
- **Whisp API polygon requirement** — before building the Phase 1 Whisp
  integration, confirm whether Whisp requires a real boundary polygon to
  produce a meaningful risk assessment, or whether a point + radius is
  sufficient. If a polygon is required, the Phase 0 `center_lat`/
  `center_lng` columns are a pure placeholder that gets superseded by the
  boundary column rather than something Whisp can partially use — meaning
  Phase 1 field data collection (walking each plot's actual boundary, via
  Open Foris Ground) becomes a required step, not optional. Not a blocker
  for Phase 0.
