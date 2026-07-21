import "server-only";

// Drop-in email notification, same fail-open pattern as the Whisp
// integration: if RESEND_API_KEY is unset, or the send fails, we log and
// return false — never throw. Callers treat email as best-effort; the
// database row is always the source of truth.
//
// Uses raw fetch against Resend's API rather than the SDK, matching the
// Whisp precedent and avoiding a dependency that's only conditionally used.
export async function sendInquiryNotification(input: {
  lotSummary: string;
  company: string;
  contactName: string;
  email: string;
  country: string | null;
  message: string | null;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const to = process.env.INQUIRY_NOTIFY_TO;

  if (!apiKey || !from || !to) {
    console.info("Resend not configured — skipping inquiry email (inquiry was still saved).");
    return false;
  }

  const body = [
    `New buyer inquiry on lot: ${input.lotSummary}`,
    "",
    `Company: ${input.company}`,
    `Contact: ${input.contactName}`,
    `Email: ${input.email}`,
    `Country: ${input.country ?? "—"}`,
    "",
    `Message:`,
    input.message ?? "(none)",
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `AgroDeal inquiry: ${input.company}`,
        text: body,
        reply_to: input.email,
      }),
    });

    if (!response.ok) {
      console.error(`Resend send failed: ${response.status} ${await response.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend request threw:", err);
    return false;
  }
}
