import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/Container";
import { UpdatePriceForm } from "./UpdatePriceForm";
import { DeleteLotButton } from "./DeleteLotButton";

type LotBatchRow = {
  batches: {
    id: string;
    weight: number;
    grade: string;
    harvest_date: string;
    farmers: { name: string } | null;
    plots: { eudr_check_status: string; eudr_risk_status: string | null } | null;
  } | null;
};

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lot, error: lotError } = await supabase
    .from("lots")
    .select("id, total_weight, blended_grade, eudr_status_rollup, price_offered")
    .eq("id", id)
    .single();

  if (lotError || !lot) {
    notFound();
  }

  const { data: lotBatchesRaw, error: batchesError } = await supabase
    .from("lot_batches")
    .select(
      `batches(id, weight, grade, harvest_date,
                farmers(name),
                plots(eudr_check_status, eudr_risk_status))`,
    )
    .eq("lot_id", id);

  const lotBatches = lotBatchesRaw as unknown as LotBatchRow[] | null;
  const batches = (lotBatches ?? [])
    .map((row) => row.batches)
    .filter((b): b is NonNullable<typeof b> => b !== null);

  const needsAttention = batches.filter(
    (b) => !(b.plots?.eudr_check_status === "complete" && b.plots?.eudr_risk_status === "low"),
  );

  return (
    <Container>
      <div className="py-16">
        <h1 className="text-xl font-semibold tracking-tight">
          {lot.total_weight} kg · {lot.blended_grade}
        </h1>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          EUDR status: {lot.eudr_status_rollup ?? "needs attention"}
        </p>

        {lot.eudr_status_rollup === null && needsAttention.length > 0 && (
          <ul className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {needsAttention.map((b) => (
              <li key={b.id}>
                {b.farmers?.name ?? "unknown farmer"}'s batch (
                {b.harvest_date}): plot is{" "}
                {b.plots?.eudr_check_status === "complete"
                  ? b.plots.eudr_risk_status
                  : (b.plots?.eudr_check_status ?? "unknown")}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Price offered: {lot.price_offered ?? "not set"}
          </p>
          <UpdatePriceForm lotId={id} currentPrice={lot.price_offered} />
        </div>

        <div className="mt-8">
          <h2 className="font-medium">Batches</h2>
          {batchesError && (
            <p className="mt-2 text-sm text-red-600">{batchesError.message}</p>
          )}
          <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
            {batches.map((b) => (
              <li key={b.id} className="py-2 text-sm">
                {b.farmers?.name ?? "unknown farmer"} · {b.weight} kg ·{" "}
                {b.grade} · {b.harvest_date}
              </li>
            ))}
          </ul>
        </div>

        <DeleteLotButton lotId={id} />
      </div>
    </Container>
  );
}
