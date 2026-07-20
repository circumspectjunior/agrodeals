# Phase 2 — Batch & Lot Management: Design Spec

Date: 2026-07-20
Status: Approved

## Purpose

Phase 2 is the internal tool for logging harvest batches against a
farmer's plot, aggregating batches into sellable lots, and tracking what's
owed/paid to each farmer for their batches. Per plan.md Section 6 and
CLAUDE.md, this is the last internal-tools phase before any public page —
the Farmer Payment ledger in particular is "the most trust-critical part
of the whole system."

Reference: `plan.md` Section 6 (Phase 2) and Section 4 (core data model),
CLAUDE.md, and the project memory `farmer-payment-funding-model` (personal
capital funding decision, made ahead of this phase).

`batches`, `lots`, and `lot_batches` already exist from the Phase 0
migration — this phase is mostly new admin UI plus one new schema area
(Farmer Payment).

## Scope decisions (confirmed during brainstorming)

- **Amount owed**: manual entry at batch-logging time, not an
  auto-calculated formula — matches how farmgate prices actually get
  negotiated per delivery.
- **Amount owed is immutable** once set — confirmed against real practice
  (price is settled at the point of delivery/weighing, not adjusted
  afterward).
- **Partial payments are supported**, and get a real audit trail: a
  `payment_events` table (one row per payment), not a single mutable
  running-total field. `amount_paid` isn't stored at all — it's
  `sum(payment_events.amount)`, computed at query time, so it's
  structurally impossible for a stored total to drift from the actual
  events.
- **Grade is a fixed dropdown**: Grade I / Grade II / Grade III /
  Ungraded.
- **Lot rollup fields are auto-computed**, not manually entered:
  `total_weight` (sum), `blended_grade` (worst grade present),
  `eudr_status_rollup` (`"low"` only if every included batch's plot is
  fully verified low-risk, otherwise `null`).
- **A lot's batch composition is fixed at creation** — no later
  add/remove. `price_offered` is the one exception: optional at creation,
  editable afterward (price negotiation happens over time; physical batch
  composition doesn't change).
- **Lots are deletable** (releases their batches back to the unaggregated
  pool) to recover from a mis-click — but not if a Sale is already
  attached (enforced by the existing `sales → lots` FK, `on delete
  restrict`).

## Schema

### Farmer Payment

```
farmer_payments
  id uuid pk, farmer_id -> farmers, batch_id -> batches (unique — exactly
  one payment row per batch, created atomically with it),
  amount_owed numeric not null, created_at

payment_events
  id uuid pk, farmer_payment_id -> farmer_payments,
  amount numeric not null, paid_date date not null, created_at
```

`batch_id`, not `lot_id` — a farmer's payment obligation is created the
moment their batch is weighed and graded, regardless of which lot it later
gets aggregated into or how long aggregation takes. Referencing `lot_id`
instead would leave a gap: a farmer delivers cocoa and is owed money, but
no row exists yet because aggregation hasn't happened. (See the
`farmer-payment-funding-model` project memory for the full reasoning.)

RLS: `authenticated` gets full CRUD on both tables, matching the Phase 1
pattern (one authenticated role in use, no per-row scoping needed yet).

## Batch logging

`/admin/farmers/[id]/batches/new` — fields: plot (dropdown if the farmer
has multiple plots, auto-selected if only one), weight, moisture %,
fermentation days, grade (fixed dropdown), harvest date, and **amount
owed**. Submitting creates the `batches` row and its paired
`farmer_payments` row in the same action — owed amount is decided at the
moment cocoa is delivered and weighed, so there's no meaningful gap
between "batch exists" and "we know what's owed for it."

No photo upload (matches the Phase 1 decision to skip it), no Whisp call
(that's plot-level, already done).

The farmer detail page (`/admin/farmers/[id]`) gains a "Batches" section:
each batch shows weight/grade/harvest date, EUDR status (read from its
plot), and payment status computed as `sum(payment_events.amount)` vs.
`amount_owed` ("Unpaid" / "Partially paid (X of Y)" / "Paid in full"),
plus a "Record payment" action and an expandable list of the individual
payment events (date + amount) — the actual audit trail a farmer dispute
would need.

## Lot creation and rollup

`/admin/lots` (list) and `/admin/lots/new`. The create form lists every
batch not yet in any `lot_batches` row (a batch belongs to at most one
lot — you can't sell the same delivered cocoa twice): farmer name, weight,
grade, harvest date, EUDR status. Selecting a subset and submitting
computes and stores:

- `total_weight` = sum of included batches' weights.
- `blended_grade` = the **worst** grade present, using the fixed order
  Grade I > Grade II > Grade III > **Ungraded (worst)**.
- `eudr_status_rollup` = `"low"` only if **every** included batch's plot
  has `eudr_check_status = "complete"` **and** `eudr_risk_status = "low"`;
  otherwise `null`. The lot detail page then lists exactly which
  constituent plots still need attention — never a fabricated or
  averaged claim.

**On the Ungraded-worst ordering**: this is *not* claimed to be
philosophically symmetric with the EUDR rollup rule, even though both
rules superficially look like "the aggregate can't claim better than its
least-verified constituent." They're not the same kind of uncertainty —
an unchecked EUDR status might genuinely be high-risk, so treating it as
unclaimable is honest. "Ungraded" doesn't mean the cocoa might be bad
quality; it means nobody wrote a label down, and grade is a required
field the founder actively chooses at batch-logging time, not something
that takes time to come back like a Whisp check. The actual reason
Ungraded ranks worst is operational: if an ungraded batch couldn't drag a
lot's blended grade down, there would be zero cost to skipping grading
every time, and the field would quietly stop meaning anything. Making
Ungraded costly is what makes the dropdown worth having at all — this is
a deliberate incentive design, not a data-quality hedge.

`price_offered` is optional at creation and editable afterward via a
simple inline update on the lot detail page — this is the **one**
mutable field on an otherwise-immutable record; updating it must not
recompute or touch `total_weight`/`blended_grade`/`eudr_status_rollup`,
which stay locked to the batch set fixed at creation.

**Lot deletion**: a "Delete lot" action on the lot detail page deletes the
lot row, which cascades to remove its `lot_batches` rows (existing FK),
naturally releasing its batches back into the unaggregated pool. The
existing `sales → lots` FK (`on delete restrict`) already prevents
deleting a lot with a Sale attached — the action catches that DB error and
shows a friendly message rather than a raw Postgres error.

## Error Handling

- **Batch form**: weight required (positive); moisture % 0–100 if given;
  fermentation days ≥0 integer if given; harvest date required and not in
  the future; grade required (one of the four fixed values); amount owed
  required (positive).
- **Payment event**: amount required (positive); date required (not
  future); overpayment guardrail — `sum(existing events) + new amount ≤
  amount_owed` — rejected with a message showing the remaining balance.
- **Lot creation**: at least one batch must be selected; `price_offered`,
  if given, must be positive.
- **Lot deletion**: `sales → lots` FK rejection surfaced as a friendly
  message, not a raw DB error.

Considered and deliberately deferred (not worth holding up this spec):
a plausibility bound on harvest date (e.g. rejecting an implausibly old
date like a typo'd year) beyond "not in the future." Worth a data-quality
pass later if typo'd years turn out to be a real problem in practice, not
a rule to guess at now.

## Testing

Manual verification (same approach as prior phases — no automated harness
yet):

- Log a batch with valid data; verify the batch and its paired
  `farmer_payments` row (correct `amount_owed`).
- Submit invalid batch data (missing weight, future harvest date, etc.);
  verify rejection.
- Record a payment event; verify the computed total
  (`sum(payment_events.amount)`) is correct.
- Attempt to overpay; verify rejection with the remaining-balance
  message.
- Create a lot spanning mixed grades including one Ungraded batch; verify
  `blended_grade = "Ungraded"`.
- Create a lot where every batch's plot is `complete` + `low`; verify
  `eudr_status_rollup = "low"`.
- Create a lot with one batch whose plot isn't `complete`/`low`; verify
  rollup stays `null` and the lot page lists exactly which plot needs
  attention.
- Delete a lot; verify its batches become selectable again for a new lot.
- **Edit `price_offered` after lot creation; verify the update succeeds
  and, critically, does *not* recompute or change `total_weight`,
  `blended_grade`, or `eudr_status_rollup`** — this is the one mutable
  field on an otherwise-fixed record, and exactly the spot where a bug
  likes to hide.

## Known Limitation (carried forward, not a blocker)

Deleting a lot that already has a Sale attached can't be exercised this
phase — Phase 2 doesn't build any Sale-creation UI (that's Phase 4), so
the `sales → lots` FK rejection path exists in the schema but can only be
tested via a manual DB-level insert right now, not through the app. Same
shape as the Phase 1 Whisp `complete`/`failed` paths: named explicitly
rather than glossed over, to be exercised once Phase 4 exists. Track this
the same way in `review.md` once implementation starts.

## Out of Scope for Phase 2

- Sale creation / buyer catalog (Phase 4).
- Editing a lot's batch composition after creation.
- Adjusting `amount_owed` after a batch is logged.
- Any public-facing page (Phase 3+).
