---
marp: true
theme: default
paginate: true
backgroundColor: #fff
style: |
  section { font-family: 'Segoe UI', Arial, sans-serif; }
  h1 { color: #dc2626; }
  h2 { color: #991b1b; }
---

<!-- _class: lead -->

# Liar’s Deck
## Project overview (Marp)

ASE 285 — Individual project slides (hosted HTML)

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

# Status

Six features **F1–F6** with requirements through **R6.3** — see repo **docs/requirements** and GitHub **tests**.

---

# Links

- **Repo:** github.com/joseph-ampfer/Bluff_Multiplayer  
- **Project page:** GitHub Pages site root (index)  

Joey Ampfer
