import { useGame } from "../../context/GameContext";
import { getResearchCost, getResearchBonus, getBreakthroughDescription, LICENSING_MODELS } from "../../lib/research";
import { BUILD_DEFINITIONS } from "../../config/builds";
import type { BuildCategory } from "../../types/game";
import { COUNTRY_CONFIGS } from "../../types/hex";

const CATEGORIES: BuildCategory[] = ["energy", "production", "population", "food", "transport"];

export function ResearchPanel() {
  const {
    gameState,
    viewCountry,
    agreeBreakthrough,
    joinCombinedResearch,
    purchaseResearchLicense,
    applyIncrementalResearch,
  } = useGame();

  const region = gameState.regions[viewCountry];
  const proposal = gameState.breakthroughProposal;

  return (
    <div>
      <div className="section-title">Post-Tier-3 Incremental Research</div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>
        After maxing a category at Tier 3, unlock infinite +5% efficiency upgrades. Cost scales linearly (level × base).
      </p>
      {CATEGORIES.map((cat) => {
        const level = region.researchLevels[cat] ?? 0;
        const cost = getResearchCost(cat, level);
        const bonus = getResearchBonus(level);
        return (
          <div key={cat} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ textTransform: "capitalize", fontWeight: 600 }}>{cat}</span>
              <span>Lv {level} (+{Math.round(bonus * 100)}%)</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
              Next upgrade: {cost} money
            </div>
            <button
              className="overlay-btn"
              style={{ marginTop: 6 }}
              disabled={region.money < cost}
              onClick={() => applyIncrementalResearch(cat)}
            >
              Research (+5% efficiency)
            </button>
          </div>
        );
      })}

      <div className="section-title">Breakthrough Research (Collaborative)</div>
      {proposal && (
        <div className="card">
          <div style={{ fontWeight: 700 }}>{proposal.name}</div>
          <p style={{ color: "rgba(255,255,255,0.6)", margin: "6px 0" }}>
            {getBreakthroughDescription(proposal.name)}
          </p>
          <div style={{ fontSize: 11, marginBottom: 8 }}>
            <strong>Required:</strong> USA + EU + 2 random partners each cycle.
            <br />
            <strong>Partners this cycle:</strong>{" "}
            {proposal.requiredParticipants.map((c) => COUNTRY_CONFIGS[c].name).join(", ")}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {proposal.requiredParticipants.map((c) => {
              const agreed = proposal.agreed.includes(c);
              return (
                <button
                  key={c}
                  className={`overlay-btn ${agreed ? "active" : ""}`}
                  disabled={agreed}
                  onClick={() => agreeBreakthrough(c)}
                >
                  {agreed ? "✓ " : ""}{COUNTRY_CONFIGS[c].name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="section-title">Combined Research (Pooled Projects)</div>
      {gameState.combinedProjects.map((project) => (
        <div key={project.id} className="card">
          <div style={{ fontWeight: 700 }}>{project.name}</div>
          <div style={{ color: "rgba(255,255,255,0.6)" }}>{project.goal}</div>
          <div style={{ marginTop: 6 }}>
            Progress: {project.progress}/{project.target}
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 4, height: 6, marginTop: 4 }}>
              <div
                style={{
                  background: "#3b82f6",
                  height: "100%",
                  borderRadius: 4,
                  width: `${Math.min(100, (project.progress / project.target) * 100)}%`,
                }}
              />
            </div>
          </div>
          <div style={{ fontSize: 11, marginTop: 6 }}>
            Participants: {project.participants.map((c) => COUNTRY_CONFIGS[c].name).join(", ")}
          </div>
          <button
            className="overlay-btn"
            style={{ marginTop: 6 }}
            onClick={() => joinCombinedResearch(project.id, viewCountry, 25)}
          >
            Contribute 25 money ({COUNTRY_CONFIGS[viewCountry].name})
          </button>
        </div>
      ))}

      <div className="section-title">Research Licensing</div>
      {LICENSING_MODELS.map((m) => (
        <div key={m.id} style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
          <strong>{m.label}:</strong> {m.description}
        </div>
      ))}
      {gameState.researchLicenses.map((lic) => (
        <div key={lic.id} className="card">
          <div style={{ fontWeight: 600 }}>{lic.breakthrough}</div>
          <div>Seller: {COUNTRY_CONFIGS[lic.seller].name} · {lic.model === "one_time" ? "One-time" : "Royalty"} · {lic.price} money</div>
          {lic.status === "offered" && (
            <button
              className="overlay-btn"
              style={{ marginTop: 6 }}
              onClick={() => purchaseResearchLicense(lic.id, viewCountry)}
            >
              Purchase for {COUNTRY_CONFIGS[viewCountry].name}
            </button>
          )}
          {lic.status === "accepted" && (
            <span style={{ color: "#22c55e" }}>Licensed to {lic.buyer && COUNTRY_CONFIGS[lic.buyer].name}</span>
          )}
        </div>
      ))}

      <div className="section-title">Build Catalog Reference</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
        {BUILD_DEFINITIONS.length} build types across energy, production, population, food, and transport.
      </div>
    </div>
  );
}
