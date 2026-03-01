# Sprint 1 Plan — Liar's Deck

## Sprint Goal

Implement the core game loop: lobby system, server-authoritative card dealing, and turn-based gameplay with validation.

## Duration

Sprint 1 (Weeks 1–4)

---

## Features and Requirements

### Feature 1: Matchmaking and Lobby System

| ID   | Requirement                                                         | Status    |
| ---- | ------------------------------------------------------------------- | --------- |
| R1.1 | As a player, I should be able to create or join a game lobby        | Completed |
| R1.2 | As a player, I should be able to see connected players in the lobby | Completed |
| R1.3 | As a player, I should be able to ready up before the game starts    | Completed |

**Implementation:** `socket.on('join')` handler creates player objects and broadcasts updated game state. `socket.on('ready')` toggles ready state; game starts when all players are ready. Frontend provides name input, Join Room button, Ready button, and player list display.

---

### Feature 2: Server-Authoritative Card Dealing

| ID   | Requirement                                                 | Status    |
| ---- | ----------------------------------------------------------- | --------- |
| R2.1 | As a player, I should receive a private hand of cards       | Completed |
| R2.2 | As a player, I should not see other players' cards          | Completed |
| R2.3 | As the system, I should shuffle and deal cards securely     | Completed |

**Implementation:** `shuffleDeck()` uses Fisher-Yates shuffle. `dealCards()` distributes 5 cards per player from the shuffled 20-card Liar deck (6 kings, 6 queens, 6 aces, 2 jokers). `hideGameState()` replaces all hands with `{ id: -1, rank: '?' }` before broadcasting; `getHand` event sends each player their real hand privately.

---

### Feature 3: Turn-Based Gameplay and Validation

| ID   | Requirement                                                        | Status    |
| ---- | ------------------------------------------------------------------ | --------- |
| R3.1 | As a player, I should only be able to act on my turn               | Completed |
| R3.2 | As a player, I should be able to play cards and declare a rank     | Completed |
| R3.3 | As the system, I should enforce valid turn progression             | Completed |

**Implementation:** `whosTurn` check in `move` and `playCards` handlers rejects out-of-turn actions. Frontend disables action buttons when it is not the player's turn. Turn advances via `gameState.players[(gameState.moves.length % gameState.players.length)]`. `playCards` validates card ownership before removing cards from the player's hand.

---

## Burndown Summary

| Metric                | Planned | Completed | Burndown |
| --------------------- | ------- | --------- | -------- |
| Features              | 3       | 3         | 100%     |
| Requirements          | 9       | 9         | 100%     |

## Lines of Code

| File                         | Lines | Description                              |
| ---------------------------- | ----- | ---------------------------------------- |
| `src/backend/index.js`       | 286   | Express server, Socket.IO, game engine   |
| `src/frontend/src/App.tsx`   | 245   | React UI, game state, card components    |
| `src/frontend/src/App.css`   | 108   | Game styling, playing card components    |
| `src/frontend/src/socket.ts` | 7     | Socket.IO client configuration           |
| **Total**                    | **646** |                                        |

## Additional Work Beyond Sprint Scope

The following requirements from Feature 5 (Hidden State and Partial State Views) were completed as a natural part of implementing Features 2 and 3:

- **R5.1** — Players only receive state data they are allowed to see (`hideGameState()`)
- **R5.2** — System broadcasts public state updates to all players (`io.to(ROOM_NAME).emit(...)`)

These will be formally tracked under Sprint 2 alongside R5.3.
