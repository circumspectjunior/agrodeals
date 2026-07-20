"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updatePriceOffered } from "@/app/admin/lots/[id]/actions";

export function UpdatePriceForm({
  lotId,
  currentPrice,
}: {
  lotId: string;
  currentPrice: number | null;
}) {
  const router = useRouter();
  const [priceOffered, setPriceOffered] = useState(currentPrice?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await updatePriceOffered(lotId, priceOffered);

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2 text-sm">
      <input
        inputMode="decimal"
        placeholder="Price offered"
        value={priceOffered}
        onChange={(e) => setPriceOffered(e.target.value)}
        className="w-32 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-zinc-900 px-3 py-1 font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {submitting ? "Saving…" : "Update price"}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
