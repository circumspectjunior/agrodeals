import { Container } from "@/components/Container";

export function Footer() {
  return (
    <footer className="mt-24 bg-roasted text-husk">
      <Container>
        <div className="py-14">
          <p className="font-display text-2xl font-semibold tracking-tight">
            AgroDeal
          </p>
          <p className="mt-3 max-w-md text-husk/75">
            Aggregating cocoa from smallholder farmers in Nigeria and selling
            it direct — fair to farmers, traceable for buyers.
          </p>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-husk/70">
            <span className="eyebrow text-amber">Origin</span>
            <span className="text-sm">Okokodo, Nigeria</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-8 gap-y-2 text-husk/70">
            <span className="eyebrow text-amber">Contact</span>
            <a
              href="mailto:echoneeds@yahoo.com"
              className="text-sm underline decoration-husk/30 underline-offset-4 hover:decoration-husk"
            >
              echoneeds@yahoo.com
            </a>
          </div>

          <p className="mt-10 text-xs text-husk/50">
            © {new Date().getFullYear()} AgroDeal
          </p>
        </div>
      </Container>
    </footer>
  );
}
