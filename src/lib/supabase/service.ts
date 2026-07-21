import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client, used ONLY by public-page data-fetching code
// (src/lib/publicStats.ts). The `server-only` import above turns an
// accidental import from a client component into a build error, not a
// runtime leak — this client bypasses RLS entirely, so it must never
// reach the browser.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
