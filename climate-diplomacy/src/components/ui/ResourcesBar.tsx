import { useMemo } from "react";
import { useGame } from "../../context/GameContext";
import {
  computePerCapitaConsumption,
  getHappinessCascade,
  HAPPINESS_CASCADE_LABELS,
} from "../../lib/populationMechanics";
import { aggregateResources, aggregateDeposits } from "../../lib/gameState";
import { getTotalWorkforceDemand } from "../../lib/buildEconomics";
import {
  COUNTRY_CONFIGS,
  RESOURCE_DEPOSITS,
  RESOURCE_LABELS,
  RESOURCE_ICONS,
  type CountryId,
} from "../../types/hex";
import "./overlay.css";

const RESOURCE_LABELS_LIST: { key: keyof ReturnType<typeof aggregateResources>; label: string; unit?: string }[] = [
  { key: "money", label: "Money" },
  { key: "energy", label: "Energy" },
  { key: "food", label: "Food" },
  { key: "population", label: "Population" },
  { key: "happiness", label: "Happiness", unit: "%" },
  { key: "co2", label: "CO₂" },
  { key: "technology", label: "Technology" },
];

export function ResourcesBar() {
  const { gameState, resourcesExpanded, toggleResourcesExpanded, viewCountry } = useGame();

  const totals = useMemo(
    () => aggregateResources(gameState.regions),
    [gameState.regions]
  );

  const depositTotals = useMemo(
    () => aggregateDeposits(gameState.regions),
    [gameState.regions]
  );

  const workforceByCountry = useMemo(() => {
    const result = {} as Record<string, { demand: number; staffed: number }>;
    for (const id of Object.keys(gameState.regions)) {
      const buildings = Object.values(gameState.tileBuildings).filter((b) => b.countryId === id);
      const demand = getTotalWorkforceDemand(buildings);
      result[id] = { demand, staffed: Math.min(gameState.regions[id as keyof typeof gameState.regions].population, demand) };
    }
    return result;
  }, [gameState.tileBuildings, gameState.regions]);

  const countryIds = Object.keys(COUNTRY_CONFIGS) as CountryId[];

  return (
    <div className="resources-bar">
      <div
        className="overlay-panel resources-bar-inner"
        onClick={toggleResourcesExpanded}
        title="Click to toggle breakdown"
      >
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginRight: 4 }}>
          {resourcesExpanded ? "▼" : "▶"} World Totals
        </span>
        {RESOURCE_LABELS_LIST.map(({ key, label, unit }) => (
          <div key={key} className="resource-chip">
            <span className="label">{label}</span>
            <span className="value">
              {Math.round(totals[key])}{unit ?? ""}
            </span>
          </div>
        ))}
        {RESOURCE_DEPOSITS.map((dep) => (
          <div key={dep} className="resource-chip">
            <span className="label">{RESOURCE_ICONS[dep]} {RESOURCE_LABELS[dep]}</span>
            <span className="value">{depositTotals[dep]}</span>
          </div>
        ))}
        <div className="resource-chip" style={{ marginLeft: "auto" }}>
          <span className="label">World Happiness</span>
          <span className="value">{Math.round(gameState.worldHappiness)}%</span>
        </div>
        <div className="resource-chip">
          <span className="label">Temp</span>
          <span className="value">{gameState.globalTemperature.toFixed(2)}°C</span>
        </div>
      </div>

      {resourcesExpanded && (
        <div
          className="overlay-panel"
          style={{
            padding: "10px 14px",
            marginTop: 4,
            maxHeight: 240,
            overflowY: "auto",
            fontSize: 11,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 12 }}>
            Per-Region Breakdown
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
            {countryIds.map((id) => {
              const r = gameState.regions[id];
              const cfg = COUNTRY_CONFIGS[id];
              const wf = workforceByCountry[id];
              const laborShortfall = wf.demand > r.population;
              const perCapita = computePerCapitaConsumption(r.population);
              const cascade = getHappinessCascade(r.happiness);
              const cascadeColor =
                cascade === "stable" ? "#22c55e"
                : cascade === "concerned" ? "rgba(255,255,255,0.5)"
                : cascade === "unrest" ? "#eab308"
                : cascade === "crisis" ? "#f97316"
                : "#ef4444";
              return (
                <div
                  key={id}
                  className="card"
                  style={{
                    borderLeft: `3px solid ${cfg.color}`,
                    opacity: id === viewCountry ? 1 : 0.85,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{cfg.name}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", color: "rgba(255,255,255,0.7)" }}>
                    {RESOURCE_LABELS_LIST.map(({ key, label, unit }) => (
                      <span key={key}>
                        {label}: <strong style={{ color: "#fff" }}>{Math.round(r[key])}{unit ?? ""}</strong>
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 10, color: laborShortfall ? "#f97316" : "rgba(255,255,255,0.5)" }}>
                    Workforce: {Math.round(r.population)} pop / {wf.demand} demand
                    {laborShortfall && " — buildings idling (LIFO)"}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
                    Per-capita drain/cycle: −{perCapita.food} food, −{perCapita.energy} energy, −{perCapita.money} money
                  </div>
                  <div style={{ marginTop: 4, fontSize: 10, color: cascadeColor }}>
                    Happiness: {HAPPINESS_CASCADE_LABELS[cascade]}
                    {cascade === "unrest" && " — population growth halved"}
                    {cascade === "crisis" && " — −5%/cycle population loss, buildings idle"}
                    {cascade === "collapse" && " — riots, −10%/cycle, no construction"}
                  </div>
                  <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexWrap: "wrap", gap: "4px 10px", color: "rgba(255,255,255,0.6)" }}>
                    {RESOURCE_DEPOSITS.map((dep) => (
                      <span key={dep}>
                        {RESOURCE_ICONS[dep]} {RESOURCE_LABELS[dep]}:{" "}
                        <strong style={{ color: "#fff" }}>{r.deposits[dep]}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
