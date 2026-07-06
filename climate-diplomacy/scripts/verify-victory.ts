/**
 * Victory conditions verification — run with: npx tsx scripts/verify-victory.ts
 */
import { generateMap } from "../src/lib/mapGenerator";
import { createTestScenarioState } from "../src/data/testScenario";
import { createInitialGameState } from "../src/lib/gameState";
import {
  buildPlayerResults,
  computeSpecialAwards,
  scoreBadgeFromDisplay,
  BADGE_LABELS,
} from "../src/lib/scoring";
import { computeAllCountryComparisons, displayScoreFromGap } from "../src/lib/comparisonMetrics";

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

check("displayScore perfect pioneer = 100", displayScoreFromGap(0) === 100);
check("displayScore worst laggard = 0", displayScoreFromGap(1) === 0);
check("displayScore mid = 50", displayScoreFromGap(0.5) === 50);

check("badge pioneer at 75+", scoreBadgeFromDisplay(87) === "pioneer");
check("badge progressive 50-74", scoreBadgeFromDisplay(74) === "progressive");
check("badge laggard 25-49", scoreBadgeFromDisplay(44) === "laggard");
check("badge blocker 0-24", scoreBadgeFromDisplay(12) === "blocker");
check("badge labels complete", Object.keys(BADGE_LABELS).length === 4);

const hexes = generateMap(42);
const testState = createTestScenarioState(hexes);
const testResults = buildPlayerResults(testState, {
  tester: { name: "rajgm", country: "latam", connected: true },
});

check("8 player results from test scenario", testResults.length === 8);
check("results sorted by displayScore desc", testResults.every((r, i, arr) => i === 0 || arr[i - 1]!.displayScore >= r.displayScore));
check("ranks assigned 1-8", testResults.every((r, i) => r.rank === i + 1));
check("top 3 have podium awards", testResults.slice(0, 3).every((r) => r.podiumAward !== null));
check("display scores in 0-100", testResults.every((r) => r.displayScore >= 0 && r.displayScore <= 100));

const rows = computeAllCountryComparisons(testState);
check("comparison rows match gap scoring", testResults[0]!.displayScore === displayScoreFromGap(rows.find((row) => row.countryId === testResults[0]!.country)!.compositeGap));

const awards = computeSpecialAwards(testState, testResults);
check("special awards <= 3", awards.length <= 3);
check("special awards have detail", awards.every((a) => a.detail.length > 0));

const freshState = createInitialGameState(hexes);
check("initial state has happiness history", Object.keys(freshState.happinessHistory).length > 0);
check("initial state has peak green tracking", Object.keys(freshState.peakGreenRatioCycle).length > 0);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
