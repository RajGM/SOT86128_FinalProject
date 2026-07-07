import type { PresetId, RoomSettings } from "../types/multiplayer";

/** Default multiplayer settings — rich test-scenario world, no host tuning required. */
export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  preset: "normal",
  moneyMultiplier: 1.0,
  energyMultiplier: 1.0,
  foodMultiplier: 1.0,
  techMultiplier: 1.0,
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
  rules: {
    carbonTax: true,
    summitResolutions: true,
    factions: true,
    peacefulMode: false,
  },
};

export function formatPresetLabel(_preset: PresetId): string {
  return "Standard";
}
