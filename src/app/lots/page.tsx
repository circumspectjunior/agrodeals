import Link from "next/link";
import { Container } from "@/components/Container";
import { getAvailableLots, formatEudrStatusForBuyer } from "@/lib/lotCatalog";

// Same reasoning as the Phase 3 public pages: the service-role client
// doesn't use cookies, so it must opt into per-request rendering
// explicitly or Next.js freezes this "live" catalog at build time.
export const dynamic = "force-dynamic";

export default async function LotsCatalogPage() {
  const lots = await getAvailableLots();

  return (
    <Container>
      <div className="py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          Available lots
        </h1>

        {lots.length === 0 ? (
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            No lots available yet — check back soon.
          </p>
        ) : (
          <>
            <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
              {lots.length === 1
                ? "We're just getting started — here's our first available lot. Pricing is shared directly with buyers who reach out."
                : "Pricing is shared directly with buyers who reach out."}
            </p>

            <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
              {lots.map((lot) => (
                <li key={lot.id} className="py-3">
                  <Link
                    href={`/lots/${lot.id}`}
                    className="font-medium hover:underline"
                  >
                    {lot.total_weight} kg · {lot.blended_grade}
                  </Link>
                  <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                    EUDR: {formatEudrStatusForBuyer(lot.eudr_status_rollup)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Container>
  );
}
