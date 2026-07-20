# Phase 3 — Public Site: Home + Transparency: Design Spec

Date: 2026-07-21
Status: Approved

## Purpose

Phase 3 replaces the Phase 0 placeholder homepage with a real public Home
page and adds a new Transparency page, both backed by real data per
CLAUDE.md's non-negotiable build order ("internal tools before public
pages... because those pages are only credible when showing real numbers,
not placeholders").

Reference: `plan.md` Section 6 (Phase 3), CLAUDE.md's "Claims that must be
backed by real data" section, and `review.md`'s "Real data milestone"
entry (Patrick Ojo — the only real farmer/plot/batch in the system as of
this spec).

## Real data available at design time

- **Farmer**: Patrick Ojo, Okokodo village.
- **Plot**: 6.746396, 5.668334 — real Whisp check, `eudr_check_status =
  "complete"`, `eudr_risk_status = "low"`.
- **Batch**: 200kg, Grade I, harvested 2026-07-10, ₦500,000 owed (unpaid
  as of this spec).
- **No buyer price yet** — no Sale exists (Phase 4 territory).
- **No permissioned testimonial yet.**

Building this phase does not mean it goes live/publicly shared
immediately — that's a separate decision for the founder, once the
buyer-price and testimonial gaps are addressed (or deliberately accepted
as still-open when sharing the link).

## Scope decisions (confirmed during brainstorming)

- Farmgate price displays alone, clearly labeled, with the buyer-price
  side stated as genuinely not yet available ("Buyer price: not yet
  disclosed — check back as we complete our first sale") rather than
  omitting the section or inventing a number.
- Testimonial section is omitted entirely for this phase — no
  permissioned quote exists yet, and CLAUDE.md is explicit that
  testimonials must be real and permissioned, never written on someone's
  behalf.
- Live metrics and the Transparency snapshot must read as **early-stage**,
  not as an established stats panel. "1 of 1 verified plots" is honest as
  a raw number but risks implying a meaningful sample size it doesn't
  have. Copy must say things like "We're just getting started — here's
  our first verified farm," not present small numbers in stats-panel
  styling that could read as more mature than reality.

## Architecture

Both pages are Next.js Server Components (same pattern as the admin
pages):

- `/` (Home) — replaces the Phase 0 placeholder.
- `/transparency` (new).

### Data access: server-only service-role client, not new RLS policies

A new `src/lib/supabase/service.ts` provides a service-role Supabase
client, used **exclusively** by these two pages' data-fetching code. This
is a deliberate choice over writing new `anon` RLS policies: Postgres RLS
is row-level, not column-level, so a policy meant to expose only "farmer
count" is one easy mistake away from also exposing phone numbers or exact
GPS — a mistake that would be invisible until someone actually looked.
Keeping `anon` exactly as fully locked out as it's been since Phase 0, and
funneling all public data through one server-only file that only ever
returns curated, non-PII aggregate values, is a much smaller and more
reviewable surface area than column-level-safe RLS.

Because this file becomes the single chokepoint for everything the public
can see, it gets a build-time safeguard: `src/lib/supabase/service.ts`
imports the `server-only` package at the top. This turns "a client
component accidentally imports the service-role client" from a silent
runtime leak of full-database-bypass credentials into a **build error**.

### `src/lib/publicStats.ts`

Split into two layers, mirroring the lesson from the Phase 2 payment bug
(separate data extraction from computation, so the computation is
unit-testable without touching the real database):

- **I/O layer** (hits the DB via the service-role client):
  - `getHomeCounts(): Promise<{ farmerCount: number; plotCount: number; verifiedPlotCount: number; totalTracedWeightKg: number }>`
  - `getTransparencySnapshot(): Promise<{ farmgateBatch: { farmerName: string; weightKg: number; grade: string; amountOwed: number } | null; verifiedPlotCount: number; totalPlotCount: number }>`
- **Pure layer** (no I/O, takes the above shapes as input, unit-testable):
  - `formatHomeStats(counts: HomeCounts): { headline: string; verifiedLabel: string }` — e.g. produces the "We're just getting started" framing when `farmerCount` is small, and the honest "0 farmers yet" state when it's zero.
  - `formatFarmgatePrice(batch: FarmgateBatch): string` — e.g. `"₦500,000 paid for 200kg (Grade I) ≈ ₦2,500/kg"`; guards against `weightKg === 0` (division by zero) even though Phase 2 validation should prevent it.

## Home page (`/`)

- Mission/process: static copy drafted from `plan.md`'s own Vision
  section (the founder's own words already, not invented), left for the
  founder to edit before this is ever shared publicly.
- Live metrics via `formatHomeStats(getHomeCounts())`: real counts, framed
  as early-stage ("We're just getting started — 1 farmer, 1 plot mapped,
  100% EUDR-verified so far, 200kg traced"), not a cold stats panel.
- Zero-farmer state (a fresh/reset DB): "Coming soon — we're just getting
  started" rather than "0 farmers, NaN% verified."

## Transparency page (`/transparency`)

- Farmgate price: real, via `formatFarmgatePrice(getTransparencySnapshot().farmgateBatch)` — "₦500,000 paid for 200kg (Grade I) ≈ ₦2,500/kg."
- Buyer price: static "Not yet disclosed — check back as we complete our
  first sale."
- EUDR readiness: real breakdown, framed early-stage — "We're just
  getting started: 1 of 1 verified plots so far, low deforestation risk"
  rather than presented as a mature statistic.
- Testimonial: omitted entirely this phase.
- Zero-batch state (a fresh/reset DB): "No transactions yet."

## Error Handling

- `formatHomeStats`/`formatFarmgatePrice` never divide without a
  zero-guard (weight, farmer/plot counts).
- Zero-data states render honest "coming soon" / "no transactions yet"
  copy rather than crashing, showing `undefined`/`NaN`, or silently
  falling back to a misleading default.
- `service.ts`'s `server-only` import makes any accidental client-side
  import of the service-role client a build failure, not a runtime leak.

## Testing

- **Unit tests (Vitest)** for the pure layer (`formatHomeStats`,
  `formatFarmgatePrice`): the real Patrick Ojo case (1 farmer, 1 verified
  plot, ₦500,000/200kg), and the zero-farmer/zero-batch cases — all
  exercised against injected data, never against the real database, so
  testing the empty state doesn't require wiping real data.
- **Manual Playwright pass** against the real dev DB: `/` shows the
  honest "1 farmer... just getting started" framing (not a stats panel);
  `/transparency` shows the real ₦2,500/kg figure, the "not yet
  disclosed" buyer-price line, and no testimonial section at all.

## Out of Scope for Phase 3

- Buyer price (Phase 4 — no Sale exists yet).
- Testimonials (deferred until a real, permissioned quote exists).
- Any new `anon` RLS policies (deliberately avoided — see Architecture).
- Actually publishing/sharing the live site — a separate founder decision
  once the buyer-price and testimonial gaps are addressed or knowingly
  accepted as still-open.
- Education page, buyer catalog (Phases 4-5).
