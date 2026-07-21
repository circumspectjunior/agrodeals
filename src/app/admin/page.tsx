import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/Container";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Total unviewed inquiries across every lot — surfaced here, where you
  // land after login, so a new buyer lead is visible without having to
  // know to open the Lots list (let alone each lot's detail page).
  const { count } = await supabase
    .from("lot_inquiries")
    .select("*", { count: "exact", head: true })
    .is("viewed_at", null);
  const newInquiryCount = count ?? 0;

  return (
    <Container>
      <div className="py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-roasted">
          Admin
        </h1>
        <p className="mt-2 text-sm text-ink/60">Signed in as {user.email}.</p>

        {newInquiryCount > 0 && (
          <Link
            href="/admin/lots"
            className="mt-6 block rounded-md border border-terracotta-deep/40 bg-terracotta-deep/5 px-4 py-3 text-sm font-semibold text-terracotta-deep transition-colors hover:bg-terracotta-deep/10"
          >
            {newInquiryCount} new buyer{" "}
            {newInquiryCount === 1 ? "inquiry" : "inquiries"} — review in Lots →
          </Link>
        )}

        <nav className="mt-8 flex flex-col gap-2 text-sm font-medium">
          <Link
            href="/admin/farmers"
            className="text-ink/80 underline decoration-ink/25 underline-offset-4 hover:text-terracotta-deep"
          >
            Farmers
          </Link>
          <Link
            href="/admin/lots"
            className="text-ink/80 underline decoration-ink/25 underline-offset-4 hover:text-terracotta-deep"
          >
            Lots
          </Link>
        </nav>
      </div>
    </Container>
  );
}
