import { forwardRef, type CSSProperties } from 'react';
import type { LiarCard, Rank } from '../../../shared/types';
import '../App.css';

interface PlayingCardProps {
  card: LiarCard;
  faceUp: boolean;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
  style?: CSSProperties;
  played?: boolean;
  position?: string;
  className?: string;
  leaving?: boolean;
}

const RANK_META: Record<Rank, { center: string; corner: string; centerClass: string }> = {
  king: { center: '\u2654', corner: 'K', centerClass: 'card-face__center --king' },
  queen: { center: '\u269C', corner: 'Q', centerClass: 'card-face__center --queen' },
  ace: { center: 'A', corner: 'A', centerClass: 'card-face__center --ace' },
  joker: { center: '\u2605', corner: 'Joker', centerClass: 'card-face__center --joker' },
};

function CardFront({ card }: { card: LiarCard }) {
  if (card.rank === '?') {
    // Should not normally render front-side for an unknown card; render a blank face.
    return <div className="card-face card-face--front" aria-hidden="true" />;
  }
  const meta = RANK_META[card.rank];
  return (
    <div className="card-face card-face--front">
      <span className="card-face__pip card-face__pip--tl">{meta.corner}</span>
      <span className={meta.centerClass}>{meta.center}</span>
      <span className="card-face__pip card-face__pip--br">{meta.corner}</span>
    </div>
  );
}

function CardBack() {
  return (
    <div className="card-face card-face--back" aria-hidden="true">
      <div className="card-face__back-pattern" />
      <div className="card-face__back-emblem">L</div>
    </div>
  );
}

export const PlayingCard = forwardRef<HTMLButtonElement, PlayingCardProps>(
  ({ card, faceUp, selected, disabled, onToggle, style, played, position, className, leaving }, ref) => {
    const interactive = !disabled && !played && !leaving && faceUp;
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || played || leaving}
        className={[
          'playing-card',
          faceUp ? '--face-up' : '--face-down',
          interactive ? '--interactive' : '',
          position ?? '',
          played ? 'played' : '',
          selected ? 'selected' : '',
          disabled ? 'disabled' : '',
          leaving ? 'playing-card--leaving' : '',
          className ?? '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={style}
        onClick={onToggle}
        aria-hidden={leaving ? true : undefined}
        aria-label={faceUp && card.rank !== '?' ? `${card.rank}` : 'Face-down card'}
      >
        <div className="playing-card__inner">
          <CardFront card={card} />
          <CardBack />
        </div>
      </button>
    );
  }
);

PlayingCard.displayName = 'PlayingCard';
