import React, { useState, useEffect } from 'react';
import Board from './Board';
import GameInfo from './GameInfo';
import { GameState, Piece, PlayerColor, Position, Move, Difficulty } from '../models/types';
import { 
  createInitialGameState, 
  getValidMoves, 
  checkFourInARow, 
  checkCapturedPieces, 
  checkGameOver,
  isWithinBounds
} from '../utils/gameUtils';
import { getAIMove, resetAIState } from '../utils/aiUtils';
import '../styles/Game.css';

const Game: React.FC = () => {
  // Oyun durumu
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  // Zorluk seviyesi
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  // Hamle geçmişi
  const [moveHistory, setMoveHistory] = useState<GameState[]>([]);
  // Bilgisayarın düşünüp düşünmediği
  const [isAIThinking, setIsAIThinking] = useState<boolean>(false);

  // Taş seçme fonksiyonu
  const selectPiece = (position: Position) => {
    const { board, currentPlayer } = gameState;
    const selectedCell = board[position.row][position.col];

    // Eğer bir taş seçildiyse ve oyun devam ediyorsa
    if (selectedCell && selectedCell.color === currentPlayer && !gameState.gameOver) {
      setGameState({
        ...gameState,
        selectedPiece: selectedCell,
        message: `${selectedCell.color === PlayerColor.PURPLE ? 'Mor' : 'Turuncu'} taş seçildi.`
      });
    }
  };

  // Taş hareketi fonksiyonu
  const movePiece = (fromPosition: Position, toPosition: Position) => {
    try {
      console.log(`movePiece: ${fromPosition.row},${fromPosition.col} -> ${toPosition.row},${toPosition.col}`);
      
      const { board, selectedPiece, currentPlayer } = gameState;
      
      // Konum kontrolü
      if (!isWithinBounds(fromPosition) || !isWithinBounds(toPosition)) {
        console.error('movePiece: Konum sınırlar dışında');
        return;
      }
      
      // Null kontrolleri
      if (!selectedPiece) {
        console.error('movePiece: Seçili taş bulunamadı');
        return;
      }
      
      // fromPosition'daki taşın seçili taş olduğunu kontrol et
      const fromPiece = board[fromPosition.row][fromPosition.col];
      if (!fromPiece || fromPiece.id !== selectedPiece.id) {
        console.error('movePiece: Başlangıç konumunda seçili taş yok');
        return;
      }
      
      // Hedef konumun boş olduğunu kontrol et
      if (board[toPosition.row][toPosition.col]) {
        console.error('movePiece: Hedef konum dolu');
        return;
      }
      
      // Hamlenin geçerli olduğunu kontrol et
      const validMoves = getValidMoves(selectedPiece, gameState);
      const isValidMove = validMoves.some(move => move.row === toPosition.row && move.col === toPosition.col);
      
      if (!isValidMove) {
        console.error('movePiece: Geçersiz hamle');
        return;
      }
      
      // Hamle geçmişini kaydetmek için mevcut durumu kopyala
      const previousState = JSON.parse(JSON.stringify(gameState));
      setMoveHistory(prevHistory => [...prevHistory, previousState]);
      
      // Tahtayı kopyala
      const newBoard = board.map(row => [...row]);
      
      // Orijinal konumu boşalt
      newBoard[fromPosition.row][fromPosition.col] = null;
      
      // Hareket eden taşı güncelle
      const movedPiece: Piece = {
        ...selectedPiece,
        position: toPosition,
        isInStartingRow: selectedPiece.isInStartingRow && 
                        ((selectedPiece.color === PlayerColor.PURPLE && fromPosition.row === 0) || 
                         (selectedPiece.color === PlayerColor.ORANGE && fromPosition.row === 7))
      };
      
      // Yeni konuma taşı yerleştir
      newBoard[toPosition.row][toPosition.col] = movedPiece;
      
      // Hareket nesnesini oluştur
      const move: Move = {
        piece: selectedPiece,
        from: fromPosition,
        to: toPosition
      };
      
      // Bu hamle sonucu yakalanan taşları kontrol et
      const capturedPieces = checkCapturedPieces({ ...gameState, board: newBoard }, move);
      
      // Yakalanan taşlar varsa onları tahtadan kaldır
      capturedPieces.forEach(piece => {
        if (isWithinBounds(piece.position)) {
          newBoard[piece.position.row][piece.position.col] = null;
        }
      });
      
      // Dört taş yan yana kontrolü
      const hasFourInRow = checkFourInARow({ ...gameState, board: newBoard }, toPosition, currentPlayer);
      
      // Yeni durumu oluştur
      let newGameState: GameState = {
        ...gameState,
        board: newBoard,
        selectedPiece: null,
        message: 'Hamle tamamlandı.'
      };
      
      // Eğer dört taş yan yana gelmiş ise
      if (hasFourInRow) {
        // Uyarı ver ve hamleyi geri al
        newGameState = {
          ...previousState,
          warnings: {
            ...previousState.warnings,
            [currentPlayer]: previousState.warnings[currentPlayer] + 1
          },
          message: 'Kural ihlali: Dört taş yan yana gelemez! Hamleniz geri alındı ve uyarı aldınız.'
        };
      } else {
        // Yakalanan taşların sayısını güncelle
        newGameState.capturedPieces = {
          ...newGameState.capturedPieces,
          [currentPlayer]: newGameState.capturedPieces[currentPlayer] + capturedPieces.length
        };
        
        // Yakalanan taşlar hakkında mesaj
        if (capturedPieces.length > 0) {
          newGameState.message = `${capturedPieces.length} rakip taş ele geçirildi!`;
        }
        
        // Sırayı diğer oyuncuya geçir
        newGameState.currentPlayer = currentPlayer === PlayerColor.PURPLE ? PlayerColor.ORANGE : PlayerColor.PURPLE;
      }
      
      // Oyun sonu kontrolü
      const gameOverCheck = checkGameOver(newGameState);
      if (gameOverCheck.gameOver) {
        newGameState.gameOver = true;
        newGameState.winner = gameOverCheck.winner;
        
        // Kazananı belirle ve seti güncelle
        if (gameOverCheck.winner) {
          newGameState.sets = {
            ...newGameState.sets,
            [gameOverCheck.winner]: newGameState.sets[gameOverCheck.winner] + 1
          };
          
          // Oyun setinin durumunu kontrol et
          if (newGameState.sets[gameOverCheck.winner] >= 2) {
            newGameState.message = `Oyun bitti! ${gameOverCheck.winner === PlayerColor.PURPLE ? 'Mor' : 'Turuncu'} oyuncu oyunu kazandı!`;
          } else {
            newGameState.message = `Set bitti! ${gameOverCheck.winner === PlayerColor.PURPLE ? 'Mor' : 'Turuncu'} oyuncu seti kazandı!`;
          }
        }
      }
      
      console.log('Yeni oyun durumu:', newGameState);
      setGameState(newGameState);
    } catch (error) {
      console.error('movePiece: Beklenmeyen hata', error);
      
      // Hata durumunda oyuncuya bilgi ver
      setGameState(prevState => ({
        ...prevState,
        message: 'Hamle yapılırken bir hata oluştu. Lütfen tekrar deneyin.',
        selectedPiece: null
      }));
    }
  };

  // Hücre tıklama olayını işleme
  const handleCellClick = (position: Position) => {
    // Pozisyon kontrolü
    if (!position || position.row === undefined || position.col === undefined) {
      return;
    }
    
    const { board, selectedPiece, currentPlayer, gameOver } = gameState;
    
    // Oyun bittiyse veya bilgisayarın sırası ise tıklamayı engelle
    if (gameOver || isAIThinking || currentPlayer === PlayerColor.ORANGE) {
      return;
    }
    
    // Sınır kontrolü
    if (position.row < 0 || position.row >= board.length || 
        position.col < 0 || position.col >= board[0].length) {
      return;
    }
    
    const clickedCell = board[position.row][position.col];
    
    // Tıklanan hücrede bir taş varsa ve oyuncunun kendi taşıysa
    if (clickedCell && clickedCell.color === currentPlayer) {
      selectPiece(position);
      return;
    }
    
    // Eğer bir taş seçilmişse ve geçerli bir hamle yapılmışsa
    if (selectedPiece) {
      const validMoves = getValidMoves(selectedPiece, gameState);
      const isValidMove = validMoves.some(move => move.row === position.row && move.col === position.col);
      
      if (isValidMove) {
        movePiece(selectedPiece.position, position);
      } else {
        // Geçersiz hamle durumunda mesaj göster
        setGameState({
          ...gameState,
          message: 'Geçersiz hamle! Lütfen yeşil olarak işaretlenen hücrelerden birine hamle yapın.'
        });
      }
    } else {
      // Taş seçilmediğinde mesaj göster
      setGameState({
        ...gameState,
        message: 'Lütfen önce bir taşınızı seçin.'
      });
    }
  };

  // Bilgisayar hamlesi
  const makeAIMove = () => {
    if (gameState.currentPlayer === PlayerColor.ORANGE && !gameState.gameOver) {
      setIsAIThinking(true);
      console.log("AI hamle yapmak için düşünüyor...");
      
      // Gecikme süresi
      setTimeout(() => {
        try {
          // AI hamlesini al
          let aiMove = getAIMove(gameState, difficulty);
          console.log("AI hamle sonucu:", aiMove);
          
          if (aiMove && aiMove.piece && aiMove.from && aiMove.to) {
            // Direkt olarak hamleyi yap, ara durum olmadan
            let fromPos = aiMove.from;
            let toPos = aiMove.to;
            
            // Tahtayı kopyala
            let newBoard = gameState.board.map(row => [...row]);
            
            // Orijinal konumu boşalt
            newBoard[fromPos.row][fromPos.col] = null;
            
            // Hareket eden taşı güncelle
            let movedPiece: Piece = {
              ...aiMove.piece,
              position: toPos,
              isInStartingRow: aiMove.piece.isInStartingRow && 
                             ((aiMove.piece.color === PlayerColor.PURPLE && fromPos.row === 0) || 
                              (aiMove.piece.color === PlayerColor.ORANGE && fromPos.row === 7))
            };
            
            // Yeni konuma taşı yerleştir
            newBoard[toPos.row][toPos.col] = movedPiece;
            
            // Dört taş yan yana kontrolü - ÖNEMLİ: Bu aşamada tekrar kontrol edelim
            const willHaveFourInRow = checkFourInARow({ 
              ...gameState, 
              board: newBoard 
            }, toPos, PlayerColor.ORANGE);
            
            // Bu aşamada 4 taş yan yana durumu varsa yeni bir hamle iste
            if (willHaveFourInRow) {
              console.log("AI dört taş yan yana kuralını çiğneyecekti - farklı hamle deniyor");
              
              // AI'ya başka hamle yaptırmalıyız, yeni hamle denemesi
              resetAIState(); // AI belleğini sıfırlayıp yeni bir başlangıç yap
              
              // 3 deneme yapalım
              let foundValidMove = false;
              let maxAttempts = 3;
              
              while (!foundValidMove && maxAttempts > 0) {
                // Yeni AI hamlesi iste
                const altAiMove = getAIMove(gameState, difficulty);
                
                if (altAiMove && altAiMove.piece && altAiMove.from && altAiMove.to) {
                  // Alternatif hamleyi simüle et
                  const altFromPos = altAiMove.from;
                  const altToPos = altAiMove.to;
                  const altBoard = gameState.board.map(row => [...row]);
                  
                  // Orijinal konumu boşalt
                  altBoard[altFromPos.row][altFromPos.col] = null;
                  
                  // Yeni hareketi güncelle
                  const altMovedPiece: Piece = {
                    ...altAiMove.piece,
                    position: altToPos,
                    isInStartingRow: altAiMove.piece.isInStartingRow && 
                                    ((altAiMove.piece.color === PlayerColor.PURPLE && altFromPos.row === 0) || 
                                      (altAiMove.piece.color === PlayerColor.ORANGE && altFromPos.row === 7))
                  };
                  
                  // Yeni konuma taşı yerleştir
                  altBoard[altToPos.row][altToPos.col] = altMovedPiece;
                  
                  // Bu hamle 4 taş yan yana oluşturuyor mu?
                  const altWillHaveFourInRow = checkFourInARow({
                    ...gameState,
                    board: altBoard
                  }, altToPos, PlayerColor.ORANGE);
                  
                  if (!altWillHaveFourInRow) {
                    // Geçerli hamle bulundu!
                    aiMove = altAiMove;
                    fromPos = altFromPos;
                    toPos = altToPos;
                    newBoard = altBoard;
                    movedPiece = altMovedPiece;
                    foundValidMove = true;
                    console.log("4 taş yan yana oluşturmayan alternatif hamle bulundu");
                  }
                }
                
                maxAttempts--;
              }
              
              if (!foundValidMove) {
                console.log("4 taş yan yana oluşturmayan alternatif hamle bulunamadı, en iyi hamleyi kullanıyoruz");
              }
            }
            
            // Bu hamle sonucu yakalanan taşları kontrol et
            const capturedPieces = checkCapturedPieces({ 
              ...gameState, 
              board: newBoard 
            }, {
              piece: aiMove.piece,
              from: fromPos,
              to: toPos
            });
            
            // Yakalanan taşlar varsa onları tahtadan kaldır
            capturedPieces.forEach(piece => {
              if (isWithinBounds(piece.position)) {
                newBoard[piece.position.row][piece.position.col] = null;
              }
            });
            
            // Dört taş yan yana kontrolü (son durum için tekrar kontrol et)
            const hasFourInRow = checkFourInARow({ 
              ...gameState, 
              board: newBoard 
            }, toPos, PlayerColor.ORANGE);
            
            // Yeni durumu oluştur
            let newGameState: GameState = {
              ...gameState,
              board: newBoard,
              selectedPiece: null,
              message: 'Bilgisayar hamlesini tamamladı.',
              currentPlayer: PlayerColor.PURPLE // Sırayı oyuncuya geçir
            };
            
            // Eğer hala dört taş yan yana gelmiş ise
            if (hasFourInRow) {
              newGameState.warnings = {
                ...newGameState.warnings,
                [PlayerColor.ORANGE]: newGameState.warnings[PlayerColor.ORANGE] + 1
              };
              newGameState.message = `Bilgisayar kural ihlali yaptı: Dört taş yan yana! Uyarı aldı (${newGameState.warnings[PlayerColor.ORANGE]}/3) ve sıra size geçti.`;
            } else {
              // Yakalanan taşların sayısını güncelle
              newGameState.capturedPieces = {
                ...newGameState.capturedPieces,
                [PlayerColor.ORANGE]: newGameState.capturedPieces[PlayerColor.ORANGE] + capturedPieces.length
              };
              
              // Yakalanan taşlar hakkında mesaj
              if (capturedPieces.length > 0) {
                newGameState.message = `Bilgisayar ${capturedPieces.length} taşınızı ele geçirdi!`;
              }
            }
            
            // Oyun sonu kontrolü
            const gameOverCheck = checkGameOver(newGameState);
            if (gameOverCheck.gameOver) {
              newGameState.gameOver = true;
              newGameState.winner = gameOverCheck.winner;
              
              // Kazananı belirle ve seti güncelle
              if (gameOverCheck.winner) {
                newGameState.sets = {
                  ...newGameState.sets,
                  [gameOverCheck.winner]: newGameState.sets[gameOverCheck.winner] + 1
                };
                
                // Oyun setinin durumunu kontrol et
                if (newGameState.sets[gameOverCheck.winner] >= 2) {
                  newGameState.message = `Oyun bitti! ${gameOverCheck.winner === PlayerColor.PURPLE ? 'Mor' : 'Turuncu'} oyuncu oyunu kazandı!`;
                } else {
                  newGameState.message = `Set bitti! ${gameOverCheck.winner === PlayerColor.PURPLE ? 'Mor' : 'Turuncu'} oyuncu seti kazandı!`;
                }
              }
            }
            
            // Yeni durumu uygula
            console.log("Yeni oyun durumu:", newGameState);
            setGameState(newGameState);
          } else {
            // Eğer AI hamle bulamazsa sırayı oyuncuya geçir
            console.log("AI hamle bulamadı");
            setGameState(prev => ({
              ...prev,
              currentPlayer: PlayerColor.PURPLE,
              message: "Bilgisayar hamle yapamadı, sıra sizde."
            }));
          }
        } catch (error) {
          console.error("AI hamle hatası:", error);
          // Hata durumunda sırayı oyuncuya geçir
          setGameState(prev => ({
            ...prev,
            currentPlayer: PlayerColor.PURPLE,
            message: "Bilgisayar hamle hesaplayamadı, sıra sizde."
          }));
        } finally {
          setIsAIThinking(false);
        }
      }, 1000);
    }
  };

  // Bilgisayar hamlesi için useEffect hook'u
  useEffect(() => {
    // Bilgisayarın sırası geldiğinde ve düşünmediğinde
    if (gameState.currentPlayer === PlayerColor.ORANGE && !isAIThinking && !gameState.gameOver) {
      makeAIMove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentPlayer, gameState.gameOver]);

  // Yeni oyun başlatma
  const handleNewGame = () => {
    // Yeni oyun başlatırken AI'nin hafızasını sıfırla
    resetAIState();
    setGameState(createInitialGameState());
    setMoveHistory([]);
  };

  // Hamleyi geri alma
  const handleUndoMove = () => {
    if (moveHistory.length > 0) {
      const lastState = moveHistory[moveHistory.length - 1];
      setGameState(lastState);
      setMoveHistory(moveHistory.slice(0, -1));
    }
  };

  // Zorluk seviyesini değiştirme
  const handleChangeDifficulty = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
  };

  return (
    <div className="game">
      <div className="game-board-container">
        {isAIThinking && (
          <div className="ai-thinking">
            <p>Bilgisayar düşünüyor...</p>
          </div>
        )}
        <Board 
          gameState={gameState} 
          onCellClick={handleCellClick} 
        />
      </div>
      <div className="game-info-container">
        <GameInfo 
          gameState={gameState} 
          difficulty={difficulty}
          onNewGame={handleNewGame}
          onUndoMove={handleUndoMove}
          onChangeDifficulty={handleChangeDifficulty}
        />
      </div>
    </div>
  );
};

export default Game; 