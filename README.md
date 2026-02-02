# Liar’s Deck – Real-Time Multiplayer Bluffing Card Game

A real-time, server-authoritative multiplayer implementation of the classic bluffing card game *BS (Liar’s Deck)*, built to demonstrate WebSocket-based state synchronization, hidden per-player state, matchmaking, and reconnect-safe game sessions.

---

## Problem Domain and Motivation

### The Problem

Most student multiplayer projects rely on polling, client-side trust, or simple shared state. These approaches break down when dealing with hidden information, reconnections, or authoritative rule enforcement—core challenges in real-world multiplayer systems.

### Why It Matters

* Multiplayer systems must prevent cheating and information leakage
* Hidden state requires server-side authority and partial data views
* Real-time interaction requires WebSockets, not REST polling
* Reconnection handling is essential for long-running sessions

### The Solution

Liar’s Deck is a real-time multiplayer card game where all game logic, validation, and hidden state are enforced on the server. Clients communicate exclusively through structured WebSocket events, receiving filtered state views appropriate to each player. The system includes matchmaking, lobby management, turn-based gameplay, and persistent session recovery using MongoDB.

---

## Features and Requirements

### Feature 1: Matchmaking and Lobby System

**Assigned to:** Individual Project (Solo)

| ID   | User Story                                                          | Acceptance Test                                                            |
| ---- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| R1.1 | As a player, I should be able to create or join a game lobby        | Create lobby → verify lobby ID is generated and visible to joining players |
| R1.2 | As a player, I should be able to see connected players in the lobby | Join lobby with 2 clients → verify both players appear in lobby list       |
| R1.3 | As a player, I should be able to ready up before the game starts    | Toggle ready → verify ready state updates for all players                  |

---

### Feature 2: Server-Authoritative Card Dealing

**Assigned to:** Individual Project (Solo)

| ID   | User Story                                              | Acceptance Test                                                           |
| ---- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| R2.1 | As a player, I should receive a private hand of cards   | Start game → verify each player receives a different hand                 |
| R2.2 | As a player, I should not see other players’ cards      | Inspect client state → verify only hand size is visible for other players |
| R2.3 | As the system, I should shuffle and deal cards securely | Restart game → verify card order changes between games                    |

---

### Feature 3: Turn-Based Gameplay and Validation

**Assigned to:** Individual Project (Solo)

| ID   | User Story                                                     | Acceptance Test                                           |
| ---- | -------------------------------------------------------------- | --------------------------------------------------------- |
| R3.1 | As a player, I should only be able to act on my turn           | Attempt action out of turn → verify server rejects action |
| R3.2 | As a player, I should be able to play cards and declare a rank | Play cards + declare rank → verify pile size increases    |
| R3.3 | As the system, I should enforce valid turn progression         | End turn → verify next player becomes active              |

---

### Feature 4: Bluff Detection (Call BS)

**Assigned to:** Individual Project (Solo)

| ID   | User Story                                                        | Acceptance Test                                         |
| ---- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| R4.1 | As a player, I should be able to call BS on the previous play     | Click Call BS → verify pile is revealed                 |
| R4.2 | As the system, I should determine if the declaration was truthful | Reveal pile → verify declared rank matches actual cards |
| R4.3 | As the system, I should apply penalties correctly                 | Resolve BS → verify correct player receives pile        |

---

### Feature 5: Hidden State and Partial State Views

**Assigned to:** Individual Project (Solo)

| ID   | User Story                                                            | Acceptance Test                                                 |
| ---- | --------------------------------------------------------------------- | --------------------------------------------------------------- |
| R5.1 | As a player, I should only receive state data I am allowed to see     | Inspect WebSocket payload → verify opponent cards are hidden    |
| R5.2 | As the system, I should broadcast public state updates to all players | Play action → verify pile size and declared rank update for all |
| R5.3 | As the system, I should prevent information leaks on reconnect        | Reconnect mid-game → verify hand data is still private          |

---

### Feature 6: Session Persistence and Reconnection

**Assigned to:** Individual Project (Solo)

| ID   | User Story                                                    | Acceptance Test                                           |
| ---- | ------------------------------------------------------------- | --------------------------------------------------------- |
| R6.1 | As a player, I should be able to reconnect to an ongoing game | Disconnect and rejoin → verify game state is restored     |
| R6.2 | As the system, I should persist game state to the database    | Crash server → restart → verify game resumes correctly    |
| R6.3 | As the system, I should handle player disconnects gracefully  | Disconnect player → verify game pauses or advances safely |

---

## Data Model and Architecture

### System Architecture

```
┌─────────────────┐     WebSockets     ┌─────────────────┐
│                 │◀────────────────▶│                 │
│   React Client  │                   │  Express Server │
│                 │◀────────────────▶│  (Game Engine)  │
└─────────────────┘                   └─────────────────┘
                                              │
                                              ▼
                                       ┌─────────────────┐
                                       │   MongoDB       │
                                       │ (Game Sessions) │
                                       └─────────────────┘
```

---

### Core Data Entities

| Entity      | Description                 | Key Fields                                     |
| ----------- | --------------------------- | ---------------------------------------------- |
| Player      | Connected user in a session | id, socket_id, hand_size                       |
| GameSession | Active multiplayer game     | id, players, current_turn, declared_rank, pile |
| Card        | Individual card             | suit, rank                                     |
| Lobby       | Pre-game waiting room       | id, players, ready_states                      |

---

## Tests

### Test Strategy

Each requirement includes a direct acceptance test. Testing will include:

* **Unit Tests**: Game logic, turn validation, BS resolution
* **Integration Tests**: WebSocket event handling and state updates
* **Acceptance Tests**: Full gameplay scenarios across multiple clients

### Burndown Metrics

| Metric       | Count |
| ------------ | ----- |
| Features     | 6     |
| Requirements | 18    |
| Tests        | 18    |

---

## Developer Information

| Name        | Role           |
| ----------- | -------------- |
| *Your Name* | Sole Developer |

---

## Links

| Resource              | Link               |
| --------------------- | ------------------ |
| GitHub Repository     | *TBD*              |
| Project Documentation | [docs/](./docs/)   |
| Source Code           | [src/](./src/)     |
| Tests                 | [tests/](./tests/) |
| Demo Video            | *TBD*              |

---


