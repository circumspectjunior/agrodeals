import { Container } from "@/components/Container";
import {
  getTransparencySnapshot,
  formatFarmgatePrice,
  formatEudrReadiness,
} from "@/lib/publicStats";

// Same reasoning as the Home page: the service-role client doesn't use
// cookies, so it needs to opt into per-request rendering explicitly or
// Next.js will freeze this "live" data at build time.
export const dynamic = "force-dynamic";

export default async function TransparencyPage() {
  const snapshot = await getTransparencySnapshot();

  return (
    <Container>
      <div className="py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          Transparency
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
          The margin between what we pay farmers and what buyers pay us is
          the whole point of this business, not something we hide. Here's
          what we can show you right now, honestly — including the parts
          we don't have yet.
        </p>

        <div className="mt-8">
          <h2 className="font-medium">Farmgate price</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {formatFarmgatePrice(snapshot.farmgateBatch)}
          </p>
        </div>

        <div className="mt-8">
          <h2 className="font-medium">Buyer price</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Not yet disclosed — check back as we complete our first sale.
          </p>
        </div>

        <div className="mt-8">
          <h2 className="font-medium">EUDR readiness</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {formatEudrReadiness(snapshot)}
          </p>
        </div>
      </div>
    </Container>
  );
}
