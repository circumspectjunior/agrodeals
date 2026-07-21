import { Container } from "@/components/Container";

// The espresso hero used at the top of every public page. `eyebrow` is the
// mono manifest label; `children` is an optional slot for a manifest strip
// of real data beneath the headline.
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-roasted text-husk">
      <Container>
        <div className="py-16 sm:py-20">
          <p className="eyebrow text-amber">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-husk/80">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </Container>
    </section>
  );
}
