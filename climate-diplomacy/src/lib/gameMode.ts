import type { GameState, RegionState } from "../types/game";
import type { CountryId } from "../types/hex";
import { COUNTRY_CONFIGS } from "../types/hex";
import type { GameModeConfig, PresetId, RoomSettings } from "../types/multiplayer";

export const RICH_RESOURCE_MIN = 2000;

export const DEFAULT_GAME_MODE: GameModeConfig = {
  preset: "hard",
  climateGraceUntilCycle: 0,
  enableCarbonTax: true,
  enableSummitResolutions: true,
  manualCycleAdvance: false,
};

export function gameModeFromSettings(settings: RoomSettings): GameModeConfig {
  switch (settings.preset) {
    case "easy":
      return {
        preset: "easy",
        climateGraceUntilCycle: 5,
        enableCarbonTax: false,
        enableSummitResolutions: false,
        manualCycleAdvance: true,
      };
    case "medium":
      return {
        preset: "medium",
        climateGraceUntilCycle: 0,
        enableCarbonTax: true,
        enableSummitResolutions: true,
        manualCycleAdvance: true,
      };
    case "hard":
    default:
      return {
        preset: "hard",
        climateGraceUntilCycle: 0,
        enableCarbonTax: true,
        enableSummitResolutions: true,
        manualCycleAdvance: false,
      };
  }
}

/** Climate / temperature consequences apply after the grace cycle count. */
export function isClimateModelsActive(
  mode: GameModeConfig | undefined,
  cycle: number
): boolean {
  const m = mode ?? DEFAULT_GAME_MODE;
  return cycle > m.climateGraceUntilCycle;
}

export function applyRichResources(state: GameState): GameState {
  const regions = { ...state.regions };
  for (const id of Object.keys(COUNTRY_CONFIGS) as CountryId[]) {
    const region = regions[id];
    regions[id] = {
      ...region,
      money: RICH_RESOURCE_MIN,
      energy: RICH_RESOURCE_MIN,
      food: RICH_RESOURCE_MIN,
      technology: RICH_RESOURCE_MIN,
    };
  }
  return { ...state, regions };
}

export function formatPresetLabel(preset: PresetId): string {
  switch (preset) {
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    case "custom":
      return "Custom";
    default:
      return preset;
  }
}

export function presetDescription(preset: PresetId): string {
  switch (preset) {
    case "easy":
      return "2000+ resources · no climate pressure for 5 cycles · no carbon tax or summits · host advances manually";
    case "medium":
      return "2000+ resources · full climate & diplomacy models from start · host advances manually";
    case "hard":
      return "Standard country resources · test-scenario world · 5-minute rounds · auto cycle timer";
    default:
      return "";
  }
}

/** Apply shortage-only happiness when climate models are off. */
export function applyShortageHappinessOnly(region: RegionState): RegionState {
  let happiness = region.happiness;
  if (region.food < 0 || region.energy < 0) {
    happiness -= 15;
  }
  return {
    ...region,
    happiness: Math.max(0, Math.min(100, happiness)),
  };
}
