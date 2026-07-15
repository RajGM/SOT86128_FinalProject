import {
  get,
  onValue,
  ref,
  remove,
  set,
  update,
  type Unsubscribe,
} from "firebase/database";
import { getFirebaseDb } from "../config/firebase";
import type { CountryId, HexData } from "../types/hex";
import type { GameState } from "../types/game";
import type {
  ArchivedGame,
  EndReason,
  GameData,
  HumanPlayerMeta,
  PlayerResult,
  Room,
} from "../types/multiplayer";
import {
  assignCountriesToPlayers,
  createGameStateFromSettings,
  getUnassignedCountries,
} from "../lib/gameBootstrap";
import { hydrateGameState } from "../lib/gameState";
import { buildPlayerResults } from "../lib/scoring";
import {
  assignCountriesAtStart,
  removeFromActiveRooms,
  updateRoomStatus,
} from "./roomService";

export async function startGame(
  room: Room,
  hexes: HexData[]
): Promise<GameData> {
  const playerIds = Object.keys(room.players).sort(
    (a, b) => room.players[a].joinedAt - room.players[b].joinedAt
  );
  const assignments = assignCountriesToPlayers(playerIds);

  const humanPlayers: Record<string, HumanPlayerMeta> = {};
  for (const [playerId, country] of Object.entries(assignments)) {
    humanPlayers[playerId] = {
      name: room.players[playerId].name,
      country: country as CountryId,
      connected: room.players[playerId].connected !== false,
    };
  }

  const gameState = createGameStateFromSettings(hexes, room.settings);
  const now = Date.now();
  const cycleDurationMs =
    room.settings.cycleTimerMinutes > 0
      ? room.settings.cycleTimerMinutes * 60_000
      : 0;
  const botControlled: Partial<Record<CountryId, boolean>> = {};
  for (const id of getUnassignedCountries(assignments)) {
    botControlled[id] = true;
  }
  const gameData: GameData = {
    roomId: room.roomId,
    cycle: gameState.cycle,
    gameState,
    cycleTimer: {
      startedAt: now,
      durationMs: cycleDurationMs,
    },
    humanPlayers,
    botControlled,
    settings: room.settings,
    hostId: room.hostId,
    stateVersion: 1,
  };

  const db = getFirebaseDb();
  await set(ref(db, `games/${room.roomId}`), gameData);
  await assignCountriesAtStart(room.roomId, assignments);
  await updateRoomStatus(room.roomId, "active");
  return gameData;
}

function normalizeGameData(raw: GameData): GameData {
  const gameState = hydrateGameState(raw.gameState);
  return {
    ...raw,
    gameState,
  };
}

export function subscribeGame(
  roomId: string,
  onUpdate: (game: GameData | null) => void
): Unsubscribe {
  const db = getFirebaseDb();
  return onValue(ref(db, `games/${roomId}`), (snap) => {
    if (!snap.exists()) {
      remoteGameStateCache.delete(roomId);
      onUpdate(null);
      return;
    }
    const normalized = normalizeGameData(snap.val() as GameData);
    remoteGameStateCache.set(roomId, normalized.gameState);
    onUpdate(normalized);
  });
}

export async function getGame(roomId: string): Promise<GameData | null> {
  const db = getFirebaseDb();
  const snap = await get(ref(db, `games/${roomId}`));
  if (!snap.exists()) return null;
  const normalized = normalizeGameData(snap.val() as GameData);
  remoteGameStateCache.set(roomId, normalized.gameState);
  return normalized;
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;
/** Highest stateVersion seen from Firebase — shared counter must not fall behind remote. */
let knownRemoteVersion = 0;
const remoteGameStateCache = new Map<string, GameState>();

/** Keep the local write counter aligned with Firebase (call on every subscribe update). */
export function setStateVersionBaseline(version: number): void {
  if (version > knownRemoteVersion) {
    knownRemoteVersion = version;
  }
}

/** Cache latest Firebase gameState for merge-before-write summit protection. */
export function cacheRemoteGameState(roomId: string, gameState: GameState): void {
  remoteGameStateCache.set(roomId, gameState);
}

export function getCachedRemoteGameState(roomId: string): GameState | undefined {
  return remoteGameStateCache.get(roomId);
}

/** Drop any debounced push scheduled before a newer Firebase snapshot arrived. */
export function cancelPendingGameStateSync(): void {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
}

function bumpStateVersion(): number {
  knownRemoteVersion += 1;
  return knownRemoteVersion;
}

function sanitizeGameState(gameState: GameState): GameState {
  return JSON.parse(JSON.stringify(gameState)) as GameState;
}

function buildFirebaseGameUpdate(
  roomId: string,
  gameState: GameState,
  version: number,
  _isHost: boolean
): Record<string, unknown> {
  const merged = sanitizeGameState(gameState);
  return {
    gameState: merged,
    cycle: merged.cycle,
    stateVersion: version,
    lastActivity: Date.now(),
  };
}

export function syncGameState(
  roomId: string,
  gameState: GameState,
  isHost = false
): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    const version = bumpStateVersion();
    const db = getFirebaseDb();
    void update(
      ref(db, `games/${roomId}`),
      buildFirebaseGameUpdate(roomId, gameState, version, isHost)
    );
  }, 300);
}

export async function pushGameStateImmediate(
  roomId: string,
  gameState: GameState,
  isHost = true
): Promise<void> {
  cancelPendingGameStateSync();
  const version = bumpStateVersion();
  const db = getFirebaseDb();
  await update(
    ref(db, `games/${roomId}`),
    buildFirebaseGameUpdate(roomId, gameState, version, isHost)
  );
}

export async function updateHumanPlayerMeta(
  roomId: string,
  playerId: string,
  patch: Partial<HumanPlayerMeta>
): Promise<void> {
  const db = getFirebaseDb();
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    updates[`humanPlayers/${playerId}/${key}`] = value;
  }
  await update(ref(db, `games/${roomId}`), updates);
}

export async function setBotControlled(
  roomId: string,
  country: CountryId,
  isBot: boolean
): Promise<void> {
  const db = getFirebaseDb();
  await update(ref(db, `games/${roomId}/botControlled`), {
    [country]: isBot,
  });
}

export async function endGame(
  roomId: string,
  reason: EndReason
): Promise<PlayerResult[]> {
  const db = getFirebaseDb();
  const existingArchive = await get(ref(db, `archive/${roomId}`));
  if (existingArchive.exists()) {
    const archived = existingArchive.val() as ArchivedGame;
    return Object.values(archived.playerResults);
  }

  const game = await getGame(roomId);
  if (!game) return [];

  const results = buildPlayerResults(game.gameState, game.humanPlayers);
  const playerResults: Record<string, PlayerResult> = {};
  for (const r of results) {
    playerResults[r.country] = r;
  }

  const archived: ArchivedGame = {
    ...game,
    archivedAt: Date.now(),
    endReason: reason,
    finalCycle: game.gameState.cycle,
    playerResults,
    statsShownAt: Date.now(),
  };

  await set(ref(db, `archive/${roomId}`), archived);
  await update(ref(db, `games/${roomId}`), {
    endReason: reason,
    statsShownAt: Date.now(),
  });
  await removeFromActiveRooms(roomId);
  await updateRoomStatus(roomId, "ending");

  return results;
}

export async function archiveAndCleanup(roomId: string): Promise<void> {
  const db = getFirebaseDb();
  await remove(ref(db, `games/${roomId}`));
  await remove(ref(db, `rooms/${roomId}`));
  await remove(ref(db, `activeRooms/${roomId}`));
}

export async function updateCycleTimer(
  roomId: string,
  startedAt: number,
  durationMs: number
): Promise<void> {
  const db = getFirebaseDb();
  await update(ref(db, `games/${roomId}/cycleTimer`), {
    startedAt,
    durationMs,
  });
}
