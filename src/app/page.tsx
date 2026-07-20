import { Container } from "@/components/Container";

export default function Home() {
  return (
    <Container>
      <div className="py-16">
        <h1 className="text-2xl font-semibold tracking-tight">AgroDeal</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Foundation in progress — public site coming once real farmer and
          lot data exists.
        </p>
      </div>
    </Container>
  );
}
