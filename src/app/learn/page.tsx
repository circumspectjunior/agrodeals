import { Container } from "@/components/Container";
import { modulesByLanguage } from "@/lib/education/content";
import { publicContentFor } from "@/lib/education/format";

// Content is static in the repo (no DB, no network), so this page can be
// statically rendered — it only changes on deploy. No force-dynamic.

export const metadata = {
  title: "Learn — AgroDeal",
  description: "Practical guidance for cocoa farmers on quality and fair pricing.",
};

export default function LearnPage() {
  // English is authoritative and the only reviewed language for now. When a
  // reviewed translation is added to modulesByLanguage, a language switcher
  // goes here — nothing is machine-translated, so an absent language simply
  // doesn't appear.
  const modules = modulesByLanguage.en ?? [];

  return (
    <Container>
      <div className="py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          For farmers
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Practical guidance on getting the most value from your cocoa —
          written to be genuinely useful, not generic.
        </p>

        {modules.map((module) => {
          const pieces = publicContentFor(module);

          return (
            <section key={module.id} className="mt-12">
              <h2 className="text-xl font-semibold tracking-tight">
                {module.title}
              </h2>
              <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
                {module.intro}
              </p>

              {pieces.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
                  This section is being reviewed — check back soon.
                </p>
              ) : (
                <ul className="mt-4 flex flex-col gap-4">
                  {pieces.map((piece) => (
                    <li
                      key={piece.id}
                      className="max-w-2xl text-zinc-700 dark:text-zinc-300"
                    >
                      {piece.text}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </Container>
  );
}
