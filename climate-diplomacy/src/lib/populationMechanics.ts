import type { CountryId } from "../types/hex";
import type { PlacedBuilding, RegionState } from "../types/game";
import type { BuildEffects, BuildType } from "../types/game";

/** Per 100 population per cycle (population-mechanics.md). */
export const PER_CAPITA_FOOD_PER_100 = 5;
export const PER_CAPITA_ENERGY_PER_100 = 2;
export const PER_CAPITA_MONEY_PER_100 = 1;

export type HappinessCascade = "stable" | "concerned" | "unrest" | "crisis" | "collapse";

export function computePerCapitaConsumption(population: number): {
  food: number;
  energy: number;
  money: number;
} {
  const units = population / 100;
  return {
    food: Math.round(units * PER_CAPITA_FOOD_PER_100),
    energy: Math.round(units * PER_CAPITA_ENERGY_PER_100),
    money: Math.round(units * PER_CAPITA_MONEY_PER_100),
  };
}

export function getHappinessCascade(happiness: number): HappinessCascade {
  if (happiness >= 70) return "stable";
  if (happiness >= 50) return "concerned";
  if (happiness >= 30) return "unrest";
  if (happiness >= 15) return "crisis";
  return "collapse";
}

export const HAPPINESS_CASCADE_LABELS: Record<HappinessCascade, string> = {
  stable: "Stable",
  concerned: "Concerned",
  unrest: "Unrest",
  crisis: "Crisis",
  collapse: "Collapse",
};

export function isConstructionBlocked(happiness: number): boolean {
  return happiness < 15;
}

/** Crisis and collapse force all buildings idle (happiness < 30). */
export function shouldForceAllBuildingsIdle(happiness: number): boolean {
  return happiness < 30;
}

export function computeNationalCo2HappinessDelta(co2: number): number {
  if (co2 < 100) return 2;
  if (co2 <= 300) return 0;
  if (co2 <= 500) return -3;
  return -6;
}

/** Happiness penalties begin at +2.0°C (aligned with farm yield threshold). */
export function computeTemperatureHappinessDelta(globalTemperature: number): number {
  if (globalTemperature < 2.0) return 0;
  if (globalTemperature <= 2.5) return -2;
  if (globalTemperature <= 3.0) return -5;
  if (globalTemperature <= 3.5) return -8;
  return -12;
}

export function computeHappinessCycleDelta(
  region: RegionState,
  globalTemperature: number
): number {
  return (
    computeNationalCo2HappinessDelta(region.co2) +
    computeTemperatureHappinessDelta(globalTemperature)
  );
}

/** Apply CO₂, temperature, and shortage penalties to happiness. */
export function applyHappinessUpdate(
  region: RegionState,
  globalTemperature: number
): RegionState {
  let happiness = region.happiness + computeHappinessCycleDelta(region, globalTemperature);

  if (region.food < 0 || region.energy < 0) {
    happiness -= 15;
  }

  return {
    ...region,
    happiness: Math.max(0, Math.min(100, happiness)),
  };
}

export function clampResourceFloors(region: RegionState): RegionState {
  return {
    ...region,
    food: Math.max(0, region.food),
    energy: Math.max(0, region.energy),
  };
}

const POPULATION_BUILD_TYPES = new Set<BuildType>(["city"]);

/** Halve city population yields during unrest (happiness 30–50). */
export function applyUnrestPopulationPenalty(
  effects: BuildEffects,
  buildType: BuildType,
  happiness: number
): BuildEffects {
  if (!POPULATION_BUILD_TYPES.has(buildType)) return effects;
  if (happiness >= 50 || happiness < 30) return effects;
  if (!effects.population || effects.population <= 0) return effects;
  return { ...effects, population: Math.round(effects.population * 0.5) };
}

export interface PopulationEffectsResult {
  regions: Record<CountryId, RegionState>;
  tileBuildings: Record<string, PlacedBuilding>;
}

/**
 * Crisis (−5%) and collapse (−10%) population loss — people leave (gone, not transferred).
 * Population only moves between countries via trade agreements.
 * Collapse also destroys one random building (riots).
 */
export function applyPopulationEffects(
  regions: Record<CountryId, RegionState>,
  tileBuildings: Record<string, PlacedBuilding>,
  countryIds: CountryId[]
): PopulationEffectsResult {
  let nextBuildings = { ...tileBuildings };
  const buildingKeysToRemove = new Set<string>();
  const nextRegions = { ...regions };

  for (const id of countryIds) {
    const region = regions[id];
    const cascade = getHappinessCascade(region.happiness);
    if (cascade !== "crisis" && cascade !== "collapse") continue;

    const lossRate = cascade === "collapse" ? 0.1 : 0.05;
    const lost = Math.round(region.population * lossRate);
    if (lost > 0) {
      nextRegions[id] = {
        ...nextRegions[id],
        population: Math.max(0, nextRegions[id].population - lost),
      };
    }

    if (cascade === "collapse") {
      const countryBuildingKeys = Object.entries(nextBuildings)
        .filter(([, b]) => b.countryId === id)
        .map(([key]) => key);
      if (countryBuildingKeys.length > 0) {
        const idx = Math.floor(Math.random() * countryBuildingKeys.length);
        buildingKeysToRemove.add(countryBuildingKeys[idx]);
      }
    }
  }

  for (const key of buildingKeysToRemove) {
    const { [key]: _removed, ...rest } = nextBuildings;
    nextBuildings = rest;
  }

  return { regions: nextRegions, tileBuildings: nextBuildings };
}
