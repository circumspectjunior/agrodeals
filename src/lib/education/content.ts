import type { LanguageCode, Module } from "@/lib/education/types";

// English is authoritative. Reviewed translations get added later as
// additional keys in `modulesByLanguage` — never machine translation. A
// language that isn't a key here simply does not appear to farmers.
//
// Each piece is tagged `universal` (a general cocoa-handling fact, safe to
// show) or `agrodeal_specific` with a `verified` flag. Unverified specific
// claims are drafted here for the founder's review but WITHHELD from the
// public page until `verified: true`. The founder flips the flag once
// they've confirmed the claim against real AgroDeal practice.

const postHarvestQuality: Module = {
  id: "post-harvest-quality",
  title: "Post-harvest quality",
  intro:
    "What happens to your cocoa after harvest decides most of its value. These are the basics of turning good beans into a batch that grades well.",
  pieces: [
    {
      id: "phq-ferment",
      kind: "universal",
      text: "Ferment fully — usually 5 to 7 days — and turn the heap so every bean ferments evenly. Well-fermented beans turn brown and smell rich; purple or slaty beans are under-fermented and grade lower.",
    },
    {
      id: "phq-dry-slow",
      kind: "universal",
      text: "Dry slowly to about 7% moisture. Spread the beans thinly on raised racks or clean mats in the sun and turn them regularly. Drying too fast — or over a fire — traps moisture inside and adds smoky off-flavours buyers reject.",
    },
    {
      id: "phq-keep-clean",
      kind: "universal",
      text: "Keep beans off the bare ground and away from smoke, fuel, and strong smells. Cocoa easily picks up contamination and off-flavours that lower its grade, even when the beans themselves are good.",
    },
    {
      id: "phq-sort",
      kind: "universal",
      text: "Sort before bagging. Remove mouldy, broken, flat, and germinated beans, along with any sticks or stones. A clean, uniform bag grades better than a mixed one.",
    },
    {
      id: "phq-store",
      kind: "universal",
      text: "Store in a dry, well-ventilated place, off the ground and away from moisture and strong odours. Cocoa absorbs smells, and damp beans grow mould in storage or during transit.",
    },
  ],
};

const fairPriceBasics: Module = {
  id: "fair-price-basics",
  title: "Fair price basics",
  intro:
    "Understanding what your cocoa is worth — and why — helps you earn more and sell with confidence.",
  pieces: [
    {
      id: "fpb-quality-sets-price",
      kind: "universal",
      text: "Quality sets the price. Well-fermented, properly dried, low-defect beans earn more than wet, mouldy, or mixed ones. The same cocoa can be worth very different amounts depending on how it's handled after harvest.",
    },
    {
      id: "fpb-dry-weight",
      kind: "universal",
      text: "You're paid on dry weight, not wet weight. Beans lose a large share of their weight as they dry, so the number that matters for payment is the properly-dried weight — not what the wet beans weighed at harvest.",
    },
    {
      id: "fpb-know-your-grade",
      kind: "universal",
      text: "Knowing your grade helps you. When you understand why a batch graded the way it did — moisture, fermentation, defects — you can improve the next harvest and talk to buyers from a position of knowledge.",
    },
    {
      id: "fpb-traceability-premium",
      kind: "universal",
      text: "Traceable cocoa is worth more. Buyers abroad pay premiums for cocoa they can trace to a known farm with verified low deforestation risk. The record of where your beans came from is part of their value.",
    },
    // --- AgroDeal-specific claims below: drafted for founder review,
    // withheld from the public page until verified against real practice. ---
    {
      id: "fpb-agrodeal-farmgate-price",
      kind: "agrodeal_specific",
      verified: false,
      text: "AgroDeal's farmgate prices per grade: [FOUNDER TO CONFIRM real figures — do not publish a number that isn't the actual price you pay].",
    },
    {
      id: "fpb-agrodeal-grading",
      kind: "agrodeal_specific",
      verified: false,
      text: "How AgroDeal grades your batch: [FOUNDER TO CONFIRM the actual grading process you use — moisture thresholds, defect limits, what separates one grade from the next].",
    },
    {
      id: "fpb-agrodeal-payment",
      kind: "agrodeal_specific",
      verified: false,
      text: "When and how AgroDeal pays you, and how you can see your own payment record: [FOUNDER TO CONFIRM the actual payment timing, method, and whether farmers can view their ledger].",
    },
  ],
};

export const modulesByLanguage: Partial<Record<LanguageCode, Module[]>> = {
  en: [postHarvestQuality, fairPriceBasics],
};

export const availableLanguages = Object.keys(modulesByLanguage) as LanguageCode[];
