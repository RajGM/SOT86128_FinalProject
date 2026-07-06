/**
 * Test scenario verification — run with: npx tsx scripts/verify-test-scenario.ts
 */
import { generateMap } from "../src/lib/mapGenerator";
import { createTestScenarioState, TEST_SCENARIO_CYCLE, TEST_SCENARIO_TEMPERATURE } from "../src/data/testScenario";
import { getCarbonTaxFloor } from "../src/lib/summitMechanics";
import { checkResolutionCompliance } from "../src/lib/summitMechanics";

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
const state = createTestScenarioState(hexes);

check("Cycle is 15", state.cycle === TEST_SCENARIO_CYCLE);
check("Global temperature is 1.72°C", state.globalTemperature === TEST_SCENARIO_TEMPERATURE);
check("Testing mode enabled", state.testingMode === true);
check("8 regions present", Object.keys(state.regions).length === 8);

check("USA money is 312", state.regions.usa.money === 312);
check("USA carbon tax is 10 (non-compliant)", state.regions.usa.carbonTax === 10);
check("India in unrest (happiness 44)", state.regions.india.happiness === 44);
check("Africa near crisis (happiness 38)", state.regions.africa.happiness === 38);
check("OPEC food critical (4)", state.regions.opec.food === 4);

check("Two active summit resolutions", state.activeSummitResolutions.filter((r) => r.active).length === 2);
check("Res-1 is carbon tax floor ≥ 20", state.activeSummitResolutions[0]?.threshold === 20);
check("Carbon tax floor enforced at 20", getCarbonTaxFloor(state, "usa") === 20);

const usaTaxCompliance = checkResolutionCompliance(
  state.activeSummitResolutions[0]!,
  "usa",
  state.regions,
  state.cycle,
  [],
  []
);
check("USA non-compliant with res-1", !usaTaxCompliance.compliant);

check("9 active continuous trades", state.tradeAgreements.filter((t) => t.active).length === 9);
check("LatAm→OPEC food trade exists", state.tradeAgreements.some((t) => t.id === "trade-2" && t.item === "food"));
check("Africa→China transit via OPEC", state.transitAgreements.some((a) => a.transitRegion === "opec" && a.status === "active"));

check("EU↔Africa relations at 72", state.regions.eu.relations.africa === 72);
check("EU↔OPEC relations strained at 28", state.regions.eu.relations.opec === 28);

const buildingCount = Object.keys(state.tileBuildings).length;
check("Buildings placed on map", buildingCount >= 80, `got ${buildingCount}`);

check("Climate finance from LatAm tracked", (state.climateFinanceGiven.latam ?? 0) === 18);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
