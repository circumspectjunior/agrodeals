import Link from "next/link";
import { Container } from "@/components/Container";

export function Nav() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <Container>
        <nav className="flex h-16 items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            AgroDeal
          </Link>
          <Link href="/lots" className="text-sm font-medium">
            Available lots
          </Link>
          <Link href="/transparency" className="text-sm font-medium">
            Transparency
          </Link>
          <Link href="/learn" className="text-sm font-medium">
            For farmers
          </Link>
        </nav>
      </Container>
    </header>
  );
}
