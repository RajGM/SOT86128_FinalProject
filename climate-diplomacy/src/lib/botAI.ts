/**
 * Smart bot AI — utility-based heuristic decision-making (not Nash equilibrium).
 *
 * Each country archetype (fossil_maximiser, green_pioneer, pragmatic_balancer,
 * development_first) scores game state via weighted utilities. Per cycle bots
 * perform 1-step lookahead for builds/trades, adjust carbon tax on a schedule,
 * and cast summit votes by comparing estimated utility if a resolution passes
 * vs fails. Deterministic for identical game state + hex layout.
 */
import type { CountryId, HexData } from "../types/hex";
import { COUNTRY_CONFIGS } from "../types/hex";
import type {
  BuildEffects,
  BuildType,
  CarbonTaxRecycling,
  GameState,
  PendingSummitVote,
  PlacedBuilding,
  RegionState,
  SummitBoundaryType,
  SummitVoteChoice,
  TradeItem,
} from "../types/game";
import { tileKey } from "../types/game";
import { REGION_PROFILES } from "../config/regionProfiles";
import { BUILD_BY_ID } from "../config/builds";
import {
  canBuildOnTile,
  getBuildCost,
  getBuildDefinition,
  getBuildTechCost,
} from "./buildRules";
import {
  calculateTaxCollected,
  getCarbonTaxCeiling,
  getCarbonTaxFloor,
  resolveSubsidizedMoneyCost,
  snapCarbonTaxRate,
} from "./carbonTaxMechanics";
import { createEmptyFactionCycleEvents, recordBuildFactionEvent } from "./factionMechanics";
import { createHexLookup } from "./hexUtils";
import { computePerCapitaConsumption, isConstructionBlocked } from "./populationMechanics";
import { findBestRoute, findExistingRoute } from "./routeDetection";
import { applyTradeTransfer } from "./gameState";
import { getCountryTotalCapacity } from "./transportHub";
import {
  canInitiateTrade,
  getTradeTransportUnits,
  RELATION_START,
  RELATION_TRADE_THRESHOLD,
} from "./relationMechanics";
import {
  createTradeAgreement,
  createTransitRequests,
  createTransportRoute,
} from "./tradeRules";

const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS) as CountryId[];

export type BotStrategy =
  | "fossil_maximiser"
  | "green_pioneer"
  | "pragmatic_balancer"
  | "development_first";

export const BOT_STRATEGY_BY_COUNTRY: Record<CountryId, BotStrategy> = {
  opec: "fossil_maximiser",
  russia: "fossil_maximiser",
  eu: "green_pioneer",
  latam: "green_pioneer",
  usa: "pragmatic_balancer",
  china: "pragmatic_balancer",
  india: "development_first",
  africa: "development_first",
};

export interface StrategyWeights {
  money: number;
  energy: number;
  food: number;
  population: number;
  happiness: number;
  technology: number;
  /** Positive = prefer high CO₂; negative = prefer low CO₂. */
  co2: number;
  factionAlignment: number;
  relations: number;
  gapPressure: number;
  fuelStock: number;
  rareEarthStock: number;
}

export const STRATEGY_WEIGHTS: Record<BotStrategy, StrategyWeights> = {
  fossil_maximiser: {
    money: 1.0,
    energy: 0.9,
    food: 0.5,
    population: 0.3,
    happiness: 0.4,
    technology: 0.3,
    co2: 0.7,
    factionAlignment: 1.4,
    relations: 0.2,
    gapPressure: 0.15,
    fuelStock: 0.7,
    rareEarthStock: 0.2,
  },
  green_pioneer: {
    money: 0.5,
    energy: 0.8,
    food: 0.7,
    population: 0.3,
    happiness: 0.8,
    technology: 0.9,
    co2: -1.2,
    factionAlignment: 1.5,
    relations: 0.5,
    gapPressure: 0.45,
    fuelStock: -0.2,
    rareEarthStock: 0.3,
  },
  pragmatic_balancer: {
    money: 0.9,
    energy: 0.9,
    food: 0.8,
    population: 0.5,
    happiness: 0.7,
    technology: 0.7,
    co2: -0.35,
    factionAlignment: 1.1,
    relations: 0.4,
    gapPressure: 0.3,
    fuelStock: 0.4,
    rareEarthStock: 0.4,
  },
  development_first: {
    money: 0.9,
    energy: 1.1,
    food: 1.2,
    population: 0.8,
    happiness: 0.6,
    technology: 0.8,
    co2: -0.15,
    factionAlignment: 1.0,
    relations: 0.35,
    gapPressure: 0.25,
    fuelStock: 0.5,
    rareEarthStock: 0.35,
  },
};

const FOOD_EXPORTERS: CountryId[] = ["latam", "usa", "eu"];
const FUEL_EXPORTERS: CountryId[] = ["opec", "russia"];
const TECH_EXPORTERS: CountryId[] = ["eu", "china"];
const RARE_EARTH_EXPORTER: CountryId = "china";

/** Minimum simulated utility gain to prefer a build (lower = more willing to act). */
const BUILD_ACTION_THRESHOLD = 0.06;
/** Accept marginal trades when resources are tight. */
const TRADE_ACTION_THRESHOLD = 0.04;
/** Fallback build when no action passed thresholds — still require affordable placement. */
const BUILD_FALLBACK_THRESHOLD = -0.25;
const TAX_ADJUST_INTERVAL = 1;
const RELATION_PREFER_THRESHOLD = 40;

const ENERGY_EXPORTERS: CountryId[] = ["russia", "opec", "china", "usa"];

function botLog(message: string, detail?: unknown): void {
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env?.DEV &&
    typeof globalThis !== "undefined" &&
    (globalThis as { __BOT_AI_DEBUG__?: boolean }).__BOT_AI_DEBUG__
  ) {
    console.log("[botAI]", message, detail ?? "");
  }
}

function countryGreenLean(countryId: CountryId): number {
  const profile = REGION_PROFILES[countryId];
  const total = profile.legacyBrown + profile.legacyGreen;
  return total > 0 ? profile.legacyGreen / total : 0.5;
}

function getLatestGapScore(state: GameState, countryId: CountryId): number {
  const history = state.gapScoreHistory[countryId];
  if (!history?.length) return 0;
  return history[history.length - 1].gap;
}

/** Estimated faction satisfaction swing from placing one building (cycle-end deltas). */
export function estimateFactionDeltaFromBuild(
  countryId: CountryId,
  buildType: BuildType
): number {
  const greenLean = countryGreenLean(countryId);
  let brown = 0;
  let green = 0;
  switch (buildType) {
    case "fossil_plant":
      brown += 5;
      green -= 5;
      break;
    case "green_plant":
    case "nuclear_plant":
      green += 5;
      brown -= 3;
      break;
    case "extractor":
      brown += 3;
      green -= 2;
      break;
    case "industrial_complex":
      brown += 4;
      break;
    case "manufacturing":
      green += 3;
      break;
    case "farm":
      green += 2;
      break;
    default:
      break;
  }
  return greenLean * green + (1 - greenLean) * brown;
}

function norm(value: number, scale: number): number {
  if (scale <= 0) return 0;
  return value / scale;
}

function getRelation(regions: Record<CountryId, RegionState>, from: CountryId, to: CountryId): number {
  return regions[from].relations[to] ?? RELATION_START;
}

function averageRelations(region: RegionState): number {
  const scores = Object.values(region.relations);
  if (scores.length === 0) return RELATION_START;
  return scores.reduce((s, v) => s + v, 0) / scores.length;
}

function factionAlignmentScore(countryId: CountryId, region: RegionState): number {
  const profile = REGION_PROFILES[countryId];
  const total = profile.legacyBrown + profile.legacyGreen;
  const greenLean = total > 0 ? profile.legacyGreen / total : 0.5;
  return greenLean * region.factions.greenSatisfaction + (1 - greenLean) * region.factions.brownSatisfaction;
}

function isCeilingResolution(boundaryType: SummitBoundaryType): boolean {
  return boundaryType === "temperature" || boundaryType === "co2_concentration";
}

/** Score a region snapshot for an archetype (higher = better for that bot). */
export function scoreState(
  region: RegionState,
  countryId: CountryId,
  strategy: BotStrategy,
  gapScore = 0
): number {
  const w = STRATEGY_WEIGHTS[strategy];
  const drain = computePerCapitaConsumption(region.population);

  let score = 0;
  score += w.money * norm(region.money, 100);
  score += w.energy * norm(region.energy, Math.max(drain.energy * 8, 20));
  score += w.food * norm(region.food, Math.max(drain.food * 8, 20));
  score += w.population * norm(region.population, 100);
  score += w.happiness * norm(region.happiness, 100);
  score += w.technology * norm(region.technology, 100);
  score += w.co2 * norm(region.co2, 100);
  score += w.factionAlignment * norm(factionAlignmentScore(countryId, region), 100) * 1.35;
  score += w.relations * norm(averageRelations(region), 100);
  // Priority 2: strategic gap pressure (lower gap = better for green/development archetypes)
  score += w.gapPressure * (strategy === "green_pioneer" ? -gapScore : gapScore * 0.35);
  score += w.fuelStock * norm(region.deposits.fuel, 40);
  score += w.rareEarthStock * norm(region.deposits.rare_earth, 30);
  return score;
}

/** Utility delta between two region snapshots. */
export function scoreDelta(
  before: RegionState,
  after: RegionState,
  countryId: CountryId,
  strategy: BotStrategy,
  gapBefore = 0,
  gapAfter = 0
): number {
  return (
    scoreState(after, countryId, strategy, gapAfter) -
    scoreState(before, countryId, strategy, gapBefore)
  );
}

function buildPriority(
  strategy: BotStrategy,
  foodPressure: boolean,
  energyPressure: boolean,
  fuelPressure: boolean
): BuildType[] {
  const fossil: BuildType[] = ["extractor", "fossil_plant", "farm", "transport_hub", "manufacturing"];
  const green: BuildType[] = ["green_plant", "farm", "manufacturing", "transport_hub", "nuclear_plant"];
  const pragmatic: BuildType[] = ["farm", "manufacturing", "fossil_plant", "green_plant", "extractor"];
  const development: BuildType[] = ["farm", "fossil_plant", "city", "transport_hub", "manufacturing"];

  let base: BuildType[];
  switch (strategy) {
    case "fossil_maximiser":
      base = fossil;
      break;
    case "green_pioneer":
      base = green;
      break;
    case "pragmatic_balancer":
      base = pragmatic;
      break;
    case "development_first":
      base = development;
      break;
  }

  const ordered: BuildType[] = [];
  if (foodPressure) ordered.push("farm");
  if (energyPressure) {
    ordered.push(strategy === "green_pioneer" ? "green_plant" : "fossil_plant");
  }
  if (fuelPressure) ordered.push("extractor");
  for (const t of base) {
    if (!ordered.includes(t)) ordered.push(t);
  }
  return ordered.slice(0, 5);
}

function hexPlacementScore(hex: HexData, buildType: BuildType): number {
  if (buildType === "farm") {
    if (hex.terrain === "agricultural") return 3;
    if (hex.terrain === "coastal" || hex.terrain === "land") return 1;
    return 0;
  }
  if (buildType === "extractor") {
    if (hex.resource === "fuel") return 4;
    if (hex.resource === "rare_earth") return 3;
    if (hex.resource) return 2;
    return 0;
  }
  if (buildType === "green_plant" && hex.terrain === "desert") return 2;
  if (hex.terrain === "ocean" || hex.terrain === "arctic") return -1;
  return 1;
}

function findCandidateHexes(
  hexes: HexData[],
  countryId: CountryId,
  buildType: BuildType,
  occupied: Set<string>,
  limit = 4
): HexData[] {
  return hexes
    .filter((h) => h.countryId === countryId)
    .filter((h) => !occupied.has(tileKey(h.q, h.r)))
    .map((h) => ({ hex: h, score: hexPlacementScore(h, buildType) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.hex);
}

function estimateCycleEffects(
  buildType: BuildType,
  tier: 1 | 2 | 3,
  hex: HexData,
  rareEarthStock: number
): BuildEffects {
  const def = BUILD_BY_ID[buildType];
  const raw = { ...def.effectsByTier[tier] };
  const result: BuildEffects = {};

  for (const [key, val] of Object.entries(raw) as [keyof BuildEffects, number | undefined][]) {
    if (val === undefined || val === 0) continue;
    result[key] = val;
  }

  if (buildType === "green_plant" && hex.terrain === "desert" && result.energy) {
    result.energy = Math.round(result.energy * 1.3);
  }
  if (buildType === "manufacturing" && rareEarthStock >= 1 && result.technology) {
    result.technology = Math.floor(result.technology * 1.5);
  }
  if (buildType === "extractor" && hex.resource) {
    const upkeep = { 1: 3, 2: 5, 3: 8 }[tier];
    const co2 = { 1: 3, 2: 4, 3: 5 }[tier];
    return { money: -upkeep, co2 };
  }
  return result;
}

function applyEffectsToRegion(region: RegionState, effects: BuildEffects): RegionState {
  const next = { ...region };
  if (effects.money) next.money = Math.max(0, next.money + effects.money);
  if (effects.energy) next.energy = Math.max(0, next.energy + effects.energy);
  if (effects.food) next.food = Math.max(0, next.food + effects.food);
  if (effects.population) next.population = Math.max(0, next.population + effects.population);
  if (effects.happiness) next.happiness = Math.min(100, Math.max(0, next.happiness + effects.happiness));
  if (effects.technology) next.technology = Math.max(0, next.technology + effects.technology);
  if (effects.co2) next.co2 = Math.max(0, next.co2 + effects.co2);
  return next;
}

function simulateBuildOutcome(
  region: RegionState,
  countryId: CountryId,
  strategy: BotStrategy,
  buildType: BuildType,
  tier: 1 | 2 | 3,
  hex: HexData,
  baseCost: number,
  techCost: number,
  gapScore = 0
): number {
  const afterSpend: RegionState = {
    ...region,
    money: region.money - baseCost,
    technology: region.technology - techCost,
  };
  const cycleFx = estimateCycleEffects(buildType, tier, hex, afterSpend.deposits.rare_earth);
  const afterYield = applyEffectsToRegion(afterSpend, cycleFx);

  if (buildType === "extractor" && hex.resource) {
    const depositYield = { 1: 2, 2: 4, 3: 7 }[tier];
    afterYield.deposits = {
      ...afterYield.deposits,
      [hex.resource]: afterYield.deposits[hex.resource] + depositYield,
    };
  }

  const utilityDelta = scoreDelta(region, afterYield, countryId, strategy, gapScore, gapScore);
  const factionBoost = estimateFactionDeltaFromBuild(countryId, buildType) * 0.12;
  return utilityDelta + factionBoost;
}

function createBotBuilding(
  buildType: BuildType,
  tier: 1 | 2 | 3,
  hex: HexData,
  countryId: CountryId,
  builtAt: number
): PlacedBuilding {
  return {
    id: `bot-${countryId}-${buildType}-${hex.q}-${hex.r}-${builtAt}`,
    type: buildType,
    tier,
    builtAt,
    q: hex.q,
    r: hex.r,
    countryId,
  };
}

function findBestBuild(
  state: GameState,
  hexes: HexData[],
  countryId: CountryId,
  tierCap: 1 | 2 = 2
): { gain: number; buildType: BuildType; tier: 1 | 2 | 3; hex: HexData; cost: number; techCost: number; greenSubsidyPool: number } | null {
  const region = state.regions[countryId];
  if (isConstructionBlocked(region.happiness)) return null;

  const drain = computePerCapitaConsumption(region.population);
  const foodPressure = region.food < drain.food * 5;
  const energyPressure = region.energy < drain.energy * 5;
  const fuelPressure = region.deposits.fuel < 8;
  const strategy = BOT_STRATEGY_BY_COUNTRY[countryId];
  const priorities = buildPriority(strategy, foodPressure, energyPressure, fuelPressure);
  const occupied = new Set(Object.keys(state.tileBuildings));
  const hexLookup = createHexLookup(hexes);
  const gapScore = getLatestGapScore(state, countryId);

  let best: {
    gain: number;
    buildType: BuildType;
    tier: 1 | 2 | 3;
    hex: HexData;
    cost: number;
    techCost: number;
    greenSubsidyPool: number;
  } | null = null;

  for (const buildType of priorities) {
    const build = getBuildDefinition(buildType);
    const candidateHexes = findCandidateHexes(hexes, countryId, buildType, occupied, 6);

    for (const hex of candidateHexes) {
      for (const tier of [1, 2] as const) {
        if (tier > tierCap) continue;
        const key = tileKey(hex.q, hex.r);
        if (state.tileBuildings[key]) continue;

        const placement = canBuildOnTile(
          hex,
          build,
          state.tileBuildings,
          tier,
          state.testingMode,
          hexLookup,
          region.technology,
          state.testingMode ? undefined : countryId
        );
        if (!placement.available) continue;

        const baseCost = getBuildCost(build, tier);
        const techCost = getBuildTechCost(build, tier);
        const { cost, greenSubsidyPool } = resolveSubsidizedMoneyCost(region, buildType, baseCost);
        if (region.money < cost || region.technology < techCost) continue;

        if (tier === 2) {
          const tier1Cost = getBuildCost(build, 1);
          const tier1Gain = simulateBuildOutcome(
            region,
            countryId,
            strategy,
            buildType,
            1,
            hex,
            tier1Cost,
            getBuildTechCost(build, 1),
            gapScore
          );
          const tier2Gain = simulateBuildOutcome(
            region,
            countryId,
            strategy,
            buildType,
            2,
            hex,
            cost,
            techCost,
            gapScore
          );
          if (tier2Gain < tier1Gain * 1.08) continue;
        }

        const gain = simulateBuildOutcome(
          region,
          countryId,
          strategy,
          buildType,
          tier,
          hex,
          cost,
          techCost,
          gapScore
        );
        if (!best || gain > best.gain) {
          best = { gain, buildType, tier, hex, cost, techCost, greenSubsidyPool };
        }
      }
    }
  }

  return best;
}

function applyBuildChoice(
  state: GameState,
  countryId: CountryId,
  best: {
    buildType: BuildType;
    tier: 1 | 2 | 3;
    hex: HexData;
    cost: number;
    techCost: number;
    greenSubsidyPool: number;
  }
): GameState {
  const region = state.regions[countryId];
  const key = tileKey(best.hex.q, best.hex.r);
  const newBuilding = createBotBuilding(best.buildType, best.tier, best.hex, countryId, state.cycle);
  const prevEvents = state.factionCycleEvents[countryId] ?? createEmptyFactionCycleEvents();
  const buildEvents = recordBuildFactionEvent(prevEvents, best.buildType);

  return {
    ...state,
    tileBuildings: { ...state.tileBuildings, [key]: newBuilding },
    factionCycleEvents: {
      ...state.factionCycleEvents,
      [countryId]: buildEvents,
    },
    regions: {
      ...state.regions,
      [countryId]: {
        ...region,
        money: region.money - best.cost,
        technology: region.technology - best.techCost,
        greenSubsidyPool: best.greenSubsidyPool,
      },
    },
  };
}

function tryPlaceBuild(
  state: GameState,
  hexes: HexData[],
  countryId: CountryId,
  minGain = BUILD_ACTION_THRESHOLD
): GameState | null {
  const best = findBestBuild(state, hexes, countryId);
  if (!best || best.gain < minGain) return null;
  botLog(`${countryId} build`, { type: best.buildType, tier: best.tier, gain: best.gain });
  return applyBuildChoice(state, countryId, best);
}

interface TradeCandidate {
  sellerId: CountryId;
  buyerId: CountryId;
  item: TradeItem;
  amount: number;
  utilityGain: number;
}

function partnerScore(
  regions: Record<CountryId, RegionState>,
  from: CountryId,
  to: CountryId,
  desperate: boolean
): number {
  const rel = getRelation(regions, from, to);
  if (rel < RELATION_TRADE_THRESHOLD && !desperate) return -100;
  if (rel >= RELATION_PREFER_THRESHOLD) return rel;
  if (rel < RELATION_PREFER_THRESHOLD && !desperate) return rel * 0.5;
  return rel;
}

function canExecuteTrade(
  state: GameState,
  hexes: HexData[],
  sellerId: CountryId,
  buyerId: CountryId,
  amount: number
): { route: ReturnType<typeof findExistingRoute>; transportRoutes: GameState["transportRoutes"]; transitRequests: GameState["transitRequests"] } | null {
  const suspended = state.tradeRestrictionSuspensionUntil > state.cycle;
  if (!canInitiateTrade(state.regions, sellerId, buyerId, suspended)) return null;

  const buildings = Object.values(state.tileBuildings);
  const capacity = getCountryTotalCapacity(sellerId, buildings);
  const used = state.transportCapacityUsed[sellerId] ?? 0;
  const transportUnits = getTradeTransportUnits(state.regions, sellerId, buyerId, amount);
  if (transportUnits > 0 && used + transportUnits > capacity) return null;

  let route = findExistingRoute(sellerId, buyerId, state.transportRoutes);
  let transportRoutes = state.transportRoutes;
  let transitRequests = state.transitRequests;

  if (!route) {
    const option = findBestRoute(sellerId, buyerId, buildings, hexes, state.transitAgreements);
    if (!option || option.needsTransitApproval) return null;
    const newRoute = createTransportRoute(option);
    route = newRoute;
    transportRoutes = [...transportRoutes, newRoute];
    if (option.transitRegions.length > 0) {
      transitRequests = [...transitRequests, ...createTransitRequests(newRoute)];
    }
  }

  if (!route || route.status !== "active") return null;
  return { route, transportRoutes, transitRequests };
}

function evaluateTrade(
  state: GameState,
  sellerId: CountryId,
  buyerId: CountryId,
  item: TradeItem,
  amount: number,
  perspectiveId: CountryId
): number {
  const seller = state.regions[sellerId];
  const buyer = state.regions[buyerId];
  const strategy = BOT_STRATEGY_BY_COUNTRY[perspectiveId];
  const transferred = applyTradeTransfer(seller, buyer, item, amount);
  if (!transferred) return -Infinity;

  if (perspectiveId === buyerId) {
    return scoreDelta(buyer, transferred.to, buyerId, strategy);
  }
  if (perspectiveId === sellerId) {
    return scoreDelta(seller, transferred.from, sellerId, strategy);
  }
  return 0;
}

function collectTradeCandidates(state: GameState, countryId: CountryId): TradeCandidate[] {
  const region = state.regions[countryId];
  const drain = computePerCapitaConsumption(region.population);
  const candidates: TradeCandidate[] = [];

  const desperateFood = region.food < drain.food * 2.5;
  const desperateEnergy = region.energy < drain.energy * 2.5;
  const desperateFuel = region.deposits.fuel < 2;
  const desperateTech = region.technology < 30;

  // Food buyer
  if (region.food < drain.food * 4) {
    const amount = Math.min(15, Math.max(5, Math.ceil(drain.food * 2)));
    for (const sellerId of FOOD_EXPORTERS) {
      if (sellerId === countryId) continue;
      const seller = state.regions[sellerId];
      if (seller.food < amount + drain.food * 0.5) continue;
      const relScore = partnerScore(state.regions, sellerId, countryId, desperateFood);
      if (relScore < 0) continue;
      const utilityGain = evaluateTrade(state, sellerId, countryId, "food", amount, countryId) + relScore * 0.01;
      candidates.push({ sellerId, buyerId: countryId, item: "food", amount, utilityGain });
    }
  }

  // Energy buyer
  if (region.energy < drain.energy * 4) {
    const amount = Math.min(20, Math.max(6, Math.ceil(drain.energy * 2.5)));
    for (const sellerId of ENERGY_EXPORTERS) {
      if (sellerId === countryId) continue;
      const seller = state.regions[sellerId];
      if (seller.energy < amount + drain.energy) continue;
      const relScore = partnerScore(state.regions, sellerId, countryId, desperateEnergy);
      if (relScore < 0) continue;
      const utilityGain =
        evaluateTrade(state, sellerId, countryId, "energy", amount, countryId) + relScore * 0.012;
      candidates.push({ sellerId, buyerId: countryId, item: "energy", amount, utilityGain });
    }
  }

  // Fuel buyer (manufacturing / industrial countries)
  const needsFuel =
    region.deposits.fuel < 10 &&
    (BOT_STRATEGY_BY_COUNTRY[countryId] !== "green_pioneer" || desperateFuel);
  if (needsFuel) {
    const amount = Math.min(12, Math.max(4, 10 - region.deposits.fuel));
    for (const sellerId of FUEL_EXPORTERS) {
      if (sellerId === countryId) continue;
      const seller = state.regions[sellerId];
      if (seller.deposits.fuel < amount + 2) continue;
      const relScore = partnerScore(state.regions, sellerId, countryId, desperateFuel);
      if (relScore < 0) continue;
      const utilityGain = evaluateTrade(state, sellerId, countryId, "fuel", amount, countryId) + relScore * 0.01;
      candidates.push({ sellerId, buyerId: countryId, item: "fuel", amount, utilityGain });
    }
  }

  // Tech buyer
  if (region.technology < 50) {
    const amount = Math.min(10, Math.max(3, 40 - region.technology));
    for (const sellerId of TECH_EXPORTERS) {
      if (sellerId === countryId) continue;
      const seller = state.regions[sellerId];
      if (seller.technology < amount + 15) continue;
      const relScore = partnerScore(state.regions, sellerId, countryId, desperateTech);
      if (relScore < 0) continue;
      const utilityGain = evaluateTrade(state, sellerId, countryId, "technology", amount, countryId) + relScore * 0.01;
      candidates.push({ sellerId, buyerId: countryId, item: "technology", amount, utilityGain });
    }
  }

  // Rare earth buyer
  if (region.deposits.rare_earth < 5 && countryId !== RARE_EARTH_EXPORTER) {
    const amount = Math.min(8, Math.max(3, 8 - region.deposits.rare_earth));
    const seller = state.regions[RARE_EARTH_EXPORTER];
    if (seller.deposits.rare_earth >= amount + 2) {
      const relScore = partnerScore(state.regions, RARE_EARTH_EXPORTER, countryId, region.deposits.rare_earth < 2);
      if (relScore >= 0) {
        const utilityGain =
          evaluateTrade(state, RARE_EARTH_EXPORTER, countryId, "rare_earth", amount, countryId) + relScore * 0.01;
        candidates.push({
          sellerId: RARE_EARTH_EXPORTER,
          buyerId: countryId,
          item: "rare_earth",
          amount,
          utilityGain,
        });
      }
    }
  }

  // Tech seller (EU/China offload surplus)
  if (TECH_EXPORTERS.includes(countryId) && region.technology > 55) {
    const buyers: CountryId[] = ["india", "africa", "latam"];
    const amount = 5;
    for (const buyerId of buyers) {
      const buyer = state.regions[buyerId];
      if (buyer.technology > 45) continue;
      const relScore = partnerScore(state.regions, countryId, buyerId, false);
      if (relScore < 0) continue;
      const utilityGain = evaluateTrade(state, countryId, buyerId, "technology", amount, countryId) + relScore * 0.008;
      candidates.push({ sellerId: countryId, buyerId, item: "technology", amount, utilityGain });
    }
  }

  // Food seller
  if (FOOD_EXPORTERS.includes(countryId) && region.food > drain.food * 6) {
    const buyers: CountryId[] = ["india", "africa", "opec"];
    const amount = 10;
    for (const buyerId of buyers) {
      const buyer = state.regions[buyerId];
      if (buyer.food >= drain.food * 3) continue;
      const relScore = partnerScore(state.regions, countryId, buyerId, false);
      if (relScore < 0) continue;
      const utilityGain = evaluateTrade(state, countryId, buyerId, "food", amount, countryId) + relScore * 0.008;
      candidates.push({ sellerId: countryId, buyerId, item: "food", amount, utilityGain });
    }
  }

  return candidates;
}

function tryTrade(
  state: GameState,
  hexes: HexData[],
  countryId: CountryId,
  minGain = TRADE_ACTION_THRESHOLD
): GameState | null {
  const candidates = collectTradeCandidates(state, countryId)
    .filter((c) => c.utilityGain > minGain)
    .sort((a, b) => b.utilityGain - a.utilityGain);

  for (const candidate of candidates) {
    const { sellerId, buyerId, item, amount } = candidate;
    const tradePath = canExecuteTrade(state, hexes, sellerId, buyerId, amount);
    if (!tradePath) continue;

    const seller = state.regions[sellerId];
    const buyer = state.regions[buyerId];
    const transferred = applyTradeTransfer(seller, buyer, item, amount);
    if (!transferred) continue;

    const agreement = createTradeAgreement(
      sellerId,
      buyerId,
      item,
      amount,
      tradePath.route!.id,
      "one_time"
    );

    botLog(`${countryId} trade`, { item, amount, from: sellerId, to: buyerId, gain: candidate.utilityGain });
    return {
      ...state,
      transportRoutes: tradePath.transportRoutes,
      transitRequests: tradePath.transitRequests,
      tradeAgreements: [...state.tradeAgreements, agreement],
      regions: {
        ...state.regions,
        [sellerId]: transferred.from,
        [buyerId]: transferred.to,
      },
    };
  }

  return null;
}

function defaultRecycling(strategy: BotStrategy, region: RegionState): CarbonTaxRecycling {
  switch (strategy) {
    case "green_pioneer":
      return "subsidy";
    case "development_first":
    case "fossil_maximiser":
      return "dividend";
    case "pragmatic_balancer":
      return region.money > 60 ? "finance" : "dividend";
  }
}

function targetCarbonTax(
  state: GameState,
  countryId: CountryId,
  strategy: BotStrategy,
  region: RegionState
): number {
  const floor = getCarbonTaxFloor(state, countryId);
  const ceiling = getCarbonTaxCeiling(state, countryId) ?? 100;
  const greenLean = countryGreenLean(countryId);
  const brownUnhappy = region.factions.brownSatisfaction < 42;
  const greenUnhappy = region.factions.greenSatisfaction < 42;

  let target: number;
  switch (strategy) {
    case "fossil_maximiser":
      target = floor;
      if (brownUnhappy && region.carbonTax > floor) {
        target = Math.max(floor, region.carbonTax - 5);
      }
      break;
    case "green_pioneer": {
      const base = region.money > 35 ? (greenLean > 0.6 ? 72 : 62) : 50;
      target = Math.max(floor, Math.min(ceiling, base));
      if (greenUnhappy) target = Math.min(ceiling, target + 8);
      break;
    }
    case "development_first":
      target = floor > 0 ? floor : Math.min(ceiling, greenUnhappy ? 15 : 8);
      break;
    case "pragmatic_balancer": {
      const emissionsPressure = region.co2 > 50 ? 35 : region.co2 > 30 ? 25 : 15;
      const affordable = region.money > 30 ? emissionsPressure : floor;
      target = Math.max(floor, Math.min(ceiling, affordable));
      if (greenLean > 0.55 && greenUnhappy) target = Math.min(ceiling, target + 6);
      if (greenLean < 0.45 && brownUnhappy) target = Math.max(floor, target - 6);
      break;
    }
    default:
      target = floor;
  }

  return Math.max(floor, Math.min(ceiling, target));
}

function tryAdjustCarbonTax(state: GameState, countryId: CountryId, force = false): GameState {
  const region = state.regions[countryId];
  const strategy = BOT_STRATEGY_BY_COUNTRY[countryId];
  const floor = getCarbonTaxFloor(state, countryId);
  const needsCompliance = region.carbonTax < floor;
  const onSchedule = state.cycle % TAX_ADJUST_INTERVAL === 0;

  if (!force && !needsCompliance && !onSchedule) return state;

  const ceiling = getCarbonTaxCeiling(state, countryId) ?? 100;
  const target = targetCarbonTax(state, countryId, strategy, region);
  const clamped = snapCarbonTaxRate(target, floor, ceiling);
  const recycling = defaultRecycling(strategy, region);

  if (clamped === region.carbonTax && region.carbonTaxRecycling === recycling) return state;

  botLog(`${countryId} tax`, { from: region.carbonTax, to: clamped, recycling });
  return {
    ...state,
    regions: {
      ...state.regions,
      [countryId]: {
        ...region,
        carbonTax: clamped,
        carbonTaxRecycling: recycling,
      },
    },
  };
}

function estimateTaxComplianceCost(region: RegionState, requiredTax: number): number {
  const gap = Math.max(0, requiredTax - region.carbonTax);
  if (gap <= 0) return 0;
  return calculateTaxCollected(region.co2, gap);
}

function countryHasSurplus(region: RegionState, threshold: number): boolean {
  return region.food > threshold || region.energy > threshold;
}

function isDeficitCountry(region: RegionState): boolean {
  const drain = computePerCapitaConsumption(region.population);
  return region.food < drain.food || region.energy < drain.energy || region.money < 10;
}

function simulateResolutionPass(
  countryId: CountryId,
  pending: PendingSummitVote,
  regions: Record<CountryId, RegionState>
): RegionState {
  const region = regions[countryId];
  let next = { ...region };

  if (pending.boundaryType === "temperature") {
    const newTax = Math.max(region.carbonTax, pending.threshold);
    const extraCost = estimateTaxComplianceCost(region, newTax);
    next = { ...next, carbonTax: newTax, money: Math.max(0, next.money - extraCost) };
    return next;
  }

  if (pending.boundaryType === "co2_concentration") {
    const targets =
      pending.targetCountries === "all" ? ALL_COUNTRIES : pending.targetCountries;
    if (targets.includes(countryId)) {
      const pct = (pending.reductionPercent ?? pending.threshold) / 100;
      next = { ...next, co2: Math.max(0, next.co2 * (1 - pct)) };
    }
    return next;
  }

  if (pending.boundaryType === "human_development") {
    if (countryHasSurplus(region, pending.threshold)) {
      const giveFood = Math.min(15, Math.max(5, region.food - pending.threshold));
      next = { ...next, food: next.food - giveFood };
    } else if (isDeficitCountry(region)) {
      next = { ...next, food: next.food + 8, energy: next.energy + 5 };
    }
    return next;
  }

  if (pending.boundaryType === "inequality") {
    if (region.money > 60) {
      const moneyGive = pending.severityLevel && pending.severityLevel >= 2 ? 15 : 10;
      const techGive = pending.severityLevel && pending.severityLevel >= 2 ? 8 : 5;
      if (region.money >= moneyGive) {
        next = { ...next, money: next.money - moneyGive };
      } else {
        next = { ...next, technology: Math.max(0, next.technology - techGive) };
      }
    } else if (region.money < 30 || region.technology < 20) {
      next = { ...next, money: next.money + 10, technology: next.technology + 5 };
    }
    return next;
  }

  if (pending.boundaryType === "political_stability") {
    if (pending.severityLevel && pending.severityLevel >= 2) {
      if (region.happiness > 60) {
        const crisisCount = ALL_COUNTRIES.filter((id) => regions[id].happiness < 30).length;
        next = { ...next, money: Math.max(0, next.money - 10 * crisisCount) };
      }
    } else {
      const frozen = region.carbonTax;
      if (region.carbonTax > frozen) {
        next = { ...next, carbonTax: frozen };
      }
    }
    return next;
  }

  return next;
}

/** Utility-based summit vote: YES if passing raises archetype utility. */
export function computeBotVote(
  countryId: CountryId,
  pending: PendingSummitVote,
  regions: Record<CountryId, RegionState>
): SummitVoteChoice {
  const strategy = BOT_STRATEGY_BY_COUNTRY[countryId];
  const region = regions[countryId];
  const ceiling = isCeilingResolution(pending.boundaryType);

  let utilityPass = scoreState(simulateResolutionPass(countryId, pending, regions), countryId, strategy);
  const utilityFail = scoreState(region, countryId, strategy);

  if (strategy === "green_pioneer" && ceiling) {
    utilityPass += 1.2;
  }
  if (strategy === "fossil_maximiser" && ceiling) {
    utilityPass -= 1.5;
  }

  const delta = utilityPass - utilityFail;

  const voteThreshold = ceiling ? 0.15 : 0.25;

  if (delta > voteThreshold) return "yes";
  if (delta < -voteThreshold) return "no";

  // Tie-breakers preserve recognizable archetype behaviour
  if (strategy === "green_pioneer") return delta >= 0 ? "yes" : "abstain";
  if (strategy === "fossil_maximiser") {
    if (ceiling) return "no";
    if (pending.boundaryType === "inequality" || pending.boundaryType === "human_development") {
      return countryHasSurplus(region, pending.threshold) ? "no" : "yes";
    }
    return "no";
  }
  if (strategy === "development_first") {
    if (pending.boundaryType === "inequality" || pending.boundaryType === "human_development") return "yes";
    return region.happiness < 50 ? "yes" : "abstain";
  }
  return "abstain";
}

/** Run build + trade + tax adjust per bot country before cycle processing. */
export function runBotTurns(
  state: GameState,
  hexes: HexData[],
  botCountries: CountryId[]
): GameState {
  let next = state;

  for (const countryId of botCountries) {
    let acted = false;

    const afterTax = tryAdjustCarbonTax(next, countryId);
    if (afterTax !== next) {
      next = afterTax;
      acted = true;
    }

    const afterBuild = tryPlaceBuild(next, hexes, countryId);
    if (afterBuild) {
      next = afterBuild;
      acted = true;
    }

    const afterTrade = tryTrade(next, hexes, countryId);
    if (afterTrade) {
      next = afterTrade;
      acted = true;
    }

    if (!acted) {
      const fallbackBuild = tryPlaceBuild(next, hexes, countryId, BUILD_FALLBACK_THRESHOLD);
      if (fallbackBuild) {
        next = fallbackBuild;
        acted = true;
      } else {
        const fallbackTrade = tryTrade(next, hexes, countryId, -0.05);
        if (fallbackTrade) {
          next = fallbackTrade;
          acted = true;
        } else {
          const forcedTax = tryAdjustCarbonTax(next, countryId, true);
          if (forcedTax !== next) next = forcedTax;
        }
      }
    }
  }

  return next;
}

export function resolveBotCountries(
  humanCountries: CountryId[],
  botControlled: Partial<Record<CountryId, boolean>> = {}
): CountryId[] {
  const activeHumans = new Set(humanCountries);
  return ALL_COUNTRIES.filter((id) => !activeHumans.has(id) || botControlled[id] === true);
}

export function foodCyclesUntilEmpty(startFood: number, population: number): number {
  const drain = computePerCapitaConsumption(population).food;
  if (drain <= 0) return Infinity;
  return Math.floor(startFood / drain);
}
