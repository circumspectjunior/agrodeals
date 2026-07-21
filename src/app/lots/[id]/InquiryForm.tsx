"use client";

import { useState, type FormEvent } from "react";
import { submitInquiry } from "@/app/lots/actions";

const field =
  "rounded-md border border-ink/20 bg-white/60 px-3 py-2 text-ink outline-none focus:border-terracotta-deep";

export function InquiryForm({ lotId }: { lotId: string }) {
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await submitInquiry(lotId, {
      company,
      contactName,
      email,
      country,
      message,
    });

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <p className="mt-6 rounded-md border border-leaf/40 bg-leaf/10 px-4 py-3 text-sm text-ink">
        Thanks — we&apos;ve got your inquiry and will be in touch about pricing
        and next steps.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink/80">
        Company
        <input
          required
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className={field}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink/80">
        Contact name
        <input
          required
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className={field}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink/80">
        Email
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink/80">
        Country (optional)
        <input
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className={field}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink/80">
        Message (optional)
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className={field}
        />
      </label>
      {error && <p className="text-sm font-medium text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded-md bg-terracotta-deep px-5 py-2.5 text-sm font-semibold text-husk transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
