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
        <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as {user.email}.
        </p>

        {newInquiryCount > 0 && (
          <Link
            href="/admin/lots"
            className="mt-6 block rounded border border-zinc-900 px-4 py-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-50 dark:hover:bg-zinc-900"
          >
            {newInquiryCount} new buyer{" "}
            {newInquiryCount === 1 ? "inquiry" : "inquiries"} — review in Lots →
          </Link>
        )}

        <nav className="mt-8 flex flex-col gap-2 text-sm">
          <Link href="/admin/farmers" className="font-medium underline">
            Farmers
          </Link>
          <Link href="/admin/lots" className="font-medium underline">
            Lots
          </Link>
        </nav>
      </div>
    </Container>
  );
}
