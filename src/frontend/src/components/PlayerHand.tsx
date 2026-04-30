import { memo } from 'react';
import { PlayingCard } from './PlayingCard';
import { Avatar } from './Avatar';
import { RevolverCylinder } from './RevolverCylinder';
import { fan } from '../utils/fan';
import type { LiarCard, Player } from '../../../shared/types';

interface PlayerHandProps {
  player: Player;
  cards: LiarCard[];
  isMyTurn: boolean;
  isActive: boolean;
  selectedCards: number[];
  onToggle: (card: LiarCard) => void;
  playerIndex: number;
  registerCardRef?: (id: number) => (el: HTMLButtonElement | null) => void;
  leavingCardIds?: Set<number>;
  /**
   * When true, the seat cylinder is rendered with opacity:0 (kept in
   * the DOM so layout doesn't reflow and the seatRect stays valid for
   * the roulette overlay's flight-back).
   */
  cylinderHidden?: boolean;
  /**
   * When true, render the avatar/name as if the player were still alive
   * (no greyscale, no OUT tag, no eliminated border) even if the
   * underlying gameState reports `isAlive === false`. Used during the
   * roulette animation so elimination "lands" only after the bang.
   */
  suppressEliminated?: boolean;
  /**
   * Callback used by App.tsx to register the seat cylinder element so
   * it can be measured (getBoundingClientRect) when starting the
   * roulette zoom animation.
   */
  registerCylinderRef?: (playerId: string) => (el: HTMLDivElement | null) => void;
}

export const PlayerHand = memo(function PlayerHand({
  player,
  cards,
  isMyTurn,
  isActive,
  selectedCards,
  onToggle,
  playerIndex,
  registerCardRef,
  leavingCardIds,
  cylinderHidden,
  suppressEliminated,
  registerCylinderRef,
}: PlayerHandProps) {
  const isMe = playerIndex === 0;
  const eliminated = !player.isAlive && !suppressEliminated;

  const seatCls = [
    'parea',
    `position-${playerIndex}`,
    isActive ? '--active' : '',
    eliminated ? '--eliminated' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const identity = (
    <div className="parea__identity">
      <Avatar
        name={player.name}
        size={isMe ? 56 : 44}
        ready={player.ready}
        eliminated={eliminated}
      />
      <div className="parea__meta">
        <div className={`parea__name ${isMe ? '--me' : ''}`}>{player.name}</div>
        {eliminated && <div className="parea__out-tag">OUT</div>}
      </div>
      <div
        ref={registerCylinderRef ? registerCylinderRef(player.playerId) : undefined}
        style={{
          display: 'inline-flex',
          opacity: cylinderHidden ? 0 : 1,
          transition: 'opacity 200ms ease',
        }}
      >
        <RevolverCylinder
          revolverLength={player.revolver?.length ?? 6}
          isAlive={player.isAlive}
          size={isMe ? 52 : 44}
        />
      </div>
    </div>
  );

  return (
    <div className={seatCls}>
      {identity}
      <div className={`hand position-${playerIndex}`}>
        {cards?.map((card, i) => {
          const { rot, ty } = fan(i, cards.length);
          const faceUp = isMe && card.rank !== '?';
          const interactiveForMe = isMe && isMyTurn && card.rank !== '?';
          const leaving = leavingCardIds?.has(card.id) ?? false;
          return (
            <PlayingCard
              key={card.id}
              ref={registerCardRef ? registerCardRef(card.id) : undefined}
              card={card}
              faceUp={faceUp}
              style={{ transform: `rotate(${rot}deg) translateY(${ty}px)` }}
              selected={selectedCards.includes(card.id)}
              disabled={!interactiveForMe}
              onToggle={() => onToggle(card)}
              leaving={leaving}
            />
          );
        })}
      </div>
    </div>
  );
});
