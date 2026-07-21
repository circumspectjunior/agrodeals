import Link from "next/link";
import { Container } from "@/components/Container";

const links = [
  { href: "/lots", label: "Available lots" },
  { href: "/transparency", label: "Transparency" },
  { href: "/learn", label: "For farmers" },
];

export function Nav() {
  return (
    <header className="border-b border-ink/10">
      <Container>
        <nav className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-roasted"
          >
            AgroDeal
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-ink/70 transition-colors hover:text-terracotta-deep"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </Container>
    </header>
  );
}
