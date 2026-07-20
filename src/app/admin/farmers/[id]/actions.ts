"use server";

import { createClient } from "@/lib/supabase/server";
import { getEudrRiskStatus } from "@/lib/whisp";

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
