import { describe, it, expect } from 'vitest';
import {
  liarDeck,
  tableRanks,
  createGameState,
  shuffleDeck,
  dealCards,
  hideGameState,
} from '../gameLogic.js';

describe('shuffleDeck', () => {
  it('returns exactly 20 cards', () => {
    const deck = shuffleDeck(liarDeck);
    expect(deck).toHaveLength(20);
  });

  it('contains correct rank distribution (6K, 6Q, 6A, 2J)', () => {
    const deck = shuffleDeck(liarDeck);
    const counts = { king: 0, queen: 0, ace: 0, joker: 0 };
    deck.forEach(card => counts[card.rank]++);
    expect(counts).toEqual({ king: 6, queen: 6, ace: 6, joker: 2 });
  });

  it('preserves all unique card IDs', () => {
    const deck = shuffleDeck(liarDeck);
    const ids = deck.map(c => c.id).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 20 }, (_, i) => i));
  });

  it('does not mutate the original deck', () => {
    const original = JSON.parse(JSON.stringify(liarDeck));
    shuffleDeck(liarDeck);
    expect(liarDeck).toEqual(original);
  });

  it('produces a different order from the input (not identical)', () => {
    let diffFound = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      const deck = shuffleDeck(liarDeck);
      if (JSON.stringify(deck) !== JSON.stringify(liarDeck)) {
        diffFound = true;
        break;
      }
    }
    expect(diffFound).toBe(true);
  });
});

describe('dealCards', () => {
  it('gives each player exactly 5 cards', () => {
    const players = [{ name: 'A' }, { name: 'B' }];
    dealCards(players, liarDeck);
    players.forEach(p => expect(p.hand).toHaveLength(5));
  });

  it('deals no duplicate card IDs across all hands', () => {
    const players = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];
    dealCards(players, liarDeck);
    const allIds = players.flatMap(p => p.hand.map(c => c.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('works for 4 players (max)', () => {
    const players = [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }];
    dealCards(players, liarDeck);
    players.forEach(p => expect(p.hand).toHaveLength(5));
    const allIds = players.flatMap(p => p.hand.map(c => c.id));
    expect(new Set(allIds).size).toBe(20);
  });

  it('each card has a valid id and rank', () => {
    const players = [{ name: 'A' }, { name: 'B' }];
    dealCards(players, liarDeck);
    const validRanks = ['king', 'queen', 'ace', 'joker'];
    players.forEach(p => {
      p.hand.forEach(card => {
        expect(card.id).toBeGreaterThanOrEqual(0);
        expect(validRanks).toContain(card.rank);
      });
    });
  });
});

describe('hideGameState', () => {
  it('replaces all hands with hidden cards', () => {
    const state = createGameState();
    state.players = [
      { name: 'A', hand: [{ id: 0, rank: 'king' }, { id: 1, rank: 'queen' }] },
      { name: 'B', hand: [{ id: 2, rank: 'ace' }] },
    ];
    const hidden = hideGameState(state);
    hidden.players.forEach(p => {
      p.hand.forEach(card => {
        expect(card.id).toBe(-1);
        expect(card.rank).toBe('?');
      });
    });
  });

  it('preserves the correct number of cards per player', () => {
    const state = createGameState();
    state.players = [
      { name: 'A', hand: [{ id: 0, rank: 'king' }, { id: 1, rank: 'queen' }] },
      { name: 'B', hand: [{ id: 2, rank: 'ace' }] },
    ];
    const hidden = hideGameState(state);
    expect(hidden.players[0].hand).toHaveLength(2);
    expect(hidden.players[1].hand).toHaveLength(1);
  });

  it('does not mutate the original game state', () => {
    const state = createGameState();
    state.players = [
      { name: 'A', hand: [{ id: 0, rank: 'king' }] },
    ];
    hideGameState(state);
    expect(state.players[0].hand[0].rank).toBe('king');
    expect(state.players[0].hand[0].id).toBe(0);
  });

  it('preserves non-hand fields', () => {
    const state = createGameState();
    state.gameStarted = true;
    state.declaredRank = 'ace';
    state.players = [
      { name: 'Alice', ready: true, hand: [{ id: 0, rank: 'king' }] },
    ];
    const hidden = hideGameState(state);
    expect(hidden.gameStarted).toBe(true);
    expect(hidden.declaredRank).toBe('ace');
    expect(hidden.players[0].name).toBe('Alice');
    expect(hidden.players[0].ready).toBe(true);
  });

  it('handles players with no hand (undefined)', () => {
    const state = createGameState();
    state.players = [{ name: 'A' }];
    const hidden = hideGameState(state);
    expect(hidden.players[0].hand).toBeUndefined();
  });
});

describe('createGameState', () => {
  it('returns correct default shape', () => {
    const state = createGameState();
    expect(state.players).toEqual([]);
    expect(state.maxPlayers).toBe(4);
    expect(state.gameStarted).toBe(false);
    expect(state.whosTurn).toBeNull();
    expect(state.declaredRank).toBeNull();
    expect(state.moves).toEqual([]);
  });

  it('returns a new object each call', () => {
    const a = createGameState();
    const b = createGameState();
    expect(a).not.toBe(b);
    a.players.push({ name: 'test' });
    expect(b.players).toHaveLength(0);
  });
});

describe('tableRanks', () => {
  it('contains king, queen, ace', () => {
    expect(tableRanks).toEqual(['king', 'queen', 'ace']);
  });
});
