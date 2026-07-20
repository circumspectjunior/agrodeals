# Phase 1 — Farmer & Plot Registry: Design Spec

Date: 2026-07-20
Status: Approved

## Purpose

Phase 1 is the internal admin tool that produces AgroDeal's first real
data: a farmer, their plot's GPS location, and that plot's EUDR
deforestation-risk status. Per CLAUDE.md's non-negotiable build order, this
must exist and hold real data before any public page is built.

Reference: `plan.md` Section 6 (Phase 1), CLAUDE.md, and
`docs/superpowers/specs/2026-07-20-phase-0-foundation-design.md` (the
carried-forward open item on Whisp's polygon requirement, resolved below).

## Whisp / EUDR research (resolves the Phase 0 open item)

Whisp's API accepts both point and polygon geometry. More importantly,
**EUDR itself only requires a single GPS point for plots under 4 hectares**
— a full boundary polygon is only mandated at 4ha or larger. AgroDeal's
farmers are smallholders, so most plots likely qualify for point-based
capture. This means the `center_lat`/`center_lng` columns added in Phase 0
are not just a placeholder pending a polygon column — they may remain
sufficient for most farmers. A boundary polygon column can be added later
for larger plots or extra audit defensibility, but it's not a blocker.

## Scope decisions (confirmed during brainstorming)

- No Whisp API key yet — the integration is built so a real key is a
  drop-in later, not designed around fake data now.
- GPS input is manual lat/lng number entry (matches point-based EUDR
  capture for <4ha plots) — no map picker in this phase.
- No farmer photo upload — `photo_url` stays a plain text field for a URL
  pasted in later. Supabase Storage stays disabled (as set in Phase 0).
- One farmer, one plot per creation flow — not a schema limitation. The
  farmer detail page always shows an "add another plot" link regardless of
  how many plots already exist; `plots.farmer_id` already supports
  many-to-one. This phase just doesn't build a repeating multi-plot
  section into a single form.
- A manual "Recheck EUDR status" action is included in this phase (not
  deferred) — cheap to build (reuses the same Whisp-call function) and
  closes a real gap: without it, a transient Whisp outage would strand a
  plot at a non-final status with no fix short of deleting and re-adding
  it, for a field CLAUDE.md flags as a real trust-critical claim.

## Architecture

New admin routes (App Router, under the existing middleware-gated
`/admin/*`):

- `/admin/farmers` — list of farmers
- `/admin/farmers/new` — create-farmer form
- `/admin/farmers/[id]` — farmer detail: shows the farmer's plot(s) (if
  any) with EUDR status, plus an "add a plot" link
- `/admin/farmers/[id]/plots/new` — add-plot form (lat, lng, area)

Writes go through Next.js Server Actions using the existing session-based
Supabase server client (`src/lib/supabase/server.ts`), not the service-role
key — so RLS is the real access-control mechanism here, not just the
middleware's route gate.

### RLS policies (new — first real policies since Phase 0 left everything
default-deny)

`authenticated` gets full CRUD (select/insert/update/delete) on `farmers`
and `plots`. There is exactly one authenticated user right now (the
founder); this is not scoped further (e.g. per-row ownership) because
there's nothing to scope against yet. `anon` gets no new grants — stays
exactly as locked out as it was after Phase 0.

### Schema addition

One new column via a new migration, on `plots`:

```
eudr_check_status text not null default 'not_configured'
  check (eudr_check_status in ('not_configured', 'pending', 'failed', 'complete'))
```

`eudr_risk_status` (added in Phase 0) stays `null` until
`eudr_check_status = 'complete'` — it only ever holds a real Whisp-derived
value, never a sentinel, so the trust-critical claim it represents is
never ambiguous with a meta-state.

### Whisp integration (`src/lib/whisp.ts`)

```
getEudrRiskStatus(lat: number, lng: number): Promise<{
  status: "not_configured" | "pending" | "failed" | "complete";
  risk: string | null;
}>
```

- If `process.env.WHISP_API_KEY` is unset: returns
  `{ status: "not_configured", risk: null }` immediately — no network call
  attempted. This is the expected state right now, not an error.
- Otherwise: builds a GeoJSON `Point` `Feature`, `POST`s to
  `https://whisp.openforis.org/api/submit/geojson` with the `X-API-KEY`
  header, gets back a `token`, then polls `GET /api/status/{token}` every 2
  seconds, up to 15 attempts (~30s total).
  - Terminal success with a `risk_pcrop` field present →
    `{ status: "complete", risk: <risk_pcrop value> }`.
  - Non-2xx response, thrown fetch error, or a terminal response missing
    `risk_pcrop` → `{ status: "failed", risk: null }`, logged server-side
    with the response status/body (or error) for debugging — never
    swallowed silently.
  - Poll loop exceeds the timeout without a terminal result →
    `{ status: "pending", risk: null }`.

Called once from the plot-creation Server Action, right after the plot row
is inserted, to backfill `eudr_check_status`/`eudr_risk_status` via an
update.

### Manual recheck

A `recheckEudrStatus(plotId)` Server Action re-fetches the plot's
lat/lng, calls `getEudrRiskStatus` again exactly as at creation, and
updates the row. Shown as a "Recheck EUDR status" button on the farmer
detail page next to any plot whose `eudr_check_status !== "complete"`.

Tradeoff: recheck **resubmits a fresh Whisp job** rather than tracking and
re-polling the original token. Simpler, and avoids adding a token-storage
column for a case (a stuck `pending`/`failed` plot) that should be rare.

## Data flow

1. Admin opens `/admin/farmers/new`, submits name/village/phone →
   `createFarmer` Server Action inserts the row → redirect to
   `/admin/farmers/[id]`.
2. Admin opens `/admin/farmers/[id]/plots/new`, submits lat/lng/area →
   `createPlot` Server Action inserts the plot row (`eudr_check_status`
   defaults to `not_configured`) → calls `getEudrRiskStatus` → updates the
   row with whatever status/risk it returns → redirect to
   `/admin/farmers/[id]`.
3. Farmer detail page shows the plot with its status. If not `complete`,
   shows the appropriate pending/failed message and a "Recheck EUDR
   status" button.

## Error Handling

- **Farmer form**: `name` and `village` required server-side (not just
  HTML `required`); `phone_whatsapp` optional. Missing fields → inline
  error, no row written.
- **Plot form**: `lat` must be -90..90, `lng` must be -180..180 (server-
  validated); `area` optional but must be a positive number if given.
  Invalid input → inline error, no row written.
- **Whisp failures never block plot creation** — the plot row is written
  regardless of what `getEudrRiskStatus` returns; a failed/pending Whisp
  check is never a reason to fail the user-facing form submission.
- UI copy per state:
  - `not_configured` → "Pending — Whisp not configured yet"
  - `pending` → "Pending — check still running, will retry"
  - `failed` → "Check failed — will retry"
  - `complete` → the real risk value

## Testing

Manual verification (same approach as Phase 0 — no automated test harness
yet):

- Create a farmer through the UI; verify the row via Supabase Studio or a
  REST query.
- Submit the farmer form with missing required fields; verify an inline
  error and that no row is written.
- Add a plot with valid coordinates; verify `eudr_check_status =
  'not_configured'` (no local `WHISP_API_KEY`) and the UI shows "Pending —
  Whisp not configured yet".
- Submit the plot form with an out-of-range latitude; verify it's
  rejected.
- Click "Recheck EUDR status" on a `not_configured` plot; verify it re-runs
  cleanly and the status stays `not_configured` (no crash).
- Re-verify `anon` is still fully locked out after adding the new
  `authenticated` RLS policies — confirm the new grants didn't
  inadvertently widen `anon`'s access too.

## Known Limitation (carried forward, not a blocker)

Without a live `WHISP_API_KEY`, the `failed`/`pending`/`complete` code
paths cannot be exercised end-to-end in this phase. Same shape as the
Phase 0 spec's carried-forward Whisp-polygon question: flagged here so
it's exercised deliberately once a real key is obtained, not discovered by
surprise.

## Out of Scope for Phase 1

- Farmer photo upload (Supabase Storage stays disabled).
- Multi-plot-per-form UI (schema already supports it; just not this form).
- Boundary polygon capture (only needed for plots ≥4ha; point capture
  covers smallholders for now).
- Batch/Lot management (Phase 2).
- Any public-facing page (Phase 3+).
