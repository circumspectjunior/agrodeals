# AgroDeal — Business & Build Plan

## 1. Vision

AgroDeal is a direct-trade cocoa business: aggregating cocoa from smallholder
farmers (starting with your grandfather's village) and selling directly to
buyers outside Nigeria — primarily specialty/craft chocolate makers who pay a
premium for traceable, ethically-sourced cocoa. The website is the storefront
and trust layer; the real product is the trading operation underneath it —
farmer relationships, aggregation, quality, compliance, logistics, and
payment.

**You're the exporter/aggregator, not just a software builder.** The app
exists to make that operation legible and trustworthy to buyers, and fair and
transparent to farmers. Keep that ordering in mind at every phase: if a
feature doesn't serve one of those two audiences, it's not core.

**Your position:** Nigeria-based, Italian permanent resident, working
towards a Malta work permit. This is a real asset — it means you can
plausibly operate (or eventually incorporate) an entity on the EU side to
receive payment, hold buyer relationships, and handle import paperwork,
rather than relying entirely on a Nigerian exporter structure. Worth getting
proper advice on (see Section 3) rather than assuming either side is simpler.

---

## 2. Business Model — How You Make Money

- **Disclosed trade margin**: you buy from farmers at a fair, published
  farmgate price and sell to buyers at a higher price. The margin is your
  income — and the fact that it's *disclosed on the platform* is what makes
  you different from the middlemen you're replacing, not the fact that you
  take a margin at all. Hiding it would defeat the entire premise.
- **Longer term, optional**: a small fee for buyers who want deeper
  traceability data/API access beyond the public catalog. Don't build this
  first — it only matters once you have real buyers and real data.
- **Not the model (at least at first)**: subscription/SaaS fees from
  farmers. Your grandfather's neighbors are not going to pay you to be on a
  cocoa app. The money comes from the trade, not from platform fees on the
  supply side.

---

## 3. Legal & Operational Foundations (do this in parallel with Phase 0 — not after)

This is the part that actually determines whether cocoa moves, and it's easy
to under-scope while focused on the app. None of the below is legal/financial
advice — get a Nigerian trade lawyer or export consultant, and separately an
Italian/EU one, involved early. Flagging what to ask them:

- **Nigerian export registration**: Exporting cocoa from Nigeria typically
  requires registration with the Nigerian Export Promotion Council (NEPC)
  and compliance with cocoa-specific export documentation (grading
  certificates, phytosanitary certificates). Until you're registered
  yourself, working through an existing licensed exporter for your first
  shipment(s) may be the realistic path.
- **EU-side entity**: Ask an advisor whether receiving payment and handling
  import through an Italy/Malta-based entity you control makes sense given
  your residency status — this could simplify buyer trust (an EU-based
  invoice/contact) and customs on the receiving end. Don't assume this is
  necessary for Phase 1, but it's worth scoping now since it shapes how
  Contact/payments get built.
- **Cash flow / farmer payment timing**: Buyers usually pay net-30/60 after
  shipment; farmers need to be paid at or soon after harvest. Decide now how
  you'll bridge that gap for your first few sales — personal capital, a
  deposit from the buyer, or a cooperative/community advance arrangement.
  This determines what the "Payments" feature actually needs to track.
  **This is the single most common reason direct-trade efforts like this
  stall — plan it before you plan the software.**
- **Minimum viable volume**: A full export container is roughly 20 tonnes.
  Your first sales will likely be much smaller, direct-to-buyer lots
  (specialty chocolate makers routinely buy in smaller quantities than
  commodity buyers) — confirm freight/shipping options and minimums for
  smaller lot sizes before promising anything to a buyer.

---

## 4. Core Data Model

This is the real product. The public site (Home/Transparency/Education/
Contact) is a view on top of this data, not a separate thing.

| Entity | Key fields | Notes |
|---|---|---|
| **Farmer** | name, village, plot GPS (via Whisp), estimated yield, photo, contact (phone/WhatsApp) | Start with your grandfather + immediate neighbors; this is your traceability backbone |
| **Plot** | GPS boundary, farmer_id, EUDR risk status (from Whisp), area | One farmer may have multiple plots |
| **Harvest/Batch** | farmer_id, plot_id, weight, moisture %, fermentation days, grade, date, photos | Raw intake before aggregation |
| **Lot** | list of batch_ids, total weight, blended grade, EUDR status rollup, price offered | What you actually sell to a buyer — an aggregated, sellable unit |
| **Buyer** | company, country, contact, volume needs, certifications required | CRM-lite |
| **Sale/Transaction** | lot_id, buyer_id, agreed price, payment status, shipment status | The actual deal |
| **Farmer Payment** | farmer_id, batch_id or lot_id, amount owed, amount paid, date | The trust-critical ledger — this is what proves you're not a new middleman |

Build this as a real database (Supabase/Postgres), not static JSON files —
this was fine for a brochure site but this data changes constantly and needs
relationships between farmers, batches, lots, and sales.

---

## 5. Tech Stack (revised)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | Same as before — good for public site + admin views |
| Database | Supabase (Postgres) | You need real relational data now (farmers → plots → batches → lots → sales), not flat content files |
| Styling | Tailwind CSS | Unchanged |
| Farmer intake | WhatsApp Business API (or a simple WhatsApp-linked form) | Your grandfather isn't filling out a web form — meet farmers where they already are |
| Map/geolocation | Whisp API + Open Foris Ground for field GPS capture | Unchanged from before — this is still your EUDR backbone |
| Auth | Supabase Auth, roles: admin (you), possibly field-team | Public site stays open; farmer/lot data entry is gated |
| Buyer-facing catalog | Public pages reading from Supabase (lot listings, price, EUDR status) | Replaces the old static "Transparency" content model |
| Contact/inquiry | Resend | Unchanged |
| Hosting | Vercel + Supabase | Unchanged |

---

## 6. Phases & Dependencies

### Phase 0 — Foundation
- Next.js + Supabase project setup
- Database schema for the Section 4 data model
- Shared layout: Nav, Footer, Container, base components
- Admin auth (just for you initially)

### Phase 1 — Farmer & Plot Registry (internal tool first, not public)
- Simple admin form/page to add a farmer (your grandfather first) + plot GPS
- Whisp API integration: submit plot GPS → get EUDR risk status back, store it
- This phase produces your *first real data*, before anything public ships

**Depends on:** Phase 0. **This should come before the public site**, not
after — you need at least one real farmer + plot in the system to make the
Transparency page mean anything.

### Phase 2 — Batch & Lot Management (internal)
- Log a harvest batch against a farmer/plot
- Aggregate batches into a sellable lot
- Basic farmer payment ledger (owed/paid)

**Depends on:** Phase 1.

### Phase 3 — Public Site: Home + Transparency
- Home: mission, process, live metrics pulled from real data (farms mapped,
  traceability %) instead of static placeholder numbers
- Transparency: real farmgate vs. buyer price snapshot, real EUDR readiness
  status pulled from Whisp data, real testimonial (your grandfather or a
  neighbor, with permission)

**Depends on:** Phase 2 — this phase is *much* stronger once real data exists
rather than shipping with placeholders.

### Phase 4 — Buyer-Facing Lot Catalog
- Public (or gated, your call) listing of available lots: volume, grade,
  EUDR status, indicative price
- Buyer inquiry tied to a specific lot (extends the old Contact form)

**Depends on:** Phase 2 (needs real lots to list).

### Phase 5 — Farmer Education Page
- Same as original plan: EUDR traceability, GPS records, fair price basics,
  post-harvest quality, buyer verification, safe farming
- Multilingual (Yoruba/Igbo/Hausa) — scope to 1–2 modules first, expand later
- Directly useful for your own farmers, not just generic content

**Depends on:** Phase 0 only — can run in parallel with Phases 1–4.

### Phase 6 — Polish & Launch
- Responsive/mobile QA (buyers and you will both check this on phones)
- SEO, analytics, professional domain/email
- Deploy

**Depends on:** Phases 1–5 substantially complete.

---

## 7. Dependency Graph (summary)

```
Phase 0 (Foundation)
  ├── Phase 1 (Farmer/Plot Registry — internal)
  │     └── Phase 2 (Batch/Lot Management — internal)
  │           ├── Phase 3 (Public Home + Transparency, uses real data)
  │           └── Phase 4 (Buyer Lot Catalog)
  └── Phase 5 (Farmer Education — can run in parallel)
        └── Phase 6 (Polish & Launch, needs 1–5 done)
```

Note the shift from the original plan: **internal tools (farmer/lot data)
now come before the public-facing pages**, because the public pages are only
credible once they're showing real data instead of placeholders.

---

## 8. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Farmer cash-flow gap** (buyers pay net-30/60, farmers need cash at harvest) | Could break trust with farmers on the very first sale | Decide funding approach (personal capital, buyer deposit, cooperative advance) before your first real transaction — this is a business decision, not a software one |
| **Export/legal registration incomplete** | Cocoa physically can't leave Nigeria without proper documentation | Start NEPC registration and compliance research now, in parallel with Phase 0–1, not after the app is built |
| **Minimum volume mismatch with big buyers** | Institutional buyers (Ferrero-scale) want full containers you can't yet supply | Target specialty/craft chocolate buyers first — smaller volumes, values traceability, more realistic entry point |
| **EUDR compliance claims** | "EUDR Ready" badge is a real claim to real buyers now, not marketing copy | Base every claim directly on actual Whisp output per plot, not aspirational copy |
| **Translation quality** (Yoruba/Igbo/Hausa) | Poor translation undermines trust with the exact people (your neighbors) this is meant to serve | Use MT as a draft, have a native speaker (you, or someone in the village) review before publishing |
| **Farmer payment trust** | If farmers don't visibly get paid fairly and promptly, the whole "not a middleman" premise collapses | Build the payment ledger early (Phase 2), keep it simple and honest, consider showing farmers their own record directly (even via WhatsApp) |
| **You are simultaneously trader, exporter, and developer** | Real risk of the software eating time that should go to buyer relationships and export logistics | Treat Phases 1–2 (internal tools) as the minimum to start real conversations with buyers — you don't need the full public site to start those relationships |
| **Single point of failure (you)** | Whole operation depends on one person across two countries | Not solvable immediately, but worth keeping in mind as you decide what to formalize (EU entity, local cooperative partner) as things grow |

---

## 9. Data & API Resources

| Need | Recommended pick | Link |
|---|---|---|
| EUDR / deforestation risk per plot | Whisp (FAO Open Foris) — free, open-source | https://www.openforis.org/whisp/ |
| Global cocoa reference pricing | FRED (St. Louis Fed) — free API | https://fred.stlouisfed.org/series/PCOCOUSDM |
| Translation (Yoruba/Igbo/Hausa) | Google Cloud Translation API — 500k chars/month free, permanent | https://cloud.google.com/translate |
| Contact/inquiry email | Resend — 3,000 emails/month free | https://resend.com |
| Farmer field GPS capture | Open Foris Ground (mobile app, free) | https://www.openforis.org/ (Ground tool) |

---

## 10. Open Decisions

1. Who is your first buyer conversation target — do you have any specialty
   chocolate maker contacts already, or does that need researching?
2. How will you fund the farmer-payment gap for your first sale?
3. Nigerian export path: apply for NEPC registration yourself, or route the
   first shipment(s) through an existing licensed exporter?
4. Is an EU-side entity (Italy/Malta) worth setting up now, or later once
   there's real trade volume?
5. i18n scope for Education page: start with how many modules translated?

---

## 11. Suggested Order of Operations for Claude Code

1. Phase 0 in full
2. Phase 1 (Farmer/Plot Registry) — get your grandfather's data in first
3. Phase 2 (Batch/Lot Management)
4. Phase 3 (Public Home + Transparency) — now backed by real data
5. Phase 4 (Buyer Lot Catalog)
6. Phase 5 (Education) — can start in parallel with 3–4
7. Phase 6 (Polish & Launch)

Alongside all of this, Section 3 (legal/export/cash-flow) should be running
in parallel from day one — it's not blocked by the software and the software
is worth very little without it.
