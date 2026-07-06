/**
 * Summit resolutions verification — run with: npx tsx scripts/verify-summit.ts
 */
import { generateMap } from "../src/lib/mapGenerator";
import { createInitialGameState } from "../src/lib/gameState";
import {
  checkBoundariesInOrder,
  computeBotVote,
  createPendingVote,
  tallySummitVote,
  activateResolution,
  checkResolutionCompliance,
  getCarbonTaxFloor,
  isCeilingResolution,
  BOT_STRATEGY_BY_COUNTRY,
} from "../src/lib/summitMechanics";
import { computeSummitYesPercent } from "../src/lib/comparisonMetrics";
import type { CountryId } from "../src/types/hex";
import { COUNTRY_CONFIGS } from "../src/types/hex";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    passed++;
    console.log("PASS:", name);
  } else {
    failed++;
    console.log("FAIL:", name, detail);
  }
}

const hexes = generateMap(42);
const state = createInitialGameState(hexes);
const ALL = Object.keys(COUNTRY_CONFIGS) as CountryId[];

check("Initial state has no active resolutions", state.activeSummitResolutions.length === 0);
check("Initial pending vote is null", state.pendingSummitVote === null);
check("Initial tax floor is 0", getCarbonTaxFloor(state, "usa") === 0);

// Boundary 1: temperature at 1.5°C
const tempBreach = checkBoundariesInOrder({
  regions: state.regions,
  globalTemperature: 1.6,
  globalCo2ThisCycle: 50,
  worldHappiness: 60,
  cycle: 5,
  climateFinanceGiven: {},
  peakGlobalPopulation: 200,
  currentGlobalPopulation: 200,
  cycleCo2ByCountry: { usa: 50 },
});
check("Temp 1.6°C triggers tax ≥ 20", tempBreach?.boundaryType === "temperature" && tempBreach.threshold === 20);
check("Temp 2.1°C triggers tax ≥ 40", (() => {
  const b = checkBoundariesInOrder({
    regions: state.regions,
    globalTemperature: 2.1,
    globalCo2ThisCycle: 50,
    worldHappiness: 60,
    cycle: 5,
    climateFinanceGiven: {},
    peakGlobalPopulation: 200,
    currentGlobalPopulation: 200,
    cycleCo2ByCountry: {},
  });
  return b?.threshold === 40;
})());

// Boundary 2: CO₂ flow
const co2Breach = checkBoundariesInOrder({
  regions: state.regions,
  globalTemperature: 1.0,
  globalCo2ThisCycle: 250,
  worldHappiness: 60,
  cycle: 5,
  climateFinanceGiven: {},
  peakGlobalPopulation: 200,
  currentGlobalPopulation: 200,
  cycleCo2ByCountry: { usa: 100, china: 80, eu: 70 },
});
check("Global CO₂ 250 triggers top-3 reduction", co2Breach?.boundaryType === "co2_concentration");
check("CO₂ reduction 10% at warning", co2Breach?.reductionPercent === 10);

// Vote tally
const votes = {
  usa: "yes" as const,
  eu: "yes" as const,
  china: "yes" as const,
  india: "yes" as const,
  latam: "yes" as const,
  africa: "no" as const,
  russia: "no" as const,
  opec: "abstain" as const,
};
const tally = tallySummitVote(votes);
check("5 yes vs 2 no passes", tally.passed === true, `yes=${tally.yesCount} no=${tally.noCount}`);

const failVotes = {
  usa: "yes" as const,
  eu: "yes" as const,
  china: "yes" as const,
  india: "no" as const,
  latam: "no" as const,
  africa: "no" as const,
  russia: "no" as const,
  opec: "abstain" as const,
};
check("3 yes vs 4 no fails", tallySummitVote(failVotes).passed === false);

// Bot strategies assigned
check("OPEC is fossil maximiser", BOT_STRATEGY_BY_COUNTRY.opec === "fossil_maximiser");
check("EU is green pioneer", BOT_STRATEGY_BY_COUNTRY.eu === "green_pioneer");

if (tempBreach) {
  const pending = createPendingVote(tempBreach, 5);
  check("OPEC votes NO on tax ceiling", computeBotVote("opec", pending, state.regions) === "no");
  check("EU votes YES on tax ceiling", computeBotVote("eu", pending, state.regions) === "yes");
}

// Activate resolution and compliance
if (tempBreach) {
  const pending = createPendingVote(tempBreach, 5);
  const allYes = Object.fromEntries(ALL.map((id) => [id, "yes" as const]));
  const resolution = activateResolution({ ...pending, votes: allYes }, true, state.regions, 5);
  const activeState = {
    ...state,
    activeSummitResolutions: [resolution],
  };
  check("Tax floor becomes 20 after passage", getCarbonTaxFloor(activeState, "opec") === 20);

  const nonCompliant = checkResolutionCompliance(
    resolution,
    "opec",
    { ...state.regions, opec: { ...state.regions.opec, carbonTax: 0 } },
    6,
    [],
    []
  );
  check("OPEC tax 0 is non-compliant", !nonCompliant.compliant);
}

check("Ceiling resolutions identified", isCeilingResolution("temperature"));
check("Floor resolutions identified", !isCeilingResolution("inequality"));

// Summit metric abstain = 0.5
const metric = computeSummitYesPercent("usa", [
  { cycle: 1, resolution: "test", votes: { usa: "yes" } },
  { cycle: 2, resolution: "test2", votes: { usa: "abstain" } },
]);
check("Summit metric: yes + abstain = 0.75", Math.abs(metric - 0.75) < 0.01, `got ${metric}`);

console.log(`\n--- ${passed} passed, ${failed} failed ---`);
process.exit(failed > 0 ? 1 : 0);
