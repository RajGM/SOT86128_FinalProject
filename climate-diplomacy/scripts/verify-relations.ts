import { createInitialGameState, processCycle } from "../src/lib/gameState";
import {
  applyBilateralRelation,
  applyOneSidedRelation,
  canInitiateTrade,
  getRelationLabel,
  getTradeTransportUnits,
  isTradePartner,
  markTradePartners,
  processCycleRelations,
  RELATION_EVENT_DELTAS,
  RELATION_TRADE_THRESHOLD,
  RELATION_TRANSIT_THRESHOLD,
} from "../src/lib/relationMechanics";
import type { CountryId } from "../src/types/hex";

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

const state = createInitialGameState();
check("Initial relationEvents empty", state.relationEvents.length === 0);
check("Initial tradePartners empty", Object.keys(state.tradePartners).length === 0);
check("USA→EU starts at 50", state.regions.usa.relations.eu === 50);
check("Relations asymmetric capable", true);

let regions = state.regions;
let events = [...state.relationEvents];
let alerts = [...state.relationAlerts];

const reject = applyOneSidedRelation(
  regions,
  "usa",
  "russia",
  RELATION_EVENT_DELTAS.trade_rejected,
  "trade_rejected",
  1,
  "Trade proposal rejected by Russia",
  events,
  alerts
);
check(
  "Trade rejection one-sided",
  reject.regions.usa.relations.russia === 48 &&
    reject.regions.russia.relations.usa === 50
);

const bilateral = applyBilateralRelation(
  reject.regions,
  "usa",
  "eu",
  RELATION_EVENT_DELTAS.trade_completed,
  "trade_completed",
  1,
  "Trade completed",
  "Trade completed",
  reject.relationEvents,
  reject.relationAlerts
);
check(
  "Trade completed bilateral",
  bilateral.regions.usa.relations.eu === 53 &&
    bilateral.regions.eu.relations.usa === 53
);

check(
  "getRelationLabel Friendly at 72",
  getRelationLabel(72) === "Friendly"
);
check(
  "getRelationLabel Hostile at 15",
  getRelationLabel(15) === "Hostile"
);

const partners = markTradePartners({}, "usa", "eu");
check("Trade partner tracking", isTradePartner(partners, "usa", "eu"));

const lowRelRegions = {
  ...bilateral.regions,
  eu: {
    ...bilateral.regions.eu,
    relations: { ...bilateral.regions.eu.relations, usa: 15 },
  },
};
check(
  "Trade blocked below 20",
  !canInitiateTrade(lowRelRegions, "usa", "eu")
);

const alliedRegions = {
  ...bilateral.regions,
  usa: {
    ...bilateral.regions.usa,
    relations: { ...bilateral.regions.usa.relations, eu: 85 },
  },
  eu: {
    ...bilateral.regions.eu,
    relations: { ...bilateral.regions.eu.relations, usa: 85 },
  },
};
check(
  "Allied transport halved",
  getTradeTransportUnits(alliedRegions, "usa", "eu", 10) === 5
);

// Cycle relations: continuous trade
let cycleState = createInitialGameState();
cycleState = {
  ...cycleState,
  tradeAgreements: [
    {
      id: "t1",
      from: "usa",
      to: "eu",
      item: "food",
      amount: 10,
      routeId: "r1",
      active: true,
      tradeMode: "continuous",
    },
  ],
  transportRoutes: [
    {
      id: "r1",
      from: "usa",
      to: "eu",
      routeType: "land",
      path: ["usa", "eu"],
      status: "active",
      emissionsPerUnit: 3,
    },
  ],
};

const cycleResult = processCycleRelations({
  regions: cycleState.regions,
  relationEvents: [],
  relationAlerts: [],
  tradeAgreements: cycleState.tradeAgreements,
  transitAgreements: [],
  transportRoutes: cycleState.transportRoutes,
  climateFinanceThisCycle: {},
  summitVotes: [],
  cycle: 1,
  prevTemperature: 1.0,
  nextTemperature: 1.0,
  happinessBeforeTemp: Object.fromEntries(
    (Object.keys(cycleState.regions) as CountryId[]).map((id) => [id, cycleState.regions[id].happiness])
  ),
  cycleStartCo2: cycleState.cycleStartCo2,
  buildings: [],
});

check(
  "Continuous trade +1 per cycle",
  cycleResult.regions.usa.relations.eu === 51 &&
    cycleResult.regions.eu.relations.usa === 51
);

check("RELATION_TRANSIT_THRESHOLD is 30", RELATION_TRANSIT_THRESHOLD === 30);
check("RELATION_TRADE_THRESHOLD is 20", RELATION_TRADE_THRESHOLD === 20);

const afterCycle = processCycle(cycleState);
check("processCycle advances with relations", afterCycle.cycle === 2);
check("climateFinanceThisCycle resets", Object.keys(afterCycle.climateFinanceThisCycle).length === 0);

console.log(`\n--- ${passed} passed, ${failed} failed ---`);
process.exit(failed > 0 ? 1 : 0);
