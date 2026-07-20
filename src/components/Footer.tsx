import { Container } from "@/components/Container";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <Container>
        <div className="flex h-16 items-center text-sm text-zinc-600 dark:text-zinc-400">
          © {new Date().getFullYear()} AgroDeal
        </div>
      </Container>
    </footer>
  );
}
