import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/Container";
import { RecheckEudrButton } from "@/components/RecheckEudrButton";

const EUDR_STATUS_COPY: Record<string, string> = {
  not_configured: "Pending — Whisp not configured yet",
  pending: "Pending — check still running, will retry",
  failed: "Check failed — will retry",
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
      </div>
    </Container>
  );
}
