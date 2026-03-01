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
