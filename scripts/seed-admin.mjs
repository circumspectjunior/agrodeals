// Creates the single admin account for local dev, since there's no public
// sign-up flow. Re-run after `supabase db reset` wipes local auth data.
//
// Usage:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... \
//     node --env-file=.env.local scripts/seed-admin.mjs

import { createClient } from "@supabase/supabase-js";

const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD } =
  process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set — pass --env-file=.env.local.",
  );
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD env vars before running this script.");
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase.auth.admin.createUser({
  email: ADMIN_EMAIL,
  password: ADMIN_PASSWORD,
  email_confirm: true,
});

if (error) {
  throw error;
}

console.log(`Created admin user ${data.user.email} (${data.user.id})`);
