import { GameState, Piece, PlayerColor, Position, Move } from '../models/types';

// Tahtanın boyutu
export const BOARD_SIZE = 8;

// İlk oyun durumunu oluştur
export const createInitialGameState = (): GameState => {
  const board: (Piece | null)[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  // Mor ve turuncu taşları yerleştir
  for (let col = 0; col < BOARD_SIZE; col++) {
    // Mor taşlar (üst satır)
    board[0][col] = {
      id: col,
      color: PlayerColor.PURPLE,
      position: { row: 0, col },
      isInStartingRow: true,
    };

    // Turuncu taşlar (alt satır)
    board[BOARD_SIZE - 1][col] = {
      id: col + BOARD_SIZE,
      color: PlayerColor.ORANGE,
      position: { row: BOARD_SIZE - 1, col },
      isInStartingRow: true,
    };
  }

  return {
    board,
    currentPlayer: PlayerColor.PURPLE, // Mor oyuncu her zaman başlar
    selectedPiece: null,
    capturedPieces: {
      [PlayerColor.PURPLE]: 0,
      [PlayerColor.ORANGE]: 0,
    },
    warnings: {
      [PlayerColor.PURPLE]: 0,
      [PlayerColor.ORANGE]: 0,
    },
    sets: {
      [PlayerColor.PURPLE]: 0,
      [PlayerColor.ORANGE]: 0,
    },
    gameOver: false,
    winner: null,
    message: 'Oyun başladı! Mor oyuncu başlar.',
  };
};

// Bir konumun tahta sınırları içinde olup olmadığını kontrol et
export const isWithinBounds = (position: Position): boolean => {
  return (
    position.row >= 0 &&
    position.row < BOARD_SIZE &&
    position.col >= 0 &&
    position.col < BOARD_SIZE
  );
};

// Geçerli hamleleri bul
export const getValidMoves = (piece: Piece, gameState: GameState): Position[] => {
  // Null kontrolü
  if (!piece || !gameState || !gameState.board) {
    return [];
  }
  
  const validMoves: Position[] = [];
  const { row, col } = piece.position;
  
  // Konum kontrolü
  if (!isWithinBounds({ row, col })) {
    return [];
  }

  // İlk satırdaki taşlar için hareket kuralları
  if (piece.isInStartingRow) {
    // İleri hareket
    const forwardRow = piece.color === PlayerColor.PURPLE ? row + 1 : row - 1;
    
    // İleri hareket
    if (isWithinBounds({ row: forwardRow, col }) && !gameState.board[forwardRow][col]) {
      validMoves.push({ row: forwardRow, col });
    }
    
    // Sol çapraz hareket
    if (isWithinBounds({ row: forwardRow, col: col - 1 }) && !gameState.board[forwardRow][col - 1]) {
      validMoves.push({ row: forwardRow, col: col - 1 });
    }
    
    // Sağ çapraz hareket
    if (isWithinBounds({ row: forwardRow, col: col + 1 }) && !gameState.board[forwardRow][col + 1]) {
      validMoves.push({ row: forwardRow, col: col + 1 });
    }
  } else {
    // İlk satırdan çıkan taşlar için tüm yönlere hareket
    const directions = [
      { row: -1, col: 0 }, // Yukarı
      { row: 1, col: 0 },  // Aşağı
      { row: 0, col: -1 }, // Sol
      { row: 0, col: 1 },  // Sağ
      { row: -1, col: -1 }, // Sol üst çapraz
      { row: -1, col: 1 },  // Sağ üst çapraz
      { row: 1, col: -1 },  // Sol alt çapraz
      { row: 1, col: 1 },   // Sağ alt çapraz
    ];

    for (const dir of directions) {
      const newPos = { row: row + dir.row, col: col + dir.col };
      if (isWithinBounds(newPos) && !gameState.board[newPos.row][newPos.col]) {
        validMoves.push(newPos);
      }
    }
  }

  return validMoves;
};

// Tahtada dört taşın yan yana olup olmadığını kontrol et
export const checkFourInARow = (gameState: GameState, position: Position, color: PlayerColor): boolean => {
  // Null kontrolü
  if (!gameState || !gameState.board || !position || !color) {
    return false;
  }
  
  // Sınırları kontrol et
  if (!isWithinBounds(position)) {
    return false;
  }
  
  const directions = [
    [{ row: 0, col: 1 }],  // Yatay
    [{ row: 1, col: 0 }],  // Dikey
    [{ row: 1, col: 1 }],  // Çapraz (sağ alt)
    [{ row: 1, col: -1 }], // Çapraz (sol alt)
  ];
  
  const board = gameState.board;

  for (const direction of directions) {
    const dir = direction[0];
    let count = 1; // Kendisi dahil
    
    // İleri yönde kontrol
    for (let i = 1; i < 4; i++) {
      const newPos = {
        row: position.row + i * dir.row,
        col: position.col + i * dir.col
      };
      
      if (!isWithinBounds(newPos) || !board[newPos.row][newPos.col] || board[newPos.row][newPos.col]?.color !== color) {
        break;
      }
      count++;
    }
    
    // Ters yönde kontrol
    for (let i = 1; i < 4; i++) {
      const newPos = {
        row: position.row - i * dir.row,
        col: position.col - i * dir.col
      };
      
      if (!isWithinBounds(newPos) || !board[newPos.row][newPos.col] || board[newPos.row][newPos.col]?.color !== color) {
        break;
      }
      count++;
    }
    
    if (count >= 4) {
      return true;
    }
  }
  
  return false;
};

// Hamle sonrası sıkışan taşları kontrol et
export const checkCapturedPieces = (gameState: GameState, move: Move): Piece[] => {
  const capturedPieces: Piece[] = [];
  
  // Null kontrolü
  if (!gameState || !gameState.board || !move || !move.piece || !move.to) {
    return capturedPieces;
  }
  
  const { row, col } = move.to;
  const playerColor = move.piece.color;
  const opponentColor = playerColor === PlayerColor.PURPLE ? PlayerColor.ORANGE : PlayerColor.PURPLE;
  
  const directions = [
    { row: 0, col: 1 },  // Sağ
    { row: 0, col: -1 }, // Sol
    { row: 1, col: 0 },  // Aşağı
    { row: -1, col: 0 }, // Yukarı
    { row: 1, col: 1 },  // Sağ-aşağı (çapraz)
    { row: -1, col: -1 }, // Sol-yukarı (çapraz)
    { row: 1, col: -1 }, // Sol-aşağı (çapraz)
    { row: -1, col: 1 }  // Sağ-yukarı (çapraz)
  ];
  
  for (const dir of directions) {
    const pos1 = { row: row + dir.row, col: col + dir.col };
    const pos2 = { row: row + 2 * dir.row, col: col + 2 * dir.col };
    
    if (
      isWithinBounds(pos1) && 
      isWithinBounds(pos2) && 
      gameState.board[pos1.row][pos1.col] && 
      gameState.board[pos1.row][pos1.col]?.color === opponentColor &&
      gameState.board[pos2.row][pos2.col] && 
      gameState.board[pos2.row][pos2.col]?.color === playerColor
    ) {
      const capturedPiece = gameState.board[pos1.row][pos1.col] as Piece;
      capturedPieces.push(capturedPiece);
    }
  }
  
  return capturedPieces;
};

// Tahtadaki taşları say
const countPieces = (board: (Piece | null)[][]): { [key in PlayerColor]: number } => {
  const counts = {
    [PlayerColor.PURPLE]: 0,
    [PlayerColor.ORANGE]: 0
  };
  
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const piece = board[row][col];
      if (piece) {
        counts[piece.color]++;
      }
    }
  }
  
  return counts;
};

// Oyun sonu kontrolü
export const checkGameOver = (gameState: GameState): { gameOver: boolean; winner: PlayerColor | null } => {
  // Taşları tükenen oyuncu kontrolü
  const pieceCount = countPieces(gameState.board);
  if (pieceCount[PlayerColor.PURPLE] === 0) {
    return { gameOver: true, winner: PlayerColor.ORANGE };
  }
  if (pieceCount[PlayerColor.ORANGE] === 0) {
    return { gameOver: true, winner: PlayerColor.PURPLE };
  }
  
  // Dört taş ele geçirme kontrolü
  if (gameState.capturedPieces[PlayerColor.PURPLE] >= 4) {
    return { gameOver: true, winner: PlayerColor.PURPLE };
  }
  if (gameState.capturedPieces[PlayerColor.ORANGE] >= 4) {
    return { gameOver: true, winner: PlayerColor.ORANGE };
  }
  
  // Üç uyarı kontrolü
  if (gameState.warnings[PlayerColor.PURPLE] >= 3) {
    return { gameOver: true, winner: PlayerColor.ORANGE };
  }
  if (gameState.warnings[PlayerColor.ORANGE] >= 3) {
    return { gameOver: true, winner: PlayerColor.PURPLE };
  }
  
  return { gameOver: false, winner: null };
}; 