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
} from "../lib/gameBootstrap";
import { buildPlayerResults } from "../lib/scoring";
import { assignCountriesAtStart, updateRoomStatus } from "./roomService";

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
  const gameData: GameData = {
    roomId: room.roomId,
    cycle: 1,
    gameState,
    cycleTimer: {
      startedAt: now,
      durationMs: room.settings.cycleTimerMinutes * 60 * 1000,
    },
    humanPlayers,
    botControlled: {},
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

export function subscribeGame(
  roomId: string,
  onUpdate: (game: GameData | null) => void
): Unsubscribe {
  const db = getFirebaseDb();
  return onValue(ref(db, `games/${roomId}`), (snap) => {
    onUpdate(snap.exists() ? (snap.val() as GameData) : null);
  });
}

export async function getGame(roomId: string): Promise<GameData | null> {
  const db = getFirebaseDb();
  const snap = await get(ref(db, `games/${roomId}`));
  return snap.exists() ? (snap.val() as GameData) : null;
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let localVersion = 0;

export function syncGameState(roomId: string, gameState: GameState): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    localVersion += 1;
    const db = getFirebaseDb();
    void update(ref(db, `games/${roomId}`), {
      gameState,
      cycle: gameState.cycle,
      stateVersion: localVersion,
      lastActivity: Date.now(),
    });
  }, 300);
}

export async function pushGameStateImmediate(
  roomId: string,
  gameState: GameState
): Promise<void> {
  localVersion += 1;
  const db = getFirebaseDb();
  await update(ref(db, `games/${roomId}`), {
    gameState,
    cycle: gameState.cycle,
    stateVersion: localVersion,
  });
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
