import { useMemo } from "react";
import { useGame } from "../../context/GameContext";
import { aggregateResources, aggregateDeposits } from "../../lib/gameState";
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
  { key: "goods", label: "Goods" },
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
