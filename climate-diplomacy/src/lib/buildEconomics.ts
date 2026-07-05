import type { HexData, ResourceDeposit } from "../types/hex";
import type { BuildEffects, BuildType, PlacedBuilding } from "../types/game";
import { BUILD_BY_ID } from "../config/builds";
import { applyUnrestPopulationPenalty, shouldForceAllBuildingsIdle } from "./populationMechanics";

const INFRA_TYPES = new Set<BuildType>(["airport", "dock", "transport_center"]);

export const EXTRACTOR_YIELD: Record<1 | 2 | 3, number> = { 1: 2, 2: 4, 3: 7 };
export const FOSSIL_FUEL_PER_CYCLE: Record<1 | 2 | 3, number> = { 1: 1, 2: 2, 3: 3 };
export const NUCLEAR_URANIUM_PER_CYCLE: Record<1 | 2 | 3, number> = { 1: 1, 2: 1, 3: 2 };

/** Buildings idle when population < total workforce demand (LIFO: newest first). Crisis forces all idle. */
export function computeIdleBuildingIds(
  buildings: PlacedBuilding[],
  population: number,
  happiness?: number
): Set<string> {
  if (happiness !== undefined && shouldForceAllBuildingsIdle(happiness)) {
    return new Set(buildings.map((b) => b.id));
  }

  const sorted = [...buildings].sort((a, b) => b.builtAt - a.builtAt);
  let demand = 0;
  for (const b of buildings) {
    demand += BUILD_BY_ID[b.type].workforce;
  }

  const idle = new Set<string>();
  if (population >= demand) return idle;

  let surplus = demand - population;
  for (const building of sorted) {
    if (surplus <= 0) break;
    idle.add(building.id);
    surplus -= BUILD_BY_ID[building.type].workforce;
  }
  return idle;
}

export function getTotalWorkforceDemand(buildings: PlacedBuilding[]): number {
  return buildings.reduce((sum, b) => sum + BUILD_BY_ID[b.type].workforce, 0);
}

/** Extractor yields the tile deposit type (step 2 of cycle). */
export function getExtractorYield(
  building: PlacedBuilding,
  hex: HexData | undefined,
  isWorkforceIdle: boolean
): { deposit: ResourceDeposit; amount: number } | null {
  if (isWorkforceIdle || building.type !== "extractor") return null;
  if (!hex?.resource) return null;
  return { deposit: hex.resource, amount: EXTRACTOR_YIELD[building.tier] };
}

/** Fossil/nuclear idle when stockpile lacks required material (step 3). */
export function computeMaterialShortageIdleIds(
  buildings: PlacedBuilding[],
  workforceIdle: Set<string>,
  deposits: Record<ResourceDeposit, number>
): Set<string> {
  const shortage = new Set<string>();
  const fuelNeeded = new Map<string, number>();
  const uraniumNeeded = new Map<string, number>();

  for (const building of buildings) {
    if (workforceIdle.has(building.id)) continue;
    if (building.type === "fossil_plant") {
      fuelNeeded.set(building.id, FOSSIL_FUEL_PER_CYCLE[building.tier]);
    } else if (building.type === "nuclear_plant") {
      uraniumNeeded.set(building.id, NUCLEAR_URANIUM_PER_CYCLE[building.tier]);
    }
  }

  let fuelPool = deposits.fuel;
  for (const [id, need] of fuelNeeded) {
    if (fuelPool >= need) fuelPool -= need;
    else shortage.add(id);
  }

  let uraniumPool = deposits.uranium;
  for (const [id, need] of uraniumNeeded) {
    if (uraniumPool >= need) uraniumPool -= need;
    else shortage.add(id);
  }

  return shortage;
}

/** Consume fuel/uranium for active plants; returns updated deposits. */
export function consumePlantMaterials(
  buildings: PlacedBuilding[],
  workforceIdle: Set<string>,
  materialIdle: Set<string>,
  deposits: Record<ResourceDeposit, number>
): Record<ResourceDeposit, number> {
  const next = { ...deposits };
  for (const building of buildings) {
    if (workforceIdle.has(building.id) || materialIdle.has(building.id)) continue;
    if (building.type === "fossil_plant") {
      next.fuel -= FOSSIL_FUEL_PER_CYCLE[building.tier];
    } else if (building.type === "nuclear_plant") {
      next.uranium -= NUCLEAR_URANIUM_PER_CYCLE[building.tier];
    }
  }
  return next;
}

function splitEffects(effects: BuildEffects): { yields: BuildEffects; costs: BuildEffects } {
  const yields: BuildEffects = {};
  const costs: BuildEffects = {};
  for (const [key, val] of Object.entries(effects) as [keyof BuildEffects, number | undefined][]) {
    if (val === undefined || val === 0) continue;
    if (val > 0) yields[key] = val;
    else costs[key] = val;
  }
  return { yields, costs };
}

function applyGreenDesertBonus(
  effects: BuildEffects,
  type: BuildType,
  hex: HexData | undefined
): BuildEffects {
  if (type !== "green_plant" || !hex || hex.terrain !== "desert" || !effects.energy) {
    return effects;
  }
  return { ...effects, energy: Math.round(effects.energy * 1.3) };
}

function applyManufacturingRareEarthBonus(
  effects: BuildEffects,
  type: BuildType,
  rareEarthStock: number
): BuildEffects {
  if (type !== "manufacturing" || rareEarthStock < 1) return effects;
  const next = { ...effects };
  if (next.goods) next.goods = Math.round(next.goods * 1.5);
  if (next.technology) next.technology = Math.round(next.technology * 1.33);
  return next;
}

export function getFarmClimateMultiplier(globalTemperature: number): number {
  if (globalTemperature <= 2.0) return 1;
  if (globalTemperature > 3.0) return 0.6;
  return 0.8;
}

/** Food adjustment for step 10 climate effects (applied after temperature update). */
export function computeFarmClimateFoodAdjustment(
  baseFoodYield: number,
  globalTemperature: number
): number {
  if (baseFoodYield <= 0) return 0;
  const adjusted = Math.round(baseFoodYield * getFarmClimateMultiplier(globalTemperature));
  return adjusted - baseFoodYield;
}

function isBuildingActive(
  buildingId: string,
  workforceIdle: Set<string>,
  materialIdle: Set<string>
): boolean {
  return !workforceIdle.has(buildingId) && !materialIdle.has(buildingId);
}

export function computeBuildingYields(
  building: PlacedBuilding,
  hex: HexData | undefined,
  rareEarthStock: number,
  workforceIdle: Set<string>,
  materialIdle: Set<string>,
  happiness = 70
): BuildEffects {
  if (
    !isBuildingActive(building.id, workforceIdle, materialIdle) ||
    INFRA_TYPES.has(building.type) ||
    building.type === "extractor"
  ) {
    return {};
  }

  const def = BUILD_BY_ID[building.type];
  let effects = { ...def.effectsByTier[building.tier] };
  const { yields } = splitEffects(effects);

  let result = applyGreenDesertBonus(yields, building.type, hex);
  result = applyManufacturingRareEarthBonus(result, building.type, rareEarthStock);
  result = applyUnrestPopulationPenalty(result, building.type, happiness);
  return result;
}

export function computeBuildingCosts(
  building: PlacedBuilding,
  workforceIdle: Set<string>,
  materialIdle: Set<string>
): BuildEffects {
  if (!isBuildingActive(building.id, workforceIdle, materialIdle)) return {};

  const def = BUILD_BY_ID[building.type];
  const base = def.effectsByTier[building.tier];
  const { costs } = splitEffects(base);

  if (building.type === "extractor") {
    const tier = building.tier;
    const moneyUpkeep = { 1: -3, 2: -5, 3: -8 }[tier];
    const co2 = { 1: 3, 2: 4, 3: 5 }[tier];
    return { ...costs, money: (costs.money ?? 0) + moneyUpkeep, co2: (costs.co2 ?? 0) + co2 };
  }

  return costs;
}

export function computeExtractorCo2(
  building: PlacedBuilding,
  workforceIdle: Set<string>
): number {
  if (workforceIdle.has(building.id) || building.type !== "extractor") return 0;
  return { 1: 3, 2: 4, 3: 5 }[building.tier];
}

/** @deprecated Use computeBuildingYields + computeBuildingCosts */
export function computeBuildingCycleEffects(
  building: PlacedBuilding,
  hex: HexData | undefined,
  globalTemperature: number,
  isIdle: boolean
): BuildEffects {
  const idle = isIdle ? new Set([building.id]) : new Set<string>();
  const yields = computeBuildingYields(building, hex, 0, idle, new Set());
  const costs = computeBuildingCosts(building, idle, new Set());
  return { ...yields, ...costs };
}

