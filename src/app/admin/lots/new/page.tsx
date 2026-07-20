import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/Container";
import { NewLotForm } from "./NewLotForm";

type AvailableBatch = {
  id: string;
  weight: number;
  grade: string;
  harvest_date: string;
  farmers: { name: string } | null;
  plots: { eudr_check_status: string; eudr_risk_status: string | null } | null;
  lot_batches: { lot_id: string } | null;
};

export default async function NewLotPage() {
  const supabase = await createClient();

  const { data: batchesRaw, error } = await supabase
    .from("batches")
    .select(
      `id, weight, grade, harvest_date,
       farmers(name),
       plots(eudr_check_status, eudr_risk_status),
       lot_batches(lot_id)`,
    )
    .order("harvest_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const batches = batchesRaw as unknown as AvailableBatch[];
  const availableBatches = batches.filter((b) => b.lot_batches === null);

  return (
    <Container>
      <div className="py-16">
        <h1 className="text-xl font-semibold tracking-tight">Create a lot</h1>
        {availableBatches.length === 0 ? (
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            No unassigned batches available — log a batch first.
          </p>
        ) : (
          <NewLotForm batches={availableBatches} />
        )}
      </div>
    </Container>
  );
}
