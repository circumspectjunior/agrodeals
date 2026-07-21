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

type InquiryRow = {
  id: string;
  company: string;
  contact_name: string;
  email: string;
  country: string | null;
  message: string | null;
  created_at: string;
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

  const { data: inquiriesRaw, error: inquiriesError } = await supabase
    .from("lot_inquiries")
    .select("id, company, contact_name, email, country, message, created_at")
    .eq("lot_id", id)
    .order("created_at", { ascending: false });

  const inquiries = (inquiriesRaw ?? []) as InquiryRow[];

  // Mark this lot's inquiries as viewed now that an admin is looking at
  // them, clearing the "N new" badge on the lots list. Best-effort and
  // idempotent (only touches still-null rows) — a failure here must not
  // break the page render, so it's logged, not thrown.
  const { error: markViewedError } = await supabase
    .from("lot_inquiries")
    .update({ viewed_at: new Date().toISOString() })
    .eq("lot_id", id)
    .is("viewed_at", null);

  if (markViewedError) {
    console.error("Failed to mark inquiries viewed for lot", id, markViewedError);
  }

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

        <div className="mt-8">
          <h2 className="font-medium">Inquiries</h2>
          {inquiriesError && (
            <p className="mt-2 text-sm text-red-600">{inquiriesError.message}</p>
          )}
          {!inquiriesError && inquiries.length === 0 && (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              No inquiries yet.
            </p>
          )}
          {inquiries.length > 0 && (
            <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
              {inquiries.map((inq) => (
                <li key={inq.id} className="py-3 text-sm">
                  <p className="font-medium">
                    {inq.company}
                    <span className="ml-2 font-normal text-zinc-600 dark:text-zinc-400">
                      {inq.contact_name} · {inq.email}
                      {inq.country ? ` · ${inq.country}` : ""}
                    </span>
                  </p>
                  {inq.message && (
                    <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                      {inq.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    {inq.created_at.slice(0, 10)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DeleteLotButton lotId={id} />
      </div>
    </Container>
  );
}
