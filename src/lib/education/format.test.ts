import { describe, expect, it } from "vitest";
import { isPubliclyShown, publicContentFor, publishableCount } from "./format";
import type { Module } from "./types";

const moduleFixture: Module = {
  id: "test",
  title: "Test module",
  intro: "intro",
  pieces: [
    { id: "u1", kind: "universal", text: "universal fact one" },
    { id: "u2", kind: "universal", text: "universal fact two" },
    { id: "s1", kind: "agrodeal_specific", verified: true, text: "verified specific claim" },
    { id: "s2", kind: "agrodeal_specific", verified: false, text: "unverified specific claim" },
  ],
};

describe("isPubliclyShown", () => {
  it("shows universal facts", () => {
    expect(isPubliclyShown({ id: "u", kind: "universal", text: "x" })).toBe(true);
  });

  it("shows a verified specific claim", () => {
    expect(
      isPubliclyShown({ id: "s", kind: "agrodeal_specific", verified: true, text: "x" }),
    ).toBe(true);
  });

  it("withholds an unverified specific claim", () => {
    expect(
      isPubliclyShown({ id: "s", kind: "agrodeal_specific", verified: false, text: "x" }),
    ).toBe(false);
  });
});

describe("publicContentFor", () => {
  it("includes every universal piece and only verified specifics", () => {
    expect(publicContentFor(moduleFixture).map((p) => p.id)).toEqual(["u1", "u2", "s1"]);
  });

  it("never includes an unverified specific claim (withheld, not labeled)", () => {
    expect(publicContentFor(moduleFixture).some((p) => p.id === "s2")).toBe(false);
  });
});

describe("publishableCount", () => {
  it("counts shown vs held-back correctly", () => {
    expect(publishableCount(moduleFixture)).toEqual({ shown: 3, heldBack: 1 });
  });

  it("reports an all-held-back module as zero shown (empty-module case)", () => {
    const allHeld: Module = {
      id: "empty",
      title: "Empty",
      intro: "intro",
      pieces: [
        { id: "s1", kind: "agrodeal_specific", verified: false, text: "x" },
        { id: "s2", kind: "agrodeal_specific", verified: false, text: "y" },
      ],
    };
    expect(publishableCount(allHeld)).toEqual({ shown: 0, heldBack: 2 });
  });
});
