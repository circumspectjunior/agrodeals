# Phase 5 — Farmer Education Page: Design Spec

Date: 2026-07-21
Status: Approved

## Purpose

Phase 5 adds a farmer-facing education page — the first page whose audience
is the founder's own farmers (his grandfather and neighbors in Nigeria),
not buyers. Per plan.md Section 6, it starts with 1–2 modules and is
"directly useful for your own farmers, not just generic content."

Reference: plan.md Section 6 (Phase 5) and Section 8 (the Translation
quality risk), CLAUDE.md ("Claims that must be backed by real data";
translation MT-is-draft-only rule). Phase 5 depends only on Phase 0.

## Scope decisions (confirmed during brainstorming)

- **Two modules for v1**: Post-harvest quality, and Fair price basics.
- **Content authorship**: drafted from general agronomy knowledge, with
  every piece explicitly tagged as either a universal cocoa-handling fact
  or an AgroDeal-specific claim — because the founder needs to *verify*
  the specific claims against real practice, not just proofread the
  writing.
- **Translation**: English is authoritative now. The page is built
  i18n-ready, but **no machine-translated text is ever shown** — a
  language appears only once its content is genuinely human-reviewed.
  English-only for v1; which language comes first is deferred.
- **Delivery**: a public, mobile-first page (no auth), built so the
  founder can share the link over WhatsApp or walk a farmer through it on
  a phone.

## Content model (the core of this phase)

Content lives as structured data in the repo (a TypeScript content
module), not the database — factual educational content that changes
rarely and needs founder review is exactly what belongs in version
control. This does not contradict CLAUDE.md's "no flat files for
farmer/batch/lot/sale data" rule: that concerns relational *business*
data, not educational content.

Each content piece is tagged one of two ways:

- **`universal`** — a general cocoa-handling fact true anywhere (e.g.
  "cocoa should be dried to around 7% moisture"; "under-fermented beans
  grade lower"). Rendered plainly.
- **`agrodeal_specific`** — any claim about how *AgroDeal specifically*
  grades or prices. Carries a `verified: boolean` flag, default `false`.

**The public page renders all `universal` content plus only the
`agrodeal_specific` pieces marked `verified: true`.** An unverified
specific claim stays in the source for the founder's review but is
**never shown to a farmer** — withheld entirely, not merely labeled.

Rationale for withholding rather than labeling: a "draft / unconfirmed"
label protects a careful reader, but the whole point of this content is
reaching farmers who may not weigh a label carefully. Withholding is the
only approach that matches CLAUDE.md's spirit (same conclusion as the
EUDR-status, price, and testimonial rules) rather than technically
complying while leaving the real risk in place.

### Review workflow

The founder flips a claim to `verified: true` by editing the content file
(directly, or by instructing an edit) once they've confirmed it against
real practice. No admin UI for verification — that keeps this phase small,
and two modules with a handful of claims is a practical amount to review
by hand. (If the review friction turns out worse than expected once real
content exists, that's a legitimate reason to reconsider the mechanism
later — not something to force through for architectural tidiness.)

### Empty-module handling

Fair-price-basics is inherently mostly `agrodeal_specific` ("how grade
maps to what you're paid" is close to entirely a specific claim), so much
of it may sit unverified and held back. A module whose publicly-renderable
content is empty or nearly so must render an honest **"This section is
being reviewed — check back soon"** state, never a broken empty block.

**Publish-readiness report (a deliverable, not an afterthought)**: once
both modules are drafted, before the page is considered publishable, the
implementer reports the verified-vs-held-back ratio per module — e.g.
"Post-harvest: 8 of 8 shown; Fair price: 1 of 6 shown, 5 held for review."
This lets the founder decide, *before* publish, whether fair-price-basics
needs a review pass as a blocker rather than shipping mostly empty.

## i18n structure

- Content keyed by language code. `en` populated and authoritative;
  `yo`/`ig`/`ha` absent until a human-reviewed translation exists.
- The language switcher lists only languages with reviewed content;
  with English-only it shows nothing (or just English). No MT is ever
  rendered — an unreviewed language simply does not appear, the same
  withholding discipline applied to unverified claims.
- The structure supports per-module translation (one module can gain
  Yoruba before another). The exact untranslated-module fallback
  behaviour (most likely: show authoritative English with a small "shown
  in English" note) is finalized when the first real reviewed translation
  is added — deferred (YAGNI) while v1 is English-only.

## Architecture

- Public route `/learn` (no auth), mobile-first, plus a nav link.
- `src/lib/education/content.ts` — the structured content (typed), with
  the two modules and each piece tagged `universal` / `agrodeal_specific`
  (+ `verified`).
- `src/lib/education/format.ts` — pure functions (no I/O, no `server-only`
  guard, unit-testable), mirroring the `publicStatsFormat` /
  `lotCatalogFormat` split:
  - `publicContentFor(module)` → the pieces a farmer should see (all
    universal + verified specifics).
  - `publishableCount(module)` → `{ shown, heldBack }` for the empty-module
    check and the publish-readiness report.
- `src/app/learn/page.tsx` — server component rendering each module from
  `publicContentFor`, with the "being reviewed" state when
  `publishableCount().shown === 0`.

No database, no service-role client, no network — content is static in the
repo, so unlike the Phase 3/4 public pages this page needs no
`force-dynamic` (it can be statically rendered; content only changes on
deploy).

## Error Handling

- A module with zero publishable pieces renders the honest "being
  reviewed — check back soon" state, never an empty/broken section.
- Unverified `agrodeal_specific` claims are absent from the rendered
  output entirely (verified by test — see below), not shown with a
  disclaimer.
- An unreviewed language never appears in the switcher.

## Testing

- **Unit tests (Vitest)** for the pure layer, against injected content:
  - `publicContentFor` includes every `universal` piece.
  - `publicContentFor` includes an `agrodeal_specific` piece only when
    `verified: true`; excludes it when `false`.
  - `publishableCount` returns the correct `{ shown, heldBack }`,
    including the all-held-back (empty module) case.
- **Manual Playwright** against the built page:
  - `/learn` renders the universal post-harvest guidance.
  - A deliberately-unverified specific claim is confirmed **absent** from
    the page (proving withholding, not just labeling).
  - A module with no publishable content shows the "being reviewed" state.

## Out of Scope for Phase 5

- Machine-translated content of any kind.
- Yoruba/Igbo/Hausa text (added later, per-module, only after human
  review).
- An admin UI for verifying claims (editing the content file is the
  workflow for now).
- The other four modules (EUDR traceability, GPS records, buyer
  verification, safe farming) — later expansion.
- Any farmer login/account (the page is fully public).
