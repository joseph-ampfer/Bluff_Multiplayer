---
marp: true
theme: default
paginate: true
backgroundColor: #fff
style: |
  section { font-family: 'Segoe UI', Arial, sans-serif; }
  h1 { color: #1e3a5f; }
  h2 { color: #2563eb; }
  code { font-size: 0.85em; }
---

# Liar’s Deck
## User Manual

**Bluff_Multiplayer** — real-time multiplayer (desktop)

---

# Prerequisites

- **Node.js** (LTS recommended) and **npm**
- Two terminal windows for local play (server + client)
- Modern desktop browser (Chrome / Edge / Firefox)

**Optional:** MongoDB Atlas or local MongoDB for room persistence after server restart (`MONGODB_URI` in backend `.env`).

---

# Install and run

### 1. Backend (port 3000)

```bash
cd src/backend
npm install
npm run dev
```

Or production build: `npm run build && npm start`

Default URL: `http://localhost:3000` (Socket.IO + Express).

---

# Install and run (cont.)

### 2. Frontend (port 5173)

```bash
cd src/frontend
npm install
npm run dev
```

Open **http://localhost:5173** in the browser.

The app connects to `http://localhost:3000` (see `src/frontend/src/socket.ts`). Change the URL there if the server runs elsewhere.

---

# Lobby: create or join

1. Enter a **room code** (any non-empty string, max 32 characters).
2. **Create Room** — creates that room if it does not already exist.
3. **Join Room** — join an existing room (must exist, not full, game not started).

Errors (e.g. room full, wrong name) appear as **toasts** in the corner.

---

# Room: name and ready

After joining:

1. Note the **Room Code**; use **Copy** to share with friends.
2. Enter **Your name** and click **Set Name** (max 20 characters).
3. When everyone is named, click **Ready Up**.

**Start condition:** At least **two** players in the room and **every** player must be ready. Then the server deals cards and revolvers and the game begins.

**Leave** returns you to the lobby and clears local session UI.

---

# Playing the game

- **Declared rank:** A random table rank (King, Queen, or Ace) applies to the round; you play Liar cards onto the pile.
- **Your turn:** Select one or more cards in your hand, then **Play Cards**. Only the active player can play.
- **Call Liar:** When it is your turn and **Call Liar** is available, you may challenge the **previous** play. The pile is revealed; a roulette-style outcome may eliminate a player.
- Opponents see **hidden** hands (`?`); you only see your real cards after the server sends your hand via **getHand**.

---

# Session and reconnect

- On create/join, the server issues a **session token** stored in `localStorage` as `sessionToken`.
- The Socket.IO client sends this token on connect; the server can **restore** your room and player when possible.
- Short disconnects are helped by Socket.IO **connection state recovery** (server configured with a recovery window).

If you see stale UI, refresh after ensuring the backend is running.

---

# Optional: MongoDB persistence

Set in **`src/backend/.env`** (create if missing):

```env
MONGODB_URI=mongodb+srv://...
```

When configured, room snapshots are saved to database **`LiarsDeck`**, collection **`gameRooms`**. If `MONGODB_URI` is unset, the game runs fully in memory.

---

# Troubleshooting

| Issue | What to try |
|-------|-------------|
| Cannot connect | Start backend first; check firewall; URL in `socket.ts` matches server. |
| “Not your turn” / errors | Wait for your turn; toasts show server messages. |
| Game won’t start | Need **2+** players and **all** ready. |
| CORS errors | Backend allows `http://localhost:5173` for Socket.IO. |

---

# Repository

**https://github.com/joseph-ampfer/Bluff_Multiplayer**

Joey Ampfer — NKU ASE 285 Individual Project
