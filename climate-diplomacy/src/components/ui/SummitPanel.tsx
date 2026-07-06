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

function voteBadge(choice?: string): string {
  if (choice === "yes") return "✅ YES";
  if (choice === "no") return "❌ NO";
  if (choice === "abstain") return "➖ ABSTAIN";
  return "—";
}

export function SummitPanel() {
  const { gameState, viewCountry } = useGame();
  const { activeSummitResolutions, summitHistory, summitComplianceResults, summitComplianceAlerts } =
    gameState;
  const taxFloor = getCarbonTaxFloor(gameState, viewCountry);

  const myCompliance = summitComplianceResults.filter((c) => c.countryId === viewCountry);
  const recentVotes = [...gameState.summitVotes].slice(-5).reverse();

  return (
    <div>
      <div className="section-title">Summit Resolutions — Doughnut Boundaries</div>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 10 }}>
        Boundaries 1–5 are checked each cycle in priority order. First breach triggers one vote.
        Passed resolutions stay active with per-cycle compliance tracking.
      </p>

      {gameState.pendingSummitVote && (
        <div
          className="card"
          style={{ marginBottom: 10, borderLeft: "3px solid #eab308", fontSize: 12 }}
        >
          ⏳ Vote in progress: {gameState.pendingSummitVote.resolutionText}
        </div>
      )}

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
      {activeSummitResolutions.filter((r) => r.active && r.passed).length === 0 ? (
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>
          No active summit resolutions — world is in the safe space.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          {activeSummitResolutions
            .filter((r) => r.active && r.passed)
            .map((r) => (
              <div key={r.id} className="card" style={{ fontSize: 11 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {BOUNDARY_LABELS[r.boundaryType] ?? r.boundaryType}
                </div>
                <div style={{ color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                  {r.resolutionText}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 10 }}>
                  Passed cycle {r.cycle}
                  {r.complianceDeadline ? ` · Compliance deadline cycle ${r.complianceDeadline}` : ""}
                </div>
              </div>
            ))}
        </div>
      )}

      {myCompliance.length > 0 && (
        <>
          <div className="section-title">Your Compliance (last cycle)</div>
          <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
            {myCompliance.map((c) => (
              <div
                key={c.resolutionId}
                className="card"
                style={{
                  fontSize: 11,
                  borderLeft: `3px solid ${c.compliant ? "#22c55e" : "#ef4444"}`,
                }}
              >
                {c.compliant ? "✅" : "⚠️"} {c.reason}
              </div>
            ))}
          </div>
        </>
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

      <div className="section-title">Voting Record</div>
      {recentVotes.length === 0 ? (
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>No summit votes yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {recentVotes.map((record, i) => (
            <div key={i} className="card" style={{ fontSize: 11 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Cycle {record.cycle}: {record.passed ? "✅ Passed" : "❌ Failed"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>
                {record.resolution}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 10 }}>
                {(Object.keys(COUNTRY_CONFIGS) as CountryId[]).map((id) => (
                  <span key={id}>
                    {COUNTRY_CONFIGS[id].name}: {voteBadge(record.votes[id])}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {summitHistory.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 12 }}>
            Full History ({summitHistory.length})
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", maxHeight: 120, overflowY: "auto" }}>
            {summitHistory
              .slice()
              .reverse()
              .map((r) => (
                <div key={r.id} style={{ marginBottom: 4 }}>
                  C{r.cycle} {r.passed ? "✓" : "✗"} [{r.boundaryType}] {r.resolutionText.slice(0, 60)}…
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
