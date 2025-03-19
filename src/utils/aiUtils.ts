import { GameState, Piece, PlayerColor, Position, Move, Difficulty } from '../models/types';
import { getValidMoves, checkCapturedPieces, checkFourInARow } from './gameUtils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const evaluateMove = (gameState: GameState, move: Move): number => {
  if (!move || !move.piece) return -100; // Geçersiz hamle için düşük puan
  
  let score = 0;
  const { piece, to } = move;

  // Taş yakalama puanı
  const capturedPieces = checkCapturedPieces({ ...gameState, board: simulateMove(gameState.board, move) }, move);
  score += capturedPieces.length * 20; // Taş yakalaması en değerli hamle

  // İlerlemek için puan
  const progressionValue = piece.color === PlayerColor.PURPLE 
    ? to.row 
    : 7 - to.row;
  score += progressionValue;

  // Merkeze yakın olmak için puan
  const distanceToCenter = Math.abs(3.5 - to.row) + Math.abs(3.5 - to.col);
  score += (7 - distanceToCenter) * 0.5;

  // Taşları koruma puanı
  const isSafe = !isPieceVulnerable(gameState, { ...piece, position: to });
  if (isSafe) {
    score += 5;
  } else {
    score -= 10; // Tehlikedeki taşlar için ceza
  }

  return score;
};

// Tahtada bir hamle simüle et
const simulateMove = (board: (Piece | null)[][], move: Move): (Piece | null)[][] => {
  if (!move || !move.piece || !move.from || !move.to) {
    return board.map(row => [...row]);
  }
  
  const newBoard = board.map(row => [...row]);
  const { from, to, piece } = move;
  
  // Orijinal konumun sınırlar içinde olduğunu kontrol et
  if (from.row < 0 || from.row >= board.length || from.col < 0 || from.col >= board[0].length) {
    return newBoard;
  }
  
  // Orijinal konumu boşalt
  newBoard[from.row][from.col] = null;
  
  // Hedef konumun sınırlar içinde olduğunu kontrol et
  if (to.row < 0 || to.row >= board.length || to.col < 0 || to.col >= board[0].length) {
    return newBoard;
  }
  
  // Yeni konuma taşı
  const updatedPiece = { 
    ...piece, 
    position: to,
    isInStartingRow: piece.isInStartingRow && 
                    ((piece.color === PlayerColor.PURPLE && from.row === 0) || 
                     (piece.color === PlayerColor.ORANGE && from.row === 7))
  };
  newBoard[to.row][to.col] = updatedPiece;
  
  return newBoard;
};

// Bir taşın tehlikede olup olmadığını kontrol et
const isPieceVulnerable = (gameState: GameState, piece: Piece): boolean => {
  if (!piece) return false;
  
  const opponentColor = piece.color === PlayerColor.PURPLE ? PlayerColor.ORANGE : PlayerColor.PURPLE;
  const { board } = gameState;
  
  // Rakip taşları bul
  const opponentPieces: Piece[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] && board[row][col]?.color === opponentColor) {
        opponentPieces.push(board[row][col] as Piece);
      }
    }
  }
  
  // Her rakip taşın yakalayıp yakalayamayacağını kontrol et
  for (const opponentPiece of opponentPieces) {
    const validMoves = getValidMoves(opponentPiece, gameState);
    for (const move of validMoves) {
      const simulatedMove: Move = {
        piece: opponentPiece,
        from: opponentPiece.position,
        to: move
      };
      
      const capturedPieces = checkCapturedPieces(
        { ...gameState, board: simulateMove(gameState.board, simulatedMove) }, 
        simulatedMove
      );
      
      if (capturedPieces.some(p => p.id === piece.id)) {
        return true;
      }
    }
  }
  
  return false;
};

// Son kullanılan taşları takip etmek için
let lastUsedPieceIds: number[] = [];

// Taşların kullanım sayısını takip etmek için
let pieceUsageCount: Record<number, number> = {};

// Yeni oyun başladığında sayaçları sıfırla
export const resetAIState = (): void => {
  lastUsedPieceIds = [];
  pieceUsageCount = {};
  console.log("AI hafızası sıfırlandı.");
};

// Yapay zeka tarafından hamle seçimi
export const getAIMove = (gameState: GameState, difficulty: Difficulty): Move | null => {
  try {
    console.log("AI hamle hesaplanıyor...");
    
    // Kontrol et - board var mı?
    if (!gameState || !gameState.board) {
      console.error("getAIMove: Geçersiz oyun durumu");
      return null;
    }
    
    // Tüm AI taşlarını bulalım
    const aiPieces: Piece[] = [];
    const currentPieceIds = new Set<number>();
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const cell = gameState.board[row][col];
        if (cell && cell.color === PlayerColor.ORANGE) {
          aiPieces.push(cell);
          currentPieceIds.add(cell.id);
          
          // Eğer bu taş daha önce takip edilmediyse, kullanım sayısını başlat
          if (pieceUsageCount[cell.id] === undefined) {
            pieceUsageCount[cell.id] = 0;
          }
        }
      }
    }
    
    if (aiPieces.length === 0) {
      console.error("AI taşları bulunamadı");
      return null;
    }
    
    console.log(`${aiPieces.length} adet AI taşı bulundu`);
    
    // Tahtada olmayan taşları kullanım sayacından kaldır (yakalanmış taşlar)
    Object.keys(pieceUsageCount).forEach(idStr => {
      const id = parseInt(idStr);
      if (!currentPieceIds.has(id)) {
        delete pieceUsageCount[id];
      }
    });
    
    // Taşların ortalama kullanım sayısını hesapla
    const usageCounts = Object.values(pieceUsageCount);
    const totalUsage = usageCounts.reduce((sum, count) => sum + count, 0);
    const averageUsage = totalUsage / (usageCounts.length || 1);
    const maxAllowedUsage = Math.max(2, Math.ceil(averageUsage * 1.5)); // Ortalamanın 1.5 katından fazla kullanım kısıtlanacak
    
    console.log(`Ortalama taş kullanımı: ${averageUsage.toFixed(1)}, Maksimum izin verilen: ${maxAllowedUsage}`);
    
    // Hiç kullanılmamış taşları bul
    const unusedPieces = aiPieces.filter(piece => pieceUsageCount[piece.id] === 0);
    console.log(`${unusedPieces.length} adet hiç kullanılmamış taş var`);
    
    // Az kullanılmış taşları bul (ortalamadan daha az)
    const underusedPieces = aiPieces.filter(piece => {
      const count = pieceUsageCount[piece.id];
      return count > 0 && count < averageUsage;
    });
    
    // Zorunlu rotasyon için taş seçimi stratejisi
    let forcedPieceSelection: Piece | null = null;
    
    // Eğer hiç kullanılmamış taşlar varsa, zorunlu olarak onlardan birini kullan
    if (unusedPieces.length > 0) {
      forcedPieceSelection = unusedPieces[Math.floor(Math.random() * unusedPieces.length)];
      console.log(`Zorunlu rotasyon: Hiç kullanılmamış taş ${forcedPieceSelection.id} seçildi`);
    }
    // Değilse, çok fazla kullanılmış taşları kısıtla ve az kullanılmış taşlara öncelik ver
    else if (underusedPieces.length > 0 && totalUsage > aiPieces.length * 2) {
      // Oyun yeterince ilerlemişse az kullanılmış taşlar tercih edilsin
      forcedPieceSelection = underusedPieces[Math.floor(Math.random() * underusedPieces.length)];
      console.log(`Zorunlu rotasyon: Az kullanılmış taş ${forcedPieceSelection.id} seçildi`);
    }
    
    // Son kullanılan taşın ID'sini öğren
    const lastUsedPieceId = lastUsedPieceIds.length > 0 ? lastUsedPieceIds[lastUsedPieceIds.length - 1] : -1;
    
    // Taşları kullanım sayısına ve son kullanım durumuna göre sırala
    const sortedPieces = [...aiPieces].sort((a, b) => {
      // Eğer zorla seçilmiş bir taş varsa, o en üstte olsun
      if (forcedPieceSelection) {
        if (a.id === forcedPieceSelection.id) return -1;
        if (b.id === forcedPieceSelection.id) return 1;
      }
      
      const aUsageCount = pieceUsageCount[a.id] || 0;
      const bUsageCount = pieceUsageCount[b.id] || 0;
      
      // Kullanım sınırını aşan taşlar en sona
      const aExceedsLimit = aUsageCount >= maxAllowedUsage;
      const bExceedsLimit = bUsageCount >= maxAllowedUsage;
      
      if (aExceedsLimit && !bExceedsLimit) return 1;
      if (!aExceedsLimit && bExceedsLimit) return -1;
      
      // Hiç oynanmamış taşlara en yüksek önceliği ver
      if (aUsageCount === 0 && bUsageCount > 0) return -1;
      if (bUsageCount === 0 && aUsageCount > 0) return 1;
      
      // Son kullanılan taşı sona koy
      if (a.id === lastUsedPieceId) return 1;
      if (b.id === lastUsedPieceId) return -1;
      
      // Son 3 taşı da daha az tercih et
      const aUsedRecently = lastUsedPieceIds.includes(a.id);
      const bUsedRecently = lastUsedPieceIds.includes(b.id);
      
      if (aUsedRecently && !bUsedRecently) return 1;
      if (!aUsedRecently && bUsedRecently) return -1;
      
      // Eğer diğer kriterlerde eşitse, kullanım sayısı az olana öncelik ver
      if (aUsageCount !== bUsageCount) {
        return aUsageCount - bUsageCount;
      }
      
      return Math.random() - 0.5;  // Diğer taşları rastgele sırala
    });
    
    // Kullanım sayıları hakkında bilgi
    console.log("Taşların kullanım sayıları:");
    sortedPieces.forEach(piece => {
      console.log(`Taş ${piece.id}: ${pieceUsageCount[piece.id] || 0} kez kullanıldı`);
    });
    
    // En iyi hamleyi bulmak için tüm olası hamleleri değerlendir
    const allMoves: { piece: Piece; from: Position; to: Position; score: number }[] = [];
    
    // Her taş için geçerli hamleleri ve puanlarını hesapla
    for (const piece of sortedPieces) {
      const validMoves = getValidMoves(piece, gameState);
      
      // Aşırı kullanılmış taşları kısıtla (zorunlu seçilmiş taş yoksa)
      if (!forcedPieceSelection && pieceUsageCount[piece.id] >= maxAllowedUsage) {
        // Bu taş fazla kullanılmış, sadece taş yakalama hamleleri veya çok kritik hamleler için izin ver
        const captureMoves = validMoves.filter(movePos => {
          const move: Move = {
            piece: piece,
            from: piece.position,
            to: movePos
          };
          
          const capturedPieces = checkCapturedPieces(
            { ...gameState, board: simulateMove(gameState.board, move) }, 
            move
          );
          
          return capturedPieces.length > 0;
        });
        
        if (captureMoves.length === 0) {
          console.log(`Taş ${piece.id} çok fazla kullanıldı (${pieceUsageCount[piece.id]}/${maxAllowedUsage}), sadece taş yakalama hamleleri seçilebilir.`);
          continue; // Bu taşı atla
        } else {
          console.log(`Taş ${piece.id} çok fazla kullanıldı, ama taş yakalamaya izin veriliyor.`);
        }
      }
      
      for (const movePos of validMoves) {
        const move: Move = {
          piece: piece,
          from: piece.position,
          to: movePos
        };
        
        // Simüle edilmiş durumu oluştur
        const simulatedBoard = simulateMove(gameState.board, move);
        
        // Eğer bu hamle dört taş yan yana getiriyorsa, kesinlikle yapma
        const willCauseFourInRow = checkFourInARow({ ...gameState, board: simulatedBoard }, movePos, PlayerColor.ORANGE);
        
        if (willCauseFourInRow) {
          console.log(`Taş ${piece.id} için ${movePos.row},${movePos.col} pozisyonu dört taş yan yana oluşturur - atlanıyor`);
          continue; // Bu hamleyi atla
        }
        
        // Hamleyi değerlendir ve puan ver
        let score = 0;
        
        // Taş yakalama puanı
        const capturedPieces = checkCapturedPieces(
          { ...gameState, board: simulatedBoard }, 
          move
        );
        score += capturedPieces.length * 20; // Taş yakalaması en değerli hamle
        
        // İlerleme puanı (yukarı doğru ilerleme)
        score += (7 - movePos.row) * 3; // Turuncu için yukarı doğru gitmeyi teşvik et
        
        // Güvenlik puanı
        const isSafe = !isPieceVulnerable(
          { ...gameState, board: simulatedBoard },
          { ...piece, position: movePos }
        );
        score += isSafe ? 5 : -5;
        
        // Hiç kullanılmamış taşa çok büyük bonus
        const usageCount = pieceUsageCount[piece.id] || 0;
        if (usageCount === 0) {
          score += 30; // Hiç kullanılmamış taşa çok yüksek öncelik
        } else {
          // Daha az kullanılan taşlara da bonus ver (azalan şekilde)
          const unusedBonus = Math.max(0, 15 - usageCount * 3); 
          score += unusedBonus;
        }
        
        // Zorla seçilmiş taşa ekstra bonus
        if (forcedPieceSelection && piece.id === forcedPieceSelection.id) {
          score += 50; // Zorla seçilen taşa çok büyük bonus
        }
        
        // Son kullanılan taşlara ceza
        if (piece.id === lastUsedPieceId) {
          score -= 20; // Son kullanılan taşın tercih edilmemesi için ciddi ceza
        } else if (lastUsedPieceIds.includes(piece.id)) {
          score -= 10; // Son 3 taşın da daha az tercih edilmesi için ceza
        }
        
        // Aşırı kullanılmış taşlara büyük ceza (rotasyon için)
        if (usageCount > averageUsage) {
          const overusePenalty = (usageCount - averageUsage) * 5;
          score -= overusePenalty;
        }
        
        // Rastgelelik ekle
        score += Math.random() * 2;
        
        allMoves.push({
          piece,
          from: piece.position,
          to: movePos,
          score
        });
      }
    }
    
    // Geçerli hamle yoksa null döndür
    if (allMoves.length === 0) {
      console.log("AI geçerli hamle bulamadı");
      return null;
    }
    
    // Hamleleri puanlarına göre sırala
    allMoves.sort((a, b) => b.score - a.score);
    
    // Zorluk seviyesine göre hamle seç
    let selectedMove;
    
    switch (difficulty) {
      case Difficulty.EASY:
        // Kolay seviye - rastgele bir hamle seç, ama dört taş yan yana getirmeyecek hamleler arasından
        selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        break;
        
      case Difficulty.MEDIUM:
        // Orta seviye - en iyi hamlelerin arasından birini seç
        // En iyi 3 hamleden birini seç, ancak hepsinin farklı taşlar olması için çaba göster
        let mediumCandidates = allMoves.slice(0, Math.min(5, allMoves.length));
        // Farklı taşlardan oluşan bir alt küme bul
        let uniquePieceMoves = [];
        let usedPieceIds = new Set<number>();
        
        for (const move of mediumCandidates) {
          if (!usedPieceIds.has(move.piece.id)) {
            uniquePieceMoves.push(move);
            usedPieceIds.add(move.piece.id);
            if (uniquePieceMoves.length >= 3) break;
          }
        }
        
        // Eğer yeterli sayıda farklı taş bulamazsak, orijinal listeyi kullan
        if (uniquePieceMoves.length > 0) {
          const mediumIndex = Math.floor(Math.random() * uniquePieceMoves.length);
          selectedMove = uniquePieceMoves[mediumIndex];
        } else {
          const mediumIndex = Math.floor(Math.random() * Math.min(3, allMoves.length));
          selectedMove = allMoves[mediumIndex];
        }
        break;
        
      case Difficulty.HARD:
      default:
        // Zor seviye - genel olarak en iyi hamleyi seç
        // Ancak hiç kullanılmamış taşlara yüksek öncelik ver
        // Önce hiç kullanılmamış taşlarla iyi hamleleri bul
        let unusedPieceMoves = allMoves.filter(move => (pieceUsageCount[move.piece.id] || 0) === 0);
        
        if (unusedPieceMoves.length > 0) {
          // Hiç kullanılmamış taşla yapılabilecek hamle varsa onu kullan
          selectedMove = unusedPieceMoves[0];
        } else if (forcedPieceSelection) {
          // Zorla seçilmiş taşla yapılabilecek hamleler
          const forcedMoves = allMoves.filter(move => 
            forcedPieceSelection !== null && move.piece.id === forcedPieceSelection.id
          );
          if (forcedMoves.length > 0) {
            selectedMove = forcedMoves[0];
          } else {
            selectedMove = allMoves[0]; // Zorunlu taşla hamle yoksa en iyisini seç
          }
        } else if (allMoves[0].piece.id === lastUsedPieceId && 
                  allMoves[0].score < 25 && // Taş yakalama gibi kritik hamleler değilse
                  allMoves.length > 1) {
          // En iyi hamle son kullanılan taşla ve kritik değilse alternatif bul
          for (let i = 1; i < Math.min(5, allMoves.length); i++) {
            if (allMoves[i].piece.id !== lastUsedPieceId) {
              selectedMove = allMoves[i];
              break;
            }
          }
          // Eğer alternatif bulunamazsa, en iyi hamleyi kullan
          if (!selectedMove) {
            selectedMove = allMoves[0];
          }
        } else {
          selectedMove = allMoves[0];
        }
        break;
    }
    
    // Son kullanılan taşların listesini güncelle
    lastUsedPieceIds.push(selectedMove.piece.id);
    if (lastUsedPieceIds.length > 3) {
      lastUsedPieceIds.shift(); // En eski taşı listeden çıkar
    }
    
    // Taşın kullanım sayısını artır
    pieceUsageCount[selectedMove.piece.id] = (pieceUsageCount[selectedMove.piece.id] || 0) + 1;
    
    console.log(`AI şunu oynuyor: ${selectedMove.from.row},${selectedMove.from.col} -> ${selectedMove.to.row},${selectedMove.to.col} (puan: ${selectedMove.score})`);
    console.log(`Son kullanılan taşlar: ${lastUsedPieceIds.join(', ')}`);
    console.log(`Seçilen taşın kullanım sayısı: ${pieceUsageCount[selectedMove.piece.id]}`);
    
    return {
      piece: selectedMove.piece,
      from: selectedMove.from,
      to: selectedMove.to
    };
    
  } catch (error) {
    console.error("AI hamle hatası:", error);
    return null;
  }
}; 