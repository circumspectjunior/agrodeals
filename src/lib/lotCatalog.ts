import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { filterAvailableLots, type CatalogLot } from "@/lib/lotCatalogFormat";

export type { CatalogLot } from "@/lib/lotCatalogFormat";
export { filterAvailableLots, isValidEmail, formatEudrStatusForBuyer } from "@/lib/lotCatalogFormat";

export async function getAvailableLots(): Promise<CatalogLot[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("lots")
    .select("id, total_weight, blended_grade, eudr_status_rollup, sales(id)")
    .order("created_at", { ascending: false });

  const lots = (data ?? []) as unknown as CatalogLot[];
  return filterAvailableLots(lots);
}

export async function getPublicLot(id: string): Promise<CatalogLot | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("lots")
    .select("id, total_weight, blended_grade, eudr_status_rollup, sales(id)")
    .eq("id", id)
    .maybeSingle();

  return (data as unknown as CatalogLot) ?? null;
}
