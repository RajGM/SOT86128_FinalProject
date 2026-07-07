import { useGame } from "../../context/GameContext";
import { COUNTRY_CONFIGS, type CountryId } from "../../types/hex";
import { getCarbonTaxFloor } from "../../lib/summitMechanics";

const BOUNDARY_LABELS: Record<string, string> = {
  temperature: "🌡️ Temperature (Ecological Ceiling)",
  co2_concentration: "💨 CO₂ Concentration (Ecological Ceiling)",
  human_development: "🌾 Human Development (Social Floor)",
  inequality: "⚖️ Inequality / Justice Gap (Social Floor)",
  political_stability: "🏛️ Political Stability (Social Floor)",
};

const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS) as CountryId[];

export function SummitPanel() {
  const { gameState } = useGame();
  const { activeSummitResolutions, summitComplianceAlerts } = gameState;
  const taxFloor = getCarbonTaxFloor(gameState, "usa");

  const activeResolutions = activeSummitResolutions.filter((r) => r.active && r.passed);

  return (
    <div>
      <div className="section-title">Summit Resolutions — Doughnut Boundaries</div>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 10 }}>
        Resolutions are automatically enacted when planetary boundaries are breached. Compliance is
        optional but affects diplomatic relations.
      </p>

      {taxFloor > 0 && (
        <div className="card" style={{ marginBottom: 10, fontSize: 12, color: "#3b82f6" }}>
          Active carbon tax floor: <strong>≥ {taxFloor}</strong> (summit temperature resolution)
        </div>
      )}

      {gameState.tradeRestrictionSuspensionUntil > gameState.cycle && (
        <div className="card" style={{ marginBottom: 10, fontSize: 12, color: "#22c55e" }}>
          Trade restrictions suspended until cycle {gameState.tradeRestrictionSuspensionUntil}
        </div>
      )}

      <div className="section-title">Active Resolutions</div>
      {activeResolutions.length === 0 ? (
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>
          No active summit resolutions — world is in the safe space.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          {activeResolutions.map((r) => (
            <div key={r.id} className="card" style={{ fontSize: 11 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {BOUNDARY_LABELS[r.boundaryType] ?? r.boundaryType}
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                {r.resolutionText}
              </div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, marginBottom: 6 }}>
                Enacted cycle {r.passedAtCycle}
                {r.complianceDeadline !== null
                  ? ` · Compliance deadline cycle ${r.complianceDeadline}`
                  : ""}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 10 }}>
                {ALL_COUNTRIES.map((id) => (
                  <span key={id} title={COUNTRY_CONFIGS[id].name}>
                    {COUNTRY_CONFIGS[id].name}:{" "}
                    {r.compliance[id] ? "✅" : "❌"}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {summitComplianceAlerts.length > 0 && (
        <>
          <div className="section-title">Global Alerts</div>
          <div style={{ display: "grid", gap: 4, marginBottom: 12 }}>
            {summitComplianceAlerts.map((alert, i) => (
              <div key={i} style={{ fontSize: 11, color: "#f97316" }}>
                {alert}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
