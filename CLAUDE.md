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
  free, no API key cost; call this whenever a new Plot is added
- WhatsApp as the intended farmer-facing intake channel — most farmers
  will not use a web form directly

## Claims that must be backed by real data

Never hardcode or fabricate:
- "EUDR Ready" status — must come from actual Whisp API output per plot,
  not placeholder/aspirational text
- Farmgate vs. buyer price figures — use real founder-sourced data; if real
  numbers aren't available yet, label displayed figures clearly as sample
  data rather than presenting them as live
- Testimonials — only real, permissioned quotes from real farmers

## Payment-gap handling (confirm before building Phase 2 payment fields)

Buyers typically pay net-30/60; farmers need payment near harvest. The
Payment ledger's schema depends on which funding model is in use — e.g.
"amount owed until buyer pays" vs. "amount advanced personally by founder."
**Check `plan.md` Section 10 / ask the founder which model applies before
finalizing the Payment table schema** — this is a business decision that
changes the data model, not just a UI detail.

## Out of scope for now (don't build unless explicitly asked)

- Farmer-facing subscription/SaaS billing — the business model is trade
  margin, not platform fees on farmers
- Full institutional-buyer container logistics (~20 tonnes) — early buyers
  are smaller specialty buyers; don't over-build for a buyer size that
  doesn't exist yet
- Speculative EU-entity/incorporation features — legal/operational
  decisions here are still open (see plan.md Section 10)
