import { describe, expect, it } from "vitest";
import { formatEudrReadiness, formatFarmgatePrice, formatHomeStats } from "./publicStatsFormat";

describe("formatHomeStats", () => {
  it("shows an honest coming-soon state with zero farmers", () => {
    expect(
      formatHomeStats({
        farmerCount: 0,
        plotCount: 0,
        verifiedPlotCount: 0,
        totalTracedWeightKg: 0,
      }),
    ).toEqual({
      headline: "Coming soon — we're just getting started.",
      verifiedLabel: "",
    });
  });

  it("frames the real single-farmer case as early-stage, not a stats panel", () => {
    const result = formatHomeStats({
      farmerCount: 1,
      plotCount: 1,
      verifiedPlotCount: 1,
      totalTracedWeightKg: 200,
    });
    expect(result.headline).toBe(
      "We're just getting started — 1 farmer, 1 plot mapped, 200kg traced so far.",
    );
    expect(result.verifiedLabel).toBe("100% EUDR-verified");
  });

  it("pluralizes correctly for multiple farmers/plots", () => {
    const result = formatHomeStats({
      farmerCount: 2,
      plotCount: 3,
      verifiedPlotCount: 1,
      totalTracedWeightKg: 400,
    });
    expect(result.headline).toBe(
      "We're just getting started — 2 farmers, 3 plots mapped, 400kg traced so far.",
    );
    expect(result.verifiedLabel).toBe("33% EUDR-verified");
  });
});

describe("formatFarmgatePrice", () => {
  it("shows the real Patrick Ojo case", () => {
    expect(
      formatFarmgatePrice({
        farmerName: "Patrick Ojo",
        weightKg: 200,
        grade: "Grade I",
        amountOwed: 500000,
      }),
    ).toBe("₦500,000 paid for 200kg (Grade I) ≈ ₦2,500/kg");
  });

  it("shows an honest no-transactions state when there's no batch yet", () => {
    expect(formatFarmgatePrice(null)).toBe("No transactions yet.");
  });

  it("guards against division by zero for weight", () => {
    expect(
      formatFarmgatePrice({
        farmerName: "Test",
        weightKg: 0,
        grade: "Grade I",
        amountOwed: 100,
      }),
    ).toBe("₦100 paid for 0kg (Grade I).");
  });
});

describe("formatEudrReadiness", () => {
  it("shows the real single-plot verified-low case", () => {
    expect(
      formatEudrReadiness({ totalPlotCount: 1, verifiedPlotCount: 1, lowRiskPlotCount: 1 }),
    ).toBe(
      "We're just getting started: 1 of 1 verified plot so far is low deforestation risk.",
    );
  });

  it("shows an honest no-plots state", () => {
    expect(
      formatEudrReadiness({ totalPlotCount: 0, verifiedPlotCount: 0, lowRiskPlotCount: 0 }),
    ).toBe("No plots mapped yet.");
  });

  it("shows a pending state when plots exist but none are verified yet", () => {
    expect(
      formatEudrReadiness({ totalPlotCount: 2, verifiedPlotCount: 0, lowRiskPlotCount: 0 }),
    ).toBe("We're just getting started: 2 plots mapped, EUDR checks pending.");
  });
});
