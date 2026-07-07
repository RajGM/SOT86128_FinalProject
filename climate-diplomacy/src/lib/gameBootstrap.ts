import type { CountryId, HexData } from "../types/hex";
import { COUNTRY_CONFIGS } from "../types/hex";
import type { GameState } from "../types/game";
import type { RoomSettings } from "../types/multiplayer";
import { createTestScenarioState } from "../data/testScenario";

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

/** Rich mid-game state (cycle 15 test scenario) for multiplayer — real build/trade rules. */
export function createGameStateFromSettings(
  hexes: HexData[],
  _settings: RoomSettings
): GameState {
  return {
    ...createTestScenarioState(hexes),
    testingMode: false,
  };
}

export function getUnassignedCountries(
  assignments: Record<string, CountryId>
): CountryId[] {
  const assigned = new Set(Object.values(assignments));
  return ALL_COUNTRIES.filter((id) => !assigned.has(id));
}
