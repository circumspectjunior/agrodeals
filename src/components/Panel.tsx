// A labeled "manifest" panel on the cream surface — mono eyebrow label
// over content. Used for the factual data blocks on Transparency and the
// lot catalog.
export function Panel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-ink/15 px-5 py-5">
      <p className="eyebrow text-terracotta-deep">{label}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

// EUDR status as a manifest tag. Green (leaf on cream) is used ONLY for the
// verified low-risk state — everything else is neutral ink. Green never
// decorates; it means "low deforestation risk, verified".
export function EudrTag({ status }: { status: string | null }) {
  const isLow = status === "low";
  return (
    <span
      className={`inline-block rounded font-mono text-sm ${
        isLow
          ? "bg-leaf/12 px-2 py-0.5 font-bold uppercase tracking-wider text-leaf"
          : "text-ink/60"
      }`}
    >
      {isLow ? "Low risk" : status === null ? "Check pending" : status}
    </span>
  );
}
