// Centralized pricing for Velour Walls prints.
// Benchmarked against Mpix, Canvas On Demand, Nations Photo Lab, and acrylic-print
// galleries (Nov 2025). Priced ~10–15% above mass-market labs to reflect signed,
// limited-edition gallery pieces — but still well below high-end fine-art studios.

export type Finish = {
  name: string;
  desc: string;
  badge: string;
  // Multiplier applied on top of the base size price for this finish.
  multiplier: number;
  sizes: SizeOption[];
};

export type SizeOption = {
  label: string; // "18×24″"
  basePriceCents: number; // base canvas price in cents
};

// Base = Gallery Canvas pricing. Other finishes scale via multiplier.
const SIZES: SizeOption[] = [
  { label: "12×16″", basePriceCents: 11900 },
  { label: "18×24″", basePriceCents: 18900 },
  { label: "24×36″", basePriceCents: 28900 },
  { label: "30×40″", basePriceCents: 38900 },
  { label: "40×60″", basePriceCents: 54900 },
];

export const FINISHES: Finish[] = [
  {
    name: "Gallery Canvas",
    desc: "Hand-stretched on kiln-dried solid wood. Museum-wrapped edges, zero staples on the face — the way canvas was always meant to carry a painting. Ready to hang.",
    badge: "Bestseller",
    multiplier: 1,
    sizes: SIZES,
  },
  {
    name: "Tempered Glass",
    desc: "UV-printed directly onto 6mm tempered glass with brushed aluminum standoffs. Impossible depth, mirror-sharp colour, and a piece that changes with the light in your room.",
    badge: "Premium",
    multiplier: 1.75,
    sizes: SIZES,
  },
  {
    name: "Acrylic Face-Mount",
    desc: "Printed face-first onto 1/4″ crystal-clear acrylic with rigid dibond backing. Colours reach a saturation you've never seen in a print — the museum standard.",
    badge: "Editor's pick",
    multiplier: 1.85,
    sizes: SIZES,
  },
];

// Optional add-on: hand-signed by the artist. Kept rare on purpose — the signature
// is the artist's mark of authenticity and only ships when explicitly chosen.
export const SIGNATURE_SURCHARGE_CENTS = 4500;

export const formatPrice = (cents: number) =>
  `$${Math.round(cents / 100).toLocaleString()}`;

export const priceFor = (finishName: string, sizeLabel: string): number => {
  const f = FINISHES.find((x) => x.name === finishName) ?? FINISHES[0];
  const s = f.sizes.find((x) => x.label === sizeLabel) ?? f.sizes[0];
  return Math.round(s.basePriceCents * f.multiplier);
};

// Lowest available price across all finishes/sizes — used for "From $X" labels.
export const startingPriceCents = (() => {
  let min = Infinity;
  for (const f of FINISHES) for (const s of f.sizes) {
    const p = Math.round(s.basePriceCents * f.multiplier);
    if (p < min) min = p;
  }
  return min;
})();
