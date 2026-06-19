// Server-authoritative pricing for Velour Walls prints.
// MUST stay in sync with src/lib/pricing.ts. Never trust client-supplied amounts.

type SizeOption = { label: string; basePriceCents: number };
type Finish = { name: string; multiplier: number; sizes: SizeOption[] };

const SIZES: SizeOption[] = [
  { label: "12×16″", basePriceCents: 11900 },
  { label: "18×24″", basePriceCents: 18900 },
  { label: "24×36″", basePriceCents: 28900 },
  { label: "30×40″", basePriceCents: 38900 },
  { label: "40×60″", basePriceCents: 54900 },
];

const FINISHES: Finish[] = [
  { name: "Gallery Canvas", multiplier: 1, sizes: SIZES },
  { name: "Tempered Glass", multiplier: 1.75, sizes: SIZES },
  { name: "Acrylic Face-Mount", multiplier: 1.85, sizes: SIZES },
];

export const SIGNATURE_SURCHARGE_CENTS = 4500;

/**
 * Compute the canonical price for a finish+size (+ optional signature).
 * Returns null when finish/size are not recognized — callers MUST reject.
 */
export function computePriceCents(
  finishName: string,
  sizeLabel: string,
  signed: boolean,
): number | null {
  const f = FINISHES.find((x) => x.name === finishName);
  if (!f) return null;
  const s = f.sizes.find((x) => x.label === sizeLabel);
  if (!s) return null;
  return Math.round(s.basePriceCents * f.multiplier) + (signed ? SIGNATURE_SURCHARGE_CENTS : 0);
}
