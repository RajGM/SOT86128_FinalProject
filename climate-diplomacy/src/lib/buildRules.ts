import type { HexData } from "../types/hex";
import type { BuildDefinition, BuildEffects, BuildTierCost, BuildType, PlacedBuilding } from "../types/game";
import { BUILD_BY_ID, BUILD_DEFINITIONS } from "../config/builds";
import { createHexLookup, getHexNeighborCoords } from "./hexUtils";

export const DOCK_COASTAL_PLACEMENT_MESSAGE =
  "Can only be built at coastal tiles adjacent to ocean within region territory";

export const FARM_AGRICULTURAL_PLACEMENT_MESSAGE =
  "Can only be built on agricultural tiles";

export const TRANSPORT_HUB_T2_COASTAL_MESSAGE =
  "Tier 2+ requires a coastal tile (enables sea routes)";

export const TRANSPORT_HUB_LAND_MESSAGE =
  "Can only be built on land tiles (not ocean/arctic)";

export const GREEN_TECH_REQUIREMENT_MESSAGE =
  "Requires technology to build (T1: 10, T2: 18, T3: 23 total)";

export const EXTRACTOR_DEPOSIT_PLACEMENT_MESSAGE =
  "Can only be built on tiles with resource deposits";

const DEFAULT_DEMOLISH_COST_RATIO = 0.25;
const DEFAULT_DEMOLISH_REFUND_RATIO = 0.35;
const DEFAULT_UPGRADE_COST_RATIO = 1.0;

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

export function canPlaceFarm(hex: HexData, testingMode = false): BuildAvailability {
  if (!testingMode && !hex.countryId) {
    return { available: false, reason: FARM_AGRICULTURAL_PLACEMENT_MESSAGE };
  }
  if (hex.terrain !== "agricultural") {
    return { available: false, reason: FARM_AGRICULTURAL_PLACEMENT_MESSAGE };
  }
  return { available: true };
}

export function canPlaceTransportHub(
  hex: HexData,
  tier: 1 | 2 | 3,
  hexLookup: Map<string, HexData>,
  testingMode = false
): BuildAvailability {
  if (!testingMode && !hex.countryId) {
    return { available: false, reason: TRANSPORT_HUB_LAND_MESSAGE };
  }
  if (hex.terrain === "ocean" || hex.terrain === "arctic") {
    return { available: false, reason: TRANSPORT_HUB_LAND_MESSAGE };
  }
  if (tier >= 2) {
    const coastal = canPlaceDock(hex, hexLookup, testingMode);
    if (!coastal.available) return { available: false, reason: TRANSPORT_HUB_T2_COASTAL_MESSAGE };
  }
  return { available: true };
}

export function canPlaceExtractor(hex: HexData): BuildAvailability {
  if (hex.resource === null) {
    return { available: false, reason: EXTRACTOR_DEPOSIT_PLACEMENT_MESSAGE };
  }
  return { available: true };
}

export function getBuildTierCost(build: BuildDefinition, tier: 1 | 2 | 3): BuildTierCost {
  return build.costByTier[tier];
}

export function getBuildCost(build: BuildDefinition, tier: 1 | 2 | 3): number {
  return build.costByTier[tier].money;
}

export function getBuildTechCost(build: BuildDefinition, tier: 1 | 2 | 3): number {
  return build.costByTier[tier].tech ?? 0;
}

export function getUpgradeTierCost(
  build: BuildDefinition,
  currentTier: 1 | 2 | 3
): BuildTierCost | null {
  if (currentTier >= 3) return null;
  const nextTier = (currentTier + 1) as 2 | 3;
  const current = build.costByTier[currentTier];
  const next = build.costByTier[nextTier];
  return {
    money: next.money - current.money,
    tech: (next.tech ?? 0) - (current.tech ?? 0),
  };
}

export function canAffordBuild(
  money: number,
  technology: number,
  build: BuildDefinition,
  tier: 1 | 2 | 3
): boolean {
  const cost = getBuildTierCost(build, tier);
  return money >= cost.money && technology >= (cost.tech ?? 0);
}

export function canAffordUpgrade(
  money: number,
  technology: number,
  build: BuildDefinition,
  currentTier: 1 | 2 | 3
): boolean {
  const upgradeCost = getUpgradeCost(build, currentTier);
  if (upgradeCost === null) return false;
  const upgradeTechCost = getUpgradeTechCost(build, currentTier);
  return money >= upgradeCost && technology >= upgradeTechCost;
}

export function canBuildOnTile(
  hex: HexData,
  build: BuildDefinition,
  existingBuildings: Record<string, PlacedBuilding>,
  tier: 1 | 2 | 3,
  testingMode = false,
  hexLookup?: Map<string, HexData>,
  regionTech = 0
): BuildAvailability {
  const key = `${hex.q},${hex.r}`;
  if (existingBuildings[key]) {
    return { available: false, reason: "Tile already has a building" };
  }

  const lookup = hexLookup ?? createHexLookup([]);

  if (build.id === "transport_hub") {
    const hubAvailability = canPlaceTransportHub(hex, tier, lookup, testingMode);
    if (!hubAvailability.available) return hubAvailability;
  } else if (build.id === "farm") {
    const farmAvailability = canPlaceFarm(hex, testingMode);
    if (!farmAvailability.available) return farmAvailability;
  } else if (build.id === "extractor") {
    const extractorAvailability = canPlaceExtractor(hex);
    if (!extractorAvailability.available) return extractorAvailability;
  } else if (!testingMode) {
    if (!hex.countryId) {
      return { available: false, reason: "Must be on a country hex" };
    }
    if (hex.terrain === "ocean" || hex.terrain === "arctic") {
      return { available: false, reason: "Cannot build on ocean/arctic" };
    }
  }

  const techRequired = getBuildTechCost(build, tier);
  if (techRequired > 0 && regionTech < techRequired) {
    return {
      available: false,
      reason: `${GREEN_TECH_REQUIREMENT_MESSAGE} — need ${techRequired}, have ${Math.round(regionTech)}`,
    };
  }

  const tierReq = build.tierRequirements?.[tier];
  if (tierReq && tier > 1) {
    return { available: true, reason: `Tier ${tier}: ${tierReq} (advisory)` };
  }

  return { available: true };
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
  const delta = getUpgradeTierCost(build, currentTier);
  if (!delta) return null;
  const ratio = build.upgradeCostRatio ?? DEFAULT_UPGRADE_COST_RATIO;
  return Math.round(delta.money * ratio);
}

export function getUpgradeTechCost(
  build: BuildDefinition,
  currentTier: 1 | 2 | 3
): number {
  const delta = getUpgradeTierCost(build, currentTier);
  if (!delta) return 0;
  const ratio = build.upgradeCostRatio ?? DEFAULT_UPGRADE_COST_RATIO;
  return Math.round((delta.tech ?? 0) * ratio);
}

export function getMaxTier(build: BuildDefinition): 1 | 2 | 3 {
  const tiers = Object.keys(build.effectsByTier).map(Number) as (1 | 2 | 3)[];
  return Math.max(...tiers) as 1 | 2 | 3;
}

export function canUpgradeTier(currentTier: 1 | 2 | 3): currentTier is 1 | 2 {
  return currentTier < 3;
}

export function canPostTier3Upgrade(type: BuildType, tier: 1 | 2 | 3): boolean {
  return type === "transport_hub" && tier >= 3;
}

export function getPostTier3UpgradeCost(_build: BuildDefinition, _extraLevel: number): number {
  return 50;
}

const EFFECT_KEYS: (keyof BuildEffects)[] = [
  "money", "energy", "food", "population", "happiness", "co2", "technology",
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
    builtAt: Date.now(),
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
  hexLookup?: Map<string, HexData>,
  regionTech = 0
): { build: BuildDefinition; tier: 1 | 2 | 3; availability: BuildAvailability }[] {
  const lookup = hexLookup ?? createHexLookup([]);
  const results: { build: BuildDefinition; tier: 1 | 2 | 3; availability: BuildAvailability }[] = [];
  for (const build of BUILD_DEFINITIONS) {
    for (const tier of [1, 2, 3] as const) {
      const availability = canBuildOnTile(
        hex,
        build,
        existingBuildings,
        tier,
        testingMode,
        lookup,
        regionTech
      );
      const showBlocked =
        build.id === "transport_hub" ||
        build.id === "extractor" ||
        build.id === "farm" ||
        (build.id === "green_plant" && getBuildTechCost(build, tier) > 0);
      if (availability.available || showBlocked) {
        results.push({ build, tier, availability });
      }
    }
  }
  return results;
}
