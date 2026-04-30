/**
 * Hand-fan math: given a card's index inside a hand of `total` cards,
 * return the rotation (degrees) and vertical offset (pixels) used to lay
 * cards out in a gentle arc.
 */
export function fan(index: number, total: number): { rot: number; ty: number } {
  if (total <= 1) return { rot: 0, ty: 0 };
  const t = (index / (total - 1)) * 2 - 1; // -1 .. 1
  const max = Math.min(8 + total * 0.8, 13);
  return { rot: t * max, ty: Math.abs(t) * max * 0.8 };
}
