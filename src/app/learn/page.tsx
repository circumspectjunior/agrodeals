import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { modulesByLanguage } from "@/lib/education/content";
import { publicContentFor } from "@/lib/education/format";

// Content is static in the repo (no DB, no network), so this page can be
// statically rendered — it only changes on deploy. No force-dynamic.

export const metadata = {
  title: "For farmers — AgroDeal",
  description: "Practical guidance for cocoa farmers on quality and fair pricing.",
};

// Topical eyebrow per module — encodes the real subject, not a fake
// sequence number (the modules are independent topics, not ordered steps).
const MODULE_EYEBROW: Record<string, string> = {
  "post-harvest-quality": "Quality",
  "fair-price-basics": "Pricing",
};

export default function LearnPage() {
  // English is authoritative and the only reviewed language for now. When a
  // reviewed translation is added to modulesByLanguage, a language switcher
  // goes here — nothing is machine-translated, so an absent language simply
  // doesn't appear.
  const modules = modulesByLanguage.en ?? [];

  return (
    <>
      <PageHeader
        eyebrow="For farmers"
        title="Getting the most from your cocoa."
        subtitle="Practical guidance on quality and fair pricing — written to be genuinely useful, not generic."
      />

      <Container>
        <div className="py-16 sm:py-20">
          {modules.map((module, i) => {
            const pieces = publicContentFor(module);

            return (
              <Section
                key={module.id}
                eyebrow={MODULE_EYEBROW[module.id] ?? "Guide"}
                title={module.title}
                className={i > 0 ? "mt-14 border-t border-ink/10 pt-14" : ""}
              >
                <p className="max-w-2xl text-lg leading-relaxed text-ink/70">
                  {module.intro}
                </p>

                {pieces.length === 0 ? (
                  <p className="mt-6 text-ink/55">
                    This section is being reviewed — check back soon.
                  </p>
                ) : (
                  <ul className="mt-6 flex flex-col gap-6">
                    {pieces.map((piece) => (
                      <li key={piece.id} className="flex gap-4">
                        <span
                          aria-hidden
                          className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta"
                        />
                        <p className="text-lg leading-relaxed text-ink/85">
                          {piece.text}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            );
          })}
        </div>
      </Container>
    </>
  );
}
