import {
  findBestRoute,
  hasLandConnection,
  findAllLandPaths,
} from "../src/lib/routeDetection";
import {
  applyTradeTransfer,
  createInitialGameState,
} from "../src/lib/gameState";
import {
  getHubCapacity,
  getCountryTotalCapacity,
  getCountryMaxHubTier,
  HUB_BASE_CAPACITY,
  ROUTE_CO2_PER_UNIT,
} from "../src/lib/transportHub";
import { createTransportRoute } from "../src/lib/tradeRules";
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

const mkHub = (
  id: string,
  countryId: PlacedBuilding["countryId"],
  tier: 1 | 2 | 3 = 1,
  extraLevel = 0
): PlacedBuilding => ({
  id,
  type: "transport_hub",
  tier,
  extraLevel: extraLevel > 0 ? extraLevel : undefined,
  builtAt: Date.now(),
  q: 0,
  r: 0,
  countryId,
});

const emptyHexes: never[] = [];

// --- Hub capacity ---
check("T1 hub capacity is 20", getHubCapacity(mkHub("h1", "india", 1)) === 20);
check("T2 hub capacity is 40", getHubCapacity(mkHub("h2", "india", 2)) === 40);
check("T3 hub capacity is 60", getHubCapacity(mkHub("h3", "india", 3)) === 60);
check(
  "T3+1 hub capacity is 80",
  getHubCapacity(mkHub("h4", "india", 3, 1)) === 80
);
check(
  "Two T1 hubs stack to 40",
  getCountryTotalCapacity("india", [mkHub("a", "india", 1), mkHub("b", "india", 1)]) === 40
);

// --- Route prerequisites ---
const noHubs: PlacedBuilding[] = [];
check(
  "No hub => no route USA->EU",
  findBestRoute("usa", "eu", noHubs, emptyHexes, []) === null
);

const usaT3 = mkHub("usa-hub", "usa", 3);
const usaEuRoute = findBestRoute("usa", "eu", [usaT3], emptyHexes, []);
check("Land-connected pair prefers land over air", usaEuRoute?.routeType === "land");
check("USA-EU land path is multi-hop", (usaEuRoute?.path.length ?? 0) >= 4);
check("Land CO₂ per unit on USA-EU", usaEuRoute?.emissionsPerUnit === ROUTE_CO2_PER_UNIT.land);

check("USA-EU has multi-hop land connection", hasLandConnection("usa", "eu"));
check("USA-Latam land connection", hasLandConnection("usa", "latam"));

const usaT1 = mkHub("usa-t1", "usa", 1);
const latamT1 = mkHub("latam-t1", "latam", 1);
const landRoute = findBestRoute("usa", "latam", [usaT1, latamT1], emptyHexes, []);
check(
  "T1 land route USA-Latam",
  landRoute?.routeType === "land" && landRoute.path.length === 2
);

const indiaT1 = mkHub("india-t1", "india", 1);
const chinaT1 = mkHub("china-t1", "china", 1);
const opecT1 = mkHub("opec-t1", "opec", 1);
const multiLand = findBestRoute(
  "india",
  "opec",
  [indiaT1, chinaT1, opecT1],
  emptyHexes,
  []
);
check("Multi-hop land India-OPEC exists", multiLand?.routeType === "land");
check("Land CO₂ per unit is 3", multiLand?.emissionsPerUnit === ROUTE_CO2_PER_UNIT.land);

// --- Reach tiers ---
check(
  "Max tier with T1 hub is 1",
  getCountryMaxHubTier("india", [mkHub("x", "india", 1)]) === 1
);
check(
  "Max tier stacks across hubs",
  getCountryMaxHubTier("india", [mkHub("a", "india", 1), mkHub("b", "india", 3)]) === 3
);

// --- Route creation ---
const route1 = createTransportRoute({
  routeType: "air",
  path: ["usa", "eu"],
  transitRegions: [],
  emissionsPerUnit: 8,
  fromHubId: "usa-hub",
  label: "test",
  needsTransitApproval: false,
});
check("Route has emissionsPerUnit", route1.emissionsPerUnit === 8);
check("Route without transit is active", route1.status === "active");

const pendingRoute = createTransportRoute({
  routeType: "land",
  path: ["usa", "latam", "africa", "eu"],
  transitRegions: ["latam", "africa"],
  emissionsPerUnit: 3,
  label: "multi",
  needsTransitApproval: true,
});
check("Route with pending transit is pending", pendingRoute.status === "pending");

// --- Trade transfers ---
const state = createInitialGameState();
check("Initial transportCapacityUsed is empty", Object.keys(state.transportCapacityUsed).length === 0);

const from = {
  ...state.regions.usa,
  deposits: { ...state.regions.usa.deposits, fuel: 100 },
};
const to = {
  ...state.regions.eu,
  deposits: { ...state.regions.eu.deposits, fuel: 0 },
};
const xfer = applyTradeTransfer(from, to, "fuel", 30);
check(
  "Deposit transfer fuel",
  xfer?.from.deposits.fuel === 70 && xfer?.to.deposits.fuel === 30
);
check("Insufficient fuel blocks transfer", applyTradeTransfer(from, to, "fuel", 200) === null);

for (const item of ["rare_earth", "uranium"] as const) {
  const f = { ...from, deposits: { ...from.deposits, [item]: 50 } };
  const t = { ...to, deposits: { ...to.deposits, [item]: 0 } };
  const r = applyTradeTransfer(f, t, item, 10);
  check(`Deposit transfer ${item}`, r?.to.deposits[item] === 10);
}

const moneyXfer = applyTradeTransfer(
  { ...state.regions.usa, money: 1000 },
  state.regions.eu,
  "money",
  100
);
check(
  "Money transfer",
  moneyXfer?.from.money === 900 && (moneyXfer?.to.money ?? 0) > state.regions.eu.money
);

// Land paths BFS
const paths = findAllLandPaths("usa", "eu", 3);
check("USA-EU has multi-hop land paths", paths.some((p) => p.length >= 4));

check("HUB_BASE_CAPACITY T1 is 20", HUB_BASE_CAPACITY[1] === 20);

console.log(`\n--- ${passed} passed, ${failed} failed ---`);
process.exit(failed > 0 ? 1 : 0);
