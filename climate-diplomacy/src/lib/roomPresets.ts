import type { PresetId, RoomSettings } from "../types/multiplayer";

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  preset: "normal",
  moneyMultiplier: 1.0,
  energyMultiplier: 1.0,
  foodMultiplier: 1.0,
  techMultiplier: 1.0,
  startingTemperature: 1.0,
  cycleTimerMinutes: 5,
  maxPlayers: 8,
  startingInfra: {
    fossilPlant: true,
    farm: true,
    extractor: true,
    transportHub: false,
    manufacturing: false,
  },
  rules: {
    carbonTax: true,
    summitResolutions: true,
    factions: true,
    peacefulMode: false,
  },
};

const PRESETS: Record<Exclude<PresetId, "custom">, RoomSettings> = {
  easy: {
    ...DEFAULT_ROOM_SETTINGS,
    preset: "easy",
    moneyMultiplier: 1.5,
    energyMultiplier: 1.5,
    foodMultiplier: 1.5,
    techMultiplier: 1.5,
    startingTemperature: 0.8,
    cycleTimerMinutes: 7,
    startingInfra: {
      fossilPlant: true,
      farm: true,
      extractor: true,
      transportHub: true,
      manufacturing: false,
    },
    rules: {
      carbonTax: true,
      summitResolutions: true,
      factions: false,
      peacefulMode: true,
    },
  },
  normal: { ...DEFAULT_ROOM_SETTINGS, preset: "normal" },
  hard: {
    ...DEFAULT_ROOM_SETTINGS,
    preset: "hard",
    moneyMultiplier: 0.75,
    energyMultiplier: 0.75,
    foodMultiplier: 0.75,
    techMultiplier: 0.75,
    startingTemperature: 1.2,
    cycleTimerMinutes: 3,
    startingInfra: {
      fossilPlant: true,
      farm: true,
      extractor: false,
      transportHub: false,
      manufacturing: false,
    },
    rules: {
      carbonTax: true,
      summitResolutions: true,
      factions: true,
      peacefulMode: false,
    },
  },
};

export function getPresetSettings(preset: Exclude<PresetId, "custom">): RoomSettings {
  return structuredClone(PRESETS[preset]);
}

export function settingsMatchPreset(settings: RoomSettings): PresetId {
  for (const key of ["easy", "normal", "hard"] as const) {
    const preset = PRESETS[key];
    const matches =
      settings.moneyMultiplier === preset.moneyMultiplier &&
      settings.energyMultiplier === preset.energyMultiplier &&
      settings.foodMultiplier === preset.foodMultiplier &&
      settings.techMultiplier === preset.techMultiplier &&
      settings.startingTemperature === preset.startingTemperature &&
      settings.cycleTimerMinutes === preset.cycleTimerMinutes &&
      JSON.stringify(settings.startingInfra) === JSON.stringify(preset.startingInfra) &&
      JSON.stringify(settings.rules) === JSON.stringify(preset.rules);
    if (matches) return key;
  }
  return "custom";
}

export function formatPresetLabel(preset: PresetId): string {
  if (preset === "custom") return "Custom";
  return preset.charAt(0).toUpperCase() + preset.slice(1);
}
