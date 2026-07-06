import { useMemo } from "react";
import { useGame } from "../../context/GameContext";
import { COUNTRY_CONFIGS } from "../../types/hex";
import "../../styles/lobby.css";

interface GameTopBarProps {
  onExit: () => void;
  onEndGame: () => void;
  onHostEnd?: () => void;
  cycleRemainingSec?: number;
}

export function GameTopBar({
  onExit,
  onEndGame,
  onHostEnd,
  cycleRemainingSec,
}: GameTopBarProps) {
  const { gameState, multiplayer } = useGame();

  const countryLabel = useMemo(() => {
    if (!multiplayer) return null;
    const country = multiplayer.assignedCountry;
    return `${COUNTRY_CONFIGS[country].name} (${multiplayer.playerName})`;
  }, [multiplayer]);

  const timerLabel =
    cycleRemainingSec !== undefined
      ? `${Math.floor(cycleRemainingSec / 60)}:${String(cycleRemainingSec % 60).padStart(2, "0")}`
      : null;

  return (
    <div className="game-top-bar">
      <div className="game-top-bar-left">
        <span>
          Cycle {gameState.cycle}
          {timerLabel ? ` / ${timerLabel}` : ""}
        </span>
        {countryLabel && <span style={{ color: "rgba(255,255,255,0.75)" }}>{countryLabel}</span>}
      </div>
      <div className="game-top-bar-actions">
        <button type="button" className="overlay-btn" onClick={onExit}>
          Exit
        </button>
        <button type="button" className="overlay-btn danger" onClick={onEndGame}>
          End Game
        </button>
        {multiplayer?.isHost && onHostEnd && (
          <button type="button" className="overlay-btn danger active" onClick={onHostEnd}>
            End Game (Host)
          </button>
        )}
      </div>
    </div>
  );
}
