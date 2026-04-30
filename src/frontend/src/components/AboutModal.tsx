import { useEffect } from 'react';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

interface Credit {
  label: string;
  source: string;
}

// Placeholder attribution block. Fill in once the actual sound files
// are finalized — keep the same shape so the layout stays stable.
const AUDIO_CREDITS: Credit[] = [
  { label: 'Card flick / deal / select', source: 'TBD' },
  { label: 'Button click', source: 'TBD' },
  { label: 'Turn bell', source: 'TBD' },
  { label: 'Liar call / top-deck reveal', source: 'TBD' },
  { label: 'Empty chamber (click)', source: 'TBD' },
  { label: 'Gunshot (bang)', source: 'TBD' },
  { label: 'Win sting', source: 'TBD' },
  { label: 'Saloon piano loop', source: 'TBD' },
];

export function AboutModal({ open, onClose }: AboutModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="about-backdrop"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
    >
      <div className="panel about-panel">
        <button
          type="button"
          className="about-panel__close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <h2 className="lobby__title" id="about-title" style={{ fontSize: 28 }}>
          Liar&apos;s Deck
        </h2>
        <div className="lobby__subtitle">Bluff. Call. Survive.</div>

        <div className="panel__divider" />

        <p className="about-panel__blurb">
          A multiplayer bluffing game of nerve and luck. Each round one rank is
          called; declare your hand, lie if you must, and pray the chamber is
          empty when someone calls you out.
        </p>

        <div className="panel__divider" />

        <div className="about-panel__section-label">Audio Credits</div>
        <dl className="about-panel__credits">
          {AUDIO_CREDITS.map(c => (
            <div className="about-panel__credit-row" key={c.label}>
              <dt>{c.label}</dt>
              <dd>{c.source}</dd>
            </div>
          ))}
        </dl>

        <div className="about-panel__footer">Best on desktop.</div>
      </div>
    </div>
  );
}
