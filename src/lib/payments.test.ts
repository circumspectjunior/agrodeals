import { describe, expect, it } from "vitest";
import { computePaymentStatus } from "./payments";

describe("computePaymentStatus", () => {
  it("is unpaid for a freshly-logged batch with no payment events", () => {
    // Regression test: a Supabase relation-typing bug elsewhere once made
    // both amountOwed and paidTotal silently default to 0 here, and
    // 0 >= 0 read as "paid in full" for a batch nobody had paid yet.
    expect(computePaymentStatus([], 100)).toEqual({ kind: "unpaid", amountOwed: 100 });
  });

  it("is partial when some but not all of the owed amount has been paid", () => {
    expect(computePaymentStatus([{ amount: 40 }], 100)).toEqual({
      kind: "partial",
      paidTotal: 40,
      amountOwed: 100,
    });
  });

  it("sums multiple payment events for the partial total", () => {
    expect(computePaymentStatus([{ amount: 40 }, { amount: 30 }], 100)).toEqual({
      kind: "partial",
      paidTotal: 70,
      amountOwed: 100,
    });
  });

  it("is paid in full when events sum to exactly the owed amount", () => {
    expect(computePaymentStatus([{ amount: 100 }], 100)).toEqual({ kind: "paid_in_full" });
  });
});
