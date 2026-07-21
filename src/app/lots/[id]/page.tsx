import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { getPublicLot, formatEudrStatusForBuyer } from "@/lib/lotCatalog";
import { InquiryForm } from "./InquiryForm";

export const dynamic = "force-dynamic";

export default async function PublicLotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lot = await getPublicLot(id);

  if (!lot) {
    notFound();
  }

  return (
    <Container>
      <div className="py-16">
        <h1 className="text-2xl font-semibold tracking-tight">
          {lot.total_weight} kg · {lot.blended_grade}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          EUDR status: {formatEudrStatusForBuyer(lot.eudr_status_rollup)}
        </p>
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Interested in this lot? Send us an inquiry below and we'll share
          pricing and next steps directly.
        </p>

        <h2 className="mt-8 font-medium">Inquire about this lot</h2>
        <InquiryForm lotId={lot.id} />
      </div>
    </Container>
  );
}
