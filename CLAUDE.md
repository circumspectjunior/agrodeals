# CLAUDE.md — AgroDeal

Persistent context for Claude Code. Read this at the start of every session,
alongside `plan.md` for full phase detail.

## What this project is

AgroDeal is a direct-trade cocoa business, not just a website. It aggregates
cocoa from smallholder farmers (starting with the founder's grandfather and
neighboring farmers in Nigeria) and sells directly to buyers outside Nigeria
— mainly specialty/craft chocolate makers. The app is the trust and
operations layer on top of a real trading business.

The founder is Nigeria-based with Italian permanent residency and is
pursuing a Malta work permit — relevant context if EU-side entity/payment
questions come up in the code (e.g. invoicing, currency, contact details),
but not something to build speculative features around unless asked.

## Non-negotiable build order

**Internal tools before public pages.** Farmer registry → batch/lot
management → payment ledger must exist and hold real data *before* the
public Transparency/Home pages are built out, because those pages are only
credible when showing real numbers, not placeholders. If asked to jump
straight to public pages before the data model exists, flag this rather than
just proceeding.

## Core data model (do not deviate without discussion)

```
Farmer (name, village, contact/WhatsApp, photo)
  └── Plot (GPS boundary, EUDR risk status via Whisp API, area)
        └── Batch (weight, moisture %, fermentation days, grade, date, photos)

Lot (aggregates multiple Batches; total weight, blended grade,
     rolled-up EUDR status, price offered)
  └── Sale (buyer_id, agreed price, payment status, shipment status)

Farmer Payment (farmer_id, batch_id or lot_id, amount owed, amount paid, date)
Buyer (company, country, contact, volume needs, certifications required)
```

The **Farmer Payment ledger** is the most trust-critical part of the whole
system — it's the proof that this isn't just a rebranded middleman. Keep it
simple, accurate, and ideally viewable by the farmer themselves (even via a
WhatsApp-shareable summary) once built.

## Repo structure

Next.js app lives at the **repo root** (not in a subdirectory like `app/` or
`web/`) — no monorepo. Data scripts go in a plain `/scripts` folder at root;
WhatsApp intake is a Next.js API route, not a separate service. Do not
propose restructuring into a monorepo (`apps/web`, `apps/bot`, etc.) unless
a component genuinely can't run as part of the Next.js app anymore (e.g. a
long-running process that doesn't fit the serverless model) — that's a
deliberate future decision, not a default.

## Tech stack

- Next.js (App Router, TypeScript)
- Supabase (Postgres + Auth) — real relational data, not static JSON/MDX.
  This changed from an earlier static-site version of the plan; don't
  fall back to flat content files for farmer/batch/lot/sale data.
- Tailwind CSS
- Resend for transactional/contact email
- Whisp API (FAO Open Foris) for plot-level EUDR deforestation risk —
  free, no API key cost; call this whenever a new Plot is added.
  **Its live behavior contradicts its own published docs**: `/submit/geojson`
  can complete synchronously (`code: "analysis_completed"` in the submit
  response itself, not just after polling), and the job token lives at
  `context.token`, not a top-level `token` field as the docs imply. Both
  `/submit/geojson` and `/status/{token}` return the same
  `{code, data, context}` envelope — see `src/lib/whisp.ts`. Also:
  `risk_pcrop` isn't only low/medium/high — `more_info_needed` is a real
  value too (seen on a forested point that needs more context to classify).
  Plot geometry is point-based today **by design**, not as a stopgap —
  EUDR only requires a point for plots under ~4ha, which covers AgroDeal's
  smallholders. Boundary-polygon capture via QGIS + the Whisp QGIS plugin
  is a planned future upgrade (see plan.md Section 9), not a gap to fix
  now — don't second-guess the point-based approach without checking there
  first.
- WhatsApp as the intended farmer-facing intake channel — most farmers
  will not use a web form directly

## Claims that must be backed by real data

Never hardcode or fabricate:
- "EUDR Ready" status — must come from actual Whisp API output per plot,
  not placeholder/aspirational text. As of Phase 1, this is a **verified
  live pipeline**, not just a designed one: tested against a real
  `WHISP_API_KEY` with two independently sanity-checked coordinates (an
  urban point in Akure returning "low"; a forested hillside near Idanre
  Hill correctly returning tree-cover detected + "more_info_needed") —
  satellite imagery was used to confirm the results matched real land
  cover before trusting the integration. See `review.md` Phase 1 for
  detail. This matters because any public-facing "EUDR Ready" claim
  (Phase 3+) traces back to this pipeline.
- Farmgate vs. buyer price figures — use real founder-sourced data; if real
  numbers aren't available yet, label displayed figures clearly as sample
  data rather than presenting them as live
- Testimonials — only real, permissioned quotes from real farmers

## Payment-gap handling (decided — personal capital)

Buyers typically pay net-30/60; farmers need payment near harvest.
**Decided:** the founder funds farmer payments personally (advances cash
at/near harvest) and is reimbursed once the buyer eventually pays. This
means the Farmer Payment ledger tracks amount owed/paid to the farmer as
its own thing — it is **not** gated on or derived from `Sale.payment_status`.
Whether the founder has been reimbursed can be read off the related Sale's
own payment status when needed; it doesn't need its own field on the
Payment row (single funding source right now — don't add a
`funding_source` field until a second model, e.g. buyer deposits or a
cooperative advance, actually comes into play for some other farmer/lot).

Still open for Phase 2's brainstorming (schema-adjacent, not yet decided):
whether a Farmer Payment row references a `batch_id` or a `lot_id` — a
farmer is owed money for *their own* batch, before it's aggregated into a
lot with others, so `batch_id` is the likely answer, but confirm during
Phase 2 design rather than assuming.

## Out of scope for now (don't build unless explicitly asked)

- Farmer-facing subscription/SaaS billing — the business model is trade
  margin, not platform fees on farmers
- Full institutional-buyer container logistics (~20 tonnes) — early buyers
  are smaller specialty buyers; don't over-build for a buyer size that
  doesn't exist yet
- Speculative EU-entity/incorporation features — legal/operational
  decisions here are still open (see plan.md Section 10)
