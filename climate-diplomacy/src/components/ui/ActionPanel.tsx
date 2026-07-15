import { useState } from "react";
import { useGame } from "../../context/GameContext";
import { canPlayerBuildOnHex } from "../../lib/buildRules";
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
    playerBuildCountry,
    advanceCycle,
  } = useGame();

  const [expanded, setExpanded] = useState(false);

  const hostManualAdvance =
    Boolean(multiplayer?.isHost) &&
    Boolean(gameState.gameMode?.manualCycleAdvance) &&
    !gameState.testingMode;

  const showAdvance = gameState.testingMode || hostManualAdvance;

  const showBuildButton = canPlayerBuildOnHex(
    selectedHex,
    gameState.testingMode,
    playerBuildCountry
  );

  const openDashboard = () => {
    setDashboardOpen(true);
    setExpanded(false);
  };

  const toggleBuild = () => {
    setBuildPanelOpen(!buildPanelOpen);
    setExpanded(false);
  };

  return (
    <div className={`action-panel ${expanded ? "expanded" : "collapsed"}`}>
      <button
        type="button"
        className={`overlay-btn action-toggle ${expanded ? "active" : ""}`}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {expanded ? "Close" : "Action"}
      </button>

      {expanded && (
        <div className="action-panel-menu overlay-panel">
          {isTestScenario && (
            <span className="test-scenario-badge" title="Cycle 15 mid-game classroom scenario">
              Test Scenario — Cycle {gameState.cycle}
            </span>
          )}
          <button
            type="button"
            className={`overlay-btn ${dashboardOpen ? "active" : ""}`}
            onClick={openDashboard}
          >
            Technology / Diplomacy / Trade / Routes / Summit
          </button>
          {showBuildButton && (
            <button
              type="button"
              className={`overlay-btn primary ${buildPanelOpen ? "active" : ""}`}
              onClick={toggleBuild}
            >
              Build
            </button>
          )}
          {showAdvance && (
            <button
              type="button"
              className="overlay-btn primary"
              onClick={advanceCycle}
            >
              {hostManualAdvance
                ? `Next Round for All (${gameState.cycle})`
                : `Advance Cycle (${gameState.cycle})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
