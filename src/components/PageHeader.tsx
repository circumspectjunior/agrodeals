import { Container } from "@/components/Container";

// The espresso hero at the top of every public page. On large screens it's
// a two-column layout — headline left, the manifest data (`children`) in a
// right rail — so the width is used instead of the content hugging the
// left. It stacks to a single column on phone/tablet.
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
        <div className="grid items-end gap-x-12 gap-y-10 py-16 sm:py-20 lg:grid-cols-12">
          <div className={children ? "lg:col-span-7" : "lg:col-span-9"}>
            <p className="eyebrow text-amber">{eyebrow}</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-husk/80">
                {subtitle}
              </p>
            )}
          </div>
          {children && <div className="lg:col-span-5">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
