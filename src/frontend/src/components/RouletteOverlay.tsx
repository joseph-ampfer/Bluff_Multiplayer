import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { RevolverCylinder } from './RevolverCylinder';
import { playSfx } from '../utils/audio';

export interface RouletteOverlayProps {
  /** The seat cylinder's bounding rect at animation start. */
  seatRect: { left: number; top: number; width: number; height: number };
  /** Whether this shot is the lethal one. Drives the reveal branch. */
  isShot: boolean;
  /** Called once the full sequence (zoomIn -> spin -> reveal -> zoomOut) finishes. */
  onComplete: () => void;
}

type Phase = 'zoomIn' | 'spin' | 'reveal' | 'zoomOut';

const ZOOM_IN_MS = 400;
const SPIN_MS = 1800;
const REVEAL_MS = 600;
const ZOOM_OUT_MS = 400;
const BIG_SIZE = 280;

/**
 * Phase 5 — roulette zoom + spin theater.
 *
 * Portaled to <body>. Renders a vignette spotlight on the firing seat
 * plus a "big" generic cylinder that flies seat -> center, spins with
 * deceleration, reveals (bang or click), then flies back to seat.
 * The seat cylinder itself is hidden via opacity by the parent for the
 * duration; on `onComplete` it reappears reflecting the post-shot state.
 */
export function RouletteOverlay({
  seatRect,
  isShot,
  onComplete,
}: RouletteOverlayProps) {
  const [phase, setPhase] = useState<Phase>('zoomIn');
  const [zoomedIn, setZoomedIn] = useState(false);
  const completedRef = useRef(false);

  // Pin seat center for the vignette as CSS variables.
  const seatCx = seatRect.left + seatRect.width / 2;
  const seatCy = seatRect.top + seatRect.height / 2;

  // Fire reveal SFX exactly once per reveal phase entry.
  useEffect(() => {
    if (phase !== 'reveal') return;
    playSfx(isShot ? 'gunshot' : 'gunclick');
  }, [phase, isShot]);

  // Apply / clean up the body-level shake class on the bang.
  useEffect(() => {
    if (phase !== 'reveal' || !isShot) return;
    const cls = 'app-shake';
    document.body.classList.add(cls);
    const timer = window.setTimeout(() => {
      document.body.classList.remove(cls);
    }, 500);
    return () => {
      window.clearTimeout(timer);
      document.body.classList.remove(cls);
    };
  }, [phase, isShot]);

  // Drive the phase chain with timeouts. The initial zoom-in transition
  // is set up via a double-rAF so the browser paints the seat-rect
  // styles first, then sees the centered styles and animates between
  // them (mirrors the CardGhost pattern).
  useLayoutEffect(() => {
    let cancelled = false;
    const timers: number[] = [];

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        setZoomedIn(true);
      });
    });

    timers.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setPhase('spin');
      }, ZOOM_IN_MS)
    );
    timers.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setPhase('reveal');
      }, ZOOM_IN_MS + SPIN_MS)
    );
    timers.push(
      window.setTimeout(() => {
        if (cancelled) return;
        setZoomedIn(false);
        setPhase('zoomOut');
      }, ZOOM_IN_MS + SPIN_MS + REVEAL_MS)
    );
    timers.push(
      window.setTimeout(() => {
        if (cancelled) return;
        if (completedRef.current) return;
        completedRef.current = true;
        onComplete();
      }, ZOOM_IN_MS + SPIN_MS + REVEAL_MS + ZOOM_OUT_MS)
    );

    return () => {
      cancelled = true;
      for (const t of timers) window.clearTimeout(t);
    };
  }, [onComplete]);

  // Position styles for the big cylinder wrapper. While "zoomedIn" is
  // true we render at screen center; otherwise we render at the seat
  // rect (used for both the initial frame and the zoom-out target).
  const wrapperStyle: CSSProperties = zoomedIn
    ? {
        left: window.innerWidth / 2 - BIG_SIZE / 2,
        top: window.innerHeight / 2 - BIG_SIZE / 2,
        width: BIG_SIZE,
        height: BIG_SIZE,
      }
    : {
        left: seatRect.left,
        top: seatRect.top,
        width: seatRect.width,
        height: seatRect.height,
      };

  const vignetteStyle = {
    ['--cx' as string]: `${seatCx}px`,
    ['--cy' as string]: `${seatCy}px`,
  } as CSSProperties;

  const vignetteVisible = phase !== 'zoomOut';
  const isSpinning = phase === 'spin';
  const revealMode: 'bang' | 'click' | null =
    phase === 'reveal' ? (isShot ? 'bang' : 'click') : null;

  // Match the wrapper's pixel size so the cylinder fills its host.
  const cylinderSize = zoomedIn ? BIG_SIZE : Math.min(seatRect.width, seatRect.height);

  return createPortal(
    <>
      <div
        className={`roulette-vignette ${vignetteVisible ? '--visible' : ''}`}
        style={vignetteStyle}
        aria-hidden
      />
      <div className="roulette-big-cylinder" style={wrapperStyle} aria-hidden>
        <RevolverCylinder
          revolverLength={6}
          isAlive={true}
          size={cylinderSize}
          generic
          spinning={isSpinning}
          revealMode={revealMode}
        />
      </div>
    </>,
    document.body
  );
}
