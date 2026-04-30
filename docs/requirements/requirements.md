# Liar’s Deck — Requirements Specification

**Project:** Real-time multiplayer Liar’s Deck (BS)  
**Author:** Joey Ampfer  
**Repository:** [Bluff_Multiplayer](https://github.com/joseph-ampfer/Bluff_Multiplayer)

This document is the canonical requirements list for grading and traceability. Narrative context, architecture diagram, and sprint tables also appear in the root [README.md](../../README.md).

---

## 1. Scope and quality bar

The system shall provide a **server-authoritative** game: rules, hidden hands, and turn validation are enforced on the server; clients receive **partial state** appropriate to each player. Real-time sync uses **WebSockets** (Socket.IO). Optional **MongoDB** persistence restores room snapshots after server restart when configured.

Each requirement below includes a **measurable acceptance test** (observable behavior or automated test target).

---

## 2. Feature overview

| ID | Feature | Requirement IDs |
|----|---------|-----------------|
| F1 | Matchmaking and lobby | R1.1–R1.3 |
| F2 | Server-authoritative card dealing | R2.1–R2.3 |
| F3 | Turn-based gameplay and validation | R3.1–R3.3 |
| F4 | Bluff detection (Call Liar) | R4.1–R4.3 |
| F5 | Hidden state and partial views | R5.1–R5.3 |
| F6 | Session persistence and reconnection | R6.1–R6.3 |

**Totals:** 6 features, 18 requirements.

---

## 3. Requirements and acceptance criteria

### F1 — Matchmaking and lobby

| ID | User story | Acceptance test |
|----|------------|-----------------|
| R1.1 | As a player, I can create or join a game room | Create or join room → room id/name is established and joiners see the same room |
| R1.2 | As a player, I can see connected players in the lobby | Two clients in same room → both appear in the shared player list |
| R1.3 | As a player, I can ready up before the game starts | Toggle ready → all clients see updated ready state; game starts when policy is satisfied (e.g. all ready and minimum players) |

### F2 — Server-authoritative card dealing

| ID | User story | Acceptance test |
|----|------------|-----------------|
| R2.1 | As a player, I receive a private hand | After start → each player has a distinct hand delivered via server-side dealing |
| R2.2 | As a player, I cannot see opponents’ actual cards | Inspect broadcast payload → other hands are hidden (e.g. placeholder), not real ranks |
| R2.3 | As the system, I shuffle and deal fairly | New game → deck order differs from prior run (non-deterministic shuffle) |

### F3 — Turn-based gameplay

| ID | User story | Acceptance test |
|----|------------|-----------------|
| R3.1 | As a player, I only act on my turn | Out-of-turn play or call → server rejects with error |
| R3.2 | As a player, I can play cards and declare context consistent with rules | Legal play → pile/move updates and turn advances per rules |
| R3.3 | As the system, I enforce valid turn order | After a resolved turn step → `whosTurn` matches the next player in order |

### F4 — Bluff detection (Call Liar)

| ID | User story | Acceptance test |
|----|------------|-----------------|
| R4.1 | As a player, I can call Liar on the previous play when allowed | When `canCallLiar` → emit call → pile/cards revealed to room |
| R4.2 | As the system, I determine if the play matched the declared rank | Reveal path compares played ranks to declared rank (jokers wild per rules) |
| R4.3 | As the system, I apply penalties per rules | Wrong call vs right call → distinct outcomes (e.g. roulette / pile assignment per implementation) |

### F5 — Hidden state and partial views

| ID | User story | Acceptance test |
|----|------------|-----------------|
| R5.1 | As a player, I only receive data I am allowed to see | WS `gameState` payloads exclude other players’ real cards |
| R5.2 | As the system, I broadcast public updates to everyone | Play event → all clients see shared fields (pile size, declared rank, turn) update |
| R5.3 | As the system, I avoid leaking hands on reconnect | Reconnect with session recovery → opponents’ hands remain hidden in broadcasts |

### F6 — Session persistence and reconnection

| ID | User story | Acceptance test |
|----|------------|-----------------|
| R6.1 | As a player, I can reconnect to an ongoing session | Same session token after drop → room and role restored; `gameState` resynced |
| R6.2 | As the system, I persist game state across restarts | With persistence enabled → stop server, restart, reload → room snapshot restored |
| R6.3 | As the system, I handle disconnects safely | Abrupt disconnect mid-game → remaining players get consistent state (pause, remove, or safe advance per design); no corrupted room |

---

## 4. Implementation status (for burndown / rubric)

Status is assessed against the acceptance tests above and the current codebase (`src/backend`, `src/frontend`). Update this section when scope changes.

| ID | Status | Notes |
|----|--------|--------|
| R1.1–R1.3 | Met | `createRoom`, `joinRoom`, `setUsername`, `ready` |
| R2.1–R2.3 | Met | `dealCards`, `shuffleDeck`, `hideGameState`, `getHand` |
| R3.1–R3.3 | Met | `playCards` / turn checks; integration tests for R3.1 |
| R4.1–R4.3 | Met | `callLiar` handler; success/fail paths and roulette penalty |
| R5.1–R5.2 | Met | `hideGameState` on broadcasts |
| R5.3 | Met | Session restore + hidden broadcasts (`tryRestoreSession`) |
| R6.1 | Met | `sessionToken` + `tryRestoreSession`; Socket.IO recovery config |
| R6.2 | Met (conditional) | Full crash-recovery acceptance satisfied when `MONGODB_URI` is set and `mongoPersistence` loads/saves snapshots; without URI, in-memory only |
| R6.3 | Partial | `disconnecting` notifies room; explicit `leaveRoom` removes player. Abrupt disconnect during play may not fully match “pause or advance” until enhanced |

**Requirement counts:** 17 **Met** (including R6.2 as met when persistence is configured), 1 **Partial** (R6.3).

**Feature counts:** F1–F5 **complete** (all sub-requirements Met). F6 **partial** (R6.1–R6.2 met with configuration note; R6.3 partial).

---

## 5. Rubric B1 — summary metrics (copy to `individual_project_rubric.md`)

| Metric | Value |
|--------|--------|
| **Requirements document link** | Repository path: `docs/requirements/requirements.md` (this file) |
| **Planned features count** | **6** |
| **Completed features count (strict)** | **5** (F1–F5); F6 incomplete until R6.3 is fully satisfied |
| **Completed features count (lenient)** | **5.5** — treat as **5** or **6** per instructor guidance if partial feature credit is allowed |
| **Burndown — requirements** | **17 ÷ 18 ≈ 94.4%** (if R6.2 counted met with MongoDB); **16 ÷ 18 ≈ 88.9%** if R6.2 excluded without env |
| **Burndown — features (strict)** | **5 ÷ 6 ≈ 83.3%** |

Use the **strict** feature burndown unless your rubric expects requirement-level burndown; align the percentage you report with the definition your instructor uses.

---

## 6. Test traceability (high level)

| Layer | Role |
|-------|------|
| Unit | `gameLogic` — shuffle, deal, turn helpers, Liar resolution inputs |
| Integration | Socket tests — join, ready, play, `callLiar`, errors |
| Manual / acceptance | Multi-browser scenarios matching acceptance tests in §3 |

See `src/backend/tests/` for automated coverage.
