// Oyuncu renkleri
export enum PlayerColor {
  PURPLE = 'purple',
  ORANGE = 'orange',
}

// Taş durumu
export interface Piece {
  id: number;
  color: PlayerColor;
  position: Position;
  isInStartingRow: boolean;
}

// Konum
export interface Position {
  row: number;
  col: number;
}

// Oyun Durumu
export interface GameState {
  board: (Piece | null)[][];
  currentPlayer: PlayerColor;
  selectedPiece: Piece | null;
  capturedPieces: {
    [PlayerColor.PURPLE]: number;
    [PlayerColor.ORANGE]: number;
  };
  warnings: {
    [PlayerColor.PURPLE]: number;
    [PlayerColor.ORANGE]: number;
  };
  sets: {
    [PlayerColor.PURPLE]: number;
    [PlayerColor.ORANGE]: number;
  };
  gameOver: boolean;
  winner: PlayerColor | null;
  message: string;
}

// Hareket
export interface Move {
  piece: Piece;
  from: Position;
  to: Position;
}

// Zorluk Seviyeleri
export enum Difficulty {
  EASY = 'Kolay',
  MEDIUM = 'Orta',
  HARD = 'Zor',
} 