import React from 'react';
import { GameState, Position, Piece, PlayerColor } from '../models/types';
import { getValidMoves } from '../utils/gameUtils';
import '../styles/Board.css';

interface BoardProps {
  gameState: GameState;
  onCellClick: (position: Position) => void;
}

const Board: React.FC<BoardProps> = ({ gameState, onCellClick }) => {
  const { board, selectedPiece, currentPlayer } = gameState;
  
  // Seçilen taşın geçerli hamlelerini hesapla
  const validMoves: Position[] = selectedPiece 
    ? getValidMoves(selectedPiece, gameState) 
    : [];
  
  // Oyuncunun mevcut taşlarını vurgula
  const highlightPlayerPieces = (row: number, col: number): boolean => {
    const cell = board[row][col];
    return !gameState.gameOver && 
           cell !== null && 
           cell.color === currentPlayer;
  };
  
  // Bir hücre için CSS sınıflarını hesapla
  const getCellClassName = (row: number, col: number): string => {
    let className = 'board-cell';
    
    // Satranç tahtası desenini oluştur
    if ((row + col) % 2 === 0) {
      className += ' light-cell';
    } else {
      className += ' dark-cell';
    }
    
    // Geçerli bir hamle ise vurgula
    if (validMoves.some(move => move.row === row && move.col === col)) {
      className += ' valid-move';
    }
    
    // Seçili taş hücresini vurgula
    if (selectedPiece && selectedPiece.position.row === row && selectedPiece.position.col === col) {
      className += ' selected';
    }
    
    // Oyuncunun taşlarını vurgula
    if (highlightPlayerPieces(row, col)) {
      className += ' current-player-piece';
    }
    
    return className;
  };
  
  // Bir taşın CSS sınıfını hesapla
  const getPieceClassName = (piece: Piece): string => {
    let className = 'piece';
    
    if (piece.color === PlayerColor.PURPLE) {
      className += ' purple-piece';
    } else {
      className += ' orange-piece';
    }
    
    return className;
  };
  
  // Geçerli olup olmadığını kontrol et
  const isValidMove = (position: Position): boolean => {
    return validMoves.some(move => move.row === position.row && move.col === position.col);
  };
  
  // Hücreye tıklama olayını işle
  const handleCellClick = (row: number, col: number) => {
    onCellClick({ row, col });
  };
  
  return (
    <div className="board">
      {board.map((row, rowIndex) => (
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={getCellClassName(rowIndex, colIndex)}
            onClick={() => handleCellClick(rowIndex, colIndex)}
            data-testid={`cell-${rowIndex}-${colIndex}`}
          >
            {/* Taş varsa göster */}
            {cell && (
              <div 
                className={getPieceClassName(cell)}
                data-testid={`piece-${cell.id}`}
              />
            )}
            
            {/* Geçerli hamle göstergesi */}
            {isValidMove({ row: rowIndex, col: colIndex }) && (
              <div className="valid-move-indicator" />
            )}
          </div>
        ))
      ))}
    </div>
  );
};

export default Board; 