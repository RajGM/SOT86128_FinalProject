import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GameProvider, useGame } from "../context/GameContext";
import { HexMap } from "../components/map/HexMap";
import { StatsScreen } from "../components/endgame/StatsScreen";
import { createTestScenarioState } from "../data/testScenario";
import { generateMap } from "../lib/mapGenerator";
import { buildPlayerResults } from "../lib/scoring";
import type { GameState } from "../types/game";
import type { PlayerResult } from "../types/multiplayer";
import "../components/ui/overlay.css";

interface EndGamePreview {
  results: PlayerResult[];
  gameState: GameState;
  viewCountry: import("../types/hex").CountryId;
}

function TestEndGameControls({ onShowResults }: { onShowResults: (preview: EndGamePreview) => void }) {
  const { gameState, viewCountry } = useGame();

  const handleEndGame = () => {
    const humanPlayers = {
      tester: {
        name: "Tester",
        country: viewCountry,
        connected: true,
      },
    };
    onShowResults({
      results: buildPlayerResults(gameState, humanPlayers),
      gameState,
      viewCountry,
    });
  };

  return (
    <div className="test-endgame-bar">
      <span className="test-scenario-badge">Test Scenario · Cycle {gameState.cycle}</span>
      <button type="button" className="overlay-btn primary" onClick={handleEndGame}>
        End Game (Preview)
      </button>
    </div>
  );
}

function TestGameInner({
  hexes,
  onShowResults,
}: {
  hexes: import("../types/hex").HexData[];
  onShowResults: (preview: EndGamePreview) => void;
}) {
  return (
    <>
      <TestEndGameControls onShowResults={onShowResults} />
      <div className="game-shell game-shell--test" style={{ height: "100vh" }}>
        <HexMap hexes={hexes} />
      </div>
    </>
  );
}

export function TestPage() {
  const navigate = useNavigate();
  const hexes = useMemo(() => generateMap(42), []);
  const initialState = useMemo(() => createTestScenarioState(hexes), [hexes]);
  const [preview, setPreview] = useState<EndGamePreview | null>(null);

  const handleReturn = useCallback(() => {
    setPreview(null);
    navigate("/");
  }, [navigate]);

  return (
    <>
      {preview && (
        <StatsScreen
          results={preview.results}
          gameState={preview.gameState}
          viewCountry={preview.viewCountry}
          finalCycle={preview.gameState.cycle}
          finalTemperature={preview.gameState.globalTemperature}
          archived={false}
          onReturn={handleReturn}
        />
      )}
      <GameProvider hexes={hexes} initialState={initialState} isTestScenario>
        <TestGameInner hexes={hexes} onShowResults={setPreview} />
      </GameProvider>
    </>
  );
}
