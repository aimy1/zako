export type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';
export type CardType = 
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' 
  | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
}

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  hand: Card[];
  isUno: boolean;
  avatar?: string;
}

export type GameStatus = 'menu' | 'playing' | 'gameover';

export interface GameState {
  status: GameStatus;
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  deck: Card[];
  discardPile: Card[];
  currentColor: CardColor;
  pendingDraw: number;
  pendingAction: 'none' | 'wild_color_select';
  pendingWildCardInfo: { playerId: string, card: Card } | null;
  winner: Player | null;
  logs: string[];
}
