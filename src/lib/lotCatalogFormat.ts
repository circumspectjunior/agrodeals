// Pure functions only — no I/O, no "server-only" guard, so these are
// safely unit-testable outside Next.js's build pipeline. The I/O layer
// (lotCatalog.ts) and the submitInquiry Server Action import from here.

export type CatalogLot = {
  id: string;
  total_weight: number | null;
  blended_grade: string | null;
  eudr_status_rollup: string | null;
  sales: { id: string }[];
};

// A lot is available to list if no Sale references it yet. Nothing can
// create a Sale via the app yet (Phase 4 doesn't build Sale-creation UI),
// so today this is equivalent to "all lots" — but it's correct now and
// stays correct the moment Sale rows start existing, no follow-up fix.
export function filterAvailableLots<T extends { sales: { id: string }[] }>(
  lots: T[],
): T[] {
  return lots.filter((lot) => lot.sales.length === 0);
}

// Plausible email shape only — enough to reject a malformed address that
// would leave a "real lead" row we could never actually respond to. Not
// trying to fully validate deliverability (that's what the Resend bounce
// would surface later); just something@something.tld with no spaces.
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function formatEudrStatusForBuyer(eudrStatusRollup: string | null): string {
  return eudrStatusRollup ?? "EUDR check pending";
}
