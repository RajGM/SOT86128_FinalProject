import { findRouteOptions, hasLandConnection, hasFacilityCapacity } from "../src/lib/routeDetection";
import { applyTradeTransfer, createInitialGameState } from "../src/lib/gameState";
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

const mkBuilding = (
  id: string,
  type: PlacedBuilding["type"],
  countryId: PlacedBuilding["countryId"],
  tier: 1 | 2 | 3 = 1
): PlacedBuilding => ({
  id,
  type,
  tier,
  builtAt: Date.now(),
  q: 0,
  r: 0,
  countryId,
});

// --- Route prerequisites ---
const noBuildings: PlacedBuilding[] = [];
check("No infra => no routes USA->EU", findRouteOptions("usa", "eu", noBuildings, []).length === 0);

const usaAir = mkBuilding("usa-air", "airport", "usa");
const euAir = mkBuilding("eu-air", "airport", "eu");
const airOpts = findRouteOptions("usa", "eu", [usaAir, euAir], []);
check("Air route needs airports both ends", airOpts.some((o) => o.routeType === "air"));
check("Air route is direct path", airOpts[0]?.path.length === 2);

const usaDock = mkBuilding("usa-dock", "dock", "usa");
const euDock = mkBuilding("eu-dock", "dock", "eu");
const seaOpts = findRouteOptions("usa", "eu", [usaDock, euDock], []);
check("Sea route needs docks both ends", seaOpts.some((o) => o.routeType === "sea"));

check("USA-EU has multi-hop land connection", hasLandConnection("usa", "eu"));
check("USA-Latam land connection", hasLandConnection("usa", "latam"));

const usaTc = mkBuilding("usa-tc", "transport_center", "usa");
const latamTc = mkBuilding("latam-tc", "transport_center", "latam");
const landOpts = findRouteOptions("usa", "latam", [usaTc, latamTc], []);
check(
  "Direct land route USA-Latam",
  landOpts.some((o) => o.routeType === "land" && o.path.length === 2)
);

// Multi-hop land: usa -> latam -> africa -> eu
const africaTc = mkBuilding("africa-tc", "transport_center", "africa");
const euTc = mkBuilding("eu-tc", "transport_center", "eu");
const multiLand = findRouteOptions("usa", "eu", [usaTc, latamTc, africaTc, euTc], []);
check("Multi-hop land USA-EU exists", multiLand.some((o) => o.transitRegions.length >= 2));

// --- Capacity ---
const t1 = mkBuilding("fac1", "airport", "usa", 1);
const route1 = createTransportRoute({
  routeType: "air",
  path: ["usa", "eu"],
  transitRegions: [],
  emissionsPerCycle: 8,
  fromFacilityId: "fac1",
  toFacilityId: "eu-air",
  label: "test",
});
const routes = [{ ...route1, status: "active" as const, to: "eu" as const, from: "usa" as const }];
check("T1 facility has capacity with 1 route", hasFacilityCapacity(t1, routes));
check(
  "T1 at capacity after 2 routes on same facility",
  !hasFacilityCapacity(t1, [
    ...routes,
    { ...route1, id: "r2", fromFacilityId: "fac1" },
  ])
);

// --- Trade transfers ---
const state = createInitialGameState();
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

// Sea route without dock at one end
check(
  "Sea blocked without both docks",
  findRouteOptions("usa", "eu", [usaDock], []).filter((o) => o.routeType === "sea").length === 0
);

// Land blocked without transport centers
check(
  "Land blocked without transport centers",
  findRouteOptions("usa", "latam", [], []).length === 0
);

console.log(`\n--- ${passed} passed, ${failed} failed ---`);
process.exit(failed > 0 ? 1 : 0);
