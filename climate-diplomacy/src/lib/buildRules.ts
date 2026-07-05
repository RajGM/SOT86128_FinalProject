import type { HexData } from "../types/hex";
import type { BuildDefinition, BuildEffects, BuildType, PlacedBuilding } from "../types/game";
import { BUILD_BY_ID } from "../config/builds";

const DEFAULT_DEMOLISH_COST_RATIO = 0.25;
const DEFAULT_DEMOLISH_REFUND_RATIO = 0.35;
const DEFAULT_UPGRADE_COST_RATIO = 0.75;

export interface BuildAvailability {
  available: boolean;
  reason?: string;
}

function matchesResource(
  hex: HexData,
  required?: BuildDefinition["requiredResource"]
): boolean {
  if (!required) return true;
  if (Array.isArray(required)) {
    return required.some((r) => hex.resource === r);
  }
  return hex.resource === required;
}

function matchesTerrain(
  hex: HexData,
  required?: BuildDefinition["requiredTerrain"]
): boolean {
  if (!required) return true;
  if (Array.isArray(required)) {
    return required.some((t) => hex.terrain === t);
  }
  return hex.terrain === required;
}

export function canBuildOnTile(
  hex: HexData,
  build: BuildDefinition,
  existingBuildings: Record<string, PlacedBuilding>,
  tier: 1 | 2 | 3
): BuildAvailability {
  const key = `${hex.q},${hex.r}`;
  if (existingBuildings[key]) {
    return { available: false, reason: "Tile already has a building" };
  }
  if (hex.terrain === "ocean" || hex.terrain === "arctic") {
    return { available: false, reason: "Cannot build on ocean/arctic" };
  }

  if (build.requiredResource && !matchesResource(hex, build.requiredResource)) {
    const req = Array.isArray(build.requiredResource)
      ? build.requiredResource.join(" or ")
      : build.requiredResource.replace("_", " ");
    return { available: false, reason: `Requires ${req} tile` };
  }

  if (build.requiredTerrain && !matchesTerrain(hex, build.requiredTerrain)) {
    const req = Array.isArray(build.requiredTerrain)
      ? build.requiredTerrain.join(" or ")
      : build.requiredTerrain;
    return { available: false, reason: `Requires ${req} terrain` };
  }

  const tierReq = build.tierRequirements?.[tier];
  if (tierReq && tier > 1) {
    return { available: true, reason: `Tier ${tier}: ${tierReq} (advisory)` };
  }

  // Industrial complex tier 1: any non-ocean (already checked)
  if (build.id === "manufacturing" && tier >= 2) {
    const hasMineral = hex.resource === "rare_earth" || hex.resource === "coal";
    if (!hasMineral) {
      return { available: false, reason: `Tier ${tier}: requires mineral/rare earth tile or import` };
    }
  }

  if (build.id === "industrial_complex" || build.id === "manufacturing") {
    if (tier === 1) return { available: true };
  }

  // Goods production needs prior production building in region - advisory for MVP
  if (build.id === "goods_production" && tier === 1) {
    return { available: true, reason: "Requires manufacturing or industrial complex (advisory)" };
  }

  return { available: true };
}

export function getBuildCost(build: BuildDefinition, tier: 1 | 2 | 3): number {
  return build.baseCost * tier;
}

export interface DemolishCostBreakdown {
  placedCost: number;
  demolitionFee: number;
  salvageRefund: number;
  netMoneyChange: number;
}

export function getDemolishCost(build: BuildDefinition, tier: 1 | 2 | 3): DemolishCostBreakdown {
  const placedCost = getBuildCost(build, tier);
  const costRatio = build.demolishCostRatio ?? DEFAULT_DEMOLISH_COST_RATIO;
  const refundRatio = build.demolishRefundRatio ?? DEFAULT_DEMOLISH_REFUND_RATIO;
  const demolitionFee = Math.round(placedCost * costRatio);
  const salvageRefund = Math.round(placedCost * refundRatio);
  return {
    placedCost,
    demolitionFee,
    salvageRefund,
    netMoneyChange: salvageRefund - demolitionFee,
  };
}

export function getUpgradeCost(
  build: BuildDefinition,
  currentTier: 1 | 2 | 3
): number | null {
  if (currentTier >= 3) return null;
  const nextTier = (currentTier + 1) as 2 | 3;
  const currentCost = getBuildCost(build, currentTier);
  const nextCost = getBuildCost(build, nextTier);
  const ratio = build.upgradeCostRatio ?? DEFAULT_UPGRADE_COST_RATIO;
  return Math.round((nextCost - currentCost) * ratio);
}

export function getMaxTier(build: BuildDefinition): 1 | 2 | 3 {
  const tiers = Object.keys(build.effectsByTier).map(Number) as (1 | 2 | 3)[];
  return Math.max(...tiers) as 1 | 2 | 3;
}

export function canUpgradeTier(currentTier: 1 | 2 | 3): currentTier is 1 | 2 {
  return currentTier < 3;
}

export function canPostTier3Upgrade(type: BuildType, tier: 1 | 2 | 3): boolean {
  return (type === "airport" || type === "dock" || type === "transport_center") && tier >= 3;
}

export function getPostTier3UpgradeCost(build: BuildDefinition, extraLevel: number): number {
  return build.baseCost * (extraLevel + 1);
}

const EFFECT_KEYS: (keyof BuildEffects)[] = [
  "money", "energy", "food", "population", "happiness", "co2", "technology", "goods",
];

export function getEffectDelta(
  build: BuildDefinition,
  fromTier: 1 | 2 | 3,
  toTier: 1 | 2 | 3
): BuildEffects {
  const from = build.effectsByTier[fromTier];
  const to = build.effectsByTier[toTier];
  const delta: BuildEffects = {};
  for (const key of EFFECT_KEYS) {
    const diff = (to[key] ?? 0) - (from[key] ?? 0);
    if (diff !== 0) delta[key] = diff;
  }
  return delta;
}

export function reverseEffects(effects: BuildEffects): BuildEffects {
  const reversed: BuildEffects = {};
  for (const key of EFFECT_KEYS) {
    const val = effects[key];
    if (val !== undefined && val !== 0) reversed[key] = -val;
  }
  return reversed;
}

export function createPlacedBuilding(
  type: BuildType,
  tier: 1 | 2 | 3,
  hex: HexData
): PlacedBuilding {
  return {
    id: `${type}-${hex.q}-${hex.r}-${Date.now()}`,
    type,
    tier,
    q: hex.q,
    r: hex.r,
    countryId: hex.countryId,
  };
}

export function getBuildDefinition(type: BuildType): BuildDefinition {
  return BUILD_BY_ID[type];
}

export function getAvailableBuildsForTile(
  hex: HexData,
  existingBuildings: Record<string, PlacedBuilding>
): { build: BuildDefinition; tier: 1 | 2 | 3; availability: BuildAvailability }[] {
  const results: { build: BuildDefinition; tier: 1 | 2 | 3; availability: BuildAvailability }[] = [];
  for (const build of Object.values(BUILD_BY_ID)) {
    for (const tier of [1, 2, 3] as const) {
      const availability = canBuildOnTile(hex, build, existingBuildings, tier);
      if (availability.available) {
        results.push({ build, tier, availability });
      }
    }
  }
  return results;
}
