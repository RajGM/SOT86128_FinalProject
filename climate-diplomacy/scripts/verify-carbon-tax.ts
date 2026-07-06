/**
 * Carbon tax verification — run with: npx tsx scripts/verify-carbon-tax.ts
 */
import { generateMap } from "../src/lib/mapGenerator";
import { createInitialGameState, processCycle } from "../src/lib/gameState";
import {
  applyFactionSatisfactionChanges,
  createEmptyFactionCycleEvents,
  createInitialFactionState,
} from "../src/lib/factionMechanics";
import {
  applyGreenSubsidyToCost,
  calculateTaxCollected,
  citizenDividendHappinessBonus,
  climateFinancePerRecipient,
  climateFinanceRelationsBonus,
  processCarbonTaxCollection,
  snapCarbonTaxRate,
} from "../src/lib/carbonTaxMechanics";
import { DEVELOPING_RECIPIENTS } from "../src/lib/comparisonMetrics";
import type { RegionState } from "../src/types/game";
import { COUNTRY_CONFIGS, type CountryId } from "../src/types/hex";

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

// Formula checks from carbonTax.md
check("Tax at 10% on 73 CO₂ = 7", calculateTaxCollected(73, 10) === 7);
check("Tax at 40% on 73 CO₂ = 29", calculateTaxCollected(73, 40) === 29);
check("Tax at 40% on 126 CO₂ = 50", calculateTaxCollected(126, 40) === 50);
check("Tax at 40% on 5 CO₂ = 2", calculateTaxCollected(5, 40) === 2);
check("Zero rate collects nothing", calculateTaxCollected(100, 0) === 0);

// Slider snapping
check("Snap 37 → 35", snapCarbonTaxRate(37) === 35);
check("Snap 103 → 100", snapCarbonTaxRate(103) === 100);

// Citizen dividend
check("Dividend 29 money → +2 happiness", citizenDividendHappinessBonus(29) === 2);
check("Dividend 80 money capped at +8", citizenDividendHappinessBonus(80) === 8);

// Climate finance
check("Relations bonus 29 money → +1", climateFinanceRelationsBonus(29) === 1);
check("Relations bonus 45 money → +3 cap", climateFinanceRelationsBonus(45) === 3);
check("Per recipient floor(29/3)=9", climateFinancePerRecipient(29) === 9);
check("Developing recipients are India/LatAm/Africa", DEVELOPING_RECIPIENTS.length === 3);

// Green subsidy
const subsidy = applyGreenSubsidyToCost(100, 60);
check("Subsidy caps at 50% of build cost", subsidy.actualCost === 50);
check("Subsidy uses 50 from pool", subsidy.subsidyUsed === 50);
check("Subsidy pool remainder 10", subsidy.remainingPool === 10);

// Initial state defaults
const hexes = generateMap(42);
const state = createInitialGameState(hexes);
check("Default carbon tax is 0", state.regions.usa.carbonTax === 0);
check("Default recycling is dividend", state.regions.usa.carbonTaxRecycling === "dividend");
check("Default subsidy pool is 0", state.regions.usa.greenSubsidyPool === 0);
check("cycleStartCarbonTax initialized", state.cycleStartCarbonTax.usa === 0);

// Cycle integration: manual tax collection on emissions
function makeRegion(overrides: Partial<RegionState>): RegionState {
  const base = state.regions.usa;
  return { ...base, ...overrides };
}

const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS) as CountryId[];
const regions = Object.fromEntries(
  ALL_COUNTRIES.map((id) => [id, state.regions[id]])
) as Record<CountryId, RegionState>;

regions.usa = makeRegion({ money: 100, carbonTax: 40, carbonTaxRecycling: "dividend", happiness: 70 });
const dividendResult = processCarbonTaxCollection(
  regions,
  { usa: 73 },
  {},
  {},
  [],
  [],
  1
);
check(
  "Dividend deducts 29 money",
  dividendResult.regions.usa.money === 71,
  `got ${dividendResult.regions.usa.money}`
);
check(
  "Dividend adds +2 happiness",
  dividendResult.regions.usa.happiness === 72,
  `got ${dividendResult.regions.usa.happiness}`
);

regions.eu = { ...state.regions.eu, money: 50, carbonTax: 40, carbonTaxRecycling: "subsidy" };
const subsidyResult = processCarbonTaxCollection(
  { ...regions, eu: regions.eu },
  { eu: 20 },
  {},
  {},
  [],
  [],
  1
);
check(
  "Subsidy adds to green pool",
  subsidyResult.regions.eu.greenSubsidyPool === 8,
  `got ${subsidyResult.regions.eu.greenSubsidyPool}`
);

regions.eu = { ...state.regions.eu, money: 200, carbonTax: 40, carbonTaxRecycling: "finance" };
const indiaBefore = state.regions.india.money;
const financeResult = processCarbonTaxCollection(
  { ...regions, eu: regions.eu },
  { eu: 45 },
  {},
  {},
  [],
  [],
  1
);
const taxPaid = 18; // floor(45 * 0.4)
check(
  "Climate finance deducts tax from sender",
  financeResult.regions.eu.money === 200 - taxPaid,
  `got ${financeResult.regions.eu.money}`
);
check(
  "India receives floor(tax/3)",
  financeResult.regions.india.money === indiaBefore + Math.floor(taxPaid / 3),
  `got ${financeResult.regions.india.money}`
);
check(
  "Climate finance ledger updated",
  (financeResult.climateFinanceGiven.eu ?? 0) === taxPaid,
  `got ${financeResult.climateFinanceGiven.eu}`
);

// Faction deltas (factionsInCountry.md)
const taxFactionResult = applyFactionSatisfactionChanges(createInitialFactionState(), {
  ...createEmptyFactionCycleEvents(),
  carbonTaxIncrease: 40,
});
check(
  "Tax raised 40 pts: brown −8, green +8",
  taxFactionResult.brownSatisfaction === 52 && taxFactionResult.greenSatisfaction === 68,
  `brown=${taxFactionResult.brownSatisfaction} green=${taxFactionResult.greenSatisfaction}`
);

// Cycle integration: tax change detected from cycleStartCarbonTax
const factionState = createInitialGameState(hexes);
check("OPEC cycleStartCarbonTax is 0", factionState.cycleStartCarbonTax.opec === 0);
factionState.regions.opec = {
  ...factionState.regions.opec,
  carbonTax: 40,
};
const afterCycle = processCycle(factionState, hexes);
check(
  "Cycle end snapshots carbon tax rate",
  afterCycle.cycleStartCarbonTax.opec === 40,
  `got ${afterCycle.cycleStartCarbonTax.opec}`
);
check(
  "OPEC raising tax 0→40 reduces brown satisfaction by 8",
  afterCycle.regions.opec.factions.brownSatisfaction === 52,
  `got ${afterCycle.regions.opec.factions.brownSatisfaction}`
);

// Broke country collects only what it can
const brokeRegions = { ...regions };
brokeRegions.opec = makeRegion({ money: 5, carbonTax: 100, carbonTaxRecycling: "dividend" });
const brokeResult = processCarbonTaxCollection(brokeRegions, { opec: 100 }, {}, {}, [], [], 1);
check(
  "Broke country money clamped to 0",
  brokeResult.regions.opec.money === 0,
  `got ${brokeResult.regions.opec.money}`
);

console.log(`\n--- ${passed} passed, ${failed} failed ---`);
process.exit(failed > 0 ? 1 : 0);
