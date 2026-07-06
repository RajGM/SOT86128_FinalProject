import type { CountryId, HexData } from "../types/hex";
import { COUNTRY_CONFIGS } from "../types/hex";
import type { BuildType, GameState, PlacedBuilding } from "../types/game";
import { tileKey } from "../types/game";
import { createInitialGameState } from "./gameState";
import { createPlacedBuilding } from "./buildRules";
import type { RoomSettings } from "../types/multiplayer";

const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS) as CountryId[];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function assignCountriesToPlayers(
  playerIds: string[]
): Record<string, CountryId> {
  const shuffled = shuffle(ALL_COUNTRIES);
  const result: Record<string, CountryId> = {};
  playerIds.forEach((id, i) => {
    if (i < shuffled.length) result[id] = shuffled[i];
  });
  return result;
}

function findHexForBuild(
  hexes: HexData[],
  countryId: CountryId,
  type: BuildType
): HexData | null {
  const countryHexes = hexes.filter((h) => h.countryId === countryId);
  const occupied = new Set<string>();

  const pick = (predicate: (h: HexData) => boolean): HexData | null => {
    for (const hex of countryHexes) {
      const key = tileKey(hex.q, hex.r);
      if (occupied.has(key)) continue;
      if (predicate(hex)) return hex;
    }
    return null;
  };

  if (type === "farm") {
    return (
      pick((h) => h.terrain === "agricultural") ??
      pick((h) => h.terrain === "land" || h.terrain === "coastal")
    );
  }
  if (type === "extractor") {
    return (
      pick((h) => h.resource !== null) ??
      pick((h) => h.terrain !== "ocean" && h.terrain !== "arctic")
    );
  }
  if (type === "transport_hub") {
    return pick((h) => h.terrain === "coastal" || h.terrain === "land");
  }
  return pick((h) => h.terrain !== "ocean" && h.terrain !== "arctic");
}

function placeStartingInfra(
  hexes: HexData[],
  state: GameState,
  settings: RoomSettings
): GameState {
  const infra = settings.startingInfra;
  const types: BuildType[] = [];
  if (infra.fossilPlant) types.push("fossil_plant");
  if (infra.farm) types.push("farm");
  if (infra.extractor) types.push("extractor");
  if (infra.transportHub) types.push("transport_hub");
  if (infra.manufacturing) types.push("manufacturing");

  if (types.length === 0) return state;

  const tileBuildings = { ...state.tileBuildings };
  const regions = { ...state.regions };

  for (const countryId of ALL_COUNTRIES) {
    for (const type of types) {
      const hex = findHexForBuild(hexes, countryId, type);
      if (!hex) continue;
      const key = tileKey(hex.q, hex.r);
      if (tileBuildings[key]) continue;
      const building: PlacedBuilding = {
        ...createPlacedBuilding(type, 1, hex),
        countryId,
      };
      tileBuildings[key] = building;
    }
  }

  return { ...state, tileBuildings, regions };
}

function applyResourceMultipliers(
  state: GameState,
  settings: RoomSettings
): GameState {
  const regions = { ...state.regions };
  for (const id of ALL_COUNTRIES) {
    const r = regions[id];
    regions[id] = {
      ...r,
      money: Math.round(r.money * settings.moneyMultiplier),
      energy: Math.round(r.energy * settings.energyMultiplier),
      food: Math.round(r.food * settings.foodMultiplier),
      technology: Math.round(r.technology * settings.techMultiplier),
    };
  }
  return { ...state, regions };
}

export function createGameStateFromSettings(
  hexes: HexData[],
  settings: RoomSettings
): GameState {
  let state = createInitialGameState(hexes);
  state = {
    ...state,
    testingMode: false,
    globalTemperature: settings.startingTemperature,
  };
  state = applyResourceMultipliers(state, settings);
  state = placeStartingInfra(hexes, state, settings);
  return state;
}

export function getUnassignedCountries(
  assignments: Record<string, CountryId>
): CountryId[] {
  const assigned = new Set(Object.values(assignments));
  return ALL_COUNTRIES.filter((id) => !assigned.has(id));
}
