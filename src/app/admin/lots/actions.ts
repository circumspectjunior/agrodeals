"use server";

import { createClient } from "@/lib/supabase/server";
import { worstGrade, type Grade } from "@/lib/grades";

type BatchForRollup = {
  id: string;
  weight: number;
  grade: Grade;
  plots: { eudr_check_status: string; eudr_risk_status: string | null } | null;
};

export async function createLot(input: {
  batchIds: string[];
  priceOffered: string;
}): Promise<{ error: string } | { id: string }> {
  if (input.batchIds.length === 0) {
    return { error: "Select at least one batch." };
  }

  const priceOfferedInput = input.priceOffered.trim();
  const priceOffered = priceOfferedInput ? Number(priceOfferedInput) : null;
  if (priceOffered !== null && (!Number.isFinite(priceOffered) || priceOffered <= 0)) {
    return { error: "Price offered must be a positive number." };
  }

  const supabase = await createClient();

  const { data: batchesRaw, error: batchesError } = await supabase
    .from("batches")
    .select("id, weight, grade, plots(eudr_check_status, eudr_risk_status)")
    .in("id", input.batchIds);

  if (batchesError) {
    return { error: batchesError.message };
  }

  const batches = batchesRaw as unknown as BatchForRollup[];

  if (batches.length !== input.batchIds.length) {
    return { error: "One or more selected batches could not be found." };
  }

  const totalWeight = batches.reduce((sum, b) => sum + b.weight, 0);
  const blendedGrade = worstGrade(batches.map((b) => b.grade));
  const allCompleteAndLow = batches.every(
    (b) => b.plots?.eudr_check_status === "complete" && b.plots?.eudr_risk_status === "low",
  );
  const eudrStatusRollup = allCompleteAndLow ? "low" : null;

  const { data: lot, error: lotError } = await supabase
    .from("lots")
    .insert({
      total_weight: totalWeight,
      blended_grade: blendedGrade,
      eudr_status_rollup: eudrStatusRollup,
      price_offered: priceOffered,
    })
    .select("id")
    .single();

  if (lotError) {
    return { error: lotError.message };
  }

  const { error: lotBatchesError } = await supabase.from("lot_batches").insert(
    input.batchIds.map((batchId) => ({ lot_id: lot.id, batch_id: batchId })),
  );

  if (lotBatchesError) {
    return { error: lotBatchesError.message };
  }

  return { id: lot.id };
}
