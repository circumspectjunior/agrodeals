"use server";

import { createClient } from "@/lib/supabase/server";
import { getEudrRiskStatus } from "@/lib/whisp";
import { GRADES, type Grade } from "@/lib/grades";

export async function createPlot(
  farmerId: string,
  input: { lat: string; lng: string; area: string },
): Promise<{ error: string } | { id: string }> {
  const lat = Number(input.lat);
  const lng = Number(input.lng);
  const areaInput = input.area.trim();
  const area = areaInput ? Number(areaInput) : null;

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { error: "Latitude must be a number between -90 and 90." };
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { error: "Longitude must be a number between -180 and 180." };
  }
  if (area !== null && (!Number.isFinite(area) || area <= 0)) {
    return { error: "Area must be a positive number." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plots")
    .insert({
      farmer_id: farmerId,
      center_lat: lat,
      center_lng: lng,
      area,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  const { status, risk } = await getEudrRiskStatus(lat, lng);
  const { error: updateError } = await supabase
    .from("plots")
    .update({ eudr_check_status: status, eudr_risk_status: risk })
    .eq("id", data.id);

  if (updateError) {
    console.error("Failed to store Whisp result for plot", data.id, updateError);
  }

  return { id: data.id };
}

function isValidGrade(grade: string): grade is Grade {
  return (GRADES as readonly string[]).includes(grade);
}

export async function createBatch(
  farmerId: string,
  input: {
    plotId: string;
    weight: string;
    moisturePct: string;
    fermentationDays: string;
    grade: string;
    harvestDate: string;
    amountOwed: string;
  },
): Promise<{ error: string } | { id: string }> {
  const weight = Number(input.weight);
  const moisturePctInput = input.moisturePct.trim();
  const moisturePct = moisturePctInput ? Number(moisturePctInput) : null;
  const fermentationDaysInput = input.fermentationDays.trim();
  const fermentationDays = fermentationDaysInput ? Number(fermentationDaysInput) : null;
  const amountOwed = Number(input.amountOwed);

  if (!input.plotId) {
    return { error: "Select a plot." };
  }
  if (!Number.isFinite(weight) || weight <= 0) {
    return { error: "Weight must be a positive number." };
  }
  if (moisturePct !== null && (!Number.isFinite(moisturePct) || moisturePct < 0 || moisturePct > 100)) {
    return { error: "Moisture % must be between 0 and 100." };
  }
  if (
    fermentationDays !== null &&
    (!Number.isInteger(fermentationDays) || fermentationDays < 0)
  ) {
    return { error: "Fermentation days must be a non-negative whole number." };
  }
  if (!isValidGrade(input.grade)) {
    return { error: "Select a grade." };
  }
  if (!input.harvestDate) {
    return { error: "Harvest date is required." };
  }
  const harvestDate = new Date(input.harvestDate);
  if (Number.isNaN(harvestDate.getTime()) || harvestDate > new Date()) {
    return { error: "Harvest date must be a valid date and not in the future." };
  }
  if (!Number.isFinite(amountOwed) || amountOwed <= 0) {
    return { error: "Amount owed must be a positive number." };
  }

  const supabase = await createClient();

  const { data: plot, error: plotError } = await supabase
    .from("plots")
    .select("farmer_id")
    .eq("id", input.plotId)
    .single();

  if (plotError) {
    return { error: plotError.message };
  }
  if (plot.farmer_id !== farmerId) {
    return { error: "That plot doesn't belong to this farmer." };
  }

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .insert({
      farmer_id: farmerId,
      plot_id: input.plotId,
      weight,
      moisture_pct: moisturePct,
      fermentation_days: fermentationDays,
      grade: input.grade,
      harvest_date: input.harvestDate,
    })
    .select("id")
    .single();

  if (batchError) {
    return { error: batchError.message };
  }

  const { error: paymentError } = await supabase.from("farmer_payments").insert({
    farmer_id: farmerId,
    batch_id: batch.id,
    amount_owed: amountOwed,
  });

  if (paymentError) {
    return { error: paymentError.message };
  }

  return { id: batch.id };
}

export async function recordPayment(
  farmerPaymentId: string,
  input: { amount: string; paidDate: string },
): Promise<{ error: string } | { success: true }> {
  const amount = Number(input.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }
  if (!input.paidDate) {
    return { error: "Date is required." };
  }
  const paidDate = new Date(input.paidDate);
  if (Number.isNaN(paidDate.getTime()) || paidDate > new Date()) {
    return { error: "Date must be a valid date and not in the future." };
  }

  const supabase = await createClient();

  const { data: payment, error: paymentError } = await supabase
    .from("farmer_payments")
    .select("amount_owed, payment_events(amount)")
    .eq("id", farmerPaymentId)
    .single();

  if (paymentError) {
    return { error: paymentError.message };
  }

  const alreadyPaid = payment.payment_events.reduce((sum, event) => sum + event.amount, 0);
  const remaining = payment.amount_owed - alreadyPaid;

  if (amount > remaining) {
    return {
      error: `This would exceed the amount owed. Remaining balance: ${remaining}.`,
    };
  }

  const { error: insertError } = await supabase.from("payment_events").insert({
    farmer_payment_id: farmerPaymentId,
    amount,
    paid_date: input.paidDate,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  return { success: true };
}

export async function recheckEudrStatus(plotId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const { data: plot, error: fetchError } = await supabase
    .from("plots")
    .select("center_lat, center_lng")
    .eq("id", plotId)
    .single();

  if (fetchError) {
    return { error: fetchError.message };
  }

  const { status, risk } = await getEudrRiskStatus(plot.center_lat, plot.center_lng);
  const { error: updateError } = await supabase
    .from("plots")
    .update({ eudr_check_status: status, eudr_risk_status: risk })
    .eq("id", plotId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}
