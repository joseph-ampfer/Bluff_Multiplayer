import { describe, it, expect } from 'vitest';
import {
  LIAR_DECK,
  shuffleDeck,
  dealCards,
  hideGameState,
  createGameState,
} from '../gameLogic.js';

describe('Regression: shuffle must not corrupt catalog or mutate LIAR_DECK', () => {
  it('still yields exactly 20 cards with the canonical rank mix', () => {
    const deck = shuffleDeck(LIAR_DECK);
    const counts = { king: 0, queen: 0, ace: 0, joker: 0 };
    deck.forEach(card => counts[card.rank]++);
    expect(deck).toHaveLength(20);
    expect(counts).toEqual({ king: 6, queen: 6, ace: 6, joker: 2 });
  });

  it('leaves LIAR_DECK unchanged so concurrent games cannot poison the source', () => {
    const snapshot = JSON.stringify(LIAR_DECK);
    shuffleDeck(LIAR_DECK);
    expect(JSON.stringify(LIAR_DECK)).toBe(snapshot);
  });
});

describe('Regression: deal must partition the deck with no duplicate card IDs', () => {
  it('assigns each physical card to at most one player hand', () => {
    const players = [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }];
    dealCards(players, LIAR_DECK);
    const allIds = players.flatMap(p => p.hand.map(c => c.id));
    expect(new Set(allIds).size).toBe(allIds.length);
    expect(allIds).toHaveLength(20);
  });
});

describe('Regression: hidden broadcast state must not leak real ranks', () => {
  it('masks every card rank and id for stolen-information regression', () => {
    const state = createGameState();
    state.players = [
      { name: 'Spy', hand: [{ id: 0, rank: 'king' }, { id: 1, rank: 'ace' }] },
      { name: 'Victim', hand: [{ id: 2, rank: 'queen' }] },
    ];
    const hidden = hideGameState(state);
    hidden.players.forEach(p => {
      p.hand.forEach(card => {
        expect(card.rank).toBe('?');
        expect(card.id).toBe(-1);
      });
    });
  });
});
