export const tableRanks = ['king', 'queen', 'ace'];

export const liarDeck = [
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

export const ROOM_NAME = 'Test Room';

export function createGameState() {
  let gameState = {
    players: [],
    maxPlayers: 4,
    gameStarted: false,
    whosTurn: null,
    declaredRank: null,
    moves: [],
  };
  return gameState;
};

export function hideGameState(gameState) {
  const hiddenHandsGameState = structuredClone(gameState); 
  hiddenHandsGameState.players.forEach(player => {
    player.hand = player.hand?.map(() => ({ id: -1, rank: '?' }));
  });
  return hiddenHandsGameState;
};

export function shuffleDeck(cardDeck) {
  const deck = [...cardDeck];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

export function dealCards(players, cardDeck) {
  const shuffledDeck = shuffleDeck(cardDeck);
  players.forEach(player => {
    player.hand = shuffledDeck.splice(0, 5);
  });
};