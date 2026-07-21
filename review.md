# AgroDeal — Implementation Review Log

Tracks what's actually been done, phase by phase. Update as work lands —
this is a running log, not a plan (see `docs/superpowers/specs/` for specs
and `plan.md` for the business/phase plan).

## Real data milestone (2026-07-20/21)

First real farmer entered via the actual admin UI (not test data): **Patrick
Ojo**, Okokodo village, +2347036803856. Plot at 6.746396, 5.668334 — real
Whisp check returned `EUDR status: low`. One real batch: 200 kg, Grade I
(corrected from an initial Grade II data-entry error — see below), harvested
2026-07-10, ₦500,000 owed (unpaid as of entry). Throwaway test farmers from
Phase 2 verification (Farmer Low/NeedsCheck/Ungraded) were deleted from the
local dev DB at the same time so they don't pollute any Phase 3 "live
metrics."

**Correction (2026-07-21)**: grade was entered as Grade II by mistake;
corrected to Grade I via a direct authenticated update (no "edit batch"
admin action exists yet — Phase 2 deliberately doesn't have one, since
amount_owed is meant to be immutable and grade-editing was never a
designed feature). `amount_owed` was checked and was already correct at
₦500,000; no `payment_events` existed yet, so there was nothing to correct
there. While checking this, found `service_role` had never been granted
access to `farmer_payments`/`payment_events` (same class of gap as the
earlier `authenticated`-grant fixes for batches/lots/lot_batches — these
two tables were created in Phase 2, after Phase 0's blanket service_role
grant on the original 7 tables). Fixed via a new migration, applied with
`supabase migration up` rather than `db reset` specifically to avoid
wiping this real data.

Note for Phase 3: the schema has no currency field — `amount_owed` is a
bare number. ₦500,000 was entered as-is (500000); any public-facing price
display needs to decide how to label currency unambiguously.

**First real lot (2026-07-21)**: ahead of Phase 4 (buyer lot catalog),
created a real lot from Patrick Ojo's batch via the actual `/admin/lots/new`
UI — 200 kg, Grade I, `eudr_status_rollup: "low"`, no `price_offered` set
(no real buyer price exists yet). While checking the lots list, found two
**orphaned test lots** still present from Phase 2 verification ("70 kg
Ungraded", "1 kg Grade I") — leftover because deleting a farmer cascades
to their batches and `lot_batches` rows, but **not** to a `lots` row that
becomes empty as a side effect (lots have no direct FK to farmer/batch;
they're only referenced *by* `lot_batches`). This can only happen via
direct DB manipulation bypassing the app (there's no "delete farmer"
admin action), which is exactly how it happened — when the Phase 2 test
farmers were deleted directly via the API ahead of Phase 3. Deleted both
orphaned lots directly; confirmed the lots list now shows only the one
real lot.

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
- [x] Lot detail: price_offered edit + delete (`/admin/lots/[id]`,
      `updatePriceOffered`, `deleteLot`). Lists exactly which constituent
      plots need attention when `eudr_status_rollup` is null (e.g.
      "Farmer NeedsCheck's batch (2026-07-12): plot is more_info_needed").
      Verified via Playwright + direct DB checks: updating price_offered
      (500 → 750) changed only that column — `total_weight`,
      `blended_grade`, and `eudr_status_rollup` stayed untouched; deleting
      a lot removed it from the list and released its batch back into the
      unassigned pool (selectable again on `/admin/lots/new`). Deleting a
      lot with a Sale attached remains unverified this phase — no
      Sale-creation UI exists yet (Phase 4); the FK protection exists in
      the schema but only a manual DB-level insert could exercise the
      rejection path right now, same shape as the Phase 1 Whisp
      complete/failed gap.

Phase 2 complete. All 5 tasks done and verified.

### Post-review follow-up: scrutinizing the payment-ledger bug before merge

Before approving the PR, the founder pushed back on the bug list rather
than accepting the summary at face value — specifically on the
false-positive "Paid in full" bug, since this table is the one place in
the system where a wrong-but-plausible number is worse than an obvious
error. Answering that scrutiny honestly, with verification, rather than
just restating the original summary:

- **How it was caught**: deliberate manual Playwright verification of the
  first-use case (log a batch, check its status immediately), not an
  automated test — this project has none. It was always going to surface
  on the very first manual pass, which is reassuring for *that* instance
  but doesn't mean the same class of bug couldn't hide somewhere less
  obvious.
- **Checked for the same pattern elsewhere**: grepped and manually
  reviewed all 5 embedded-relation query sites in the codebase. The other
  4 either are genuine one-to-many relations correctly treated as arrays
  (`payment_events` from `farmer_payments`) or were written after this bug
  and already match the real runtime shape. No other silent instance
  found — but this was a static check, not a regression test; nothing
  stops a future 6th site from repeating the mistake.
- **The "batch belongs to at most one lot" constraint**: confirmed via
  `git log` that the unique constraint (commit 9e1eb9b) landed *before*
  `createLot` was ever written or run (commit f0ab7ef) — no batch was ever
  double-assigned, even transiently, during testing. Also confirmed live
  that it's a real Postgres constraint, not an app-layer check: a direct
  `lot_batches` insert attempting to reuse an already-assigned `batch_id`
  (bypassing the app entirely) was rejected with `23505 duplicate key
  value violates unique constraint "lot_batches_batch_id_unique"`.

**Regression test added, with an honest caveat about what it does and
doesn't cover**: extracted the payment-status computation into a pure
function (`src/lib/payments.ts`, `computePaymentStatus`/
`formatPaymentStatus`) and added the project's first automated tests
(`npm test`, via Vitest — reverses the Phase 0 "manual verification only"
decision specifically for this one trust-critical piece). The test
reproduces the exact input that should never look "paid": zero events
against a real owed amount must compute as `unpaid`, never
`paid_in_full`.

Important limitation, stated plainly rather than oversold: this unit test
does **not** actually guard against the original root cause. The original
bug was never in the arithmetic (`paidTotal >= amountOwed` was always
correct) — it was that `payment` itself silently became `undefined` from
the Supabase relation-typing mistake, so `amount_owed ?? 0` masked a
missing record as a real zero. A pure-function test can't catch a wrong
*extraction* of its own inputs. The actual fix for that failure mode is a
defensive code change in `src/app/admin/farmers/[id]/page.tsx`: since
every batch is guaranteed exactly one `farmer_payments` row (inserted
atomically in `createBatch`), a missing `payment` now renders a loud
"No payment record found for this batch — data integrity issue" warning
instead of silently defaulting to a plausible-looking 0/0. That's the
change that actually closes the original failure mode; the unit test is a
real but narrower guard against a *different* future risk (someone
breaking the arithmetic itself).

## Phase 3 — Public Site: Home + Transparency

Spec: `docs/superpowers/specs/2026-07-21-phase-3-public-home-transparency-design.md`

Decisions locked in during brainstorming:
- Server-only service-role client for public data-fetching instead of new
  `anon` RLS policies — Postgres RLS is row-level, not column-level, so a
  policy meant to expose only counts is one mistake away from also
  exposing PII. `anon` stays exactly as locked out as always.
- `src/lib/supabase/service.ts` guarded with the `server-only` package —
  an accidental client-component import becomes a build error, not a
  runtime leak.
- All copy framed explicitly as early-stage ("just getting started"), not
  a stats panel implying more maturity than the single real farmer
  currently in the system.
- Buyer price and testimonial both stated as genuinely not yet available,
  never invented.

### Tasks

- [x] Server-only service-role client + publicStats.ts. Split into
      `publicStatsFormat.ts` (pure functions, no I/O) and `publicStats.ts`
      (I/O layer, `server-only`-guarded) after discovering `server-only`
      throws unconditionally outside Next.js's build pipeline — including
      under plain Vitest — so the pure functions couldn't share a file
      with the guard and still be unit-testable. 13 Vitest tests pass,
      including the real Patrick Ojo case (`₦500,000 paid for 200kg
      (Grade I) ≈ ₦2,500/kg`) and zero-farmer/zero-batch states. `npm run
      build` confirms the `server-only` guard doesn't break the actual
      Next.js build.
- [x] Home page (/) — mission/process copy adapted from plan.md's Vision
      section, live metrics via `formatHomeStats`. Along the way found the
      page was being **statically prerendered at build time** (unlike the
      admin pages, the service-role client doesn't use cookies, so it
      doesn't automatically opt into per-request rendering) — would have
      frozen "live" metrics until the next deploy. Fixed with
      `export const dynamic = "force-dynamic"`. Verified via Playwright
      against the real dev DB: shows "We're just getting started — 1
      farmer, 1 plot mapped, 200kg traced so far" and "100%
      EUDR-verified", matching Patrick Ojo's real data exactly.
- [x] Transparency page (/transparency), plus a Nav link so it's
      discoverable. Verified via Playwright against the real dev DB: real
      farmgate price ("₦500,000 paid for 200kg (Grade I) ≈ ₦2,500/kg"),
      honest "Not yet disclosed" buyer price, real EUDR readiness ("1 of 1
      verified plot so far is low deforestation risk"), no testimonial
      section. Same `force-dynamic` fix applied as Home, for the same
      reason.

Phase 3 complete. All 3 tasks done and verified against real data.

### Post-review follow-up: production-build verification + copy polish

Before merging, the founder asked for three things beyond the design-level
summary:

- **Confirmed `force-dynamic` on both routes** (grep, not just memory).
- **Proved the dynamic rendering actually works in production**, not just
  in dev (where everything re-renders regardless): ran `npm run build` +
  `next start`, added a temporary batch directly (50kg, Grade III,
  earlier harvest date than Patrick's real batch — so it became the new
  "earliest batch" shown), refreshed `/transparency` and `/` with no
  rebuild/restart, and confirmed both pages picked up the new numbers
  immediately (₦100,000/50kg on Transparency, 250kg traced on Home).
  Deleted the temporary batch afterward and confirmed both pages reverted
  to exactly the original real-data state (₦500,000/200kg).
- **Read `/transparency` cold, as a stranger would** (screenshot of the
  live production build, not just trusting the design description). Found
  one honest gap: the EUDR readiness section said "we're just getting
  started" but the farmgate price line was a bare number a fast skimmer
  could misread as an aggregate/average rather than the one real
  transaction it is. Fixed: `formatFarmgatePrice` now leads with the same
  "We're just getting started — here's our first real transaction:"
  framing as `formatEudrReadiness`, so every section signals early-stage
  explicitly rather than relying on the intro paragraph alone.

## Phase 4 — Buyer-Facing Lot Catalog

Spec: `docs/superpowers/specs/2026-07-21-phase-4-buyer-lot-catalog-design.md`

Decisions locked in during brainstorming:
- Public catalog (volume/grade/EUDR status, no price); pricing/contact
  gated behind a real inquiry.
- Inquiry writes go through a `submitInquiry` Server Action + service-role
  client, NOT an `anon` INSERT policy — so unauthenticated input can never
  reach Postgres without passing the Server Action's validation first, and
  `anon` never gets a database foothold even for writes.
- `lot_inquiries` uses `on delete restrict` matching `sales -> lots`:
  protects real lead data from accidental deletion, without treating an
  inquiry as Sale-level consequential.
- Inquiry != Sale, and Buyer-record creation both stay separate deliberate
  admin actions.
- Availability filter (lots with no `sales` row) built correct now, not a
  deferred TODO.
- `viewed_at` + an unread count on `/admin/lots` so new leads are visible
  without Resend configured.
- Email validated server-side (plausible shape) — a malformed email in a
  "real lead" row is a lead you can never respond to.

### Tasks

- [x] `lot_inquiries` migration + `authenticated` select/update RLS.
      Applied via `supabase migration up` (not `db reset`) to preserve
      Patrick's real data. Verified: service-role can insert (the write
      path); `on delete restrict` blocks deleting a lot with an inquiry
      attached (FK error 23503); `anon` fully denied for BOTH select and
      insert; `authenticated` can select but cannot insert (only
      service-role writes). Test inquiry cleaned up after verification.
- [x] Public lot data helpers + email validator, same pure/I/O split as
      publicStats: `lotCatalogFormat.ts` (pure — `filterAvailableLots`,
      `isValidEmail`, `formatEudrStatusForBuyer`) + `lotCatalog.ts` (I/O,
      server-only — `getAvailableLots`, `getPublicLot`). 13 new Vitest
      tests (26 total), all against injected data: available-lots filter
      (excludes lots with a sale), email validator (accepts plausible,
      rejects malformed incl. whitespace-trim), EUDR pending fallback.
- [x] Public /lots catalog + /lots/[id] detail + inquiry form +
      submitInquiry Server Action + drop-in Resend (`src/lib/resend.ts`,
      fail-open like Whisp) + Nav link. Both routes `force-dynamic` (Phase
      3 reasoning). Verified via Playwright against Patrick's real lot:
      `/lots` shows "We're just getting started — here's our first
      available lot", 200kg/Grade I/EUDR low, no price; `/lots/[id]` shows
      the same + inquiry form; an invalid email (`jane@nodomain`, which
      passes HTML5 type=email but not a real check) was correctly rejected
      server-side, proving the server validation does real work; a valid
      inquiry saved to the DB (verified: correct fields, `viewed_at` null,
      right lot_id) and Resend failed open ("skipping inquiry email —
      inquiry was still saved" logged, never thrown).
- [x] Admin inquiry visibility: Inquiries section on `/admin/lots/[id]`
      (marks the lot's inquiries viewed on visit — best-effort,
      idempotent `update ... where viewed_at is null`, logged-not-thrown
      on failure) + a "N new inquiry/inquiries" badge on `/admin/lots`.
      Verified the full loop end-to-end via Playwright: public inquiry
      submitted (viewed_at null) → `/admin/lots` showed "1 new inquiry" →
      visiting `/admin/lots/[id]` showed the full inquiry AND marked it
      viewed → returning to `/admin/lots` showed the badge cleared. Test
      inquiry deleted afterward; `lot_inquiries` back to empty.

Phase 4 complete. All 4 tasks done and verified against real data.

### Post-review follow-up: email-strictness check + real /admin dashboard

Before merging, the founder asked to actually verify two things rather
than trust the description:

- **Email validation strictness**: confirmed well-calibrated by running
  the regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) against real-world edge
  cases. It accepts every format a real buyer would type —
  plus-addressing (`jane+x@gmail.com`), subdomains
  (`jane@mail.co.uk`), underscore/hyphen local parts, non-ASCII — and
  rejects only the genuinely undeliverable (no TLD, no `@`, spaces,
  double-`@`). The only theoretical false-positive is a quoted local-part
  with a space, which nobody types into a web form. No real-buyer
  rejection risk.
- **Badge visibility — real gap found and fixed**: the "N new inquiry"
  badge worked, but only on `/admin/lots`, while login lands you on
  `/admin` — which was still the **Phase 0 placeholder** ("Farmer/plot
  data entry lands in Phase 1"), with no links and no inquiry signal. So
  the badge did NOT actually answer the brainstorm's "how will I notice
  without going to look" question — you had to know to navigate to the
  lots list. Fixed by rebuilding `/admin` into a real landing dashboard:
  removed the stale copy, added Farmers/Lots nav, and surfaced a total
  "N new buyer inquiries — review in Lots →" callout right where you land
  after login. Verified end-to-end via Playwright: submit inquiry → log
  in → callout is visible immediately on `/admin` → click through and
  view the inquiry → return to `/admin`, callout gone.

Left mark-viewed-on-visit as-is (matches the approved spec; the inquiry
content is co-located on the page that marks it viewed, and the `/admin`
total-count callout gives a persistent signal until every lot's inquiries
are actually opened).

## Phase 5 — Farmer Education Page

Spec: `docs/superpowers/specs/2026-07-21-phase-5-farmer-education-design.md`

Decisions locked in during brainstorming:
- Two modules (post-harvest quality, fair price basics); English
  authoritative; i18n-ready but NO machine translation ever rendered.
- Each content piece tagged `universal` vs `agrodeal_specific(+verified)`;
  unverified specific claims WITHHELD from the page entirely, not labeled
  — same discipline as unverified EUDR/prices/testimonials, because the
  audience may not weigh a disclaimer carefully.
- Empty-module honest "being reviewed" state + a publish-readiness report
  (verified-vs-held-back ratio per module) so fair-price-basics (mostly
  agrodeal_specific) doesn't ship mostly empty by surprise.
- Static in-repo content (no DB, no force-dynamic).

### Tasks

- [x] Content types (`types.ts`) + pure filter (`format.ts`:
      `isPubliclyShown`, `publicContentFor`, `publishableCount`) + 7 Vitest
      tests (33 total) against injected data: universal always shown,
      verified specifics shown, unverified specifics withheld (not
      labeled), publishableCount `{shown, heldBack}` incl. the all-held-back
      empty-module case.
- [ ] Draft module content + report verified/held-back ratio
- [ ] Public /learn page + nav link

## Phase 6+

Not started.
