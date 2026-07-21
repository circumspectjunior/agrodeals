import Link from "next/link";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { EudrTag } from "@/components/Panel";
import { getAvailableLots } from "@/lib/lotCatalog";

// Same reasoning as the Phase 3 public pages: the service-role client
// doesn't use cookies, so it must opt into per-request rendering
// explicitly or Next.js freezes this "live" catalog at build time.
export const dynamic = "force-dynamic";

export default async function LotsCatalogPage() {
  const lots = await getAvailableLots();
  const subtitle =
    lots.length === 0
      ? "No lots are available right now — check back soon."
      : lots.length === 1
        ? "We're just getting started — here's our first available lot. Pricing is shared directly with buyers who reach out."
        : "Pricing is shared directly with buyers who reach out.";

  return (
    <>
      <PageHeader
        eyebrow="Available lots"
        title="Cocoa ready to buy, lot by lot."
        subtitle={subtitle}
      />

      <Container>
        <div className="py-16 sm:py-20">
          {lots.length === 0 ? (
            <p className="text-lg text-ink/70">Nothing listed yet.</p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {lots.map((lot) => (
                <li key={lot.id}>
                  <Link
                    href={`/lots/${lot.id}`}
                    className="group block rounded-lg border border-ink/15 px-5 py-5 transition-colors hover:border-terracotta-deep/50"
                  >
                    <p className="eyebrow text-terracotta-deep">Lot</p>
                    <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-roasted">
                      {lot.total_weight} kg · {lot.blended_grade}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="eyebrow text-ink/50">EUDR</span>
                      <EudrTag status={lot.eudr_status_rollup} />
                    </div>
                    <p className="mt-4 text-sm font-semibold text-terracotta-deep">
                      Inquire about this lot →
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </>
  );
}
