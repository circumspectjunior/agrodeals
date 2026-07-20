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
- [x] Plot create flow + Whisp call + recheck action
      (`/admin/farmers/[id]`, `/admin/farmers/[id]/plots/new`, `createPlot`,
      `recheckEudrStatus`). Verified end-to-end via Playwright against the
      dev server: farmer creation → farmer detail (no plots yet) → plot
      form rejects an out-of-range latitude with an inline error → valid
      submission creates the plot, shows "6.524379, 3.379206 · 1.5 ha" and
      "Pending — Whisp not configured yet" → "Recheck EUDR status" re-runs
      cleanly and stays `not_configured`, no crash.

**Update once a real `WHISP_API_KEY` became available**: the live API's
response shape doesn't match its own docs. `/submit/geojson` can complete
*synchronously* (`code: "analysis_completed"` in the submit response
itself, not just the poll response), and the token lives at
`context.token`, not top-level `token` as the docs implied. The original
implementation would have misread every successful synchronous check as
`failed`. Fixed `src/lib/whisp.ts` to check for synchronous completion
first and read the token from the right place; both endpoints share the
same `{code, data, context}` envelope. Verified live for real: a point in
Ondo State (Nigeria's cocoa belt) returned `risk_pcrop: "low"` end-to-end,
both via direct function call and through the actual UI (immediate check
on plot creation, and via "Recheck EUDR status" on the existing pending
plot — which now correctly shows "EUDR status: low" and the recheck button
disappears once complete). This closes the "known limitation" noted in
the PR — the complete/success path is now proven against the real API, not
just designed against its docs.

**Independent sanity check**: the first test point (7.2571, 5.2058) turned
out to be inside Akure city (Ijapo Estate — hospitals, a post office,
paved roads per satellite imagery), so its "low" result was a weak
validation (of course a built-up area has low deforestation risk). Picked
a second, more meaningful point on a forested hillside near Idanre Hill
(7.0902, 5.1041): Whisp correctly returned `Ind_01_treecover: "yes"` and
`risk_pcrop: "more_info_needed"` — a third real category beyond low/
medium/high, for a point where tree cover is genuinely present and a
simple low/high risk call needs more context. This is a much stronger
signal that the integration reflects real land cover, not just a
default-low response. Note for later: `risk_pcrop` can be
`more_info_needed`, not only low/medium/high — the UI already handles
this fine since it just displays whatever Whisp returns, but worth knowing
when designing any future UI that branches on the risk value specifically.

## Phase 2 — Batch & Lot Management

Spec: `docs/superpowers/specs/2026-07-20-phase-2-batch-lot-management-design.md`

Decisions locked in during brainstorming:
- amount_owed: manual entry, fixed at batch-logging time, never edited
- payment_events audit trail (not a stored running total) — amount_paid
  is always `sum(payment_events.amount)`, computed at query time
- Grade is a fixed dropdown (Grade I/II/III/Ungraded); Ungraded ranks
  worst for blended_grade — not for symmetry with the EUDR rollup, but as
  a deliberate incentive to keep grading disciplined (grade is a required
  choice made in the moment, unlike an EUDR check that takes time)
- eudr_status_rollup = "low" only if every included batch's plot is
  complete+low; otherwise null, never a fabricated/averaged claim
- Lot batch composition fixed at creation; price_offered is the one
  editable field, and editing it must never recompute the rollup fields
- Lots are deletable (recovers from mis-clicks) unless a Sale is attached
  (existing FK protection)

### Tasks

- [x] Add `farmer_payments`/`payment_events` migration + `authenticated`
      RLS. Verified: schema matches spec exactly; `anon` denied,
      `authenticated` (signed-in test account) can select cleanly.
- [x] Batch logging flow (`/admin/farmers/[id]/batches/new`, `createBatch`
      action). Validates weight/moisture/fermentation/grade/harvest date/
      amount owed server-side, checks the selected plot actually belongs
      to the farmer, and inserts the batch + its paired `farmer_payments`
      row together. `npm run build` and `tsc --noEmit` pass. Full
      click-through verified alongside the "Batches" section below.
- [x] Batches section + payment recording on farmer detail
      (`recordPayment` action, `RecordPaymentForm` component). Along the
      way found **two real bugs**:
      1. `batches`/`lots`/`lot_batches` only ever had `service_role`
         grants (from Phase 0) — Phase 1 extended `authenticated` access
         to `farmers`/`plots` only, since that's all it needed. Batch
         logging failed with "permission denied for table batches" until
         a new migration extended `authenticated` grants + RLS policies to
         `batches`/`lots`/`lot_batches`.
      2. The Supabase client has no generated types in this project, so
         it infers every embedded relation (`plots(...)`,
         `farmer_payments(...)`) as an array regardless of real
         cardinality. Code written against that inference used `[0]`
         indexing, but PostgREST actually returns a plain object for both
         at runtime (plots is many-to-one; farmer_payments is one-to-one
         since `batch_id` is unique) — so `[0]` silently returned
         `undefined`, showing "EUDR status: unknown" and "Payment: Paid in
         full" (a false positive, from `0 >= 0` when both owed/paid
         defaulted to 0) on a freshly-logged, unpaid batch. Fixed with an
         explicit `BatchRow` type reflecting the real runtime shape
         instead of trusting the client's inference.
      Verified end-to-end via Playwright: logged a batch, confirmed
      correct EUDR status and "Unpaid (100 owed)", rejected an overpayment
      attempt (150 against 100 owed) with the correct remaining-balance
      message, then recorded a valid partial payment (40) and confirmed
      "Partially paid (40 of 100)" plus the event history line.
- [x] Lot list + creation with rollup logic (`/admin/lots`,
      `/admin/lots/new`, `createLot`). Along the way found the "batch
      belongs to at most one lot" rule was only a UI convention —
      `lot_batches` had no unique constraint on `batch_id`, so a bug could
      have double-assigned a batch. Added a migration enforcing it at the
      DB level. Verified via Playwright + direct DB checks with 3 test
      batches (low/Grade I, more_info_needed/Grade III, low/Ungraded):
      selecting the two "low" batches (one Ungraded) produced
      `total_weight: 70`, `blended_grade: "Ungraded"` (worst wins),
      `eudr_status_rollup: "low"`; the remaining `more_info_needed` batch
      correctly became a separate lot with `eudr_status_rollup: null`
      (shown as "needs attention") and `price_offered: 500`. Confirmed the
      already-assigned batches no longer appear as selectable in a new
      lot's form.
- [ ] Lot detail: price_offered edit + delete

## Phase 3+

Not started.
