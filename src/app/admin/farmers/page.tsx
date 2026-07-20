import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/Container";

export default async function FarmersPage() {
  const supabase = await createClient();
  const { data: farmers, error } = await supabase
    .from("farmers")
    .select("id, name, village")
    .order("created_at", { ascending: false });

  return (
    <Container>
      <div className="py-16">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Farmers</h1>
          <Link
            href="/admin/farmers/new"
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            Add farmer
          </Link>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error.message}</p>}

        {!error && farmers && farmers.length === 0 && (
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            No farmers yet.
          </p>
        )}

        {!error && farmers && farmers.length > 0 && (
          <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
            {farmers.map((farmer) => (
              <li key={farmer.id} className="py-3">
                <Link
                  href={`/admin/farmers/${farmer.id}`}
                  className="font-medium hover:underline"
                >
                  {farmer.name}
                </Link>
                <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {farmer.village}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}
