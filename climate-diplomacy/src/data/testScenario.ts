/**
 * Cycle 15 mid-game test scenario — loaded when visiting /test.
 * Source of truth: testScenario.md
 */
import type { CountryId, HexData, ResourceDeposit } from "../types/hex";
import { COUNTRY_CONFIGS, emptyDepositCounts } from "../types/hex";
import type {
  BuildType,
  GameState,
  PlacedBuilding,
  RegionState,
  SummitResolution,
  SummitVoteRecord,
  TradeAgreement,
  TransportRoute,
  TransitAgreement,
} from "../types/game";
import { tileKey } from "../types/game";
import { createInitialFactionState } from "../lib/factionMechanics";
import { appendGapHistory, appendHappinessHistory, computeAllCountryComparisons, updatePeakGreenTracking } from "../lib/comparisonMetrics";
import { ROUTE_CO2_PER_UNIT } from "../lib/transportHub";
import { createHexLookup } from "../lib/hexUtils";

const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS) as CountryId[];

export const TEST_SCENARIO_PATH = "/test";
export const TEST_SCENARIO_CYCLE = 15;
export const TEST_SCENARIO_TEMPERATURE = 1.72;

type HexPreference =
  | "land"
  | "agricultural"
  | "coastal"
  | "fuel"
  | "uranium"
  | "rare_earth"
  | "desert";

interface BuildingSpec {
  type: BuildType;
  tier: 1 | 2 | 3;
  prefer?: HexPreference;
}

interface RegionSpec {
  population: number;
  money: number;
  energy: number;
  food: number;
  happiness: number;
  co2: number;
  technology: number;
  deposits: { fuel: number; uranium: number; rare_earth: number };
  carbonTax: number;
  carbonTaxRecycling: RegionState["carbonTaxRecycling"];
  greenSubsidyPool: number;
  brownSatisfaction: number;
  greenSatisfaction: number;
  buildings: BuildingSpec[];
}

const RELATION_VALUES: Partial<Record<CountryId, Partial<Record<CountryId, number>>>> = {
  usa: { eu: 62, russia: 38, china: 42, india: 35, opec: 55, latam: 58, africa: 40 },
  eu: { usa: 62, russia: 34, china: 56, india: 68, opec: 28, latam: 65, africa: 72 },
  russia: { usa: 38, eu: 34, china: 64, india: 44, opec: 68, latam: 42, africa: 45 },
  china: { usa: 42, eu: 56, russia: 64, india: 52, opec: 58, latam: 48, africa: 60 },
  india: { usa: 35, eu: 68, russia: 44, china: 52, opec: 40, latam: 62, africa: 65 },
  opec: { usa: 55, eu: 28, russia: 68, china: 58, india: 40, latam: 52, africa: 48 },
  latam: { usa: 58, eu: 65, russia: 42, china: 48, india: 62, opec: 52, africa: 58 },
  africa: { usa: 40, eu: 72, russia: 45, china: 60, india: 65, opec: 48, latam: 58 },
};

const REGION_SPECS: Record<CountryId, RegionSpec> = {
  usa: {
    population: 41,
    money: 312,
    energy: 58,
    food: 22,
    happiness: 59,
    co2: 114,
    technology: 18,
    deposits: { fuel: 12, uranium: 3, rare_earth: 0 },
    carbonTax: 10,
    carbonTaxRecycling: "dividend",
    greenSubsidyPool: 0,
    brownSatisfaction: 42,
    greenSatisfaction: 55,
    buildings: [
      { type: "fossil_plant", tier: 2 },
      { type: "fossil_plant", tier: 1 },
      { type: "green_plant", tier: 1 },
      { type: "industrial_complex", tier: 2 },
      { type: "manufacturing", tier: 1 },
      { type: "city", tier: 2 },
      { type: "city", tier: 1 },
      { type: "farm", tier: 2, prefer: "agricultural" },
      { type: "farm", tier: 1, prefer: "agricultural" },
      { type: "extractor", tier: 2, prefer: "fuel" },
      { type: "transport_hub", tier: 2, prefer: "coastal" },
    ],
  },
  eu: {
    population: 28,
    money: 185,
    energy: 14,
    food: 18,
    happiness: 65,
    co2: 28,
    technology: 42,
    deposits: { fuel: 0, uranium: 2, rare_earth: 1 },
    carbonTax: 45,
    carbonTaxRecycling: "subsidy",
    greenSubsidyPool: 38,
    brownSatisfaction: 35,
    greenSatisfaction: 78,
    buildings: [
      { type: "nuclear_plant", tier: 2 },
      { type: "green_plant", tier: 2 },
      { type: "green_plant", tier: 1 },
      { type: "manufacturing", tier: 2 },
      { type: "manufacturing", tier: 1 },
      { type: "city", tier: 1 },
      { type: "farm", tier: 2, prefer: "agricultural" },
      { type: "farm", tier: 1, prefer: "agricultural" },
      { type: "extractor", tier: 1, prefer: "uranium" },
      { type: "transport_hub", tier: 3, prefer: "coastal" },
    ],
  },
  russia: {
    population: 20,
    money: 142,
    energy: 88,
    food: 11,
    happiness: 54,
    co2: 152,
    technology: 8,
    deposits: { fuel: 24, uranium: 6, rare_earth: 2 },
    carbonTax: 0,
    carbonTaxRecycling: "dividend",
    greenSubsidyPool: 0,
    brownSatisfaction: 72,
    greenSatisfaction: 25,
    buildings: [
      { type: "fossil_plant", tier: 3 },
      { type: "fossil_plant", tier: 2 },
      { type: "fossil_plant", tier: 1 },
      { type: "industrial_complex", tier: 2 },
      { type: "industrial_complex", tier: 1 },
      { type: "city", tier: 1 },
      { type: "farm", tier: 1, prefer: "agricultural" },
      { type: "extractor", tier: 2, prefer: "fuel" },
      { type: "extractor", tier: 2, prefer: "fuel" },
      { type: "extractor", tier: 1, prefer: "uranium" },
      { type: "transport_hub", tier: 2, prefer: "coastal" },
    ],
  },
  china: {
    population: 102,
    money: 245,
    energy: 38,
    food: 15,
    happiness: 52,
    co2: 168,
    technology: 35,
    deposits: { fuel: 8, uranium: 0, rare_earth: 14 },
    carbonTax: 15,
    carbonTaxRecycling: "subsidy",
    greenSubsidyPool: 22,
    brownSatisfaction: 48,
    greenSatisfaction: 47,
    buildings: [
      { type: "fossil_plant", tier: 2 },
      { type: "fossil_plant", tier: 1 },
      { type: "green_plant", tier: 1 },
      { type: "industrial_complex", tier: 2 },
      { type: "industrial_complex", tier: 1 },
      { type: "manufacturing", tier: 2 },
      { type: "manufacturing", tier: 1 },
      { type: "city", tier: 2 },
      { type: "city", tier: 1 },
      { type: "farm", tier: 2, prefer: "agricultural" },
      { type: "farm", tier: 2, prefer: "agricultural" },
      { type: "farm", tier: 1, prefer: "agricultural" },
      { type: "extractor", tier: 2, prefer: "rare_earth" },
      { type: "extractor", tier: 1, prefer: "fuel" },
      { type: "transport_hub", tier: 3, prefer: "coastal" },
    ],
  },
  india: {
    population: 96,
    money: 62,
    energy: 8,
    food: 9,
    happiness: 44,
    co2: 38,
    technology: 12,
    deposits: { fuel: 2, uranium: 0, rare_earth: 0 },
    carbonTax: 25,
    carbonTaxRecycling: "dividend",
    greenSubsidyPool: 0,
    brownSatisfaction: 38,
    greenSatisfaction: 58,
    buildings: [
      { type: "fossil_plant", tier: 1 },
      { type: "green_plant", tier: 1, prefer: "desert" },
      { type: "green_plant", tier: 1 },
      { type: "industrial_complex", tier: 1 },
      { type: "manufacturing", tier: 1 },
      { type: "city", tier: 1 },
      { type: "farm", tier: 2, prefer: "agricultural" },
      { type: "farm", tier: 1, prefer: "agricultural" },
      { type: "farm", tier: 1, prefer: "agricultural" },
      { type: "extractor", tier: 1, prefer: "fuel" },
      { type: "transport_hub", tier: 1, prefer: "coastal" },
    ],
  },
  opec: {
    population: 30,
    money: 198,
    energy: 124,
    food: 4,
    happiness: 61,
    co2: 195,
    technology: 3,
    deposits: { fuel: 38, uranium: 0, rare_earth: 0 },
    carbonTax: 0,
    carbonTaxRecycling: "dividend",
    greenSubsidyPool: 0,
    brownSatisfaction: 78,
    greenSatisfaction: 15,
    buildings: [
      { type: "fossil_plant", tier: 3 },
      { type: "fossil_plant", tier: 2 },
      { type: "fossil_plant", tier: 2 },
      { type: "industrial_complex", tier: 2 },
      { type: "industrial_complex", tier: 1 },
      { type: "city", tier: 1 },
      { type: "extractor", tier: 3, prefer: "fuel" },
      { type: "extractor", tier: 2, prefer: "fuel" },
      { type: "extractor", tier: 2, prefer: "fuel" },
      { type: "transport_hub", tier: 2, prefer: "coastal" },
    ],
  },
  latam: {
    population: 58,
    money: 78,
    energy: 20,
    food: 82,
    happiness: 63,
    co2: 22,
    technology: 15,
    deposits: { fuel: 3, uranium: 4, rare_earth: 2 },
    carbonTax: 20,
    carbonTaxRecycling: "finance",
    greenSubsidyPool: 0,
    brownSatisfaction: 45,
    greenSatisfaction: 65,
    buildings: [
      { type: "fossil_plant", tier: 1 },
      { type: "green_plant", tier: 1 },
      { type: "industrial_complex", tier: 1 },
      { type: "manufacturing", tier: 1 },
      { type: "city", tier: 1 },
      { type: "farm", tier: 2, prefer: "agricultural" },
      { type: "farm", tier: 2, prefer: "agricultural" },
      { type: "farm", tier: 1, prefer: "agricultural" },
      { type: "farm", tier: 1, prefer: "agricultural" },
      { type: "extractor", tier: 1, prefer: "uranium" },
      { type: "extractor", tier: 1, prefer: "rare_earth" },
      { type: "transport_hub", tier: 2, prefer: "coastal" },
    ],
  },
  africa: {
    population: 88,
    money: 34,
    energy: 6,
    food: 5,
    happiness: 38,
    co2: 18,
    technology: 8,
    deposits: { fuel: 5, uranium: 3, rare_earth: 8 },
    carbonTax: 10,
    carbonTaxRecycling: "dividend",
    greenSubsidyPool: 0,
    brownSatisfaction: 40,
    greenSatisfaction: 42,
    buildings: [
      { type: "fossil_plant", tier: 1 },
      { type: "green_plant", tier: 1, prefer: "desert" },
      { type: "industrial_complex", tier: 1 },
      { type: "city", tier: 1 },
      { type: "farm", tier: 1, prefer: "agricultural" },
      { type: "farm", tier: 1, prefer: "agricultural" },
      { type: "extractor", tier: 2, prefer: "rare_earth" },
      { type: "extractor", tier: 1, prefer: "rare_earth" },
      { type: "extractor", tier: 1, prefer: "fuel" },
      { type: "transport_hub", tier: 1, prefer: "coastal" },
    ],
  },
};

function isCoastalHex(hex: HexData, lookup: Map<string, HexData>): boolean {
  if (hex.terrain === "ocean" || hex.terrain === "arctic") return false;
  const dirs: [number, number][] =
    hex.r % 2 === 0
      ? [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 1],
          [-1, 0],
          [-1, -1],
        ]
      : [
          [1, -1],
          [1, 0],
          [1, 1],
          [0, 1],
          [-1, 0],
          [0, -1],
        ];
  return dirs.some(([dq, dr]) => lookup.get(`${hex.q + dq},${hex.r + dr}`)?.terrain === "ocean");
}

function matchesPreference(hex: HexData, prefer: HexPreference, lookup: Map<string, HexData>): boolean {
  switch (prefer) {
    case "agricultural":
      return hex.terrain === "agricultural";
    case "coastal":
      return isCoastalHex(hex, lookup);
    case "fuel":
      return hex.resource === "fuel";
    case "uranium":
      return hex.resource === "uranium";
    case "rare_earth":
      return hex.resource === "rare_earth";
    case "desert":
      return hex.terrain === "desert";
    default:
      return hex.terrain !== "ocean" && hex.terrain !== "arctic";
  }
}

function pickHex(
  hexes: HexData[],
  countryId: CountryId,
  used: Set<string>,
  prefer: HexPreference,
  lookup: Map<string, HexData>
): HexData {
  const candidates = hexes.filter(
    (h) =>
      h.countryId === countryId &&
      h.terrain !== "ocean" &&
      h.terrain !== "arctic" &&
      !used.has(tileKey(h.q, h.r))
  );

  const preferred = candidates.filter((h) => matchesPreference(h, prefer, lookup));
  const pool = preferred.length > 0 ? preferred : candidates;
  if (pool.length === 0) {
    throw new Error(`No hex available for ${countryId} (${prefer})`);
  }
  const hex = pool[0];
  used.add(tileKey(hex.q, hex.r));
  return hex;
}

function placeBuildingsForCountry(
  countryId: CountryId,
  specs: BuildingSpec[],
  hexes: HexData[],
  used: Set<string>,
  lookup: Map<string, HexData>,
  builtAtStart: number
): PlacedBuilding[] {
  const placed: PlacedBuilding[] = [];
  specs.forEach((spec, index) => {
    const hex = pickHex(hexes, countryId, used, spec.prefer ?? "land", lookup);
    placed.push({
      id: `${countryId}-${spec.type}-${index}`,
      type: spec.type,
      tier: spec.tier,
      builtAt: builtAtStart + index,
      q: hex.q,
      r: hex.r,
      countryId,
    });
  });
  return placed;
}

function buildRelations(countryId: CountryId): Partial<Record<CountryId, number>> {
  const relations: Partial<Record<CountryId, number>> = {};
  for (const other of ALL_COUNTRIES) {
    if (other === countryId) continue;
    relations[other] = RELATION_VALUES[countryId]?.[other] ?? 50;
  }
  return relations;
}

function createSummitResolutions(): SummitResolution[] {
  return [
    {
      id: "res-1",
      cycle: 12,
      boundaryType: "temperature",
      resolutionText: "All countries must set carbon tax ≥ 20",
      threshold: 20,
      severityLevel: 1,
      targetCountries: [...ALL_COUNTRIES],
      votes: {
        usa: "no",
        eu: "yes",
        russia: "no",
        china: "abstain",
        india: "yes",
        opec: "no",
        latam: "yes",
        africa: "yes",
      },
      passed: true,
      active: true,
    },
    {
      id: "res-2",
      cycle: 14,
      boundaryType: "inequality",
      resolutionText:
        "Countries with money > 60 must contribute 15 money OR 8 technology to countries with money < 30 or tech < 20. Contributions count toward climate finance.",
      threshold: 15,
      severityLevel: 2,
      targetCountries: [...ALL_COUNTRIES],
      votes: {
        usa: "no",
        eu: "yes",
        russia: "abstain",
        china: "no",
        india: "yes",
        opec: "abstain",
        latam: "yes",
        africa: "yes",
      },
      passed: true,
      active: true,
      complianceDeadline: 16,
      expiresOnSafe: true,
    },
  ];
}

function createSummitVoteHistory(): SummitVoteRecord[] {
  return [
    {
      cycle: 12,
      resolution: "All countries must set carbon tax ≥ 20",
      boundaryType: "temperature",
      passed: true,
      votes: {
        usa: "no",
        eu: "yes",
        russia: "no",
        china: "abstain",
        india: "yes",
        opec: "no",
        latam: "yes",
        africa: "yes",
      },
    },
    {
      cycle: 14,
      resolution:
        "Countries with money > 60 must contribute 15 money OR 8 technology to countries with money < 30 or tech < 20.",
      boundaryType: "inequality",
      passed: true,
      votes: {
        usa: "no",
        eu: "yes",
        russia: "abstain",
        china: "no",
        india: "yes",
        opec: "abstain",
        latam: "yes",
        africa: "yes",
      },
    },
  ];
}

interface TradeSpec {
  id: string;
  from: CountryId;
  to: CountryId;
  item: TradeAgreement["item"];
  amount: number;
  routeType: TransportRoute["routeType"];
  path: CountryId[];
}

const TRADE_SPECS: TradeSpec[] = [
  { id: "trade-1", from: "russia", to: "eu", item: "fuel", amount: 3, routeType: "land", path: ["russia", "eu"] },
  { id: "trade-2", from: "latam", to: "opec", item: "food", amount: 20, routeType: "sea", path: ["latam", "opec"] },
  { id: "trade-3", from: "china", to: "eu", item: "rare_earth", amount: 2, routeType: "air", path: ["china", "eu"] },
  { id: "trade-4", from: "russia", to: "china", item: "fuel", amount: 4, routeType: "land", path: ["russia", "china"] },
  { id: "trade-5", from: "latam", to: "india", item: "food", amount: 15, routeType: "sea", path: ["latam", "india"] },
  { id: "trade-6", from: "africa", to: "china", item: "rare_earth", amount: 3, routeType: "land", path: ["africa", "opec", "china"] },
  { id: "trade-7", from: "eu", to: "africa", item: "technology", amount: 5, routeType: "land", path: ["eu", "africa"] },
  { id: "trade-8", from: "usa", to: "latam", item: "money", amount: 12, routeType: "land", path: ["usa", "latam"] },
  { id: "trade-9", from: "opec", to: "india", item: "energy", amount: 15, routeType: "land", path: ["opec", "india"] },
];

function hubIdForCountry(buildings: PlacedBuilding[], countryId: CountryId): string | undefined {
  return buildings.find((b) => b.countryId === countryId && b.type === "transport_hub")?.id;
}

function buildTradeInfrastructure(
  buildings: PlacedBuilding[]
): { transportRoutes: TransportRoute[]; tradeAgreements: TradeAgreement[]; transitAgreements: TransitAgreement[] } {
  const transportRoutes: TransportRoute[] = TRADE_SPECS.map((spec) => ({
    id: `route-${spec.id}`,
    from: spec.from,
    to: spec.to,
    routeType: spec.routeType,
    path: spec.path,
    status: "active" as const,
    emissionsPerUnit: ROUTE_CO2_PER_UNIT[spec.routeType],
    fromHubId: hubIdForCountry(buildings, spec.from),
  }));

  const tradeAgreements: TradeAgreement[] = TRADE_SPECS.map((spec) => ({
    id: spec.id,
    from: spec.from,
    to: spec.to,
    item: spec.item,
    amount: spec.amount,
    routeId: `route-${spec.id}`,
    active: true,
    tradeMode: "continuous" as const,
  }));

  const transitAgreements: TransitAgreement[] = [
    {
      id: "transit-africa-china-opec",
      routeId: "route-trade-6",
      traderFrom: "africa",
      traderTo: "china",
      transitRegion: "opec",
      feeModel: "commission",
      feeAmount: 10,
      status: "active",
      payer: "africa",
    },
  ];

  return { transportRoutes, tradeAgreements, transitAgreements };
}

function buildTradePartners(): Partial<Record<CountryId, CountryId[]>> {
  const partners: Partial<Record<CountryId, CountryId[]>> = {};
  for (const trade of TRADE_SPECS) {
    partners[trade.from] = [...new Set([...(partners[trade.from] ?? []), trade.to])];
    partners[trade.to] = [...new Set([...(partners[trade.to] ?? []), trade.from])];
  }
  partners.opec = [...new Set<CountryId>([...(partners.opec ?? []), "africa", "china"])];
  return partners;
}

export function isTestScenarioPath(pathname: string = window.location.pathname): boolean {
  return pathname === TEST_SCENARIO_PATH || pathname.endsWith(TEST_SCENARIO_PATH);
}

/** Build the cycle-15 mid-game state from map hexes (seed 42). */
export function createTestScenarioState(hexes: HexData[]): GameState {
  const lookup = createHexLookup(hexes);
  const used = new Set<string>();
  const tileBuildings: Record<string, PlacedBuilding> = {};
  const allBuildings: PlacedBuilding[] = [];

  for (const countryId of ALL_COUNTRIES) {
    const placed = placeBuildingsForCountry(
      countryId,
      REGION_SPECS[countryId].buildings,
      hexes,
      used,
      lookup,
      100
    );
    for (const building of placed) {
      tileBuildings[tileKey(building.q, building.r)] = building;
      allBuildings.push(building);
    }
  }

  const regions = {} as Record<CountryId, RegionState>;
  for (const countryId of ALL_COUNTRIES) {
    const spec = REGION_SPECS[countryId];
    regions[countryId] = {
      money: spec.money,
      energy: spec.energy,
      food: spec.food,
      population: spec.population,
      happiness: spec.happiness,
      co2: spec.co2,
      technology: spec.technology,
      deposits: {
        fuel: spec.deposits.fuel,
        uranium: spec.deposits.uranium,
        rare_earth: spec.deposits.rare_earth,
      },
      researchLevels: {},
      extractionUnlocks: {} as Partial<Record<ResourceDeposit, boolean>>,
      breakthroughs: [],
      relations: buildRelations(countryId),
      factions: {
        ...createInitialFactionState(),
        brownSatisfaction: spec.brownSatisfaction,
        greenSatisfaction: spec.greenSatisfaction,
      },
      carbonTax: spec.carbonTax,
      carbonTaxRecycling: spec.carbonTaxRecycling,
      greenSubsidyPool: spec.greenSubsidyPool,
    };
  }

  const activeSummitResolutions = createSummitResolutions();
  const summitHistory = [...activeSummitResolutions];
  const summitVotes = createSummitVoteHistory();
  const { transportRoutes, tradeAgreements, transitAgreements } = buildTradeInfrastructure(allBuildings);

  const worldHappiness = Math.round(
    ALL_COUNTRIES.reduce((sum, id) => sum + regions[id].happiness, 0) / ALL_COUNTRIES.length
  );
  const peakGlobalPopulation = ALL_COUNTRIES.reduce((sum, id) => sum + regions[id].population, 0);

  const cycleStartCo2 = Object.fromEntries(
    ALL_COUNTRIES.map((id) => [id, regions[id].co2])
  ) as Partial<Record<CountryId, number>>;
  const cycleStartCarbonTax = Object.fromEntries(
    ALL_COUNTRIES.map((id) => [id, regions[id].carbonTax])
  ) as Partial<Record<CountryId, number>>;

  const base: GameState = {
    regions,
    tileBuildings,
    tradeAgreements,
    transportRoutes,
    transitAgreements,
    transitRequests: [],
    highlightedRoutes: [],
    transportCapacityUsed: {},
    breakthroughProposal: null,
    combinedProjects: [],
    researchLicenses: [],
    worldHappiness,
    globalTemperature: TEST_SCENARIO_TEMPERATURE,
    cycle: TEST_SCENARIO_CYCLE,
    testingMode: true,
    cycleStartCo2,
    cycleStartCarbonTax,
    previousCycleCo2: { ...cycleStartCo2 },
    summitVotes,
    activeSummitResolutions,
    summitHistory,
    pendingSummitVote: null,
    summitComplianceResults: [],
    summitComplianceAlerts: [],
    peakGlobalPopulation,
    cycleTradeOffers: [],
    cycleCompletedTransfers: [],
    tradeRestrictionSuspensionUntil: 0,
    summitNonComplianceStrikes: {
      usa: 2,
      russia: 2,
      opec: 2,
      china: 1,
      africa: 1,
    },
    climateFinanceGiven: { latam: 18 },
    gapScoreHistory: {},
    happinessHistory: {},
    peakGreenRatio: {},
    peakGreenRatioCycle: {},
    lastFactionTempThreshold: 1.5,
    factionCycleEvents: {},
    relationEvents: [],
    tradePartners: buildTradePartners(),
    relationAlerts: [],
    climateFinanceThisCycle: {},
  };

  const comparisonRows = computeAllCountryComparisons(base);
  const withGap = {
    ...base,
    gapScoreHistory: appendGapHistory({}, TEST_SCENARIO_CYCLE, comparisonRows),
    happinessHistory: appendHappinessHistory({}, TEST_SCENARIO_CYCLE, base),
  };
  const peakTracking = updatePeakGreenTracking({}, {}, TEST_SCENARIO_CYCLE, withGap);
  return {
    ...withGap,
    peakGreenRatio: peakTracking.peakGreenRatio,
    peakGreenRatioCycle: peakTracking.peakGreenRatioCycle,
  };
}
