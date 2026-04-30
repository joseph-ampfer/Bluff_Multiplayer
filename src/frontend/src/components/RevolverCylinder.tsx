import type { CSSProperties } from 'react';

interface RevolverCylinderProps {
  revolverLength: number;
  isAlive: boolean;
  size?: number;
  className?: string;
  /**
   * If true, render a featureless steel cylinder (no glyphs, no spent dim,
   * no lethal red) regardless of `revolverLength`/`isAlive`. Used by the
   * Phase 5 roulette overlay so the spinning cylinder looks identical
   * across players.
   */
  generic?: boolean;
  /** Adds the .--spinning class so the keyframe animation runs. */
  spinning?: boolean;
  /**
   * Reveal styling for the generic/big cylinder:
   *   'bang'  -> chamber 0 flashes red + cylinder pulses
   *   'click' -> small soft pulse, no red
   * Ignored for non-generic (seat) cylinders.
   */
  revealMode?: 'bang' | 'click' | null;
}

/**
 * Static visual of a 6-shot revolver cylinder, derived purely from
 * `revolver.length` and `isAlive`. No backend payload changes required.
 *
 *   chambersUsed = 6 - revolverLength
 *   slots [0 .. chambersUsed - 1]   -> spent (hollow / dim metal)
 *   slot   chambersUsed - 1         -> lethal red, if !isAlive
 *   slots [chambersUsed .. 5]       -> unrevealed (?)
 *
 * In `generic` mode the derivation is skipped and all six chambers render
 * as featureless steel — used by the roulette zoom + spin theater so the
 * dramatic moment doesn't leak per-player progress.
 */
export function RevolverCylinder({
  revolverLength,
  isAlive,
  size = 44,
  className,
  generic = false,
  spinning = false,
  revealMode = null,
}: RevolverCylinderProps) {
  const clampedLength = Math.max(0, Math.min(6, revolverLength));
  const chambersUsed = 6 - clampedLength;

  const containerStyle: CSSProperties = {
    width: size,
    height: size,
  };

  const containerClass = [
    'cylinder',
    generic ? '--generic' : '',
    spinning ? '--spinning' : '',
    revealMode === 'bang' ? '--bang' : '',
    revealMode === 'click' ? '--click' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const ariaLabel = generic
    ? 'Revolver cylinder'
    : `Revolver: ${clampedLength} of 6 chambers remaining`;

  return (
    <div className={containerClass} style={containerStyle} aria-label={ariaLabel}>
      <div className="cylinder__hub" />
      {Array.from({ length: 6 }, (_, i) => {
        const isSpent = !generic && i < chambersUsed;
        const isLethal =
          !generic && !isAlive && i === chambersUsed - 1 && chambersUsed > 0;
        const chamberClass = generic
          ? 'chamber generic'
          : isLethal
            ? 'chamber spent --lethal'
            : isSpent
              ? 'chamber spent'
              : 'chamber unrevealed';

        // Each chamber sits on a circle; rotate the slot into place, then
        // counter-rotate the inner content so glyphs read upright.
        const angle = i * 60;
        const orbit = size * 0.32;
        const chamberSize = size * 0.3;

        return (
          <div
            key={i}
            className={chamberClass}
            style={{
              width: chamberSize,
              height: chamberSize,
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${orbit}px) rotate(${-angle}deg)`,
            }}
          >
            <span className="chamber__glyph">
              {generic ? '' : isLethal ? '\u25CF' : isSpent ? '' : '?'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
