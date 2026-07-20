"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createLot } from "@/app/admin/lots/actions";

type Batch = {
  id: string;
  weight: number;
  grade: string;
  harvest_date: string;
  farmers: { name: string } | null;
  plots: { eudr_check_status: string; eudr_risk_status: string | null } | null;
};

function eudrLabel(plot: Batch["plots"]) {
  if (!plot) return "unknown";
  if (plot.eudr_check_status === "complete") return plot.eudr_risk_status;
  return plot.eudr_check_status;
}

export function NewLotForm({ batches }: { batches: Batch[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [priceOffered, setPriceOffered] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createLot({
      batchIds: Array.from(selected),
      priceOffered,
    });

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push(`/admin/lots/${result.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {batches.map((batch) => (
          <li key={batch.id} className="flex items-center gap-3 py-3">
            <input
              type="checkbox"
              checked={selected.has(batch.id)}
              onChange={() => toggle(batch.id)}
            />
            <div className="text-sm">
              <p>
                {batch.farmers?.name ?? "unknown farmer"} · {batch.weight} kg
                · {batch.grade} · {batch.harvest_date}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                EUDR: {eudrLabel(batch.plots)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <label className="flex max-w-xs flex-col gap-1 text-sm">
        Price offered (optional, can be set later)
        <input
          inputMode="decimal"
          value={priceOffered}
          onChange={(e) => setPriceOffered(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || selected.size === 0}
        className="w-fit rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {submitting ? "Creating…" : "Create lot"}
      </button>
    </form>
  );
}
