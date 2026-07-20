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

  return (
    <Container>
      <div className="py-16">
        <h1 className="text-xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Signed in as {user.email}. Farmer/plot data entry lands in Phase 1.
        </p>
      </div>
    </Container>
  );
}
