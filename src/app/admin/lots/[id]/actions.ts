"use server";

import { createClient } from "@/lib/supabase/server";

export async function updatePriceOffered(
  lotId: string,
  priceOffered: string,
): Promise<{ error: string } | { success: true }> {
  const priceOfferedInput = priceOffered.trim();
  const price = priceOfferedInput ? Number(priceOfferedInput) : null;

  if (price !== null && (!Number.isFinite(price) || price <= 0)) {
    return { error: "Price offered must be a positive number." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("lots")
    .update({ price_offered: price })
    .eq("id", lotId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteLot(lotId: string): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const { error } = await supabase.from("lots").delete().eq("id", lotId);

  if (error) {
    if (error.code === "23503") {
      return { error: "This lot has a sale attached and can't be deleted." };
    }
    return { error: error.message };
  }

  return { success: true };
}
