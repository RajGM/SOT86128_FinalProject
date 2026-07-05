import { useMemo } from "react";
import { HexMap } from "./components/map/HexMap";
import { GameProvider } from "./context/GameContext";
import { generateMap } from "./lib/mapGenerator";
import "./components/ui/overlay.css";

function App() {
  const hexes = useMemo(() => generateMap(42), []);

  return (
    <GameProvider hexes={hexes}>
      <HexMap hexes={hexes} />
    </GameProvider>
  );
}

export default App;
