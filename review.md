# AgroDeal — Implementation Review Log

Tracks what's actually been done, phase by phase. Update as work lands —
this is a running log, not a plan (see `docs/superpowers/specs/` for specs
and `plan.md` for the business/phase plan).

## Phase 0 — Foundation

Spec: `docs/superpowers/specs/2026-07-20-phase-0-foundation-design.md`

Decisions locked in during brainstorming/discovery:
- Next.js app lives at repo root, no monorepo (recorded in CLAUDE.md)
- npm as package manager
- Supabase local dev via CLI + Docker for now; cloud project link is a
  founder action, done whenever ready
- Farmer Payment table excluded from Phase 0 — deferred to Phase 2 pending
  the farmer-payment funding-model decision (plan.md Section 10.2)
- Plot GPS stored as `center_lat`/`center_lng` for v1; boundary polygon
  column added in a Phase 1 migration once Whisp's polygon requirement is
  confirmed and field GPS capture (Open Foris Ground) happens
- Manual verification (dev server / `supabase db reset` checks) for this
  phase, not an automated test harness — that starts once there's real
  application logic (Phase 1+)
- Single admin account seeded via script (`scripts/seed-admin.ts`), not
  created manually through Supabase Studio

### Tasks

- [x] Scaffold Next.js app at repo root
- [x] Set up Supabase CLI local dev (init + start + `.env.local`) — ports
      shifted +10 from defaults (54331/54332/etc.) to avoid colliding with
      another local Supabase project already running on this machine;
      analytics/realtime/storage/edge-runtime disabled since Phase 0 doesn't
      need them and Docker memory is constrained (~3.8GB total, shared with
      the other project's stack)
- [x] Write Section 4 schema migration (farmers, plots, batches, lots,
      lot_batches, buyers, sales — RLS on, no policies yet). Verified via
      `supabase db reset` + REST API schema introspection: all 7 tables
      present with expected columns, no `payments` table.
- [x] Supabase client helpers (`src/lib/supabase/client.ts`,
      `src/lib/supabase/server.ts`) via `@supabase/ssr`. Along the way found
      that this Supabase version doesn't auto-grant table privileges to
      Data API roles (`auto_expose_new_tables` now defaults off) — even
      `service_role` got "permission denied" until the migration explicitly
      granted it. Fixed in the schema migration; verified service_role can
      query `farmers` (anon/authenticated intentionally stay ungranted).
- [x] Shared layout components (Container, Nav, Footer) wired into
      `src/app/layout.tsx`; replaced the create-next-app placeholder
      homepage with a minimal AgroDeal placeholder (no links to unbuilt
      pages). Verified via `npm run build` and a dev-server curl check
      that Nav/Footer render around the page content.
- [ ] Admin auth: middleware gating `/admin`, login page, `scripts/seed-
      admin.ts`, placeholder `/admin` page

## Phase 1+ 

Not started.
