import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type TransitionEvent } from 'react';
import { createPortal } from 'react-dom';
import type { LiarCard } from '../../../shared/types';
import {
  FLIGHT_EASING,
  FLIGHT_MS,
  FLIP_DELAY_MS,
  type FlightRect,
  type FlightTarget,
} from '../utils/animation';
import { PlayingCard } from './PlayingCard';

export interface CardGhostProps {
  card: LiarCard;
  src: FlightRect;
  dst: FlightTarget;
  delayMs: number;
  faceUpStart: boolean;
  faceUpEnd: boolean;
  onLand: () => void;
}

/**
 * A single in-flight card portaled to document.body. Starts pinned at `src`,
 * then on the next frame (after `delayMs`) transitions top/left/transform to
 * `dst`. If `faceUpStart !== faceUpEnd`, the inner card flips at FLIP_DELAY_MS
 * into the flight to disguise the snap when it lands face-down on the pile.
 *
 * `onLand` is called once when the position transition completes (filtered
 * to propertyName === 'left' so it can't fire twice).
 */
export function CardGhost({
  card,
  src,
  dst,
  delayMs,
  faceUpStart,
  faceUpEnd,
  onLand,
}: CardGhostProps) {
  const [phase, setPhase] = useState<'src' | 'dst'>('src');
  const [faceUp, setFaceUp] = useState(faceUpStart);
  const landedRef = useRef(false);

  useLayoutEffect(() => {
    const startTimer = window.setTimeout(() => {
      // Double rAF to make sure the initial src styles have flushed before
      // we apply the transition + dst styles, otherwise the browser may
      // collapse the two style mutations into a single non-animated jump.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase('dst'));
      });
    }, delayMs);
    return () => window.clearTimeout(startTimer);
  }, [delayMs]);

  useEffect(() => {
    if (faceUpStart === faceUpEnd) return;
    const flipTimer = window.setTimeout(() => {
      setFaceUp(faceUpEnd);
    }, delayMs + FLIP_DELAY_MS);
    return () => window.clearTimeout(flipTimer);
  }, [delayMs, faceUpStart, faceUpEnd]);

  // Safety net: if the transitionend event never fires (e.g. tab-throttled
  // background), still resolve the ghost so the pile/hand state isn't stuck.
  useEffect(() => {
    const safety = window.setTimeout(() => {
      if (!landedRef.current) {
        landedRef.current = true;
        onLand();
      }
    }, delayMs + FLIGHT_MS + 200);
    return () => window.clearTimeout(safety);
  }, [delayMs, onLand]);

  const handleTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== 'left') return;
    if (landedRef.current) return;
    landedRef.current = true;
    onLand();
  };

  const style: CSSProperties =
    phase === 'src'
      ? {
          position: 'fixed',
          left: src.left,
          top: src.top,
          width: src.width,
          height: src.height,
          transform: 'rotate(0deg)',
          transition: 'none',
        }
      : {
          position: 'fixed',
          left: dst.left,
          top: dst.top,
          width: dst.width,
          height: dst.height,
          transform: `rotate(${dst.rotateDeg}deg)`,
          transition: `top ${FLIGHT_MS}ms ${FLIGHT_EASING}, left ${FLIGHT_MS}ms ${FLIGHT_EASING}, transform ${FLIGHT_MS}ms ${FLIGHT_EASING}, width ${FLIGHT_MS}ms ${FLIGHT_EASING}, height ${FLIGHT_MS}ms ${FLIGHT_EASING}`,
        };

  return createPortal(
    <div className="card-ghost" style={style} onTransitionEnd={handleTransitionEnd}>
      <PlayingCard
        card={card}
        faceUp={faceUp}
        selected={false}
        disabled
        onToggle={() => {}}
        className="card-ghost__card"
      />
    </div>,
    document.body
  );
}
