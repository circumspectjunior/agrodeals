# Phase 6 — Polish & Launch: Design Spec

Date: 2026-07-21
Status: Approved

## Purpose

Phase 6 gets the app production-ready and documents the path to going
live. Per plan.md Section 6: responsive/mobile QA, SEO, analytics,
professional domain/email, deploy.

Reference: plan.md Section 6 (Phase 6). Depends on Phases 1–5, all
complete.

## Scope split (the core framing of this phase)

Phase 6 is deliberately decomposed into two buckets:

- **Buildable now** — everything doable without external accounts or
  infrastructure. This is what this spec implements and verifies.
- **Founder-gated go-live** — steps requiring the founder's own
  accounts/money/decisions (domain, production Supabase, real API keys,
  the actual deploy, email). These are **documented in `LAUNCH.md`, not
  implemented** — "launch" is delivered as a clear checklist, not
  pretended.

## Buildable now

### A. SEO / metadata

- **Root layout** (`src/app/layout.tsx`): add `metadataBase` derived from
  `NEXT_PUBLIC_SITE_URL` (falling back to `http://localhost:3000` when
  unset), a title template (`%s · AgroDeal`), and default Open Graph
  fields (title, description, siteName "AgroDeal", type "website"). Text
  only — no fabricated brand/OG image (noted as an optional design item in
  `LAUNCH.md`).
- **Per-page metadata** on the public pages currently inheriting the
  generic title:
  - `/` (Home), `/transparency`, `/lots` — static `metadata` exports with
    page-specific title + description.
  - `/lots/[id]` — `generateMetadata` using the lot's real specs (e.g.
    "200 kg · Grade I — AgroDeal"); `notFound`-safe (no metadata crash on
    a bad id).
  - `/learn` already has metadata — unchanged.
- **Admin pages `noindex`**: the `/admin` segment must not be indexed
  (login/dashboard/data-entry). Add `robots: { index: false, follow:
  false }` metadata at the admin layout level (create
  `src/app/admin/layout.tsx` if needed to carry it) so every admin route
  inherits it.
- **`src/app/robots.ts`**: allow all public routes, `disallow: "/admin"`;
  reference the sitemap URL (built from `NEXT_PUBLIC_SITE_URL`).
- **`src/app/sitemap.ts`**: list the public routes `/`, `/transparency`,
  `/lots`, `/learn` (absolute URLs from `NEXT_PUBLIC_SITE_URL`).
  Individual `/lots/[id]` pages are intentionally omitted (they churn and
  the catalog already links them) — noted so it's a deliberate choice, not
  an oversight.

### B. Responsive / mobile QA

Verify every public page (`/`, `/transparency`, `/lots`, `/lots/[id]`,
`/learn`) at a 375px mobile viewport via Playwright; screenshot each and
fix real breakage. The 4-item Nav (AgroDeal / Available lots /
Transparency / For farmers) is the most likely offender on narrow
screens — it must wrap or shrink gracefully rather than overflow. Admin
pages are founder-only and lower priority, but should not be visibly
broken.

### C. Analytics — drop-in, env-gated

A small `Analytics` component rendered in the root layout that injects an
analytics script **only when `NEXT_PUBLIC_ANALYTICS_SRC` is set** (an
optional `NEXT_PUBLIC_ANALYTICS_DOMAIN` passed through as the script's
`data-domain`), and renders `null` otherwise. Provider-agnostic (works
with Plausible/Umami/simple-analytics-style script tags), zero new
dependency, and nothing loads or phones home until the founder configures
it after deploy — the same fail-quiet pattern as the Whisp and Resend
integrations.

### D. Cleanup + deprecation fix

- Migrate `src/middleware.ts` → `src/proxy.ts`: rename the file and the
  exported `middleware` function to `proxy`, keeping the `config` matcher
  export. This clears the standing Next.js 16 `middleware`-deprecation
  warning flagged since Phase 0. Verify the exact rename against the build
  output (the migration must leave `/admin` auth-gating fully working).
- Delete the leftover create-next-app SVGs in `public/` (`file.svg`,
  `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`) — none are
  referenced by app code (the scaffold homepage that used them was
  replaced in Phase 3).

### E. Launch readiness docs

- **`.env.example`**: documents every env var the app reads —
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `WHISP_API_KEY`, `RESEND_API_KEY`,
  `RESEND_FROM`, `INQUIRY_NOTIFY_TO`, `NEXT_PUBLIC_SITE_URL`,
  `NEXT_PUBLIC_ANALYTICS_SRC`, `NEXT_PUBLIC_ANALYTICS_DOMAIN` — with a
  one-line note on each and which are required vs. optional/drop-in.
- **`LAUNCH.md`**: the founder-gated go-live runbook —
  - Buy a domain; set `NEXT_PUBLIC_SITE_URL`.
  - Create a production Supabase project; push migrations
    (`supabase db push` against the linked project); seed the admin
    account there (`scripts/seed-admin.mjs`).
  - Set real env vars/secrets in the host: Supabase URL/anon/service-role,
    `WHISP_API_KEY`, Resend trio, site URL, analytics.
  - Deploy on Vercel (Next.js zero-config); verify Whisp and Resend work
    live.
  - Professional email + DNS.
  - **Open content gaps** (each traces to an earlier phase's honest
    placeholder): real buyer price (Transparency), a permissioned
    testimonial, the 3 held `[FOUNDER TO CONFIRM]` fair-price claims
    (`verified: true`), the first reviewed translation, and an optional
    OG/brand image.

## Explicitly out of scope (documented in LAUNCH.md, not implemented)

Buying the domain; creating/linking/migrating a production Supabase
project; providing real `WHISP_API_KEY`/`RESEND_API_KEY`; the actual
deploy; professional email/DNS. All require the founder's own
accounts/decisions.

## Error Handling

- Metadata derives from `NEXT_PUBLIC_SITE_URL` with a localhost fallback,
  so missing config degrades to working-but-local URLs, never a crash.
- `generateMetadata` for `/lots/[id]` handles a missing lot without
  throwing (returns a generic title; the page itself already
  `notFound`s).
- The `Analytics` component renders `null` when unconfigured — no script,
  no network, no error.

## Testing

- **SEO**: for each public page, verify the emitted `<title>` and Open
  Graph tags (curl/Playwright); confirm `/admin` pages carry
  `noindex`.
- **robots/sitemap**: `curl /robots.txt` shows `/admin` disallowed and the
  sitemap referenced; `curl /sitemap.xml` lists the four public routes as
  absolute URLs.
- **Responsive**: Playwright screenshots at 375px for each public page; no
  horizontal overflow; Nav wraps/shrinks acceptably.
- **Proxy migration**: production build is free of the middleware
  deprecation warning; unauthenticated `/admin` still redirects to
  `/admin/login` (re-run the Phase 0/1 auth check).
- **Analytics**: page HTML contains no analytics script when
  `NEXT_PUBLIC_ANALYTICS_SRC` is unset; contains the script (with the
  right `src`/`data-domain`) when set.
- **Full suite**: `npm test` (33 existing tests) and `npm run build` stay
  green.

## Out of Scope for Phase 6 (beyond the founder-gated launch steps)

- A custom-designed OG/brand image (optional, noted in LAUNCH.md).
- Per-lot sitemap entries.
- Any new product features — this phase is polish + launch readiness only.
