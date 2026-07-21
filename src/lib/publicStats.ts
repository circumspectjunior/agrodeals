import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { FarmgateBatch, HomeCounts, TransparencySnapshot } from "@/lib/publicStatsFormat";

export type { HomeCounts, FarmgateBatch, TransparencySnapshot } from "@/lib/publicStatsFormat";
export {
  formatHomeStats,
  formatFarmgatePrice,
  formatEudrReadiness,
} from "@/lib/publicStatsFormat";

export async function getHomeCounts(): Promise<HomeCounts> {
  const supabase = createServiceClient();

  const [farmersResult, plotsResult, batchesResult] = await Promise.all([
    supabase.from("farmers").select("*", { count: "exact", head: true }),
    supabase.from("plots").select("eudr_check_status"),
    supabase.from("batches").select("weight"),
  ]);

  const plots = plotsResult.data ?? [];
  const batches = batchesResult.data ?? [];

  return {
    farmerCount: farmersResult.count ?? 0,
    plotCount: plots.length,
    verifiedPlotCount: plots.filter((p) => p.eudr_check_status === "complete").length,
    totalTracedWeightKg: batches.reduce((sum, b) => sum + b.weight, 0),
  };
}

export async function getTransparencySnapshot(): Promise<TransparencySnapshot> {
  const supabase = createServiceClient();

  const [plotsResult, batchResult] = await Promise.all([
    supabase.from("plots").select("eudr_check_status, eudr_risk_status"),
    supabase
      .from("batches")
      .select("weight, grade, farmers(name), farmer_payments(amount_owed)")
      .order("harvest_date", { ascending: true })
      .limit(1),
  ]);

  const plots = plotsResult.data ?? [];
  const batchRow = batchResult.data?.[0] as unknown as
    | {
        weight: number;
        grade: string;
        farmers: { name: string } | null;
        farmer_payments: { amount_owed: number } | null;
      }
    | undefined;

  const farmgateBatch: FarmgateBatch = batchRow
    ? {
        farmerName: batchRow.farmers?.name ?? "unknown farmer",
        weightKg: batchRow.weight,
        grade: batchRow.grade,
        amountOwed: batchRow.farmer_payments?.amount_owed ?? 0,
      }
    : null;

  return {
    farmgateBatch,
    totalPlotCount: plots.length,
    verifiedPlotCount: plots.filter((p) => p.eudr_check_status === "complete").length,
    lowRiskPlotCount: plots.filter(
      (p) => p.eudr_check_status === "complete" && p.eudr_risk_status === "low",
    ).length,
  };
}
