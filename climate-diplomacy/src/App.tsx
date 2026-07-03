import { useMemo } from "react";
import { HexMap } from "./components/map/HexMap";
import { generateMap } from "./lib/mapGenerator";

function App() {
  const hexes = useMemo(() => generateMap(42), []);

  return <HexMap hexes={hexes} />;
}

export default App;
