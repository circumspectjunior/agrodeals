"use client";

import { useState, use, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import { createPlot } from "@/app/admin/farmers/[id]/actions";

export default function NewPlotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: farmerId } = use(params);
  const router = useRouter();
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [area, setArea] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createPlot(farmerId, { lat, lng, area });

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push(`/admin/farmers/${farmerId}`);
    router.refresh();
  }

  return (
    <Container>
      <div className="mx-auto max-w-sm py-16">
        <h1 className="text-xl font-semibold tracking-tight">Add a plot</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Read the coordinates off a phone GPS at the plot (e.g. from Google
          Maps).
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Latitude
            <input
              required
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="6.524379"
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Longitude
            <input
              required
              inputMode="decimal"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="3.379206"
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Area in hectares (optional)
            <input
              inputMode="decimal"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {submitting ? "Checking EUDR status…" : "Add plot"}
          </button>
        </form>
      </div>
    </Container>
  );
}
