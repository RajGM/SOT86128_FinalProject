import type { CountryId } from "../types/hex";
import type {
  BuildType,
  FactionCycleEvents,
  FactionPercents,
  FactionState,
  PlacedBuilding,
  RegionProfile,
} from "../types/game";

const BROWN_BUILDINGS = new Set<BuildType>([
  "fossil_plant",
  "extractor",
  "industrial_complex",
]);

const GREEN_BUILDINGS = new Set<BuildType>([
  "green_plant",
  "nuclear_plant",
  "manufacturing",
  "farm",
]);

const NEUTRAL_BUILDINGS = new Set<BuildType>(["city", "transport_hub"]);

export const FACTION_SATISFACTION_BASE = 60;
export const FACTION_MONEY_SURPLUS_THRESHOLD = 500;

/** Global temperature thresholds (°C) that trigger green faction concern when crossed upward. */
export const TEMPERATURE_FACTION_THRESHOLDS = [1.5, 2.0, 2.5, 3.0] as const;

export function getBuildingFactionWeights(type: BuildType): {
  brown: number;
  green: number;
} {
  if (BROWN_BUILDINGS.has(type)) return { brown: 1, green: 0 };
  if (GREEN_BUILDINGS.has(type)) return { brown: 0, green: 1 };
  if (NEUTRAL_BUILDINGS.has(type)) return { brown: 0.5, green: 0.5 };
  return { brown: 0, green: 0 };
}

export interface FactionBuildingCounts {
  brownWeight: number;
  greenWeight: number;
  totalBuildings: number;
}

export function countFactionBuildings(
  buildings: PlacedBuilding[],
  countryId: CountryId
): FactionBuildingCounts {
  let brownWeight = 0;
  let greenWeight = 0;
  let totalBuildings = 0;

  for (const building of buildings) {
    if (building.countryId !== countryId) continue;
    const weights = getBuildingFactionWeights(building.type);
    brownWeight += weights.brown;
    greenWeight += weights.green;
    totalBuildings += 1;
  }

  return { brownWeight, greenWeight, totalBuildings };
}

export function computeFactionPercents(
  profile: Pick<RegionProfile, "legacyBrown" | "legacyGreen">,
  counts: FactionBuildingCounts
): FactionPercents {
  const brownNumerator = profile.legacyBrown + counts.brownWeight;
  const greenNumerator = profile.legacyGreen + counts.greenWeight;
  const denominator =
    profile.legacyBrown + profile.legacyGreen + counts.totalBuildings;

  if (denominator <= 0) {
    return { brownPercent: 50, greenPercent: 50 };
  }

  const brownPercent = Math.round((brownNumerator / denominator) * 100);
  const greenPercent = 100 - brownPercent;
  return { brownPercent, greenPercent };
}

export function createInitialFactionState(): FactionState {
  return {
    brownSatisfaction: FACTION_SATISFACTION_BASE,
    greenSatisfaction: FACTION_SATISFACTION_BASE,
  };
}

export function createEmptyFactionCycleEvents(): FactionCycleEvents {
  return {
    fossilPlantsBuilt: 0,
    greenOrNuclearPlantsBuilt: 0,
    extractorsBuilt: 0,
    industrialComplexesBuilt: 0,
    manufacturingBuilt: 0,
    farmsBuilt: 0,
    carbonTaxIncrease: 0,
    carbonTaxDecrease: 0,
    votedYesEmissionLimits: false,
    votedNoEmissionLimits: false,
    co2Increased: false,
    co2Decreased: false,
    moneySurplus: false,
    temperatureThresholdCrossed: false,
  };
}

export function recordBuildFactionEvent(
  events: FactionCycleEvents,
  buildType: BuildType
): FactionCycleEvents {
  const next = { ...events };
  switch (buildType) {
    case "fossil_plant":
      next.fossilPlantsBuilt += 1;
      break;
    case "green_plant":
    case "nuclear_plant":
      next.greenOrNuclearPlantsBuilt += 1;
      break;
    case "extractor":
      next.extractorsBuilt += 1;
      break;
    case "industrial_complex":
      next.industrialComplexesBuilt += 1;
      break;
    case "manufacturing":
      next.manufacturingBuilt += 1;
      break;
    case "farm":
      next.farmsBuilt += 1;
      break;
    default:
      break;
  }
  return next;
}

function clampSatisfaction(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function applyFactionSatisfactionChanges(
  factions: FactionState,
  events: FactionCycleEvents
): FactionState {
  let brown = factions.brownSatisfaction;
  let green = factions.greenSatisfaction;

  if (events.carbonTaxIncrease > 0) {
    brown -= events.carbonTaxIncrease / 5;
    green += events.carbonTaxIncrease / 5;
  }
  if (events.carbonTaxDecrease > 0) {
    brown += events.carbonTaxDecrease / 5;
    green -= events.carbonTaxDecrease / 5;
  }

  brown += events.fossilPlantsBuilt * 5;
  brown -= events.greenOrNuclearPlantsBuilt * 3;
  brown += events.extractorsBuilt * 3;
  brown += events.industrialComplexesBuilt * 4;

  green += events.greenOrNuclearPlantsBuilt * 5;
  green -= events.fossilPlantsBuilt * 5;
  green -= events.extractorsBuilt * 2;
  green += events.manufacturingBuilt * 3;
  green += events.farmsBuilt * 2;

  if (events.co2Decreased) green += 3;
  if (events.co2Increased) green -= 3;

  if (events.votedYesEmissionLimits) {
    brown -= 5;
    green += 5;
  }
  if (events.votedNoEmissionLimits) {
    brown += 3;
    green -= 4;
  }

  if (events.moneySurplus) brown += 2;
  if (events.temperatureThresholdCrossed) green -= 3;

  return {
    brownSatisfaction: clampSatisfaction(Math.round(brown)),
    greenSatisfaction: clampSatisfaction(Math.round(green)),
  };
}

export function computeFactionHappinessModifier(
  percents: FactionPercents,
  factions: FactionState
): number {
  return (
    (percents.brownPercent * factions.brownSatisfaction +
      percents.greenPercent * factions.greenSatisfaction) /
    100
  );
}

export function applyFactionHappinessDelta(
  happiness: number,
  percents: FactionPercents,
  factions: FactionState
): number {
  const modifier = computeFactionHappinessModifier(percents, factions);
  return Math.max(0, Math.min(100, happiness + (modifier - FACTION_SATISFACTION_BASE)));
}

export function detectTemperatureThresholdCrossing(
  prevTemperature: number,
  nextTemperature: number,
  lastCrossedThreshold: number
): { crossed: boolean; newLastCrossed: number } {
  let crossed = false;
  let newLastCrossed = lastCrossedThreshold;

  for (const threshold of TEMPERATURE_FACTION_THRESHOLDS) {
    if (threshold <= lastCrossedThreshold) continue;
    if (prevTemperature < threshold && nextTemperature >= threshold) {
      crossed = true;
      newLastCrossed = threshold;
    }
  }

  return { crossed, newLastCrossed };
}
