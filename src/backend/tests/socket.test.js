import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { io as ioc } from 'socket.io-client';
import { createApp } from '../app.js';

let httpServer, io, getGameState, resetGameState;
let clientSockets = [];

function connectClient() {
  const address = httpServer.address();
  const url = `http://localhost:${address.port}`;
  const socket = ioc(url, { forceNew: true, transports: ['websocket'] });
  clientSockets.push(socket);
  return socket;
}

function waitForEvent(socket, event) {
  return new Promise((resolve) => {
    socket.once(event, (data) => resolve(data));
  });
}

beforeEach((ctx) => {
  return new Promise((resolve) => {
    const app = createApp();
    httpServer = app.httpServer;
    io = app.io;
    getGameState = app.getGameState;
    resetGameState = app.resetGameState;
    httpServer.listen(0, () => resolve());
  });
});

afterEach(() => {
  return new Promise((resolve) => {
    clientSockets.forEach(s => { if (s.connected) s.disconnect(); });
    clientSockets = [];
    io.close(() => {
      httpServer.close(() => resolve());
    });
  });
});

async function joinPlayer(name) {
  const socket = connectClient();
  await waitForEvent(socket, 'connect');
  const gameStatePromise = waitForEvent(socket, 'gameState');
  socket.emit('join', name);
  const state = await gameStatePromise;
  return { socket, state };
}

async function joinAndReadyTwo() {
  const { socket: s1 } = await joinPlayer('Alice');
  const { socket: s2 } = await joinPlayer('Bob');

  const s1StatePromise = waitForEvent(s1, 'gameState');
  const s2StatePromise = waitForEvent(s2, 'gameState');
  s1.emit('ready');
  await s1StatePromise;
  await s2StatePromise;

  const s1FinalPromise = waitForEvent(s1, 'gameState');
  const s2FinalPromise = waitForEvent(s2, 'gameState');
  s2.emit('ready');
  const finalState1 = await s1FinalPromise;
  const finalState2 = await s2FinalPromise;

  return { s1, s2, finalState1, finalState2 };
}

// ─── F1: Matchmaking and Lobby ───────────────────────────────────────────────

describe('F1: Matchmaking and Lobby', () => {

  it('R1.1 — join adds player and broadcasts gameState', async () => {
    const { state } = await joinPlayer('Alice');
    expect(state.players).toHaveLength(1);
    expect(state.players[0].name).toBe('Alice');
    expect(state.players[0].ready).toBe(false);
  });

  it('R1.1 — duplicate name emits error', async () => {
    await joinPlayer('Alice');
    const s2 = connectClient();
    await waitForEvent(s2, 'connect');
    const errorPromise = waitForEvent(s2, 'error');
    s2.emit('join', 'Alice');
    const error = await errorPromise;
    expect(error).toBe('Player already exists');
  });

  it('R1.2 — two clients see each other in the player list', async () => {
    const { socket: s1 } = await joinPlayer('Alice');
    const s1UpdatePromise = waitForEvent(s1, 'gameState');
    const { state: s2State } = await joinPlayer('Bob');
    const s1State = await s1UpdatePromise;

    expect(s1State.players).toHaveLength(2);
    expect(s2State.players).toHaveLength(2);
    const names = s1State.players.map(p => p.name).sort();
    expect(names).toEqual(['Alice', 'Bob']);
  });

  it('R1.3 — ready updates state for all players', async () => {
    const { socket: s1 } = await joinPlayer('Alice');
    await joinPlayer('Bob');

    const s1UpdatePromise = waitForEvent(s1, 'gameState');
    s1.emit('ready');
    const updatedState = await s1UpdatePromise;

    const alice = updatedState.players.find(p => p.name === 'Alice');
    expect(alice.ready).toBe(true);
  });

  it('R1.3 — game does NOT start with only one player ready', async () => {
    const { socket: s1 } = await joinPlayer('Alice');
    await joinPlayer('Bob');

    const statePromise = waitForEvent(s1, 'gameState');
    s1.emit('ready');
    const state = await statePromise;

    expect(state.gameStarted).toBe(false);
  });
});

// ─── F2: Server-Authoritative Card Dealing ───────────────────────────────────

describe('F2: Server-Authoritative Card Dealing', () => {

  it('R2.1 — game starts when all players ready; gameStarted becomes true', async () => {
    const { finalState1 } = await joinAndReadyTwo();
    expect(finalState1.gameStarted).toBe(true);
  });

  it('R2.1 — declaredRank is set on game start', async () => {
    const { finalState1 } = await joinAndReadyTwo();
    expect(['king', 'queen', 'ace']).toContain(finalState1.declaredRank);
  });

  it('R2.2 — broadcast gameState hides all hands', async () => {
    const { finalState1 } = await joinAndReadyTwo();
    finalState1.players.forEach(p => {
      p.hand.forEach(card => {
        expect(card.id).toBe(-1);
        expect(card.rank).toBe('?');
      });
    });
  });

  it('R2.1 — getHand returns real cards for requesting player', async () => {
    const { s1 } = await joinAndReadyTwo();
    const handPromise = waitForEvent(s1, 'getHand');
    s1.emit('getHand');
    const handState = await handPromise;

    const alice = handState.players.find(p => p.name === 'Alice');
    expect(alice.hand).toHaveLength(5);
    alice.hand.forEach(card => {
      expect(card.id).toBeGreaterThanOrEqual(0);
      expect(['king', 'queen', 'ace', 'joker']).toContain(card.rank);
    });
  });

  it('R2.2 — getHand hides other players\' hands', async () => {
    const { s1 } = await joinAndReadyTwo();
    const handPromise = waitForEvent(s1, 'getHand');
    s1.emit('getHand');
    const handState = await handPromise;

    const bob = handState.players.find(p => p.name === 'Bob');
    bob.hand.forEach(card => {
      expect(card.id).toBe(-1);
      expect(card.rank).toBe('?');
    });
  });

  it('R2.3 — each player has 5 cards with valid IDs', async () => {
    const { s1, s2 } = await joinAndReadyTwo();
    const hand1Promise = waitForEvent(s1, 'getHand');
    s1.emit('getHand');
    const hand1State = await hand1Promise;

    const hand2Promise = waitForEvent(s2, 'getHand');
    s2.emit('getHand');
    const hand2State = await hand2Promise;

    const aliceHand = hand1State.players.find(p => p.name === 'Alice').hand;
    const bobHand = hand2State.players.find(p => p.name === 'Bob').hand;

    expect(aliceHand).toHaveLength(5);
    expect(bobHand).toHaveLength(5);

    const allIds = [...aliceHand.map(c => c.id), ...bobHand.map(c => c.id)];
    expect(new Set(allIds).size).toBe(10);
  });
});

// ─── F3: Turn-Based Gameplay and Validation ──────────────────────────────────

describe('F3: Turn-Based Gameplay and Validation', () => {

  it('R3.1 — playCards from wrong player emits error', async () => {
    const { s1, s2, finalState1 } = await joinAndReadyTwo();

    const firstPlayer = finalState1.whosTurn.name;
    const wrongSocket = firstPlayer === 'Alice' ? s2 : s1;

    const errorPromise = waitForEvent(wrongSocket, 'error');
    wrongSocket.emit('playCards', [0]);
    const error = await errorPromise;
    expect(error).toBe('Not your turn');
  });

  it('R3.2 — playCards with valid cards removes them and advances turn', async () => {
    const { s1, s2, finalState1 } = await joinAndReadyTwo();

    const firstPlayer = finalState1.whosTurn.name;
    const activeSocket = firstPlayer === 'Alice' ? s1 : s2;

    const handPromise = waitForEvent(activeSocket, 'getHand');
    activeSocket.emit('getHand');
    const handState = await handPromise;

    const myHand = handState.players.find(p => p.name === firstPlayer).hand;
    const cardToPlay = myHand[0].id;

    const statePromise = waitForEvent(activeSocket, 'gameState');
    activeSocket.emit('playCards', [cardToPlay]);
    const newState = await statePromise;

    expect(newState.whosTurn.name).not.toBe(firstPlayer);
  });

  it('R3.2 — playCards with card not in hand emits error', async () => {
    const { s1, s2, finalState1 } = await joinAndReadyTwo();

    const firstPlayer = finalState1.whosTurn.name;
    const activeSocket = firstPlayer === 'Alice' ? s1 : s2;

    const errorPromise = waitForEvent(activeSocket, 'error');
    activeSocket.emit('playCards', [999]);
    const error = await errorPromise;
    expect(error).toBe('Card not in hand');
  });

  it('R3.3 — turn advances to next player after a move', async () => {
    const { s1, s2, finalState1 } = await joinAndReadyTwo();

    const firstPlayer = finalState1.whosTurn.name;
    const secondPlayer = firstPlayer === 'Alice' ? 'Bob' : 'Alice';
    const activeSocket = firstPlayer === 'Alice' ? s1 : s2;

    const handPromise = waitForEvent(activeSocket, 'getHand');
    activeSocket.emit('getHand');
    const handState = await handPromise;

    const myHand = handState.players.find(p => p.name === firstPlayer).hand;

    const statePromise = waitForEvent(activeSocket, 'gameState');
    activeSocket.emit('playCards', [myHand[0].id]);
    const newState = await statePromise;

    expect(newState.whosTurn.name).toBe(secondPlayer);
  });

  it('R3.1 — move from wrong player emits error', async () => {
    const { s1, s2, finalState1 } = await joinAndReadyTwo();

    const firstPlayer = finalState1.whosTurn.name;
    const wrongSocket = firstPlayer === 'Alice' ? s2 : s1;

    const errorPromise = waitForEvent(wrongSocket, 'error');
    wrongSocket.emit('move', 'king');
    const error = await errorPromise;
    expect(error).toBe('Not your turn');
  });

  it('R3.3 — multiple turns rotate correctly', async () => {
    const { s1, s2, finalState1 } = await joinAndReadyTwo();

    const firstPlayer = finalState1.whosTurn.name;
    const activeSocket = firstPlayer === 'Alice' ? s1 : s2;
    const otherSocket = firstPlayer === 'Alice' ? s2 : s1;
    const secondPlayer = firstPlayer === 'Alice' ? 'Bob' : 'Alice';

    // First player plays a card
    const hand1Promise = waitForEvent(activeSocket, 'getHand');
    activeSocket.emit('getHand');
    const hand1 = await hand1Promise;
    const card1 = hand1.players.find(p => p.name === firstPlayer).hand[0].id;

    const state1Promise = waitForEvent(otherSocket, 'gameState');
    activeSocket.emit('playCards', [card1]);
    await state1Promise;

    // Second player plays a card
    const hand2Promise = waitForEvent(otherSocket, 'getHand');
    otherSocket.emit('getHand');
    const hand2 = await hand2Promise;
    const card2 = hand2.players.find(p => p.name === secondPlayer).hand[0].id;

    const state2Promise = waitForEvent(activeSocket, 'gameState');
    otherSocket.emit('playCards', [card2]);
    const finalState = await state2Promise;

    expect(finalState.whosTurn.name).toBe(firstPlayer);
  });
});
