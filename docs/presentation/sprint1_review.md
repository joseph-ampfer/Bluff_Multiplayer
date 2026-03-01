---
marp: true
theme: default
paginate: true
backgroundColor: #fff
style: |
  section {
    font-family: 'Segoe UI', Arial, sans-serif;
  }
  h1 {
    color: #dc2626;
  }
  h2 {
    color: #991b1b;
  }
  table {
    font-size: 0.8em;
  }
  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
---

<!-- _class: lead -->
<!-- _backgroundColor: #dc2626 -->
<!-- _color: white -->

# Liar's Deck
## Sprint 1 Review

**Joey Ampfer**
Individual Project — ASE 285

---

# Agenda

1. Sprint 1 Goal
2. Demo Recap — Features Delivered
3. Sprint 1 Metrics & Burndown
4. Lines of Code Breakdown
5. Weekly Progress
6. Retrospective
7. Sprint 2 Goals & Timeline
8. Q&A

---

# Sprint 1 Goal

> Implement the core game loop: lobby system, server-authoritative card dealing, and turn-based gameplay with validation.

### Scope
- 3 features planned (F1, F2, F3)
- 9 requirements planned (R1.1–R1.3, R2.1–R2.3, R3.1–R3.3)

---

<!-- _class: lead -->
<!-- _backgroundColor: #991b1b -->
<!-- _color: white -->

# Demo Recap

---

# Feature 1: Matchmaking and Lobby System

| ID   | Requirement                                    | Status |
| ---- | ---------------------------------------------- | ------ |
| R1.1 | Create or join a game lobby                    | Done   |
| R1.2 | See connected players in the lobby             | Done   |
| R1.3 | Ready up before the game starts                | Done   |

### How it works
- Players enter a name and click **Join Room**
- Player list updates in real time via Socket.IO
- Game starts when all players click **Ready**

---

# Feature 2: Server-Authoritative Card Dealing

| ID   | Requirement                              | Status |
| ---- | ---------------------------------------- | ------ |
| R2.1 | Receive a private hand of cards          | Done   |
| R2.2 | Cannot see other players' cards          | Done   |
| R2.3 | Shuffle and deal cards securely          | Done   |

### How it works
- `shuffleDeck()` — Fisher-Yates shuffle on 20-card Liar deck
- `dealCards()` — distributes 5 cards per player
- `hideGameState()` — replaces other players' hands with `?` before broadcast

---

# Feature 3: Turn-Based Gameplay and Validation

| ID   | Requirement                                  | Status |
| ---- | -------------------------------------------- | ------ |
| R3.1 | Only act on my turn                          | Done   |
| R3.2 | Play cards and declare a rank                | Done   |
| R3.3 | Enforce valid turn progression               | Done   |

### How it works
- Server checks `whosTurn` before accepting any action
- Frontend disables buttons when it is not the player's turn
- Turn advances via `moves.length % players.length`

---

<!-- _class: lead -->
<!-- _backgroundColor: #059669 -->
<!-- _color: white -->

# Sprint 1 Metrics

---

# Burndown Summary

| Metric       | Planned | Completed | Burndown |
| ------------ | ------- | --------- | -------- |
| Features     | 3       | 3         | **100%** |
| Requirements | 9       | 9         | **100%** |

### Additional overflow work completed
- **R5.1** — Players only receive state data they are allowed to see
- **R5.2** — System broadcasts public state updates to all players

These will be formally tracked in Sprint 2 alongside R5.3.

---

# Lines of Code Breakdown

| File                         | Lines | Description                            |
| ---------------------------- | ----- | -------------------------------------- |
| `src/backend/index.js`       | 286   | Express server, Socket.IO, game engine |
| `src/frontend/src/App.tsx`   | 245   | React UI, game state, card components  |
| `src/frontend/src/App.css`   | 108   | Game styling, playing card components  |
| `src/frontend/src/socket.ts` | 7     | Socket.IO client configuration         |
| **Total**                    | **~646** |                                     |

---

# Weekly Progress

| Week | Work Completed |
| ---- | -------------- |
| 1    | Project scaffolding — Express backend, React + Vite frontend, Socket.IO wiring |
| 2    | Lobby system (join, player list, ready up) and basic WebSocket event flow |
| 3    | Card dealing, shuffle logic, hidden state filtering, per-player hand delivery |
| 4    | Turn-based gameplay, card selection/play UI, turn validation, game reset |

---

<!-- _class: lead -->
<!-- _backgroundColor: #991b1b -->
<!-- _color: white -->

# Retrospective

---

# What Went Wrong

- Started late
- Writing tests was deferred to after features were implemented
- Core features finished, but UI styling is lacking

---

# What Went Well

- Core game loop (lobby, dealing, turn-based play) is fully functional end-to-end
- Real-time multiplayer works reliably with Socket.IO and connection state recovery
- Server-authoritative hidden state keeps player hands private using `hideGameState()`

---

# Analysis & Improvement Plan

- Start work early
- Add tests alongside feature development in Sprint 2 instead of deferring until after features are complete
- Prioritize the BS/bluff detection feature (F4) early in Sprint 2 since it is the core mechanic

---

<!-- _class: lead -->
<!-- _backgroundColor: #059669 -->
<!-- _color: white -->

# Sprint 2 Planning

---

# Sprint 2 Goals

| Feature | Description |
| ------- | ----------- |
| **F4: Bluff Detection** | Call BS button, pile reveal, truthfulness check, penalty resolution |
| **F5: Hidden State Views** | Complete reconnect privacy (R5.3); R5.1 and R5.2 already done |
| **F6: Session Persistence** | MongoDB game state storage, reconnection, graceful disconnect handling |

### Metrics
- Features planned: **3**
- Requirements planned: **9** (7 truly new, 2 already implemented)

---

# Sprint 2 Timeline

| Week | Plan |
| ---- | ---- |
| 1    | Implement Call BS button, pile reveal logic, truthfulness check (R4.1, R4.2) |
| 2    | BS penalty resolution (R4.3), hidden state on reconnect (R5.3) |
| 3    | MongoDB integration for game session persistence (R6.1, R6.2) |
| 4    | Graceful disconnect handling (R6.3), write tests, polish UI |

### Key milestone
- **Week 2** — Call BS fully working
- **Week 4** — All 6 features complete with tests

---

# Project Links

| Resource              | Link                                                 |
| --------------------- | ---------------------------------------------------- |
| GitHub Repository     | https://github.com/joseph-ampfer/Bluff_Multiplayer   |
| Project Documentation | `docs/`                                              |
| Source Code           | `src/`                                               |
| Sprint 1 Plan        | `docs/sprints/sprint1.md`                            |
| Sprint 1 Review      | `docs/presentation/sprint1_review.md`                |

---

<!-- _class: lead -->
<!-- _backgroundColor: #dc2626 -->
<!-- _color: white -->

# Questions?

## Thank you!

### Liar's Deck
Real-Time Multiplayer Bluffing Card Game
