import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Panel, EudrTag } from "@/components/Panel";
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
  const allLow =
    snapshot.totalPlotCount > 0 &&
    snapshot.lowRiskPlotCount === snapshot.verifiedPlotCount &&
    snapshot.verifiedPlotCount === snapshot.totalPlotCount;

  return (
    <>
      <PageHeader
        eyebrow="Our margin, disclosed"
        title="The numbers we'd rather show than hide."
        subtitle="The gap between what we pay farmers and what buyers pay us is the whole point of this business. Here's what we can show you right now — honestly, including the parts we don't have yet."
      />

      <Container>
        <div className="grid gap-5 py-16 sm:grid-cols-2 sm:py-20">
          <Panel label="Farmgate price">
            <p className="text-lg leading-relaxed text-ink/85">
              {formatFarmgatePrice(snapshot.farmgateBatch)}
            </p>
          </Panel>

          <Panel label="Buyer price">
            <p className="text-lg leading-relaxed text-ink/85">
              Not yet disclosed — check back as we complete our first sale.
            </p>
          </Panel>

          <Panel label="EUDR readiness">
            <div className="flex flex-col gap-3">
              <EudrTag status={allLow ? "low" : null} />
              <p className="leading-relaxed text-ink/70">
                {formatEudrReadiness(snapshot)}
              </p>
            </div>
          </Panel>
        </div>
      </Container>
    </>
  );
}
