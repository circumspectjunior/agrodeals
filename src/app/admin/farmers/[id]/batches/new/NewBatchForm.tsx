"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBatch } from "@/app/admin/farmers/[id]/actions";
import { GRADES } from "@/lib/grades";

type Plot = {
  id: string;
  center_lat: number;
  center_lng: number;
};

export function NewBatchForm({
  farmerId,
  plots,
}: {
  farmerId: string;
  plots: Plot[];
}) {
  const router = useRouter();
  const [plotId, setPlotId] = useState(plots[0].id);
  const [weight, setWeight] = useState("");
  const [moisturePct, setMoisturePct] = useState("");
  const [fermentationDays, setFermentationDays] = useState("");
  const [grade, setGrade] = useState<string>("");
  const [harvestDate, setHarvestDate] = useState("");
  const [amountOwed, setAmountOwed] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createBatch(farmerId, {
      plotId,
      weight,
      moisturePct,
      fermentationDays,
      grade,
      harvestDate,
      amountOwed,
    });

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push(`/admin/farmers/${farmerId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      {plots.length > 1 && (
        <label className="flex flex-col gap-1 text-sm">
          Plot
          <select
            value={plotId}
            onChange={(e) => setPlotId(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {plots.map((plot) => (
              <option key={plot.id} value={plot.id}>
                {plot.center_lat}, {plot.center_lng}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-1 text-sm">
        Weight (kg)
        <input
          required
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Moisture % (optional)
        <input
          inputMode="decimal"
          value={moisturePct}
          onChange={(e) => setMoisturePct(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Fermentation days (optional)
        <input
          inputMode="numeric"
          value={fermentationDays}
          onChange={(e) => setFermentationDays(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Grade
        <select
          required
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>
            Select a grade
          </option>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Harvest date
        <input
          required
          type="date"
          value={harvestDate}
          onChange={(e) => setHarvestDate(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Amount owed to farmer
        <input
          required
          inputMode="decimal"
          value={amountOwed}
          onChange={(e) => setAmountOwed(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {submitting ? "Saving…" : "Log batch"}
      </button>
    </form>
  );
}
