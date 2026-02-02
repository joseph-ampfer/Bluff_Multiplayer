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
## Real-Time Multiplayer Bluffing Card Game

**Project Plan Presentation (PPP)**

---

# Agenda

1. Developer Introduction
2. Problem Domain & Motivation
3. Our Solution
4. Features Overview
5. Requirements & Tests
6. Architecture
7. Burndown Metrics
8. Q&A

---

# Meet the Developer

| Member | Role | Features Assigned |
|--------|------|-------------------|
| *Your Name* | Sole Developer | All 6 Features (F1–F6) |

### Individual Project
A complete server-authoritative multiplayer game built solo

---

# The Problem

### Student multiplayer projects face critical limitations

- Most rely on **polling** instead of real-time communication
- **Client-side trust** leads to cheating vulnerabilities
- **Hidden information** is often exposed to all clients
- **Reconnection handling** is typically ignored
- **Authoritative rule enforcement** is missing

---

# Why It Matters

> Real-world multiplayer systems require server authority, hidden state, and reconnection support

### Current Approaches Fall Short:
- Simple shared state exposes hidden information
- REST polling creates poor user experience
- Client-side validation enables cheating
- No session recovery on disconnect

---

# Our Solution: Liar's Deck

A **server-authoritative multiplayer card game** with:

- Real-time WebSocket communication
- Server-enforced game rules and validation
- Hidden per-player state (private hands)
- Matchmaking and lobby system
- Session persistence and reconnection

**Goal:** Demonstrate production-ready multiplayer architecture

---

<!-- _class: lead -->
<!-- _backgroundColor: #991b1b -->
<!-- _color: white -->

# Features Overview

---

# Feature 1: Matchmaking and Lobby System
**Assigned to:** Individual Project (Solo)

| ID | User Story |
|----|------------|
| R1.1 | As a player, I should be able to create or join a game lobby |
| R1.2 | As a player, I should be able to see connected players in the lobby |
| R1.3 | As a player, I should be able to ready up before the game starts |

### Acceptance Tests:
- Create lobby → verify lobby ID is generated
- Join with 2 clients → verify both appear in list
- Toggle ready → verify state updates for all

---

# Feature 2: Server-Authoritative Card Dealing
**Assigned to:** Individual Project (Solo)

| ID | User Story |
|----|------------|
| R2.1 | As a player, I should receive a private hand of cards |
| R2.2 | As a player, I should not see other players' cards |
| R2.3 | As the system, I should shuffle and deal cards securely |

### Acceptance Tests:
- Start game → verify each player receives different hand
- Inspect client state → verify only hand size visible for others
- Restart game → verify card order changes

---

# Feature 3: Turn-Based Gameplay and Validation
**Assigned to:** Individual Project (Solo)

| ID | User Story |
|----|------------|
| R3.1 | As a player, I should only be able to act on my turn |
| R3.2 | As a player, I should be able to play cards and declare a rank |
| R3.3 | As the system, I should enforce valid turn progression |

### Acceptance Tests:
- Attempt action out of turn → verify server rejects
- Play cards + declare rank → verify pile size increases
- End turn → verify next player becomes active

---

# Feature 4: Bluff Detection (Call BS)
**Assigned to:** Individual Project (Solo)

| ID | User Story |
|----|------------|
| R4.1 | As a player, I should be able to call BS on the previous play |
| R4.2 | As the system, I should determine if the declaration was truthful |
| R4.3 | As the system, I should apply penalties correctly |

### Acceptance Tests:
- Click Call BS → verify pile is revealed
- Reveal pile → verify declared rank matches actual cards
- Resolve BS → verify correct player receives pile

---

# Feature 5: Hidden State and Partial State Views
**Assigned to:** Individual Project (Solo)

| ID | User Story |
|----|------------|
| R5.1 | As a player, I should only receive state data I am allowed to see |
| R5.2 | As the system, I should broadcast public state to all players |
| R5.3 | As the system, I should prevent information leaks on reconnect |

### Key Challenge: Server filters state per-player before broadcast!

---

# Feature 6: Session Persistence and Reconnection
**Assigned to:** Individual Project (Solo)

| ID | User Story |
|----|------------|
| R6.1 | As a player, I should be able to reconnect to an ongoing game |
| R6.2 | As the system, I should persist game state to the database |
| R6.3 | As the system, I should handle player disconnects gracefully |

### Acceptance Tests:
- Disconnect and rejoin → verify game state restored
- Crash server → restart → verify game resumes
- Disconnect player → verify game handles safely

---

<!-- _class: lead -->
<!-- _backgroundColor: #991b1b -->
<!-- _color: white -->

# Architecture

---

# System Architecture

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

### Key: All game logic runs server-side

---

# Data Model

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **Player** | Connected user in a session | id, socket_id, hand_size |
| **GameSession** | Active multiplayer game | id, players, current_turn, declared_rank, pile |
| **Card** | Individual card | suit, rank |
| **Lobby** | Pre-game waiting room | id, players, ready_states |

---

# Test Strategy

### Three Levels of Testing:

1. **Unit Tests**
   - Game logic, turn validation, BS resolution

2. **Integration Tests**
   - WebSocket event handling and state updates

3. **Acceptance Tests**
   - Full gameplay scenarios across multiple clients

Each requirement has a corresponding acceptance test.

---

<!-- _class: lead -->
<!-- _backgroundColor: #059669 -->
<!-- _color: white -->

# Burndown Metrics

---

# Project Metrics Summary

| Metric | Count |
|--------|-------|
| **Features** | 6 |
| **Requirements** | 18 |
| **Tests** | 18 |

### All features assigned to sole developer
Full-stack implementation including:
- Frontend (React)
- Backend (Express + WebSockets)
- Database (MongoDB)

---

# Requirements Breakdown by Feature

| Feature | Requirements | Tests |
|---------|--------------|-------|
| F1: Matchmaking & Lobby | 3 | 3 |
| F2: Card Dealing | 3 | 3 |
| F3: Turn-Based Gameplay | 3 | 3 |
| F4: Bluff Detection | 3 | 3 |
| F5: Hidden State Views | 3 | 3 |
| F6: Session Persistence | 3 | 3 |
| **Total** | **18** | **18** |

---

# Project Links

| Resource | Link |
|----------|------|
| GitHub Repository | *TBD* |
| Project Documentation | docs/ |
| Source Code | src/ |
| Tests | tests/ |
| Demo Video | *TBD* |

---

<!-- _class: lead -->
<!-- _backgroundColor: #dc2626 -->
<!-- _color: white -->

# Questions?

## Thank you!

### Liar's Deck
Real-Time Multiplayer Bluffing Card Game
