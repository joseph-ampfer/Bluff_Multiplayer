import { Socket } from 'socket.io';
import { LiarCard, RevolverCard, TableRank, GameState, Player } from '../shared/types.js';

// 1 Table card deck, containing 1 King, 1 Queen and 1 Ace.
// The table card is revealed to all players at the start of the game.
export const TABLE_RANKS: TableRank[] = ['king', 'queen', 'ace'];


// 1 Liar card deck, containing 6 Kings, 6 Queens, 6 Aces and 2 Jokers.
export const LIAR_DECK: LiarCard[] = [
  { id: 0,  rank: 'king' },  { id: 1,  rank: 'king' },
  { id: 2,  rank: 'king' },  { id: 3,  rank: 'king' },
  { id: 4,  rank: 'king' },  { id: 5,  rank: 'king' },
  { id: 6,  rank: 'queen' }, { id: 7,  rank: 'queen' },
  { id: 8,  rank: 'queen' }, { id: 9,  rank: 'queen' },
  { id: 10, rank: 'queen' }, { id: 11, rank: 'queen' },
  { id: 12, rank: 'ace' },   { id: 13, rank: 'ace' },
  { id: 14, rank: 'ace' },   { id: 15, rank: 'ace' },
  { id: 16, rank: 'ace' },   { id: 17, rank: 'ace' },
  { id: 18, rank: 'joker' }, { id: 19, rank: 'joker' },
];


// Each player gets a revolver with 6 chambers
// The revolver is loaded with 1 lethal and 5 non-lethal bullets
export const REVOLVER_DECK: RevolverCard[] = [
  { type: 'lethal', used: false, id: 0 },
  { type: 'non-lethal', used: false, id: 1 },
  { type: 'non-lethal', used: false, id: 2 },
  { type: 'non-lethal', used: false, id: 3 },
  { type: 'non-lethal', used: false, id: 4 },
  { type: 'non-lethal', used: false, id: 5 },
];

// The room name is the name of the room that the players are in.
// TODO: Players can start new rooms and join existing rooms
export const ROOM_NAME = 'Test Room';

// Create new player
export function createPlayer(socketId: string, playerId: string, name: string): Player {
  return {
    socketId,
    playerId,
    name,
    ready: false,
    hand: [],
    revolver: [],
    isAlive: true,
  };
}

// Create default game state
export function createGameState(): GameState {
  let gameState: GameState = {
    players: [],
    maxPlayers: 4,
    gameStarted: false,
    whosTurn: { name: '', playerId: '', canCallLiar: false },
    declaredRank: null,
    moves: [],
  };
  return gameState;
};

// Hide the hands of all players in the game state
export function hideGameState(gameState: GameState): GameState {
  const hiddenHandsGameState = structuredClone(gameState); 
  hiddenHandsGameState.players.forEach(player => {
    player.hand = player.hand?.map(() => ({ id: -1, rank: '?' }));
  });
  hiddenHandsGameState.moves = [];
  return hiddenHandsGameState;
};

// Show current player's hand in the game state
export function showCurrentPlayerHand(gameState: GameState, socket: Socket): GameState {
  let playerHandGameState = structuredClone(gameState);
  playerHandGameState.players.forEach(player => {
    player.hand = player.hand.map(() => ({ id: -1, rank: '?' }));
  });
  
  const player = socket.data.player;
  const playerInState = playerHandGameState.players.find(
    gamePlayer => gamePlayer.playerId === socket.data.player.playerId
  );
  if (!playerInState) {
    socket.emit('error', 'Player not found');
    return playerHandGameState;
  }
  const realHand = (playerInState.hand = player.hand);

  playerHandGameState.moves = [];
  
  console.log('player', player);
  console.log('playerHandGameState', realHand);
  
  return playerHandGameState;
}

// Shuffle the deck of cards
function shuffleDeck<T>(cardDeck: T[]): T[] {
  const deck = [...cardDeck];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck as T[];
}

// Deal the cards to the players, each player gets 5 cards
// at the beginning of each round
export function dealCards(players: Player[], cardDeck: LiarCard[]): void {
  const shuffledDeck = shuffleDeck(cardDeck);
  players.forEach(player => player.hand = shuffledDeck.splice(0, 5));
};

// Deal the revolver to the players, each player gets a revolver with 6 chambers
// at beginning of the game
export function dealRevolver(players: Player[]): void {
  players.forEach(player => player.revolver = REVOLVER_DECK.map(card => ({ ...card, used: false })));
};

// Play roulette with the revolver, the player will spin the revolver
// and shoot the chamber
// return true if the player is shot, false if the player is not shot
// remove the used chamber from the revolver
export function playRoulette(player: Player): boolean {
  const revolver = player.revolver;
  const shotChamber = Math.floor(Math.random() * revolver.length);
  const shotCard = revolver[shotChamber];
  revolver.splice(shotChamber, 1);
  if (shotCard.type === 'lethal') {
    return true;
  }
  else {
    return false;
  }
};

// Start a new round, reset the moves, whos turn, declared rank, and deal new cards to players
// players keep their revolver and their isAlive status throughout the game
export function newRound(playedRoulettePlayer: Player, lastMovePlayer: Player, gameState: GameState): void {
  gameState.moves = [];
  const firstPlayer = getFirstPlayerOfNewRound(playedRoulettePlayer, lastMovePlayer, gameState);
  if (!firstPlayer) {
    console.log('no player found');
    throw new Error('No player found');
  }
  gameState.whosTurn = { name: firstPlayer.name, playerId: firstPlayer.playerId, canCallLiar: false };
  gameState.declaredRank = TABLE_RANKS[Math.floor(Math.random() * TABLE_RANKS.length)];
  dealCards(gameState.players, LIAR_DECK);
  return;
}

export function getNextPlayerInTurnOrder(currentPlayer: Player, gameState: GameState): Player | null {
  const currentIndex = gameState.players.findIndex(player => player.playerId === currentPlayer.playerId);
  for (let i = 1; i < gameState.players.length; i++) {
    const nextIndex = (currentIndex + i) % gameState.players.length;
    if (gameState.players[nextIndex].isAlive) {
      return gameState.players[nextIndex];
    }
  }
  return null;
}

/*The first player of that new round is assigned to the player that got caught playing a Liar last round,
 or the player that incorrectly called "LIAR" last round otherwise. 
 If that player has just been eliminated, 
 the next non-eliminated player in turn order must start the new round instead.*/
export function getFirstPlayerOfNewRound(playedRoulettePlayer: Player, lastMovePlayer: Player, gameState: GameState): Player | null { 
  if (playedRoulettePlayer.isAlive) {
    return playedRoulettePlayer;
  }
  else {
    return getNextPlayerInTurnOrder(lastMovePlayer, gameState);
  }
}

export function resetGameState(gameState: GameState): void {
  gameState.moves = [];
  gameState.gameStarted = false;
  gameState.declaredRank = null;
  gameState.whosTurn.canCallLiar = false;
  gameState.players.forEach(player => {
    player.hand = [];
    player.isAlive = true;
    player.ready = false;
  });
}