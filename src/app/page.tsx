import Link from "next/link";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { getHomeCounts } from "@/lib/publicStats";

export const dynamic = "force-dynamic";

export default async function Home() {
  const counts = await getHomeCounts();
  const started = counts.farmerCount > 0;
  const verifiedPct =
    counts.plotCount > 0
      ? Math.round((counts.verifiedPlotCount / counts.plotCount) * 100)
      : 0;

  return (
    <>
      <PageHeader
        eyebrow="Direct-trade cocoa · Nigeria"
        title="Cocoa you can trace to the farm it grew on."
        subtitle="We aggregate cocoa from smallholder farmers and sell it direct to specialty buyers — a fair, published price at the farmgate, and full traceability for the buyer."
      >
        {started ? (
          <div className="mt-10">
            <dl className="grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-husk/15 bg-husk/15 sm:grid-cols-4">
              <Stat label="Farmers" value={String(counts.farmerCount)} />
              <Stat label="Plots mapped" value={String(counts.plotCount)} />
              <Stat label="EUDR-verified" value={`${verifiedPct}%`} verified />
              <Stat label="Traced" value={`${counts.totalTracedWeightKg}kg`} />
            </dl>
            <p className="mt-4 text-sm text-husk/60">
              We&apos;re just getting started — these are our real numbers so
              far, not projections.
            </p>
          </div>
        ) : (
          <p className="mt-10 font-mono text-sm uppercase tracking-widest text-amber">
            Just getting started — first farms coming soon
          </p>
        )}
      </PageHeader>

      <Container>
        <section className="py-16 sm:py-20">
          <p className="eyebrow text-terracotta-deep">Our model</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-roasted sm:text-4xl">
            Direct trade, disclosed.
          </h2>
          <div className="mt-6 grid max-w-3xl gap-5 text-lg leading-relaxed text-ink/80">
            <p>
              Most cocoa passes through a chain of middlemen before it leaves
              the country, and the farmer rarely sees what it sold for.
              AgroDeal buys directly from smallholder farmers at a fair,
              published farmgate price and sells straight to specialty buyers
              abroad.
            </p>
            <p>
              Every batch is logged against a specific farmer and a specific,
              GPS-verified plot, and every plot is checked against satellite
              deforestation data before it enters our supply chain. The record
              behind this site is the same one we use to run the business — not
              a marketing summary.
            </p>
          </div>
        </section>

        <section className="border-t border-ink/10 py-16 sm:py-20">
          <p className="eyebrow text-terracotta-deep">Verified data</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-roasted sm:text-4xl">
            Every figure here comes from real batches.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/80">
            No placeholders and no rounded-up projections — what you see is
            what&apos;s actually in the system today.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/transparency"
              className="rounded-md bg-terracotta-deep px-5 py-3 text-sm font-semibold text-husk transition-opacity hover:opacity-90"
            >
              See the transparency data
            </Link>
            <Link
              href="/lots"
              className="rounded-md border border-roasted/25 px-5 py-3 text-sm font-semibold text-roasted transition-colors hover:border-roasted/60"
            >
              Browse available lots
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}

// Manifest stat tile on the espresso hero. Verified values use leaf-bright
// green (AA on espresso); everything else uses amber. Green is reserved for
// verified/low-risk status only.
function Stat({
  label,
  value,
  verified = false,
}: {
  label: string;
  value: string;
  verified?: boolean;
}) {
  return (
    <div className="bg-roasted px-4 py-4">
      <dt className="eyebrow text-husk/55">{label}</dt>
      <dd
        className={`mt-2 font-mono text-2xl ${verified ? "text-leaf-bright" : "text-amber"}`}
      >
        {value}
      </dd>
    </div>
  );
}
