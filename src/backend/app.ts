import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server } from 'socket.io';
import type {Socket} from 'socket.io'
import { createServer } from 'http';
import crypto from 'crypto';
import { TABLE_RANKS, LIAR_DECK, ROOM_NAME, createGameState, hideGameState, dealCards, showCurrentPlayerHand, dealRevolver, playRoulette, newRound, getFirstPlayerOfNewRound, getNextPlayerInTurnOrder, createPlayer, resetGameState } from './gameLogic.js';
import type { Player, Rank, LiarCard, ServerState, SessionByToken } from '../shared/types.js';



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


  const gameState2 = createGameState();
  const serverState: ServerState = {
    gameRooms: {},
  };
  serverState.gameRooms[ROOM_NAME] = gameState2;
  const sessionByToken: SessionByToken = {};
  
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

    // define function to try and restore session
    function tryRestoreSession(socket: Socket) {
      if (socket.handshake.auth.sessionToken) {
        const session = sessionByToken[socket.handshake.auth.sessionToken];
        if (!session) {
          return;
        }
        if (!serverState.gameRooms[session.roomName]) {
          return;
        }
  
        const gameState = serverState.gameRooms[session.roomName];
        const player = gameState.players.find(player => player.playerId === session.playerId);
        
        if (!player) {
          return;
        }
        socket.data.player = player;
        socket.data.roomName = session.roomName;
        socket.join(session.roomName);
        socket.emit('roomJoined', session.roomName);
        if (player.name !== '') {
          socket.emit('usernameSet', player.name);
        }
        const hiddenHandsGameState = hideGameState(gameState);
        io.to(session.roomName).emit('gameState', hiddenHandsGameState);
      }
    }

    // try to restore session
    tryRestoreSession(socket);

    // create room creates a new room, a new player object, and starts a session for you
    socket.on('createRoom', (roomName: string) => {
      console.log('create room event received', roomName);
      roomName = roomName.trim();
      if (roomName === '') {
        socket.emit('error', 'Room name cannot be empty');
        return;
      }
      if (serverState.gameRooms[roomName]) {
        socket.emit('error', 'Room already exists');
        return;
      }
      const newGameState = createGameState();
      // add the player to the game state, but with no name yet
      const playerId = crypto.randomUUID();
      const player = createPlayer(socket.id, playerId, ""); 
      newGameState.players.push(player);
      // start a session for the player
      const sessionToken = crypto.randomBytes(32).toString('hex'); 
      sessionByToken[sessionToken] = { playerId, roomName };
      socket.emit('sessionToken', sessionToken);
      // reference the player object to the socket,
      // references the same object in memory, updates
      // to socket.data.player will update the player object in gameState
      socket.data.player = player; 
      socket.data.roomName = roomName;
      serverState.gameRooms[roomName] = newGameState;
      socket.join(roomName);
      socket.emit('roomCreated', roomName);

      const hiddenHandsGameState = hideGameState(newGameState);
      io.to(roomName).emit('gameState', hiddenHandsGameState);
    });

    // join room creates your player object and starts a session for you
    socket.on('joinRoom', (roomName: string) => {
      roomName = roomName.trim();
      if (roomName === '') {
        socket.emit('error', 'Room name cannot be empty');
        return;
      }
      if (!serverState.gameRooms[roomName]) {
        socket.emit('error', 'Room not found');
        return;
      }
      const gameState = serverState.gameRooms[roomName];
      if (!gameState) {
        socket.emit('error', 'Room not found');
        return;
      }
      if (gameState.players.length >= 4) {
        socket.emit('error', 'Room is full');
        return;
      }
      if (gameState.moves.length > 0) {
        socket.emit('error', 'Game already started');
        return;
      }
      if (gameState.players.some(player => player.socketId === socket.id)) {
        socket.emit('error', 'You are already in this room');
        return;
      }
      // add the player to the game state, but with no name yet
      const playerId = crypto.randomUUID();
      const player = createPlayer(socket.id, playerId, ""); 
      gameState.players.push(player);
      // start a session for the player
      const sessionToken = crypto.randomBytes(32).toString('hex'); 
      sessionByToken[sessionToken] = { playerId, roomName };
      socket.emit('sessionToken', sessionToken);
      // reference the player object to the socket,
      // references the same object in memory, updates
      // to socket.data.player will update the player object in gameState
      socket.data.player = player; 
      socket.data.roomName = roomName;
      socket.join(roomName);
      socket.emit('roomJoined', roomName);
      const hiddenHandsGameState = hideGameState(gameState);
      io.to(roomName).emit('gameState', hiddenHandsGameState);
    });

    socket.on('setUsername', (name: string, roomName: string) => {
      name = name.trim();
      if (name === '') {
        socket.emit('error', 'Username cannot be empty');
        return;
      }
      if (!serverState.gameRooms[roomName]) {
        socket.emit('error', 'Room not found');
        return;
      }
      const gameState = serverState.gameRooms[roomName];
      if (!gameState) {
        socket.emit('error', 'Room not found');
        return;
      }
      if (gameState.players.some(player => player.name === name)) {
        socket.emit('error', 'Username already exists');
        return;
      }
      socket.data.player.name = name;
      
      socket.emit('usernameSet', name);

      const hiddenHandsGameState = hideGameState(gameState);
      io.to(roomName).emit('gameState', hiddenHandsGameState);
    });

    socket.on('leaveRoom', (roomName: string) => {
      roomName = roomName.trim();

      socket.leave(roomName);
      socket.emit('roomLeft', roomName);
      socket.emit('clearState');

      const gameState = serverState.gameRooms[roomName];
      if (!gameState) {
        console.log('room not found', roomName);
        return;
      }
      // Remove the player from the game state
      gameState.players = gameState.players.filter(player => player.playerId !== socket.data.player.playerId);
      delete sessionByToken[socket.handshake.auth.sessionToken];
      socket.data.player = null;

      // Send the updated game state to the room, the player will be removed
      const hiddenHandsGameState = hideGameState(gameState);
      io.to(roomName).emit('gameState', hiddenHandsGameState);

      console.log(`number of players in room ${roomName}: ${gameState.players.length}`);

      // If the room is empty, delete the room
      if (gameState.players.length === 0) {
        delete serverState.gameRooms[roomName];
        console.log('room removed from server state', roomName);
      }

    });

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

    // socket.on('join', (name: string) => {
    //   if (gameState.players.some(player => player.name === name)) {
    //     socket.emit('error', 'Player already exists');
    //     console.log('player already exists', name);
    //     return;
    //   }

    //   const player: Player = createPlayer(socket.id, name);

    //   gameState.players.push(player);
    //   // reference the player object to the socket,
    //   // references the same object in memory, updates
    //   // to socket.data.player will update the player object in gameState
    //   socket.data.player = player;

    //   const hiddenHandsGameState = hideGameState(gameState);
    //   io.to(ROOM_NAME).emit('gameState', hiddenHandsGameState);
    // });

    socket.on('ready', () => {
      socket.data.player.ready = true;
      const gameState = serverState.gameRooms[socket.data.roomName];
      if (!gameState) {
        socket.emit('error', 'Game state not found for room: ' + socket.data.roomName);
        return;
      } 
      if (gameState.gameStarted) {
        socket.emit('error', 'Game already started');
        return;
      }

      if (gameState.players.length > 1 && gameState.players.every(player => player.ready)) {
        gameState.gameStarted = true;
        gameState.whosTurn = { name: gameState.players[0].name, playerId: gameState.players[0].playerId, canCallLiar: false };
        gameState.declaredRank = TABLE_RANKS[Math.floor(Math.random() * TABLE_RANKS.length)];
        console.log('whos turn', gameState.whosTurn?.name);
        
        // deal cards to players
        dealCards(gameState.players, LIAR_DECK);

        // deal revolver to players
        dealRevolver(gameState.players);
        
        const hiddenHandsGameState = hideGameState(gameState);
        io.to(socket.data.roomName).emit('gameState', hiddenHandsGameState);
      } else {
        const hiddenHandsGameState = hideGameState(gameState);
        io.to(socket.data.roomName).emit('gameState', hiddenHandsGameState);
      }
    });


    socket.on('resetGame', () => {
      if (!serverState.gameRooms[socket.data.roomName]) {
        socket.emit('error', 'Game state not found for room: ' + socket.data.roomName);
        return;
      }
      serverState.gameRooms[socket.data.roomName] = createGameState();
      io.to(socket.data.roomName).emit('resetGame');
    });

    socket.on('getHand', () => {
      const gameState = serverState.gameRooms[socket.data.roomName];
      if (!gameState) {
        socket.emit('error', 'Game state not found for room: ' + socket.data.roomName);
        return;
      }
      if (!gameState.gameStarted) {
        socket.emit('error', 'Game not started');
        return;
      }
      if (!gameState.players.some(player => player.playerId === socket.data.player.playerId)) {
        socket.emit('error', 'Player not found');
        return;
      }
      
      const playerHandGameState = showCurrentPlayerHand(gameState, socket);
      
      socket.emit('getHand', playerHandGameState);
    });

    socket.on('playCards', (cardIds: number[]) => {
      const gameState = serverState.gameRooms[socket.data.roomName];
      if (!gameState) {
        socket.emit('error', 'Game state not found for room: ' + socket.data.roomName);
        return;
      }
      if (gameState.whosTurn.playerId !== socket.data.player.playerId) {
        console.log('not your turn', socket.data.player.playerId, gameState.whosTurn?.playerId);
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
        if (!socket.data.player.hand.some((card: { id: number }) => card.id === cardId)) {
          console.log('card not in hand', cardId);
          socket.emit('error', 'Card not in hand');
          return;
        }
      }

      // remove cards from player's hand
      socket.data.player.hand = socket.data.player.hand.filter(
        (card: { id: number }) => !cardIds.includes(card.id)
      );

      gameState.moves.push({ player: socket.data.player.name, cardIds });
      const player = getNextPlayerInTurnOrder(socket.data.player, gameState);
      if (!player) {
        console.log('no player found');
        socket.emit('error', 'No player found');
        return;
      }
      gameState.whosTurn = { name: player.name, playerId: player.playerId, canCallLiar: gameState.moves.length > 0 };
      io.to(socket.data.roomName).emit('playCards', socket.data.player.name, cardIds.length)

      const hiddenHandsGameState = hideGameState(gameState);
      io.to(socket.data.roomName).emit('gameState', hiddenHandsGameState); 
    });

    socket.on('callLiar', () => {
      const gameState = serverState.gameRooms[socket.data.roomName];
      if (gameState.whosTurn.playerId !== socket.data.player.playerId) {
        console.log('not your turn', socket.data.player.name, gameState.whosTurn?.name);
        socket.emit('error', 'Not your turn');
        return;
      }
      if (gameState.moves.length === 0) {
        console.log('no moves to call liar');
        socket.emit('error', 'No moves to call liar');
        return;
      }
      if (!gameState.whosTurn.canCallLiar) {
        console.log('not allowed to call liar');
        socket.emit('error', 'Not allowed to call liar');
        return;
      }

      // check if the cards played are valid
      const lastMove = gameState.moves[gameState.moves.length - 1];
      const lastCardIds = lastMove.cardIds;
      if (!lastCardIds) {
        console.log('last card ids not found', lastMove);
        socket.emit('error', 'Last card ids not found');
        return;
      }
      const playedCards: LiarCard[] = LIAR_DECK.filter(card => lastCardIds.includes(card.id));
      const lastMovePlayer = gameState.players.find(player => player.name === lastMove.player);
      if (!lastMovePlayer) {
        console.log('last move player not found', lastMove.player);
        socket.emit('error', 'Last move player not found');
        return;
      }

      let PlayedRoulettePlayer: Player;
      
      // CHECK IF THEY CALLED LIAR CORRECTLY
      if (playedCards.every(card => card.rank === gameState.declaredRank || card.rank === 'joker')) {
        console.log('cards played are valid, UNSUCCESSFULLY called liar');
        // Liar = current caller: plays roulette with revolver
        PlayedRoulettePlayer = socket.data.player;
        const isShot = playRoulette(socket.data.player);
        if (isShot) {
          socket.data.player.isAlive = false;
        }

        // return with unsuccessful call of liar, the playedCards to display,
        // and state of playing roulette. UI will do cinematic roulette.
        io.to(socket.data.roomName).emit('callLiar', 'unsuccessful', socket.data.player.name, playedCards, isShot);
      }
      else {
        console.log('cards played are invalid, SUCCESSFULLY called liar');
        // Liar = Last move player: plays roulette with revolver
        PlayedRoulettePlayer = lastMovePlayer;
        const isShot = playRoulette(lastMovePlayer);
        if (isShot) {
          lastMovePlayer.isAlive = false;
        }

        // return with successfull call of liar, the playedCards to display,
        // and state of playing roulette. UI will do cinematic roulette.
        io.to(socket.data.roomName).emit('callLiar', 'success', lastMove.player, playedCards, isShot);
      }

      // Eliminated players skip their turns until the end of the game.

      /*
      If all but 1 player have been eliminated, 
      the game ends with the remaining player winning the game and all other players losing the game. 
      Otherwise, a new round starts. 
      The first player of that new round is assigned to the player that got caught playing a Liar last round, 
      or the player that incorrectly called "LIAR" last round otherwise. 
      If that player has just been eliminated, 
      the next non-eliminated player in turn order must start the new round instead.
      */
      
      if (gameState.players.filter(player => player.isAlive).length === 1) {
        console.log('GAME OVER, only one player is alive');
        // game ends, only one player is alive
        const winner = gameState.players.find(player => player.isAlive);
        if (!winner) {
          console.log('winner not found');
          socket.emit('error', 'Winner not found');
          return;
        }
        resetGameState(gameState);
        //serverState.gameRooms[socket.data.roomName] = createGameState();
        io.to(socket.data.roomName).emit('gameEnd', winner.name);
        io.to(socket.data.roomName).emit('gameState', gameState);
      }
      else {
        console.log('new round starts');

        // new round starts
       /*The first player of that new round is assigned to the player that got caught playing a Liar last round,
        or the player that incorrectly called "LIAR" last round otherwise. 
        If that player has just been eliminated, 
        the next non-eliminated player in turn order must start the new round instead.*/
        
        try {
          newRound(PlayedRoulettePlayer, lastMovePlayer, gameState);
        } catch (error) {
          console.log('error starting new round', error);
          socket.emit('error', 'Error starting new round: ' + error);
          return;
        }
        const hiddenHandsGameState = hideGameState(gameState);
        io.to(socket.data.roomName).emit('gameState', hiddenHandsGameState);
      }
     
    });

  });

  return {
    app,
    httpServer,
    io,
    getGameState: () => serverState.gameRooms[ROOM_NAME],
    resetGameState: () => { serverState.gameRooms[ROOM_NAME] = createGameState(); },
  };
}