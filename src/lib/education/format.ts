// Pure functions only — no I/O, no "server-only" guard, unit-testable
// outside Next.js's build pipeline. Mirrors the publicStatsFormat /
// lotCatalogFormat split.

import type { ContentPiece, Module } from "@/lib/education/types";

// A piece is publicly shown if it's a universal fact, or an
// AgroDeal-specific claim that's been verified. Unverified specific claims
// are withheld entirely.
export function isPubliclyShown(piece: ContentPiece): boolean {
  return piece.kind === "universal" || piece.verified;
}

export function publicContentFor(module: Module): ContentPiece[] {
  return module.pieces.filter(isPubliclyShown);
}

// { shown, heldBack } for the empty-module check and the publish-readiness
// report. heldBack counts unverified agrodeal_specific pieces.
export function publishableCount(module: Module): { shown: number; heldBack: number } {
  let shown = 0;
  let heldBack = 0;
  for (const piece of module.pieces) {
    if (isPubliclyShown(piece)) {
      shown += 1;
    } else {
      heldBack += 1;
    }
  }
  return { shown, heldBack };
}
