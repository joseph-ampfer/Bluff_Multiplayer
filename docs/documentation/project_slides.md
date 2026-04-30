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

# Liar’s Deck
## Project overview (Marp)

ASE 285 — Individual project slides (hosted HTML)

**Joey Ampfer**

---

# Problem

Multiplayer games need **trusted rules** and **private cards**. Client-only logic invites cheating and leaks.

---

# Solution

- **Socket.IO** real-time sync  
- **Server-authoritative** dealing, turns, and Call Liar  
- **Partial state** to each client + session tokens  

---

# Stack

**React + Vite** · **Express + Socket.IO** · **MongoDB** (optional persistence)

---

<!-- _class: lead -->
<!-- _backgroundColor: #059669 -->
<!-- _color: white -->

# Project metrics

---

# Scope & completion

| Metric | Planned | Delivered |
| ------ | ------- | --------- |
| Features | 6 | **6** |
| Requirements (R1.1–R6.3) | 18 | **18** |

### Testing

Backend suites under **`src/backend/tests/`** — `gameLogic.test.js`, `socket.test.js`, `regression.test.js`

Requirements trace to acceptance scenarios in **`docs/requirements/`**

---

# Sprint burndown

### Sprint 1

| Metric | Planned | Completed | Burndown |
| ------ | ------- | --------- | -------- |
| Features | 3 | 3 | **100%** |
| Requirements | 9 | 9 | **100%** |

**Delivered:** F1 Lobby · F2 Dealing · F3 Turn-based play

### Sprint 2

| Metric | Planned | Completed | Burndown |
| ------ | ------- | --------- | -------- |
| Features | 3 | 3 | **100%** |
| Requirements | 9 | 9 | **100%** |

**Delivered:** F4 Bluff detection · F5 Hidden state / reconnect · F6 Persistence

---

<!-- _class: lead -->
<!-- _backgroundColor: #059669 -->
<!-- _color: white -->

# Lines of code

---

# Primary sources (line counts)

_Counts are primary application sources; totals drift as the codebase evolves._

**As of April 2026.**

| File | Lines | Role |
| ---- | ----- | ---- |
| `src/backend/app.ts` | 522 | Express, Socket.IO, rooms, Call Liar, sessions |
| `src/backend/gameLogic.ts` | 188 | Shuffle, deal, hide/show hands, rounds, roulette |
| `src/backend/mongoPersistence.ts` | 76 | MongoDB load / persist room snapshots |
| `src/backend/index.ts` | 18 | Server entry, graceful Mongo shutdown |
| `src/frontend/src/App.tsx` | 700 | React UI, lobby, game, Call Liar |
| `src/frontend/src/App.css` | 1243 | Layout and card styling |
| `src/frontend/src/socket.ts` | 9 | Socket.IO client |
| **Total** | **2756** | |

---

# Features delivered (F1–F6)

| ID | Feature |
| -- | ------- |
| **F1** | Matchmaking and lobby system |
| **F2** | Server-authoritative card dealing |
| **F3** | Turn-based gameplay and validation |
| **F4** | Bluff detection (Call BS / Call Liar) |
| **F5** | Hidden state and partial state views |
| **F6** | Session persistence and reconnection |

---

# Sprint highlights

### Sprint 1

- Scaffolding — Express, React + Vite, Socket.IO  
- Lobby (join, list, ready) and real-time events  
- Dealing, hidden hands, per-player views  
- Turn order, play UI, validation  

### Sprint 2

- Call Liar flow, truth check, penalties / rounds  
- Reconnect privacy (`tryRestoreSession`, hidden broadcasts)  
- MongoDB persistence and snapshot load  
- Graceful disconnect, regression tests, polish  

---

# Links & artifacts

| Resource | Location |
| -------- | -------- |
| GitHub repository | `https://github.com/joseph-ampfer/Bluff_Multiplayer` |
| Requirements | `docs/requirements/requirements.md` |
| Sprint 1 review (Marp) | `docs/presentation/sprint1_review.md` |
| Sprint 2 review (Marp) | `docs/presentation/sprint2_review.md` |
| GitHub Pages | Site root / docs index (see repo workflow) |

### Thank you

**Liar’s Deck** — real-time multiplayer bluffing card game
