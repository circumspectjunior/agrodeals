"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { recordPayment } from "@/app/admin/farmers/[id]/actions";

export function RecordPaymentForm({ farmerPaymentId }: { farmerPaymentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paidDate, setPaidDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await recordPayment(farmerPaymentId, { amount, paidDate });

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setAmount("");
    setPaidDate("");
    setOpen(false);
    setSubmitting(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-1 text-sm font-medium underline"
      >
        Record payment
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 text-sm">
      <div className="flex items-center gap-2">
        <input
          required
          inputMode="decimal"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-28 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          required
          type="date"
          value={paidDate}
          onChange={(e) => setPaidDate(e.target.value)}
          className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-zinc-900 px-3 py-1 font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
