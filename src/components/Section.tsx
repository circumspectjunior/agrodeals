// A two-column editorial content section on large screens: an eyebrow +
// heading in a left rail, the body/content in a wider right column. Stacks
// to a single column on phone/tablet. This fills the horizontal space on a
// laptop instead of leaving the content hugging the left.
export function Section({
  eyebrow,
  title,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`grid gap-x-12 gap-y-6 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-4">
        <p className="eyebrow text-terracotta-deep">{eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-roasted sm:text-4xl">
          {title}
        </h2>
      </div>
      <div className="lg:col-span-8">{children}</div>
    </section>
  );
}
