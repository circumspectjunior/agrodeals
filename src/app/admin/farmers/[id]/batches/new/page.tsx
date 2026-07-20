import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/Container";
import { NewBatchForm } from "./NewBatchForm";

export default async function NewBatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: farmerId } = await params;
  const supabase = await createClient();

  const { data: farmer, error: farmerError } = await supabase
    .from("farmers")
    .select("id, name")
    .eq("id", farmerId)
    .single();

  if (farmerError || !farmer) {
    notFound();
  }

  const { data: plots, error: plotsError } = await supabase
    .from("plots")
    .select("id, center_lat, center_lng")
    .eq("farmer_id", farmerId)
    .order("created_at", { ascending: false });

  if (plotsError) {
    throw new Error(plotsError.message);
  }

  if (plots.length === 0) {
    return (
      <Container>
        <div className="py-16">
          <h1 className="text-xl font-semibold tracking-tight">Log a batch</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {farmer.name} has no plots yet — add a plot before logging a
            batch.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mx-auto max-w-sm py-16">
        <h1 className="text-xl font-semibold tracking-tight">Log a batch</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {farmer.name}
        </p>
        <NewBatchForm farmerId={farmerId} plots={plots} />
      </div>
    </Container>
  );
}
