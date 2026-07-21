// Content model for the farmer education page (Phase 5).
//
// Every piece of content is tagged either as a universal cocoa-handling
// fact (true anywhere, safe to show) or an AgroDeal-specific claim about
// how AgroDeal itself grades/prices (must be verified against real
// practice before a farmer sees it). Unverified specific claims are
// WITHHELD from the public page entirely — never shown with a disclaimer.

export type ContentKind =
  | { kind: "universal" }
  | { kind: "agrodeal_specific"; verified: boolean };

export type ContentPiece = {
  // Stable id so a later reviewed translation can be matched piece-by-piece.
  id: string;
  text: string;
} & ContentKind;

// Language-keyed so reviewed translations slot in later. English (`en`) is
// authoritative now; other languages are absent until human-reviewed —
// no machine translation is ever stored or rendered.
export type LanguageCode = "en" | "yo" | "ig" | "ha";

export type Module = {
  id: string;
  title: string;
  intro: string;
  pieces: ContentPiece[];
};
