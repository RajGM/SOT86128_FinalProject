import type { PresetId, RoomSettings } from "../types/multiplayer";

const BASE_RULES = {
  carbonTax: true,
  summitResolutions: true,
  factions: true,
  peacefulMode: false,
} as const;

export const ROOM_PRESETS: Record<Exclude<PresetId, "custom">, RoomSettings> = {
  easy: {
    preset: "easy",
    moneyMultiplier: 1,
    energyMultiplier: 1,
    foodMultiplier: 1,
    techMultiplier: 1,
    startingTemperature: 1.0,
    cycleTimerMinutes: 0,
    maxPlayers: 8,
    startingInfra: {
      fossilPlant: true,
      farm: true,
      extractor: true,
      transportHub: true,
      manufacturing: true,
    },
    rules: {
      ...BASE_RULES,
      carbonTax: false,
      summitResolutions: false,
    },
  },
  medium: {
    preset: "medium",
    moneyMultiplier: 1,
    energyMultiplier: 1,
    foodMultiplier: 1,
    techMultiplier: 1,
    startingTemperature: 1.72,
    cycleTimerMinutes: 0,
    maxPlayers: 8,
    startingInfra: {
      fossilPlant: true,
      farm: true,
      extractor: true,
      transportHub: true,
      manufacturing: true,
    },
    rules: BASE_RULES,
  },
  hard: {
    preset: "hard",
    moneyMultiplier: 1,
    energyMultiplier: 1,
    foodMultiplier: 1,
    techMultiplier: 1,
    startingTemperature: 1.72,
    cycleTimerMinutes: 5,
    maxPlayers: 8,
    startingInfra: {
      fossilPlant: true,
      farm: true,
      extractor: true,
      transportHub: true,
      manufacturing: true,
    },
    rules: BASE_RULES,
  },
};

/** @deprecated use ROOM_PRESETS.hard */
export const DEFAULT_ROOM_SETTINGS: RoomSettings = ROOM_PRESETS.hard;

export function getRoomPreset(preset: PresetId): RoomSettings {
  if (preset === "custom") return structuredClone(ROOM_PRESETS.hard);
  return structuredClone(ROOM_PRESETS[preset]);
}

export { formatPresetLabel, presetDescription } from "./gameMode";
