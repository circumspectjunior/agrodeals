"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { isValidEmail } from "@/lib/lotCatalogFormat";
import { sendInquiryNotification } from "@/lib/resend";

export async function submitInquiry(
  lotId: string,
  input: {
    company: string;
    contactName: string;
    email: string;
    country: string;
    message: string;
  },
): Promise<{ error: string } | { success: true }> {
  const company = input.company.trim();
  const contactName = input.contactName.trim();
  const email = input.email.trim();
  const country = input.country.trim();
  const message = input.message.trim();

  if (!company) {
    return { error: "Company is required." };
  }
  if (!contactName) {
    return { error: "Contact name is required." };
  }
  if (!isValidEmail(email)) {
    return { error: "Enter a valid email address so we can reach you back." };
  }

  // Service-role client: anon has no INSERT grant on lot_inquiries, so this
  // is the only write path, and it only runs after the validation above.
  const supabase = createServiceClient();

  const { data: lot, error: lotError } = await supabase
    .from("lots")
    .select("id, total_weight, blended_grade")
    .eq("id", lotId)
    .maybeSingle();

  if (lotError) {
    return { error: lotError.message };
  }
  if (!lot) {
    return { error: "That lot could not be found." };
  }

  const { error: insertError } = await supabase.from("lot_inquiries").insert({
    lot_id: lotId,
    company,
    contact_name: contactName,
    email,
    country: country || null,
    message: message || null,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  // Best-effort notification — never blocks the already-saved inquiry.
  await sendInquiryNotification({
    lotSummary: `${lot.total_weight} kg · ${lot.blended_grade}`,
    company,
    contactName,
    email,
    country: country || null,
    message: message || null,
  });

  return { success: true };
}
