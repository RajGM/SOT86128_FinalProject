import { useGame } from "../../context/GameContext";
import { REGION_PROFILES } from "../../config/regionProfiles";
import {
  computeFactionPercents,
  countFactionBuildings,
  FACTION_SATISFACTION_BASE,
} from "../../lib/factionMechanics";
import { COUNTRY_CONFIGS, type CountryId } from "../../types/hex";

function satisfactionColor(value: number): string {
  if (value >= 70) return "#22c55e";
  if (value >= 50) return "#eab308";
  if (value >= 30) return "#f97316";
  return "#ef4444";
}

export function FactionsPanel() {
  const {
    gameState,
    viewCountry,
    setCarbonTax,
    recordSummitVote,
  } = useGame();

  const profile = REGION_PROFILES[viewCountry];
  const region = gameState.regions[viewCountry];
  const buildings = Object.values(gameState.tileBuildings);
  const counts = countFactionBuildings(buildings, viewCountry);
  const percents = computeFactionPercents(profile, counts);
  const { brownSatisfaction, greenSatisfaction } = region.factions;

  const modifier =
    (percents.brownPercent * brownSatisfaction +
      percents.greenPercent * greenSatisfaction) /
    100;
  const happinessDelta = Math.round(modifier - FACTION_SATISFACTION_BASE);

  return (
    <div>
      <div className="section-title">Domestic Factions — Green vs Brown</div>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 10 }}>
        Infrastructure choices reshape your political balance. Legacy economy weights reflect
        pre-game fossil vs clean employment (IEA/IRENA/World Bank).
      </p>

      <div className="card" style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#f97316", fontWeight: 700 }}>Brown {percents.brownPercent}%</span>
          <span style={{ color: "#22c55e", fontWeight: 700 }}>Green {percents.greenPercent}%</span>
        </div>
        <div
          style={{
            height: 10,
            borderRadius: 5,
            overflow: "hidden",
            display: "flex",
            background: "rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ width: `${percents.brownPercent}%`, background: "#f97316" }} />
          <div style={{ width: `${percents.greenPercent}%`, background: "#22c55e" }} />
        </div>
        <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
          Legacy: {profile.legacyBrown} brown / {profile.legacyGreen} green · Buildings:{" "}
          {counts.totalBuildings} ({counts.brownWeight.toFixed(1)} brown,{" "}
          {counts.greenWeight.toFixed(1)} green weighted)
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div className="card" style={{ borderLeft: "3px solid #f97316" }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Brown Faction</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: satisfactionColor(brownSatisfaction) }}>
            {brownSatisfaction}%
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
            Pro-fossil, pro-growth · {percents.brownPercent}% of electorate
          </div>
        </div>
        <div className="card" style={{ borderLeft: "3px solid #22c55e" }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Green Faction</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: satisfactionColor(greenSatisfaction) }}>
            {greenSatisfaction}%
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
            Pro-regulation, anti-fossil · {percents.greenPercent}% of electorate
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Happiness impact this cycle</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
          Weighted satisfaction modifier: <strong>{modifier.toFixed(1)}</strong>
          {" · "}
          Net happiness delta:{" "}
          <strong style={{ color: happinessDelta >= 0 ? "#22c55e" : "#ef4444" }}>
            {happinessDelta >= 0 ? "+" : ""}
            {happinessDelta}
          </strong>
          {" "}(baseline {FACTION_SATISFACTION_BASE})
        </div>
      </div>

      <div className="section-title">Carbon Tax</div>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span>Rate: <strong>{region.carbonTax}</strong>/100</span>
          <button
            className="overlay-btn"
            onClick={() => setCarbonTax(viewCountry, region.carbonTax - 5)}
          >
            −5
          </button>
          <button
            className="overlay-btn"
            onClick={() => setCarbonTax(viewCountry, region.carbonTax + 5)}
          >
            +5
          </button>
        </div>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
          Raising tax pleases green factions, angers brown. Applied at next cycle end.
        </p>
      </div>

      <div className="section-title">Summit — Emission Limits Vote</div>
      <div className="card" style={{ display: "flex", gap: 8 }}>
        <button
          className="overlay-btn primary"
          onClick={() => recordSummitVote(viewCountry, true)}
        >
          Vote YES
        </button>
        <button
          className="overlay-btn danger"
          onClick={() => recordSummitVote(viewCountry, false)}
        >
          Vote NO
        </button>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", alignSelf: "center" }}>
          Record vote for this cycle (processed at cycle end)
        </span>
      </div>
    </div>
  );
}

export function FactionSummaryChip({ countryId }: { countryId: CountryId }) {
  const { gameState } = useGame();
  const profile = REGION_PROFILES[countryId];
  const buildings = Object.values(gameState.tileBuildings);
  const percents = computeFactionPercents(
    profile,
    countFactionBuildings(buildings, countryId)
  );
  const { brownSatisfaction, greenSatisfaction } = gameState.regions[countryId].factions;

  return (
    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>
      Factions:{" "}
      <span style={{ color: "#f97316" }}>{percents.brownPercent}%B ({brownSatisfaction})</span>
      {" / "}
      <span style={{ color: "#22c55e" }}>{percents.greenPercent}%G ({greenSatisfaction})</span>
    </span>
  );
}
