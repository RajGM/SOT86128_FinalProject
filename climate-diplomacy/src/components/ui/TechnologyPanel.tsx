import { useGame } from "../../context/GameContext";
import { BUILD_DEFINITIONS } from "../../config/builds";
import { COUNTRY_CONFIGS } from "../../types/hex";

const STARTING_TECH: Record<string, number> = {
  eu: 85,
  usa: 75,
  china: 70,
  russia: 55,
  india: 45,
  opec: 40,
  latam: 38,
  africa: 30,
};

export function TechnologyPanel() {
  const { gameState, viewCountry } = useGame();
  const region = gameState.regions[viewCountry];

  return (
    <div>
      <div className="section-title">Technology — Engineering Capacity</div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
        Technology is not research — it is know-how spent to build green and nuclear plants.
        Manufacturing is the only domestic source. Trade it like any other resource.
      </p>

      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 6 }}>
          {COUNTRY_CONFIGS[viewCountry].name}: {Math.round(region.technology)} tech
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
          Starting tech (V1): {STARTING_TECH[viewCountry] ?? "—"}
        </div>
        <div style={{ fontSize: 11, marginTop: 8, color: "rgba(255,255,255,0.6)" }}>
          <strong>Build costs (deducted from stockpile):</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            <li>Green Plant T1: 120 money + 10 tech</li>
            <li>Green Plant T2: +90 money + 8 tech (18 cumulative)</li>
            <li>Green Plant T3: +110 money + 5 tech (23 cumulative)</li>
            <li>Nuclear T1: 200 money + 15 tech</li>
          </ul>
        </div>
      </div>

      <div className="section-title">The Loop</div>
      <div className="card" style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          <li>Build <strong>Manufacturing</strong> → generates tech each cycle (+3/+5/+8)</li>
          <li>Rare earth stockpile ≥ 1 → +50% goods, +33% tech from Manufacturing</li>
          <li>Spend tech to place Green or Nuclear plants</li>
          <li>Import tech via trade if you lack Manufacturing</li>
        </ol>
      </div>

      <div className="section-title">Country Situations</div>
      {Object.entries(STARTING_TECH).map(([id, tech]) => (
        <div key={id} className="card" style={{ fontSize: 11 }}>
          <strong>{COUNTRY_CONFIGS[id as keyof typeof COUNTRY_CONFIGS].name}</strong>
          {" — "}
          {tech} starting tech
          {tech >= 70 && " · Can self-fund green transition"}
          {tech < 50 && tech >= 40 && " · Needs Manufacturing or imports"}
          {tech < 40 && " · Dependent on tech transfers"}
        </div>
      ))}

      <div className="section-title">Build Catalog ({BUILD_DEFINITIONS.length} types)</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
        Energy (fossil, green, nuclear), economy (industrial, manufacturing), population (village, city),
        food (farm), extraction (extractor), transport (airport, dock, land center).
      </div>
    </div>
  );
}
