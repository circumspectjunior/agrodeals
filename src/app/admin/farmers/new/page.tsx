"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/Container";
import { createFarmer } from "@/app/admin/farmers/actions";

export default function NewFarmerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [village, setVillage] = useState("");
  const [phoneWhatsapp, setPhoneWhatsapp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createFarmer({ name, village, phoneWhatsapp });

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push(`/admin/farmers/${result.id}`);
  }

  return (
    <Container>
      <div className="mx-auto max-w-sm py-16">
        <h1 className="text-xl font-semibold tracking-tight">Add a farmer</h1>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Village
            <input
              required
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Phone / WhatsApp (optional)
            <input
              value={phoneWhatsapp}
              onChange={(e) => setPhoneWhatsapp(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {submitting ? "Saving…" : "Add farmer"}
          </button>
        </form>
      </div>
    </Container>
  );
}
