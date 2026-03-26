export type TableRank = 'king' | 'queen' | 'ace';

export type Rank = TableRank | 'joker';

export interface LiarCard {
  id: number;
  rank: Rank | '?';
}

export interface RevolverCard {
  type: 'lethal' | 'non-lethal';
  used: boolean;
  id: number;
}

export interface Player {
  socketId: string;
  playerId: string;
  name: string;
  ready: boolean;
  hand: LiarCard[];
  revolver: RevolverCard[];
  isAlive: boolean;
}

export interface Move {
  player: Player['name'];
  rank?: Rank;
  cardIds?: number[];
}

export interface GameState {
  players: Player[];
  maxPlayers: number;
  gameStarted: boolean;
  whosTurn: { name: Player['name']; playerId: Player['playerId']; canCallLiar: boolean };
  declaredRank: TableRank | null;
  moves: Array<Move>;
}

export interface ServerState {
  gameRooms: Record<string, GameState>;
}

export type SessionByToken = Record<string, { playerId: Player['playerId'], roomName: string }>;

