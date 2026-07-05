import type { HexData } from "../types/hex";
import type { BuildDefinition, BuildEffects, BuildType, PlacedBuilding } from "../types/game";
import { BUILD_BY_ID } from "../config/builds";
import { createHexLookup, getHexNeighborCoords } from "./hexUtils";

export const DOCK_COASTAL_PLACEMENT_MESSAGE =
  "Can only be built at coastal tiles adjacent to ocean within region territory";

export const EXTRACTOR_DEPOSIT_PLACEMENT_MESSAGE =
  "Can only be built on tiles with resource deposits";

const DEFAULT_DEMOLISH_COST_RATIO = 0.25;
const DEFAULT_DEMOLISH_REFUND_RATIO = 0.35;
const DEFAULT_UPGRADE_COST_RATIO = 0.75;

export interface BuildAvailability {
  available: boolean;
  reason?: string;
}

function isOceanNeighbor(hex: HexData | undefined): boolean {
  return hex?.terrain === "ocean";
}

export function canPlaceDock(
  hex: HexData,
  hexLookup: Map<string, HexData>,
  testingMode = false
): BuildAvailability {
  if (!testingMode && !hex.countryId) {
    return { available: false, reason: DOCK_COASTAL_PLACEMENT_MESSAGE };
  }

  if (hex.terrain === "ocean" || hex.terrain === "arctic") {
    return { available: false, reason: DOCK_COASTAL_PLACEMENT_MESSAGE };
  }

  const hasOceanNeighbor = getHexNeighborCoords(hex.q, hex.r).some(([nq, nr]) =>
    isOceanNeighbor(hexLookup.get(`${nq},${nr}`))
  );

  if (!hasOceanNeighbor) {
    return { available: false, reason: DOCK_COASTAL_PLACEMENT_MESSAGE };
  }

  return { available: true };
}

export function canPlaceExtractor(hex: HexData): BuildAvailability {
  if (hex.resource === null) {
    return { available: false, reason: EXTRACTOR_DEPOSIT_PLACEMENT_MESSAGE };
  }
  return { available: true };
}

export function canBuildOnTile(
  hex: HexData,
  build: BuildDefinition,
  existingBuildings: Record<string, PlacedBuilding>,
  tier: 1 | 2 | 3,
  testingMode = false,
  hexLookup?: Map<string, HexData>
): BuildAvailability {
  const key = `${hex.q},${hex.r}`;
  if (existingBuildings[key]) {
    return { available: false, reason: "Tile already has a building" };
  }

  if (build.id === "dock") {
    const lookup = hexLookup ?? createHexLookup([]);
    const dockAvailability = canPlaceDock(hex, lookup, testingMode);
    if (!dockAvailability.available) {
      return dockAvailability;
    }
  } else if (build.id === "extractor") {
    const extractorAvailability = canPlaceExtractor(hex);
    if (!extractorAvailability.available) {
      return extractorAvailability;
    }
  } else if (!testingMode) {
    if (!hex.countryId) {
      return { available: false, reason: "Must be on a country hex" };
    }
    if (hex.terrain === "ocean" || hex.terrain === "arctic") {
      return { available: false, reason: "Cannot build on ocean/arctic" };
    }
  }

  const tierReq = build.tierRequirements?.[tier];
  if (tierReq && tier > 1) {
    return { available: true, reason: `Tier ${tier}: ${tierReq} (advisory)` };
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
  existingBuildings: Record<string, PlacedBuilding>,
  testingMode = false,
  hexLookup?: Map<string, HexData>
): { build: BuildDefinition; tier: 1 | 2 | 3; availability: BuildAvailability }[] {
  const lookup = hexLookup ?? createHexLookup([]);
  const results: { build: BuildDefinition; tier: 1 | 2 | 3; availability: BuildAvailability }[] = [];
  for (const build of Object.values(BUILD_BY_ID)) {
    for (const tier of [1, 2, 3] as const) {
      const availability = canBuildOnTile(hex, build, existingBuildings, tier, testingMode, lookup);
      if (availability.available || build.id === "dock" || build.id === "extractor") {
        results.push({ build, tier, availability });
      }
    }
  }
  return results;
}
