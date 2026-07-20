import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/Container";
import { RecheckEudrButton } from "@/components/RecheckEudrButton";
import { RecordPaymentForm } from "@/components/RecordPaymentForm";
import { computePaymentStatus, formatPaymentStatus } from "@/lib/payments";

const EUDR_STATUS_COPY: Record<string, string> = {
  not_configured: "Pending — Whisp not configured yet",
  pending: "Pending — check still running, will retry",
  failed: "Check failed — will retry",
};

// The Supabase client has no generated types in this project, so it infers
// every embedded relation as an array regardless of actual cardinality. At
// runtime PostgREST returns a single object for both of these (plots via
// batches.plot_id is many-to-one; farmer_payments is one-to-one since
// batch_id is unique) — this type reflects reality, not the client's guess.
type BatchRow = {
  id: string;
  weight: number;
  grade: string;
  harvest_date: string;
  plots: { eudr_check_status: string; eudr_risk_status: string | null } | null;
  farmer_payments: {
    id: string;
    amount_owed: number;
    payment_events: { amount: number; paid_date: string }[];
  } | null;
};

export default async function FarmerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: farmer, error: farmerError } = await supabase
    .from("farmers")
    .select("id, name, village, phone_whatsapp")
    .eq("id", id)
    .single();

  if (farmerError || !farmer) {
    notFound();
  }

  const { data: plots, error: plotsError } = await supabase
    .from("plots")
    .select("id, center_lat, center_lng, area, eudr_check_status, eudr_risk_status")
    .eq("farmer_id", id)
    .order("created_at", { ascending: false });

  const { data: batchesRaw, error: batchesError } = await supabase
    .from("batches")
    .select(
      `id, weight, grade, harvest_date,
       plots(eudr_check_status, eudr_risk_status),
       farmer_payments(id, amount_owed, payment_events(amount, paid_date))`,
    )
    .eq("farmer_id", id)
    .order("harvest_date", { ascending: false });

  const batches = batchesRaw as unknown as BatchRow[] | null;

  return (
    <Container>
      <div className="py-16">
        <h1 className="text-xl font-semibold tracking-tight">{farmer.name}</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {farmer.village}
          {farmer.phone_whatsapp ? ` · ${farmer.phone_whatsapp}` : ""}
        </p>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="font-medium">Plots</h2>
          <Link
            href={`/admin/farmers/${id}/plots/new`}
            className="text-sm font-medium underline"
          >
            Add another plot
          </Link>
        </div>

        {plotsError && (
          <p className="mt-4 text-sm text-red-600">{plotsError.message}</p>
        )}

        {!plotsError && plots && plots.length === 0 && (
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            No plots yet.
          </p>
        )}

        {!plotsError && plots && plots.length > 0 && (
          <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
            {plots.map((plot) => (
              <li key={plot.id} className="py-3">
                <p className="text-sm">
                  {plot.center_lat}, {plot.center_lng}
                  {plot.area ? ` · ${plot.area} ha` : ""}
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  EUDR status:{" "}
                  {plot.eudr_check_status === "complete"
                    ? plot.eudr_risk_status
                    : EUDR_STATUS_COPY[plot.eudr_check_status]}
                </p>
                {plot.eudr_check_status !== "complete" && (
                  <RecheckEudrButton plotId={plot.id} />
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex items-center justify-between">
          <h2 className="font-medium">Batches</h2>
          <Link
            href={`/admin/farmers/${id}/batches/new`}
            className="text-sm font-medium underline"
          >
            Log a batch
          </Link>
        </div>

        {batchesError && (
          <p className="mt-4 text-sm text-red-600">{batchesError.message}</p>
        )}

        {!batchesError && batches && batches.length === 0 && (
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            No batches yet.
          </p>
        )}

        {!batchesError && batches && batches.length > 0 && (
          <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
            {batches.map((batch) => {
              const plot = batch.plots;
              const payment = batch.farmer_payments;

              // createBatch always inserts a farmer_payments row atomically
              // with the batch — payment should never be missing. Treat a
              // missing row as a loud data-integrity warning, not a silent
              // "0 owed" default: that exact silent default once produced a
              // false-positive "Paid in full" on an unpaid batch (see
              // review.md Phase 2).
              if (!payment) {
                return (
                  <li key={batch.id} className="py-3">
                    <p className="text-sm">
                      {batch.weight} kg · {batch.grade} · {batch.harvest_date}
                    </p>
                    <p className="mt-1 text-sm text-red-600">
                      No payment record found for this batch — data
                      integrity issue, needs manual investigation.
                    </p>
                  </li>
                );
              }

              const events = payment.payment_events;
              const status = computePaymentStatus(events, payment.amount_owed);
              const paymentStatus = formatPaymentStatus(status);
              const isFullyPaid = status.kind === "paid_in_full";

              return (
                <li key={batch.id} className="py-3">
                  <p className="text-sm">
                    {batch.weight} kg · {batch.grade} · {batch.harvest_date}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    EUDR status:{" "}
                    {plot?.eudr_check_status === "complete"
                      ? plot.eudr_risk_status
                      : plot
                        ? EUDR_STATUS_COPY[plot.eudr_check_status]
                        : "unknown"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Payment: {paymentStatus}
                  </p>
                  {events.length > 0 && (
                    <ul className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                      {events.map((event, i) => (
                        <li key={i}>
                          {event.paid_date}: {event.amount}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!isFullyPaid && (
                    <RecordPaymentForm farmerPaymentId={payment.id} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Container>
  );
}
