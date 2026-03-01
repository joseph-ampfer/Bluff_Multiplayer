import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { tableRanks, liarDeck, ROOM_NAME, createGameState, hideGameState, dealCards } from './gameLogic.js';

dotenv.config();

export function createApp() {
  const app = express();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:5173',
    },
    connectionStateRecovery: {
      // the backup duration of the sessions and the packets
      maxDisconnectionDuration: 2 * 60 * 1000,
      // whether to skip middlewares upon successful recovery
      skipMiddlewares: true,
    }
  });

  // Middleware
  app.use(cors()); // Enable CORS for React frontend
  app.use(express.json()); // Parse JSON bodies from API requests
  app.use(express.urlencoded({ extended: true }));
  // app.use('/public', express.static('public'));



  // // Initialize database connection
  // await connectDB();

  // type Player = {
  //   name: string;
  //   ready: boolean;
  //   hand: string[];
  // }

  // type TableRank = 'king' | 'queen' | 'ace';
  // type Rank = TableRank | 'joker';

  // type GameState = {
  //   players: Player[];
  //   maxPlayers: number;
  //   gameStarted: boolean;
  //   whosTurn: Player | null;
  //   declaredRank: TableRank | null;
  //   moves: Record<Player['name'], Rank>[];
  // }

  let gameState = createGameState();


  app.get('/', (req, res) => {
    res.send('Hello World!')
  })

  io.on('connection', (socket) => {
    if (socket.recovered) {
      // recovery was successful: socket.id, socket.rooms and socket.data were restored
      console.log('User recovered connection', socket.id);
    }

    console.log(`User connected: ${socket.id}`);
    io.emit("hello", { 3: ["4"], 5: Buffer.from([6]) });

    socket.join(ROOM_NAME);

    socket.on('foo', (data) => {
      console.log('foo event received', data);
      socket.to(ROOM_NAME).emit('foo', data); // same as broadcast but to a specific room
    });
  
    socket.on('count', (count) => {
      io.to(ROOM_NAME).emit('count', count);
    });

    socket.on('disconnecting', (reason) => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit('user has left', socket.id);
        }
      }
    });

    socket.on('join', (name) => {
      if (gameState.players.some(player => player.name === name)) {
        socket.emit('error', 'Player already exists');
        console.log('player already exists', name);
        return;
      }

      const player = {
        socketId: socket.id,
        name,
        ready: false
      };

      gameState.players.push(player);
      // reference the player object to the socket,
      // references the same object in memory, updates
      // to socket.data.player will update the player object in gameState
      socket.data.player = player;

      const hiddenHandsGameState = hideGameState(gameState);
      io.to(ROOM_NAME).emit('gameState', hiddenHandsGameState);
    });

    socket.on('ready', (name) => {
      socket.data.player.ready = true;

      if (gameState.players.length > 1 && gameState.players.every(player => player.ready)) {
        gameState.gameStarted = true;
        gameState.whosTurn = gameState.players[0];
        gameState.declaredRank = tableRanks[Math.floor(Math.random() * tableRanks.length)];
        console.log('whos turn', gameState.whosTurn?.name);
        
        // deal cards to players
        dealCards(gameState.players, liarDeck);
        
        const hiddenHandsGameState = hideGameState(gameState);
        io.to(ROOM_NAME).emit('gameState', hiddenHandsGameState);
      } else {
        const hiddenHandsGameState = hideGameState(gameState);
        io.to(ROOM_NAME).emit('gameState', hiddenHandsGameState);
      }
    });

    socket.on('move', ( rank) => {
      if (gameState.whosTurn !== socket.data.player) {
        console.log('not your turn', socket.data.player.name, gameState.whosTurn?.name);
        socket.emit('error', 'Not your turn');
        return;
      }

      gameState.moves.push({ player: socket.data.player.name, rank });
      gameState.whosTurn = gameState.players[(gameState.moves.length % gameState.players.length)];
      
      const hiddenHandsGameState = hideGameState(gameState);
      io.to(ROOM_NAME).emit('gameState', hiddenHandsGameState);
    });

    socket.on('resetGame', () => {
      gameState = createGameState();
      io.to(ROOM_NAME).emit('resetGame');
    });

    socket.on('getHand', () => {
      if (!gameState.gameStarted) {
        socket.emit('error', 'Game not started');
        return;
      }
      if (!gameState.players.some(player => player === socket.data.player)) {
        socket.emit('error', 'Player not found');
        return;
      }
      
      let playerHandGameState = structuredClone(gameState);
      playerHandGameState.players.forEach(player => {
        player.hand = player.hand.map(() => ({ id: -1, rank: '?' }));
      });
      
      let player = socket.data.player;
      const realHand = playerHandGameState.players.find(player => player.socketId === socket.data.player.socketId).hand = player.hand;
      
      console.log('player', player);
      console.log('playerHandGameState', realHand);
      socket.emit('getHand', playerHandGameState);
    });

    socket.on('playCards', (cardIds) => {
      if (gameState.whosTurn !== socket.data.player) {
        console.log('not your turn', socket.data.player.name, gameState.whosTurn?.name);
        socket.emit('error', 'Not your turn');
        return;
      }
      if (cardIds.some(cardId => cardId < 0)) {
        console.log('invalid card id', cardIds);
        socket.emit('error', 'Invalid card id');
        return;
      }
      // check if they are playing valid cards
      for (const cardId of cardIds) {
        if (!socket.data.player.hand.some(card => card.id === cardId)) {
          console.log('card not in hand', cardId);
          socket.emit('error', 'Card not in hand');
          return;
        }
      }

      // remove cards from player's hand
      socket.data.player.hand = socket.data.player.hand.filter(card => !cardIds.includes(card.id));

      gameState.moves.push({ player: socket.data.player.name, cardIds });
      gameState.whosTurn = gameState.players[(gameState.moves.length % gameState.players.length)];
      io.to(ROOM_NAME).emit('playCards', socket.data.player.name, cardIds.length)

      const hiddenHandsGameState = hideGameState(gameState);
      io.to(ROOM_NAME).emit('gameState', hiddenHandsGameState);
    });

  });

  return {
    app,
    httpServer,
    io,
    getGameState: () => gameState,
    resetGameState: () => { gameState = createGameState(); },
  };
}