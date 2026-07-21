import { describe, expect, it } from "vitest";
import {
  filterAvailableLots,
  formatEudrStatusForBuyer,
  isValidEmail,
} from "./lotCatalogFormat";

describe("filterAvailableLots", () => {
  it("keeps lots with no sale attached", () => {
    const lots = [
      { id: "a", sales: [] },
      { id: "b", sales: [] },
    ];
    expect(filterAvailableLots(lots).map((l) => l.id)).toEqual(["a", "b"]);
  });

  it("excludes a lot that already has a sale", () => {
    const lots = [
      { id: "a", sales: [] },
      { id: "b", sales: [{ id: "sale-1" }] },
    ];
    expect(filterAvailableLots(lots).map((l) => l.id)).toEqual(["a"]);
  });

  it("returns an empty list when every lot is sold", () => {
    const lots = [{ id: "a", sales: [{ id: "sale-1" }] }];
    expect(filterAvailableLots(lots)).toEqual([]);
  });
});

describe("isValidEmail", () => {
  it("accepts a plausible address", () => {
    expect(isValidEmail("buyer@chocolatier.co")).toBe(true);
  });

  it("trims surrounding whitespace before checking", () => {
    expect(isValidEmail("  buyer@chocolatier.co  ")).toBe(true);
  });

  it.each(["", "notanemail", "missing@tld", "@nodomain.co", "no domain@x.co", "spaces in@x.co"])(
    "rejects the malformed address %j",
    (bad) => {
      expect(isValidEmail(bad)).toBe(false);
    },
  );
});

describe("formatEudrStatusForBuyer", () => {
  it("shows the real status when present", () => {
    expect(formatEudrStatusForBuyer("low")).toBe("low");
  });

  it("shows a pending label rather than nothing when the rollup is null", () => {
    expect(formatEudrStatusForBuyer(null)).toBe("EUDR check pending");
  });
});
