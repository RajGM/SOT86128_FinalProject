import { useGame } from "../../context/GameContext";
import "./overlay.css";

export function ActionPanel() {
  const {
    gameState,
    isTestScenario,
    multiplayer,
    dashboardOpen,
    setDashboardOpen,
    buildPanelOpen,
    setBuildPanelOpen,
    selectedHex,
    advanceCycle,
  } = useGame();

  const showAdvance =
    gameState.testingMode || (multiplayer?.isHost && !gameState.testingMode);

  return (
    <div className="action-panel">
      {isTestScenario && (
        <span className="test-scenario-badge" title="Cycle 15 mid-game classroom scenario">
          Test Scenario — Cycle {gameState.cycle}
        </span>
      )}
      <button
        className={`overlay-btn ${dashboardOpen ? "active" : ""}`}
        onClick={() => setDashboardOpen(!dashboardOpen)}
      >
        Actions — Technology / Diplomacy / Trade / Routes / Summit
      </button>
      {selectedHex && (
        <button
          className={`overlay-btn primary ${buildPanelOpen ? "active" : ""}`}
          onClick={() => setBuildPanelOpen(!buildPanelOpen)}
        >
          Build
        </button>
      )}
      {showAdvance && (
        <button
          className="overlay-btn"
          onClick={advanceCycle}
          disabled={!!gameState.pendingSummitVote}
          style={{ marginLeft: 8 }}
          title={
            gameState.pendingSummitVote
              ? "Complete the summit vote before advancing"
              : undefined
          }
        >
          Advance Cycle ({gameState.cycle})
        </button>
      )}
    </div>
  );
}
