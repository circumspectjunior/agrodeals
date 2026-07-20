import Link from "next/link";
import { Container } from "@/components/Container";
import { getHomeCounts, formatHomeStats } from "@/lib/publicStats";

// Without this, Next.js prerenders the page statically at build time —
// freezing "live" metrics until the next deploy, since the service-role
// client (unlike the session-based admin client) doesn't use cookies and
// so doesn't automatically opt into per-request rendering.
export const dynamic = "force-dynamic";

export default async function Home() {
  const counts = await getHomeCounts();
  const stats = formatHomeStats(counts);

  return (
    <Container>
      <div className="py-16">
        <h1 className="text-2xl font-semibold tracking-tight">AgroDeal</h1>
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
          AgroDeal is a direct-trade cocoa business. We aggregate cocoa from
          smallholder farmers in Nigeria and sell directly to buyers abroad —
          specialty and craft chocolate makers who pay a premium for
          traceable, ethically-sourced cocoa. This site is our trust and
          operations layer: real farmer relationships, real aggregation, real
          compliance — not a brochure.
        </p>
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Every batch is logged against a specific farmer and a specific,
          GPS-verified plot. Every plot is checked against satellite
          deforestation data before it enters our supply chain. Farmers are
          paid directly and promptly — the ledger behind this page is the
          same one we use internally, not a marketing summary.
        </p>

        <div className="mt-8 rounded border border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <p className="text-sm">{stats.headline}</p>
          {stats.verifiedLabel && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {stats.verifiedLabel}
            </p>
          )}
        </div>

        <Link
          href="/transparency"
          className="mt-6 inline-block text-sm font-medium underline"
        >
          See our transparency data
        </Link>
      </div>
    </Container>
  );
}
