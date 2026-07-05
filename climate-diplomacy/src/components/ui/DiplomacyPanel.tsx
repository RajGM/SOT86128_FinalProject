import { useGame } from "../../context/GameContext";
import { REGION_PROFILES } from "../../config/regionProfiles";
import { computePriorityMap, generateSuggestions, PRIORITY_COLORS } from "../../lib/priorityMap";
import { COUNTRY_CONFIGS, type CountryId } from "../../types/hex";

export function DiplomacyPanel() {
  const { gameState, viewCountry, setViewCountry } = useGame();
  const profile = REGION_PROFILES[viewCountry];
  const priorities = computePriorityMap(gameState.regions[viewCountry], viewCountry);
  const suggestions = generateSuggestions(gameState.regions[viewCountry], viewCountry);

  const countryIds = Object.keys(COUNTRY_CONFIGS) as CountryId[];

  return (
    <div>
      <div className="section-title">View Region</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {countryIds.map((id) => (
          <button
            key={id}
            className={`overlay-btn ${viewCountry === id ? "active" : ""}`}
            onClick={() => setViewCountry(id)}
            style={{ borderLeft: `3px solid ${COUNTRY_CONFIGS[id].color}` }}
          >
            {COUNTRY_CONFIGS[id].name}
          </button>
        ))}
      </div>

      <div className="section-title">Region Identity — {COUNTRY_CONFIGS[viewCountry].name}</div>
      <div className="card">
        <div><strong>Main richness:</strong> {profile.mainRichness}</div>
        <div><strong>Secondary:</strong> {profile.secondaryStrength}</div>
        <div><strong>Weakness:</strong> {profile.mainWeakness}</div>
      </div>

      <div className="section-title">Domestic Agenda</div>
      <div className="card">
        {profile.agenda.map((a) => (
          <span
            key={a}
            style={{
              display: "inline-block",
              background: "rgba(59,130,246,0.2)",
              padding: "2px 8px",
              borderRadius: 4,
              margin: "2px 4px 2px 0",
              fontSize: 11,
            }}
          >
            {a}
          </span>
        ))}
        <p style={{ marginTop: 8, color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
          Builds matching agenda boost happiness; violations create political cost.
        </p>
      </div>

      <div className="section-title">Priority Map</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {priorities.map((p) => (
          <div key={p.category} className="card" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="status-dot" style={{ background: PRIORITY_COLORS[p.status] }} />
            <span>{p.label}</span>
          </div>
        ))}
      </div>

      <div className="section-title">Advisory Suggestions (2–3 per cycle)</div>
      {suggestions.map((s) => (
        <div key={s.id} className="card" style={{ borderLeft: "3px solid #eab308" }}>
          {s.text}
        </div>
      ))}

      <div className="section-title">International Relations</div>
      {countryIds
        .filter((id) => id !== viewCountry)
        .map((id) => {
          const rel = gameState.regions[viewCountry].relations[id] ?? 50;
          return (
            <div key={id} className="card" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{COUNTRY_CONFIGS[id].name}</span>
              <span style={{ color: rel >= 60 ? "#22c55e" : rel >= 40 ? "#eab308" : "#ef4444" }}>
                {rel}/100
              </span>
            </div>
          );
        })}

      <div className="section-title">World Happiness</div>
      <div className="card">
        Global legitimacy: <strong>{Math.round(gameState.worldHappiness)}%</strong>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
          Falls when disasters rise or agreements fail; rises when emissions fall without mass shortages.
        </p>
      </div>
    </div>
  );
}
