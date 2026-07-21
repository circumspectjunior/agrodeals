import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/Container";

type LotListRow = {
  id: string;
  total_weight: number | null;
  blended_grade: string | null;
  eudr_status_rollup: string | null;
  price_offered: number | null;
  lot_inquiries: { viewed_at: string | null }[];
};

export default async function LotsPage() {
  const supabase = await createClient();
  const { data: lotsRaw, error } = await supabase
    .from("lots")
    .select(
      "id, total_weight, blended_grade, eudr_status_rollup, price_offered, created_at, lot_inquiries(viewed_at)",
    )
    .order("created_at", { ascending: false });

  const lots = lotsRaw as unknown as LotListRow[] | null;

  return (
    <Container>
      <div className="py-16">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Lots</h1>
          <Link
            href="/admin/lots/new"
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            Create lot
          </Link>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error.message}</p>}

        {!error && lots && lots.length === 0 && (
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            No lots yet.
          </p>
        )}

        {!error && lots && lots.length > 0 && (
          <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
            {lots.map((lot) => {
              const newInquiries = lot.lot_inquiries.filter(
                (i) => i.viewed_at === null,
              ).length;

              return (
                <li key={lot.id} className="py-3">
                  <Link
                    href={`/admin/lots/${lot.id}`}
                    className="font-medium hover:underline"
                  >
                    {lot.total_weight} kg · {lot.blended_grade}
                  </Link>
                  <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                    EUDR: {lot.eudr_status_rollup ?? "needs attention"}
                    {lot.price_offered ? ` · offered at ${lot.price_offered}` : ""}
                  </span>
                  {newInquiries > 0 && (
                    <span className="ml-2 rounded bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900">
                      {newInquiries} new{" "}
                      {newInquiries === 1 ? "inquiry" : "inquiries"}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Container>
  );
}
