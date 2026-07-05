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
        Actions — Research / Diplomacy / Trade / Routes
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
          style={{ marginLeft: 8 }}
        >
          Advance Cycle ({gameState.cycle})
        </button>
      )}
    </div>
  );
}
