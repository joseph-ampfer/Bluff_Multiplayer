/**
 * Helpers for the card-fly animation. Source rects come from the live card
 * buttons via getBoundingClientRect(); landing targets are derived from the
 * play-area rect and a per-card scatter that mirrors the existing topDeck
 * layout (see App.tsx play-area rendering).
 */

export interface FlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface FlightTarget extends FlightRect {
  rotateDeg: number;
}

/** Card display dimensions, matching .playing-card in App.css. */
export const CARD_W = 84;
export const CARD_H = 118;

/** Stagger between consecutive cards in a single play. */
export const STAGGER_MS = 80;

/** Total flight duration per card. */
export const FLIGHT_MS = 550;

/**
 * When (relative to the start of each card's flight) to flip face up→down.
 * The inner-card flip transition is 500ms (see .playing-card__inner in
 * App.css), so starting at FLIGHT_MS - 500 lines up the end of the flip
 * with the card's landing — when the ghost is replaced by the pile card.
 */
export const FLIP_DELAY_MS = 50;

/** Easing used for both top/left and transform during flight. */
export const FLIGHT_EASING = 'cubic-bezier(.22,.7,.2,1)';

export function rectFromDOMRect(r: DOMRect): FlightRect {
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/**
 * Compute landing rects for `count` cards centered on the play area, with
 * the same scatter as the topDeck reveal (offsetX = t*14px, rotate = t*7deg).
 *
 * Each returned rect describes where the card's top-left should be at the
 * end of the flight, matching CARD_W x CARD_H.
 */
export function computeLandingTargets(
  playArea: FlightRect,
  count: number
): FlightTarget[] {
  const cx = playArea.left + playArea.width / 2;
  const cy = playArea.top + playArea.height / 2;
  const targets: FlightTarget[] = [];
  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i - (count - 1) / 2 : 0;
    const offsetX = t * 14;
    const rotateDeg = t * 7;
    targets.push({
      left: cx + offsetX - CARD_W / 2,
      top: cy - CARD_H / 2,
      width: CARD_W,
      height: CARD_H,
      rotateDeg,
    });
  }
  return targets;
}
