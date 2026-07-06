import { useMemo } from "react";
import { HexMap } from "./components/map/HexMap";
import { GameProvider } from "./context/GameContext";
import { createTestScenarioState, isTestScenarioPath } from "./data/testScenario";
import { generateMap } from "./lib/mapGenerator";
import "./components/ui/overlay.css";

function App() {
  const hexes = useMemo(() => generateMap(42), []);
  const isTestScenario = useMemo(() => isTestScenarioPath(), []);
  const initialState = useMemo(
    () => (isTestScenario ? createTestScenarioState(hexes) : undefined),
    [hexes, isTestScenario]
  );

  return (
    <GameProvider hexes={hexes} initialState={initialState} isTestScenario={isTestScenario}>
      <HexMap hexes={hexes} />
    </GameProvider>
  );
}

export default App;
