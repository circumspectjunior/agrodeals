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
- [x] Admin auth: middleware (`src/middleware.ts`) gating `/admin/*` via
      Supabase session, login page, `scripts/seed-admin.mjs` (plain JS, no
      new tooling — run with `node --env-file=.env.local`), placeholder
      `/admin` page. Verified end-to-end via Playwright against the dev
      server with a throwaway local account (`test-admin@agrodeal.local`,
      wiped on next `supabase db reset`): unauthenticated `/admin` redirects
      to `/admin/login`; signing in reaches `/admin` showing "Signed in as
      test-admin@agrodeal.local." Hit one transient Docker DB-connection
      timeout mid-test (resource contention with the other local Supabase
      project also running) — retried and it passed; not a code issue.

## Phase 1 — Farmer & Plot Registry

Spec: `docs/superpowers/specs/2026-07-20-phase-1-farmer-plot-registry-design.md`

Key research finding: EUDR only requires a single GPS point for plots
under 4ha (full polygon only mandated at ≥4ha) — resolves the Phase 0
open item, since AgroDeal's smallholder farmers mostly qualify for
point-based capture.

Decisions locked in during brainstorming:
- No Whisp API key yet — integration built so a real key is a drop-in,
  never fabricates a status in the meantime
- Manual lat/lng entry, no map picker
- No farmer photo upload this phase (`photo_url` stays a plain URL field)
- One farmer/one plot per creation flow — UI simplification only, not a
  schema constraint (farmer detail page always offers "add another plot")
- Manual "Recheck EUDR status" action included now, not deferred
- `plots.eudr_check_status` (not_configured/pending/failed/complete) added
  so a real Whisp failure can never look identical to "not configured yet"

### Tasks

- [x] Add `plots.eudr_check_status` migration + `authenticated` RLS
      policies on farmers/plots. Verified: `anon` still gets "permission
      denied"; `authenticated` (signed-in test account) can select/insert
      cleanly; new column present with the expected default/check
      constraint.
- [x] Build Whisp integration (`src/lib/whisp.ts`) — submit/poll against
      the real documented API shape. Verified the no-key path returns
      `{status: "not_configured", risk: null}` instantly with no network
      call attempted. The complete/failed/pending paths remain untested
      until a real `WHISP_API_KEY` is available (known limitation, see
      spec).
- [x] Farmer create flow (`/admin/farmers`, `/admin/farmers/new`,
      `createFarmer` action). `npm run build` passes; the insert path was
      already verified against RLS in the previous task. Full click-through
      (including the post-create redirect target) verified alongside the
      plot flow below, since `/admin/farmers/[id]` belongs to that task.
      Noted but out of scope: Next.js 16 flags `src/middleware.ts` as
      deprecated in favor of `proxy.ts` — pre-existing from Phase 0, minor
      follow-up, not fixed in this PR.
- [ ] Plot create flow + Whisp call + recheck action

## Phase 2+

Not started.
