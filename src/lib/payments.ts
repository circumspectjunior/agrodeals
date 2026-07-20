export type PaymentStatus =
  | { kind: "unpaid"; amountOwed: number }
  | { kind: "partial"; paidTotal: number; amountOwed: number }
  | { kind: "paid_in_full" };

// Pulled out as a pure function specifically so it's independently
// testable: a bug here once produced a false-positive "Paid in full" on a
// freshly-logged, unpaid batch (see review.md Phase 2) because of an
// unrelated Supabase relation-typing mistake elsewhere that made both
// amountOwed and paidTotal silently default to 0, and 0 >= 0 read as paid.
export function computePaymentStatus(
  events: { amount: number }[],
  amountOwed: number,
): PaymentStatus {
  const paidTotal = events.reduce((sum, event) => sum + event.amount, 0);

  if (paidTotal >= amountOwed) {
    return { kind: "paid_in_full" };
  }
  if (paidTotal > 0) {
    return { kind: "partial", paidTotal, amountOwed };
  }
  return { kind: "unpaid", amountOwed };
}

export function formatPaymentStatus(status: PaymentStatus): string {
  switch (status.kind) {
    case "paid_in_full":
      return "Paid in full";
    case "partial":
      return `Partially paid (${status.paidTotal} of ${status.amountOwed})`;
    case "unpaid":
      return `Unpaid (${status.amountOwed} owed)`;
  }
}
