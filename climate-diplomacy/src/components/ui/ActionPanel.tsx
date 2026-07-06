import { useGame } from "../../context/GameContext";
import "./overlay.css";

export function ActionPanel() {
  const {
    gameState,
    dashboardOpen,
    setDashboardOpen,
    buildPanelOpen,
    setBuildPanelOpen,
    selectedHex,
    advanceCycle,
  } = useGame();

  return (
    <div className="action-panel">
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
      {gameState.testingMode && (
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
