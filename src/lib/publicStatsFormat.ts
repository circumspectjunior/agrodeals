// Pure formatting functions only — no I/O, no "server-only" guard, so
// these are safely unit-testable outside Next.js's build pipeline. The
// I/O layer (publicStats.ts) imports from here.

export type HomeCounts = {
  farmerCount: number;
  plotCount: number;
  verifiedPlotCount: number; // eudr_check_status === "complete"
  totalTracedWeightKg: number;
};

export type FarmgateBatch = {
  farmerName: string;
  weightKg: number;
  grade: string;
  amountOwed: number;
} | null;

export type TransparencySnapshot = {
  farmgateBatch: FarmgateBatch;
  totalPlotCount: number;
  verifiedPlotCount: number; // eudr_check_status === "complete"
  lowRiskPlotCount: number; // complete && eudr_risk_status === "low"
};

export function formatHomeStats(counts: HomeCounts): {
  headline: string;
  verifiedLabel: string;
} {
  if (counts.farmerCount === 0) {
    return {
      headline: "Coming soon — we're just getting started.",
      verifiedLabel: "",
    };
  }

  const verifiedPct =
    counts.plotCount > 0 ? Math.round((counts.verifiedPlotCount / counts.plotCount) * 100) : 0;

  return {
    headline: `We're just getting started — ${counts.farmerCount} farmer${counts.farmerCount === 1 ? "" : "s"}, ${counts.plotCount} plot${counts.plotCount === 1 ? "" : "s"} mapped, ${counts.totalTracedWeightKg}kg traced so far.`,
    verifiedLabel: `${verifiedPct}% EUDR-verified`,
  };
}

export function formatFarmgatePrice(batch: FarmgateBatch): string {
  if (!batch) {
    return "No transactions yet.";
  }
  // Matches formatEudrReadiness's "just getting started" framing — a bare
  // price line reads as an aggregate/average to a fast skimmer, when it's
  // actually a single real transaction. Say so explicitly.
  const prefix = "We're just getting started — here's our first real transaction:";
  if (batch.weightKg === 0) {
    return `${prefix} ₦${batch.amountOwed.toLocaleString("en-US")} paid for ${batch.weightKg}kg (${batch.grade}).`;
  }
  const perKg = Math.round(batch.amountOwed / batch.weightKg);
  return `${prefix} ₦${batch.amountOwed.toLocaleString("en-US")} paid for ${batch.weightKg}kg (${batch.grade}) ≈ ₦${perKg.toLocaleString("en-US")}/kg`;
}

export function formatEudrReadiness(
  snapshot: Pick<TransparencySnapshot, "totalPlotCount" | "verifiedPlotCount" | "lowRiskPlotCount">,
): string {
  if (snapshot.totalPlotCount === 0) {
    return "No plots mapped yet.";
  }
  if (snapshot.verifiedPlotCount === 0) {
    return `We're just getting started: ${snapshot.totalPlotCount} plot${snapshot.totalPlotCount === 1 ? "" : "s"} mapped, EUDR checks pending.`;
  }
  return `We're just getting started: ${snapshot.lowRiskPlotCount} of ${snapshot.verifiedPlotCount} verified plot${snapshot.verifiedPlotCount === 1 ? "" : "s"} so far ${snapshot.lowRiskPlotCount === 1 ? "is" : "are"} low deforestation risk.`;
}
