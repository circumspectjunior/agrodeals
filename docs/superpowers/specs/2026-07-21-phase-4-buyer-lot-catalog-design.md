# Phase 4 — Buyer-Facing Lot Catalog: Design Spec

Date: 2026-07-21
Status: Approved

## Purpose

Phase 4 makes AgroDeal's real lots visible to buyers and gives them a way
to express interest, per plan.md Section 6 ("Public (or gated, your call)
listing of available lots... Buyer inquiry tied to a specific lot").

Reference: `plan.md` Section 6 (Phase 4) and Section 4 (core data model —
`Buyer`, `Sale`), CLAUDE.md, and `review.md`'s real data milestones
(Patrick Ojo's real lot — 200kg, Grade I, `eudr_status_rollup: "low"`, no
`price_offered` yet — is the only real lot in the system as of this spec).

## Scope decisions (confirmed during brainstorming)

- **Catalog visibility**: public listing (volume, grade, EUDR status) with
  pricing and contact gated behind a real inquiry — maximizes
  discoverability for a cold buyer while not exposing pricing directly to
  competitors/other middlemen browsing the site.
- **Inquiry ≠ Sale**: submitting an inquiry never creates a `Sale` row.
  Sale creation stays a separate, deliberate step the founder takes after
  a real conversation actually leads to a deal (Phase 4 does not build
  Sale-creation UI at all).
- **Buyer record creation stays manual**: an inquiry never auto-creates a
  row in the existing `Buyer` CRM-lite table. The founder creates one
  themselves if/when a real relationship develops — mirrors the
  inquiry≠Sale reasoning, so the `Buyer` table doesn't fill with one-off
  inquiries that never go anywhere.
- **Inquiries are persisted in the DB**, not email-only — a queryable
  record that survives even if a notification email is lost or Resend
  isn't configured yet.
- **No real `RESEND_API_KEY` yet** — email notification is built
  drop-in-ready, same pattern as the Phase 1 Whisp integration: the
  inquiry is always saved regardless; if unset, the email step is skipped
  (logged, not thrown), never blocking the save.
- Catalog handles the current zero/one-lot reality honestly, consistent
  with the "just getting started" framing already established on
  Home/Transparency — never styled like a marketplace with dozens of
  listings when there's exactly one real lot.

## Architecture

Two new public routes, mirroring the admin's own `/admin/lots` +
`/admin/lots/[id]` structure:

- `/lots` — public catalog list.
- `/lots/[id]` — public lot detail + inquiry form.

### Reads: same server-only philosophy as Phase 3

Both pages are Next.js Server Components using the existing
`src/lib/supabase/service.ts` service-role client (from Phase 3) for
fetching lot data. No new `anon` RLS policies for reading lots — `anon`
stays exactly as fully locked out as it's been since Phase 0.

### Writes: Server Action + service-role client, not an `anon` INSERT policy

This is the same philosophy extended to writes, and matters more here
than it might look: an `anon` INSERT policy on `lot_inquiries` would
technically work, but it means the database itself trusts unauthenticated
input directly — anyone could script-spam inserts straight against
Postgres, bypassing whatever validation a Server Action would otherwise
enforce, with no server-side logic in between. Routing writes through
`submitInquiry` (a Server Action using the service-role client) means all
input validation and the Resend fail-open logic live in one reviewable
place, and `anon` never gets a foothold in the database at all — not even
for writes.

## Schema

### `lot_inquiries`

```
lot_inquiries
  id uuid pk, lot_id uuid references lots (id) on delete restrict,
  company text not null, contact_name text not null, email text not null,
  country text, message text,
  viewed_at timestamptz, -- null until an admin visits the lot's detail page
  created_at timestamptz not null default now()
```

`on delete restrict`, matching the existing `sales → lots` pattern — a lot
with real buyer interest attached shouldn't be silently deletable, and
inquiry data (a real lead) shouldn't be destroyed as a side effect of
deleting the lot it was about. This protects the data from accidental
deletion; it does **not** mean an inquiry is as consequential as a Sale —
those are different decisions (see "Inquiry ≠ Sale" above).

RLS: enabled, no policies for any role except what the service-role client
already bypasses. `anon`/`authenticated` get no grants — all access goes
through `submitInquiry` (public writes) and the admin pages (reads, via
the existing session-based authenticated client, which needs a grant —
see below).

Because admin pages read `lot_inquiries` via the normal session-based
client (not the service-role client), `authenticated` needs
select/update grants on this table (to view and mark-viewed), matching
the Phase 1/2 pattern.

## Catalog availability

`/lots` filters to lots with no associated `sales` row. Nothing can mark a
lot "sold" yet — Sale-creation UI doesn't exist until a later phase — so
today this is equivalent to "show all lots." It's built correct now
(rather than as a "fix later once Sale exists" TODO) so it stays correct
the moment a Sale row starts existing via direct DB entry, without a
forgotten follow-up fix.

## Public display

Per lot: volume (`total_weight`), grade (`blended_grade`), EUDR status
(`eudr_status_rollup`, or "EUDR check pending" if null — never a
fabricated claim). No price — gated behind a real inquiry, per the
visibility decision.

`/lots` framing: with today's one real lot, says "Our first available
lot," not a marketplace grid. Zero-lot state: "No lots available yet —
check back soon."

## Inquiry flow

`/lots/[id]` shows the lot's public details plus a form: company, contact
name, email (required), country, message (optional). Submitting calls
`submitInquiry(lotId, input)`:

1. Validates `company`/`contact_name`/`email` required, plausible email
   shape (a plain regex — no need for a validation library for one
   field), `country`/`message` optional.
2. Inserts the `lot_inquiries` row via the service-role client.
3. Attempts a Resend notification email to the founder (lot summary +
   buyer contact info). If `RESEND_API_KEY` is unset or the send fails:
   logged server-side, never thrown, never blocks the already-saved
   inquiry.

## Admin visibility (closing the loop on why inquiries are persisted)

- `/admin/lots/[id]` gains an "Inquiries" section listing each inquiry
  (company, contact, email, country, message, date) for that lot.
  Visiting this page marks that lot's inquiries as viewed
  (`viewed_at = now()` where currently null) — best-effort: if this
  update fails, log it server-side but don't block the page render.
- `/admin/lots` (the list) shows an inquiry count per lot, split as e.g.
  "2 new" when any `viewed_at is null` rows exist for that lot — so
  scanning the lots list itself surfaces new activity without needing
  Resend configured or a click into every lot's detail page.

## Error Handling

- Inquiry form: missing required fields or an implausible email shape →
  inline error, nothing written.
- Resend failure: caught and logged, never blocks the save — the inquiry
  row is the source of truth regardless of email delivery.
- Lot not found (bad `:id` on `/lots/[id]`): `notFound()`.
- Admin "mark viewed" update: best-effort, failure doesn't break the page.

## Testing

- **Unit tests (Vitest)** for the pure logic: the "available lots" filter
  (excludes lots with a `sales` row) and the email-format validator,
  exercised against injected data — same I/O-vs-pure split established in
  `publicStats`/`publicStatsFormat`.
- **Manual Playwright pass** against the real dev DB:
  - `/lots` shows the honest "our first available lot" framing for
    Patrick's real lot, no price shown.
  - `/lots/[id]` shows volume/grade/EUDR status, no price.
  - Submitting a valid inquiry saves it and (with no `RESEND_API_KEY` set)
    skips email gracefully, no error surfaced to the buyer.
  - Submitting an invalid email is rejected with an inline error.
  - `/admin/lots` shows the new "N new inquiries" count for the lot after
    a real submission.
  - Visiting `/admin/lots/[id]` clears the "new" count (verified by
    reloading `/admin/lots` afterward).

## Out of Scope for Phase 4

- Sale creation (still a separate, later, deliberate admin action — no
  UI for it yet).
- Auto-creating `Buyer` records from inquiries.
- Email-based (not just DB) notification guaranteed to work — depends on
  a real `RESEND_API_KEY`, which doesn't exist yet.
- Any buyer-side account/login system (catalog and inquiry form are both
  fully public, no buyer authentication).
- Education page (Phase 5).
