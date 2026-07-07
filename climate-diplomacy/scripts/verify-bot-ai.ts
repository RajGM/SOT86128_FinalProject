/**
 * Smart bot AI verification — run with: npx tsx scripts/verify-bot-ai.ts
 */
import { generateMap } from "../src/lib/mapGenerator";
import { createInitialGameState } from "../src/lib/gameState";
import { createGameStateFromSettings } from "../src/lib/gameBootstrap";
import { DEFAULT_ROOM_SETTINGS } from "../src/lib/roomPresets";
import {
  BOT_STRATEGY_BY_COUNTRY,
  STRATEGY_WEIGHTS,
  computeBotVote,
  estimateFactionDeltaFromBuild,
  foodCyclesUntilEmpty,
  resolveBotCountries,
  runBotTurns,
  scoreDelta,
  scoreState,
} from "../src/lib/botAI";
import { createPendingVote } from "../src/lib/summitMechanics";
import type { CountryId } from "../src/types/hex";
import { COUNTRY_CONFIGS } from "../src/types/hex";
import type { RegionState } from "../src/types/game";

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

function cloneRegion(r: RegionState): RegionState {
  return {
    ...r,
    deposits: { ...r.deposits },
    relations: { ...r.relations },
    factions: { ...r.factions },
    researchLevels: { ...r.researchLevels },
    extractionUnlocks: { ...r.extractionUnlocks },
    breakthroughs: [...r.breakthroughs],
  };
}

// --- Strategy mapping ---
check("OPEC is fossil maximiser", BOT_STRATEGY_BY_COUNTRY.opec === "fossil_maximiser");
check("EU is green pioneer", BOT_STRATEGY_BY_COUNTRY.eu === "green_pioneer");
check("India is development first", BOT_STRATEGY_BY_COUNTRY.india === "development_first");

// --- Utility scoring ---
const opec = state.regions.opec;
const eu = state.regions.eu;
const fossilW = STRATEGY_WEIGHTS.fossil_maximiser;
const greenW = STRATEGY_WEIGHTS.green_pioneer;

check("Fossil strategy weights CO₂ positively", fossilW.co2 > 0);
check("Green strategy weights CO₂ negatively", greenW.co2 < 0);
check("Faction alignment weighted heavily", greenW.factionAlignment >= 1.4);

const richOpec = cloneRegion(opec);
richOpec.money = 120;
const poorOpec = cloneRegion(opec);
poorOpec.money = 20;
check(
  "Fossil maximiser prefers more money",
  scoreState(richOpec, "opec", "fossil_maximiser") > scoreState(poorOpec, "opec", "fossil_maximiser")
);

const lowCo2Eu = cloneRegion(eu);
lowCo2Eu.co2 = 5;
const highCo2Eu = cloneRegion(eu);
highCo2Eu.co2 = 80;
check(
  "Green pioneer prefers lower CO₂",
  scoreState(lowCo2Eu, "eu", "green_pioneer") > scoreState(highCo2Eu, "eu", "green_pioneer")
);

const fedIndia = cloneRegion(state.regions.india);
fedIndia.food = 80;
const hungryIndia = cloneRegion(state.regions.india);
hungryIndia.food = 5;
check(
  "Development first prefers more food",
  scoreState(fedIndia, "india", "development_first") > scoreState(hungryIndia, "india", "development_first")
);

const before = cloneRegion(state.regions.china);
const after = cloneRegion(before);
after.technology += 10;
check(
  "scoreDelta matches scoreState difference",
  Math.abs(scoreDelta(before, after, "china", "pragmatic_balancer") - (scoreState(after, "china", "pragmatic_balancer") - scoreState(before, "china", "pragmatic_balancer"))) < 0.001
);

check(
  "Green builds score higher for EU than fossil builds",
  estimateFactionDeltaFromBuild("eu", "green_plant") > estimateFactionDeltaFromBuild("eu", "fossil_plant")
);
check(
  "Fossil builds score higher for OPEC than green builds",
  estimateFactionDeltaFromBuild("opec", "fossil_plant") > estimateFactionDeltaFromBuild("opec", "green_plant")
);

// --- Summit votes ---
const taxCeilingVote = createPendingVote(
  {
    boundaryType: "temperature",
    severityLevel: 1,
    threshold: 20,
    resolutionText: "All countries must set carbon tax ≥ 20",
    targetCountries: "all",
  },
  5
);
check("OPEC votes NO on tax ceiling", computeBotVote("opec", taxCeilingVote, state.regions) === "no");
check("EU votes YES on tax ceiling", computeBotVote("eu", taxCeilingVote, state.regions) === "yes");

const aidVote = createPendingVote(
  {
    boundaryType: "inequality",
    severityLevel: 1,
    threshold: 10,
    resolutionText: "Wealthy contribute to poor",
    targetCountries: "all",
  },
  8
);
check(
  "India votes YES on inequality aid",
  computeBotVote("india", aidVote, state.regions) === "yes"
);

// --- Bot country resolution ---
const soloBots = resolveBotCountries(["usa"]);
check("Solo human leaves 7 bot countries", soloBots.length === 7);
check("Solo human excludes USA", !soloBots.includes("usa"));
const withDisconnect = resolveBotCountries(["usa", "eu"], { eu: true });
check("Disconnect flag re-adds EU as bot", withDisconnect.includes("eu"));

// --- runBotTurns integration ---
const botOnly = resolveBotCountries([]);
const afterBots = runBotTurns(state, hexes, botOnly);
check("runBotTurns returns valid state", afterBots.cycle === state.cycle);
check(
  "Bots may place buildings over a cycle",
  Object.keys(afterBots.tileBuildings).length >= Object.keys(state.tileBuildings).length
);

const richOpecState = {
  ...state,
  regions: {
    ...state.regions,
    opec: { ...state.regions.opec, money: 120 },
  },
};
const opecAfter = runBotTurns(richOpecState, hexes, ["opec"]);
const opecBuilds = Object.values(opecAfter.tileBuildings).filter((b) => b.countryId === "opec");
check("OPEC bot places building when funded", opecBuilds.length >= 1);

// --- Multiplayer bootstrap (test scenario, real rules) ---
const mpState = createGameStateFromSettings(hexes, DEFAULT_ROOM_SETTINGS);
check("Multiplayer state uses real build rules", mpState.testingMode === false);
check("Multiplayer state is rich mid-game", mpState.cycle >= 10);
check("Multiplayer state has trade routes", mpState.transportRoutes.length > 0);

const mpBots = resolveBotCountries(["usa"]);
const mpBefore = {
  tradeCount: mpState.tradeAgreements.length,
  buildCount: Object.keys(mpState.tileBuildings).length,
};
const mpAfter = runBotTurns(mpState, hexes, mpBots.slice(0, 3));
const mpActed =
  mpAfter.tradeAgreements.length > mpBefore.tradeCount ||
  Object.keys(mpAfter.tileBuildings).length > mpBefore.buildCount ||
  mpAfter.regions.eu.carbonTax !== mpState.regions.eu.carbonTax;
check("Bots act on multiplayer test-scenario state", mpActed);

// --- foodCyclesUntilEmpty ---
check("foodCyclesUntilEmpty handles zero drain", foodCyclesUntilEmpty(100, 0) === Infinity);
check("foodCyclesUntilEmpty computes cycles", foodCyclesUntilEmpty(30, 10) >= 1);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
