/**
 * V1 + population mechanics verification — run with: npx tsx scripts/verify-v1-mechanics.ts
 */
import { generateMap } from "../src/lib/mapGenerator";
import { createInitialGameState, processCycle } from "../src/lib/gameState";
import {
  computeIdleBuildingIds,
  computeMaterialShortageIdleIds,
  computeFarmClimateFoodAdjustment,
  EXTRACTOR_YIELD,
  FOSSIL_FUEL_PER_CYCLE,
  getExtractorYield,
} from "../src/lib/buildEconomics";
import {
  applyPopulationEffects,
  applyUnrestPopulationPenalty,
  computeNationalCo2HappinessDelta,
  computePerCapitaConsumption,
  computeTemperatureHappinessDelta,
  shouldForceAllBuildingsIdle,
} from "../src/lib/populationMechanics";
import { BUILD_BY_ID } from "../src/config/builds";
import type { PlacedBuilding } from "../src/types/game";
import { emptyDepositCounts } from "../src/types/hex";

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

// No mixed deposits on map
const mixedTiles = hexes.filter((h) => (h.resource as string) === "mixed");
check("No mixed deposit tiles", mixedTiles.length === 0);

// OPEC has no uranium tiles
const opecUranium = hexes.filter((h) => h.countryId === "opec" && h.resource === "uranium");
check("OPEC has no uranium tiles", opecUranium.length === 0);

// Starting stockpiles are zero
check("USA starts with empty fuel stockpile", state.regions.usa.deposits.fuel === 0);

// Extractor yields by tile type
const fuelHex = hexes.find((h) => h.resource === "fuel")!;
const extractor: PlacedBuilding = {
  id: "ext-1",
  type: "extractor",
  tier: 2,
  builtAt: 1,
  q: fuelHex.q,
  r: fuelHex.r,
  countryId: fuelHex.countryId,
};
const yieldResult = getExtractorYield(extractor, fuelHex, false);
check(
  "Extractor T2 yields 4 on fuel tile",
  yieldResult?.deposit === "fuel" && yieldResult.amount === EXTRACTOR_YIELD[2]
);

// Workforce LIFO
const buildings: PlacedBuilding[] = [
  { id: "b1", type: "farm", tier: 1, builtAt: 1, q: 0, r: 0, countryId: "usa" },
  { id: "b2", type: "city", tier: 1, builtAt: 2, q: 1, r: 0, countryId: "usa" },
];
const idle = computeIdleBuildingIds(buildings, 8);
check("LIFO idles newest building first", idle.has("b2") && !idle.has("b1"));

// Crisis forces all buildings idle
check("Crisis forces all buildings idle", shouldForceAllBuildingsIdle(20));
const crisisIdle = computeIdleBuildingIds(buildings, 1000, 20);
check("Crisis idles every building", crisisIdle.has("b1") && crisisIdle.has("b2"));

// Fossil plant fuel shortage
const fossil: PlacedBuilding = {
  id: "fp-1",
  type: "fossil_plant",
  tier: 1,
  builtAt: 1,
  q: 0,
  r: 0,
  countryId: "usa",
};
const materialIdle = computeMaterialShortageIdleIds(
  [fossil],
  new Set(),
  emptyDepositCounts()
);
check(
  "Fossil plant idle without fuel",
  materialIdle.has("fp-1")
);
check(
  "Fossil T1 needs 1 fuel",
  FOSSIL_FUEL_PER_CYCLE[1] === 1
);

// Manufacturing is only tech source in builds config
const techProducers = Object.values(BUILD_BY_ID).filter((b) =>
  Object.values(b.effectsByTier).some((e) => (e.technology ?? 0) > 0)
);
check("Only Manufacturing produces technology", techProducers.length === 1 && techProducers[0].id === "manufacturing");

// Cycle processing runs
const withExtractor = {
  ...state,
  tileBuildings: {
    [`${fuelHex.q},${fuelHex.r}`]: extractor,
  },
  regions: {
    ...state.regions,
    [fuelHex.countryId ?? "usa"]: {
      ...state.regions[fuelHex.countryId ?? "usa"],
      population: 100,
      money: 500,
    },
  },
};
const afterCycle = processCycle(withExtractor, hexes);
const regionId = fuelHex.countryId ?? "usa";
check(
  "Extractor adds fuel after cycle",
  afterCycle.regions[regionId].deposits.fuel >= EXTRACTOR_YIELD[2]
);
check("Cycle counter advances", afterCycle.cycle === state.cycle + 1);

// Green plant tech cost
check("Green T1 costs 10 tech", BUILD_BY_ID.green_plant.costByTier[1].tech === 10);

// 12 building types
check("12 building types defined", Object.keys(BUILD_BY_ID).length === 12);

// --- Population mechanics (population-mechanics.md) ---
check(
  "China per-capita food drain is 42/cycle",
  computePerCapitaConsumption(1400).food === 42
);
check(
  "USA per-capita food drain is 10/cycle",
  computePerCapitaConsumption(330).food === 10
);
check(
  "USA CO₂ > 500 gives −6 happiness/cycle",
  computeNationalCo2HappinessDelta(520) === -6
);
check(
  "India CO₂ 120 gives 0 happiness/cycle",
  computeNationalCo2HappinessDelta(120) === 0
);
check(
  "Global temp +2.3°C gives −5 happiness/cycle",
  computeTemperatureHappinessDelta(2.3) === -5
);
check(
  "Unrest halves village population yield",
  applyUnrestPopulationPenalty({ population: 30 }, "village", 40).population === 15
);
check(
  "Stable happiness does not halve city yield",
  applyUnrestPopulationPenalty({ population: 80 }, "city", 70).population === 80
);

// Farm climate penalty applied after temperature update (step 10)
check(
  "Farm climate penalty at +2.5°C is −20% food",
  computeFarmClimateFoodAdjustment(20, 2.5) === -4
);
check(
  "No farm climate penalty at +1.5°C",
  computeFarmClimateFoodAdjustment(20, 1.5) === 0
);

// Per-capita consumption runs each cycle
const chinaBefore = state.regions.china.food;
const afterChinaCycle = processCycle(state, hexes);
check(
  "China loses food to per-capita drain each cycle",
  afterChinaCycle.regions.china.food < chinaBefore
);

// Population loss is gone (not transferred) — trade-only migration
const lossState = {
  ...state,
  regions: {
    ...state.regions,
    india: { ...state.regions.india, happiness: 20, population: 1000 },
    eu: { ...state.regions.eu, happiness: 85, population: 220 },
  },
};
const lossResult = applyPopulationEffects(
  lossState.regions,
  lossState.tileBuildings,
  ["india", "eu", "usa", "china", "russia", "opec", "latam", "africa"]
);
check(
  "Crisis population loss stays gone (not transferred)",
  lossResult.regions.india.population === 950 &&
    lossResult.regions.eu.population === 220
);

console.log(`\n--- ${passed} passed, ${failed} failed ---`);
process.exit(failed > 0 ? 1 : 0);
