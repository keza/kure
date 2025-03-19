import React from 'react';
import { GameState, PlayerColor, Difficulty } from '../models/types';
import '../styles/GameInfo.css';

interface GameInfoProps {
  gameState: GameState;
  difficulty: Difficulty;
  onNewGame: () => void;
  onUndoMove: () => void;
  onChangeDifficulty: (difficulty: Difficulty) => void;
}

const GameInfo: React.FC<GameInfoProps> = ({
  gameState,
  difficulty,
  onNewGame,
  onUndoMove,
  onChangeDifficulty,
}) => {
  const { currentPlayer, capturedPieces, warnings, sets, gameOver, winner, message } = gameState;

  // Renk isimlerini Türkçe olarak belirle
  const getPlayerName = (color: PlayerColor): string => {
    return color === PlayerColor.PURPLE ? 'Mor' : 'Turuncu';
  };

  return (
    <div className="game-info">
      <div className="game-status">
        <h2>Küre Oyunu</h2>
        
        {gameOver ? (
          <div className="game-over">
            <h3>Oyun Bitti!</h3>
            {winner && (
              <>
                <p>
                  Kazanan: <span className={`winner-${winner.toLowerCase()}`}>{getPlayerName(winner)} Oyuncu</span>
                </p>
                <p className="win-reason">
                  {sets[winner] >= 2 ? 
                    `${getPlayerName(winner)} oyuncu 2 set kazandı!` : 
                    capturedPieces[winner] >= 4 ? 
                      `${getPlayerName(winner)} oyuncu 4 taş ele geçirdi!` : 
                      warnings[winner === PlayerColor.PURPLE ? PlayerColor.ORANGE : PlayerColor.PURPLE] >= 3 ? 
                        `${getPlayerName(winner === PlayerColor.PURPLE ? PlayerColor.ORANGE : PlayerColor.PURPLE)} oyuncu 3 uyarı aldı!` : 
                        `${getPlayerName(winner === PlayerColor.PURPLE ? PlayerColor.ORANGE : PlayerColor.PURPLE)} oyuncunun taşları tükendi!`
                  }
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="current-player">
            <p>Sıra: <span className={`player-${currentPlayer}`}>{getPlayerName(currentPlayer)} Oyuncu</span></p>
          </div>
        )}
        
        <div className="message">
          <p>{message}</p>
        </div>
      </div>

      <div className="game-stats">
        <div className="player-stats">
          <h3>Mor Oyuncu</h3>
          <p>Ele Geçirilen Taşlar: {capturedPieces[PlayerColor.ORANGE]}</p>
          <p>Uyarılar: {warnings[PlayerColor.PURPLE]}</p>
          <p>Setler: {sets[PlayerColor.PURPLE]}</p>
        </div>
        
        <div className="player-stats">
          <h3>Turuncu Oyuncu (Bilgisayar)</h3>
          <p>Ele Geçirilen Taşlar: {capturedPieces[PlayerColor.PURPLE]}</p>
          <p>Uyarılar: {warnings[PlayerColor.ORANGE]}</p>
          <p>Setler: {sets[PlayerColor.ORANGE]}</p>
        </div>
      </div>

      <div className="game-controls">
        <div className="difficulty-control">
          <label htmlFor="difficulty">Zorluk Seviyesi:</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => onChangeDifficulty(e.target.value as Difficulty)}
          >
            <option value={Difficulty.EASY}>{Difficulty.EASY}</option>
            <option value={Difficulty.MEDIUM}>{Difficulty.MEDIUM}</option>
            <option value={Difficulty.HARD}>{Difficulty.HARD}</option>
          </select>
        </div>
        
        <div className="buttons">
          <button onClick={onNewGame}>Yeni Oyun</button>
          <button onClick={onUndoMove} disabled={gameOver}>Hamleyi Geri Al</button>
        </div>
      </div>

      <div className="game-rules">
        <h3>Oyun Kuralları</h3>
        <ul>
          <li>İlk satırdaki taşlar sadece ileri ve çapraz hareket edebilir.</li>
          <li>İlk satırdan çıkan taşlar her yöne bir birim hareket edebilir.</li>
          <li>Taşlar yatay, dikey veya çaprazda dört tane yan yana gelemez.</li>
          <li>Rakibin taşını kendi taşlarınız arasına sıkıştırırsanız, o taşı ele geçirirsiniz.</li>
          <li>Rakibinizin dört taşını ele geçirirseniz seti kazanırsınız.</li>
          <li>Üç uyarı alan oyuncu seti kaybeder.</li>
          <li>İki seti kazanan oyuncu oyunu kazanır.</li>
        </ul>
      </div>
    </div>
  );
};

export default GameInfo; 