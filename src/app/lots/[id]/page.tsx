import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { Section } from "@/components/Section";
import { getPublicLot } from "@/lib/lotCatalog";
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

  const isLow = lot.eudr_status_rollup === "low";

  return (
    <>
      <PageHeader
        eyebrow="Available lot"
        title={`${lot.total_weight} kg · ${lot.blended_grade}`}
        subtitle="Send us an inquiry and we'll share pricing and next steps directly."
      >
        <div className="mt-8 flex items-center gap-3">
          <span className="eyebrow text-husk/55">EUDR status</span>
          <span
            className={`font-mono text-sm font-bold uppercase tracking-wider ${
              isLow ? "text-leaf-bright" : "text-amber"
            }`}
          >
            {isLow
              ? "Low risk"
              : lot.eudr_status_rollup === null
                ? "Check pending"
                : lot.eudr_status_rollup}
          </span>
        </div>
      </PageHeader>

      <Container>
        <Section
          eyebrow="Inquire"
          title="Ask about this lot"
          className="py-16 sm:py-20"
        >
          <InquiryForm lotId={lot.id} />
        </Section>
      </Container>
    </>
  );
}
