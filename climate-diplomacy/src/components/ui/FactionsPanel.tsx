import { useGame } from "../../context/GameContext";
import { REGION_PROFILES } from "../../config/regionProfiles";
import {
  computeFactionPercents,
  countFactionBuildings,
  FACTION_SATISFACTION_BASE,
} from "../../lib/factionMechanics";
import {
  CARBON_TAX_RECYCLING_OPTIONS,
  calculateTaxCollected,
} from "../../lib/carbonTaxMechanics";
import { getCarbonTaxCeiling, getCarbonTaxFloor } from "../../lib/summitMechanics";
import { COUNTRY_CONFIGS, type CountryId } from "../../types/hex";
import type { CarbonTaxRecycling } from "../../types/game";

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
    setCarbonTaxRecycling,
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

  const cycleStartTax = gameState.cycleStartCarbonTax[viewCountry] ?? region.carbonTax;
  const taxChangedThisCycle = region.carbonTax !== cycleStartTax;
  const climateFinanceSent = gameState.climateFinanceGiven[viewCountry] ?? 0;

  const prevCo2 = gameState.previousCycleCo2[viewCountry] ?? region.co2;
  const lastCycleEmissions = Math.max(0, region.co2 - prevCo2);
  const projectedTax = calculateTaxCollected(lastCycleEmissions, region.carbonTax);

  const recyclingOption = CARBON_TAX_RECYCLING_OPTIONS.find(
    (o) => o.id === region.carbonTaxRecycling
  );

  const taxFloor = getCarbonTaxFloor(gameState, viewCountry);
  const taxCeiling = getCarbonTaxCeiling(gameState, viewCountry);
  const carbonTaxEnabled = gameState.gameMode?.enableCarbonTax ?? true;

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

      {carbonTaxEnabled ? (
        <>
          <div className="section-title">Carbon Tax</div>
          <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ minWidth: 72 }}>
            Rate: <strong>{region.carbonTax}</strong>/100
          </span>
          <input
            type="range"
            min={taxFloor}
            max={taxCeiling ?? 100}
            step={5}
            value={region.carbonTax}
            onChange={(e) => setCarbonTax(viewCountry, Number(e.target.value))}
            style={{ flex: 1, accentColor: "#3b82f6" }}
          />
          <button
            className="overlay-btn"
            onClick={() => setCarbonTax(viewCountry, region.carbonTax - 5)}
            disabled={region.carbonTax <= taxFloor}
          >
            −5
          </button>
          <button
            className="overlay-btn"
            onClick={() => setCarbonTax(viewCountry, region.carbonTax + 5)}
            disabled={region.carbonTax >= (taxCeiling ?? 100)}
          >
            +5
          </button>
        </div>

        {taxFloor > 0 && (
          <p style={{ fontSize: 10, color: "#3b82f6", margin: "0 0 8px" }}>
            Summit floor: minimum rate {taxFloor} while temperature resolution is active.
          </p>
        )}
        {taxCeiling !== null && (
          <p style={{ fontSize: 10, color: "#eab308", margin: "0 0 8px" }}>
            Stability freeze: cannot raise above {taxCeiling} this cycle.
          </p>
        )}

        <label style={{ display: "block", fontSize: 11, marginBottom: 4, color: "rgba(255,255,255,0.7)" }}>
          Revenue recycling
        </label>
        <select
          className="overlay-select"
          value={region.carbonTaxRecycling}
          onChange={(e) => setCarbonTaxRecycling(viewCountry, e.target.value as CarbonTaxRecycling)}
          style={{
            width: "100%",
            marginBottom: 8,
            background: "rgba(0,0,0,0.35)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 4,
            padding: "6px 8px",
            fontSize: 11,
          }}
        >
          {CARBON_TAX_RECYCLING_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>

        {recyclingOption && (
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: "0 0 8px" }}>
            {recyclingOption.description}
          </p>
        )}

        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", display: "grid", gap: 4 }}>
          <span>
            Est. collection next cycle: <strong>{projectedTax}</strong> money
            {lastCycleEmissions > 0 && ` (${lastCycleEmissions} CO₂ × ${region.carbonTax}%)`}
          </span>
          {region.greenSubsidyPool > 0 && (
            <span>
              Green subsidy pool: <strong style={{ color: "#22c55e" }}>{region.greenSubsidyPool}</strong>
            </span>
          )}
          {climateFinanceSent > 0 && (
            <span>
              Climate finance given (total): <strong>{climateFinanceSent}</strong>
            </span>
          )}
          {taxChangedThisCycle && (
            <span style={{ color: "#eab308" }}>
              Tax changed this cycle — faction effects apply at cycle end
            </span>
          )}
        </div>

        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 8, marginBottom: 0 }}>
          Tax is levied on this cycle&apos;s emissions (buildings + transport). Does not reduce CO₂
          directly — replace fossil infrastructure to cut emissions. Summit votes and compliance
          are on the Dashboard → Summit tab.
        </p>
          </div>
        </>
      ) : (
        <div className="card" style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
          Carbon tax and summit cooperation mechanics are disabled in Easy mode.
        </div>
      )}
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
  const region = gameState.regions[countryId];
  const { brownSatisfaction, greenSatisfaction } = region.factions;

  return (
    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>
      Factions:{" "}
      <span style={{ color: "#f97316" }}>{percents.brownPercent}%B ({brownSatisfaction})</span>
      {" / "}
      <span style={{ color: "#22c55e" }}>{percents.greenPercent}%G ({greenSatisfaction})</span>
      {region.carbonTax > 0 && (
        <>
          {" · "}
          <span style={{ color: "#3b82f6" }}>Tax {region.carbonTax}%</span>
        </>
      )}
    </span>
  );
}
