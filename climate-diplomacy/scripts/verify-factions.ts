/**
 * Domestic factions verification — run with: npx tsx scripts/verify-factions.ts
 */
import { generateMap } from "../src/lib/mapGenerator";
import { createInitialGameState, processCycle } from "../src/lib/gameState";
import { REGION_PROFILES } from "../src/config/regionProfiles";
import {
  applyFactionHappinessDelta,
  applyFactionSatisfactionChanges,
  computeFactionPercents,
  countFactionBuildings,
  createEmptyFactionCycleEvents,
  createInitialFactionState,
  FACTION_SATISFACTION_BASE,
  getBuildingFactionWeights,
  recordBuildFactionEvent,
} from "../src/lib/factionMechanics";
import type { PlacedBuilding } from "../src/types/game";

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

// Starting percentages from legacy weights only
check(
  "OPEC starts 90% brown",
  computeFactionPercents(REGION_PROFILES.opec, { brownWeight: 0, greenWeight: 0, totalBuildings: 0 }).brownPercent === 90
);
check(
  "EU starts 30% brown",
  computeFactionPercents(REGION_PROFILES.eu, { brownWeight: 0, greenWeight: 0, totalBuildings: 0 }).brownPercent === 30
);
check(
  "China starts 50/50",
  computeFactionPercents(REGION_PROFILES.china, { brownWeight: 0, greenWeight: 0, totalBuildings: 0 }).brownPercent === 50
);

// OPEC green transition examples from doc
function opecAfterBuilds(greenPlants: number, manufacturing = 0): number {
  const buildings: PlacedBuilding[] = [];
  for (let i = 0; i < greenPlants; i++) {
    buildings.push({
      id: `gp-${i}`,
      type: "green_plant",
      tier: 1,
      builtAt: i,
      q: i,
      r: 0,
      countryId: "opec",
    });
  }
  for (let i = 0; i < manufacturing; i++) {
    buildings.push({
      id: `mfg-${i}`,
      type: "manufacturing",
      tier: 1,
      builtAt: 100 + i,
      q: 10 + i,
      r: 0,
      countryId: "opec",
    });
  }
  const counts = countFactionBuildings(buildings, "opec");
  return computeFactionPercents(REGION_PROFILES.opec, counts).brownPercent;
}

check("OPEC +1 green plant → 82% brown", opecAfterBuilds(1) === 82);
check("OPEC +2 green plants → 75% brown", opecAfterBuilds(2) === 75);
check("OPEC +3 green plants → 69% brown", opecAfterBuilds(3) === 69);
check("OPEC +3 green +1 mfg → 64% brown", opecAfterBuilds(3, 1) === 64);

// EU fossil backlash example
function euAfterFossil(count: number): number {
  const buildings: PlacedBuilding[] = [];
  for (let i = 0; i < count; i++) {
    buildings.push({
      id: `fp-${i}`,
      type: "fossil_plant",
      tier: 1,
      builtAt: i,
      q: i,
      r: 0,
      countryId: "eu",
    });
  }
  const counts = countFactionBuildings(buildings, "eu");
  return computeFactionPercents(REGION_PROFILES.eu, counts).brownPercent;
}
check("EU +2 fossil → 42% brown", euAfterFossil(2) === 42);

// Building classification
check("Fossil is brown", getBuildingFactionWeights("fossil_plant").brown === 1);
check("City is neutral 0.5/0.5", getBuildingFactionWeights("city").brown === 0.5);
check("Manufacturing is green", getBuildingFactionWeights("manufacturing").green === 1);

// Satisfaction: fossil plant build
let events = createEmptyFactionCycleEvents();
events = recordBuildFactionEvent(events, "fossil_plant");
let factions = applyFactionSatisfactionChanges(createInitialFactionState(), events);
check("Fossil build +5 brown", factions.brownSatisfaction === 65);
check("Fossil build -5 green", factions.greenSatisfaction === 55);

// Green plant build
events = recordBuildFactionEvent(createEmptyFactionCycleEvents(), "green_plant");
factions = applyFactionSatisfactionChanges(createInitialFactionState(), events);
check("Green build +5 green", factions.greenSatisfaction === 65);
check("Green build -3 brown", factions.brownSatisfaction === 57);

// Happiness modifier at baseline
const percents = { brownPercent: 90, greenPercent: 10 };
const neutralFactions = createInitialFactionState();
const mod = applyFactionHappinessDelta(70, percents, neutralFactions);
check("Baseline satisfaction → no happiness change", mod === 70);

// Unhappy brown majority drags happiness
const unhappyBrown = { brownSatisfaction: 30, greenSatisfaction: 60 };
const dragged = applyFactionHappinessDelta(70, percents, unhappyBrown);
check(
  "90% brown at 30 sat drags happiness down",
  dragged < 70,
  `got ${dragged}`
);

// Initial game state has factions
const hexes = generateMap(42);
const state = createInitialGameState(hexes);
check("Regions have faction state", state.regions.usa.factions.brownSatisfaction === FACTION_SATISFACTION_BASE);
check("OPEC legacy weights set", REGION_PROFILES.opec.legacyBrown === 9);

// Cycle processing applies faction step
const afterCycle = processCycle(state, hexes);
check("Cycle clears faction events", Object.keys(afterCycle.factionCycleEvents).length === 0);
check("Cycle stores start CO2", afterCycle.cycleStartCo2.usa !== undefined);

console.log(`\n--- ${passed} passed, ${failed} failed ---`);
process.exit(failed > 0 ? 1 : 0);
