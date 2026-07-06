import {
  get,
  onDisconnect,
  onValue,
  ref,
  remove,
  set,
  update,
  type Unsubscribe,
} from "firebase/database";
import { getFirebaseDb } from "../config/firebase";
import type {
  ActiveRoomIndex,
  EndGameVoteState,
  Room,
  RoomPlayer,
  RoomSettings,
} from "../types/multiplayer";
import { generateUniqueRoomId } from "../lib/roomId";

function activeRoomIndex(room: Room): ActiveRoomIndex {
  return {
    hostName: room.hostName,
    playerCount: Object.keys(room.players).length,
    maxPlayers: room.settings.maxPlayers,
    status: room.status === "active" ? "active" : "waiting",
    preset: room.settings.preset,
    createdAt: room.createdAt,
  };
}

export async function createRoom(
  hostId: string,
  hostName: string,
  settings: RoomSettings
): Promise<string> {
  const db = getFirebaseDb();
  const roomId = await generateUniqueRoomId();
  const now = Date.now();
  const room: Room = {
    roomId,
    hostId,
    hostName,
    status: "waiting",
    createdAt: now,
    lastActivity: now,
    settings,
    players: {
      [hostId]: {
        name: hostName,
        joinedAt: now,
        ready: false,
        connected: true,
      },
    },
  };
  await set(ref(db, `rooms/${roomId}`), room);
  await set(ref(db, `activeRooms/${roomId}`), activeRoomIndex(room));
  return roomId;
}

export function subscribeRoom(
  roomId: string,
  onUpdate: (room: Room | null) => void
): Unsubscribe {
  const db = getFirebaseDb();
  return onValue(ref(db, `rooms/${roomId}`), (snap) => {
    onUpdate(snap.exists() ? (snap.val() as Room) : null);
  });
}

export function subscribeActiveRooms(
  onUpdate: (rooms: Record<string, ActiveRoomIndex>) => void
): Unsubscribe {
  const db = getFirebaseDb();
  return onValue(ref(db, "activeRooms"), (snap) => {
    onUpdate(snap.exists() ? (snap.val() as Record<string, ActiveRoomIndex>) : {});
  });
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const db = getFirebaseDb();
  const snap = await get(ref(db, `rooms/${roomId.toUpperCase()}`));
  return snap.exists() ? (snap.val() as Room) : null;
}

export type JoinError =
  | "not_found"
  | "in_progress"
  | "full"
  | "no_name";

export async function joinRoom(
  roomId: string,
  playerId: string,
  displayName: string
): Promise<{ ok: true; roomId: string } | { ok: false; error: JoinError }> {
  if (!displayName.trim()) return { ok: false, error: "no_name" };
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "not_found" };
  const isRejoin = Boolean(room.players[playerId]);
  if (room.status !== "waiting" && !isRejoin) {
    return { ok: false, error: "in_progress" };
  }

  const playerCount = Object.keys(room.players).length;
  if (!isRejoin && playerCount >= room.settings.maxPlayers) {
    return { ok: false, error: "full" };
  }

  const db = getFirebaseDb();
  const now = Date.now();
  const player: RoomPlayer = room.players[playerId] ?? {
    name: displayName,
    joinedAt: now,
    ready: false,
    connected: true,
  };
  player.name = displayName;
  player.connected = true;

  await update(ref(db, `rooms/${room.roomId}`), {
    lastActivity: now,
    [`players/${playerId}`]: player,
  });

  const updated = await getRoom(room.roomId);
  if (updated) {
    await set(ref(db, `activeRooms/${room.roomId}`), activeRoomIndex(updated));
  }
  return { ok: true, roomId: room.roomId };
}

export async function setPlayerReady(
  roomId: string,
  playerId: string,
  ready: boolean
): Promise<void> {
  const db = getFirebaseDb();
  await update(ref(db, `rooms/${roomId}/players/${playerId}`), { ready });
  await update(ref(db, `rooms/${roomId}`), { lastActivity: Date.now() });
}

export async function setupPresence(
  roomId: string,
  playerId: string
): Promise<void> {
  const db = getFirebaseDb();
  const connectedRef = ref(db, `rooms/${roomId}/players/${playerId}/connected`);
  await set(connectedRef, true);
  await onDisconnect(connectedRef).set(false);
}

export async function leaveRoom(roomId: string, playerId: string): Promise<void> {
  const db = getFirebaseDb();
  const room = await getRoom(roomId);
  if (!room) return;

  const players = { ...room.players };
  delete players[playerId];

  const remainingIds = Object.keys(players);
  if (remainingIds.length === 0) {
    await remove(ref(db, `rooms/${roomId}`));
    await remove(ref(db, `activeRooms/${roomId}`));
    return;
  }

  let hostId = room.hostId;
  let hostName = room.hostName;
  if (playerId === room.hostId) {
    const oldest = remainingIds
      .map((id) => ({ id, joinedAt: players[id].joinedAt }))
      .sort((a, b) => a.joinedAt - b.joinedAt)[0];
    hostId = oldest.id;
    hostName = players[oldest.id].name;
  }

  await update(ref(db, `rooms/${roomId}`), {
    hostId,
    hostName,
    lastActivity: Date.now(),
    [`players/${playerId}`]: null,
  });

  const updated = await getRoom(roomId);
  if (updated) {
    await set(ref(db, `activeRooms/${roomId}`), activeRoomIndex(updated));
  }
}

export async function updatePlayerNameInRoom(
  roomId: string,
  playerId: string,
  name: string
): Promise<void> {
  const db = getFirebaseDb();
  await update(ref(db, `rooms/${roomId}/players/${playerId}`), { name });
  const room = await getRoom(roomId);
  if (room && room.hostId === playerId) {
    await update(ref(db, `rooms/${roomId}`), { hostName: name });
    await set(ref(db, `activeRooms/${roomId}`), activeRoomIndex({ ...room, hostName: name }));
  }
}

export async function updateRoomStatus(
  roomId: string,
  status: Room["status"]
): Promise<void> {
  const db = getFirebaseDb();
  await update(ref(db, `rooms/${roomId}`), {
    status,
    lastActivity: Date.now(),
  });
  const room = await getRoom(roomId);
  if (room) {
    await set(ref(db, `activeRooms/${roomId}`), activeRoomIndex({ ...room, status }));
  }
}

export async function assignCountriesAtStart(
  roomId: string,
  assignments: Record<string, string>
): Promise<void> {
  const db = getFirebaseDb();
  const updates: Record<string, unknown> = { lastActivity: Date.now() };
  for (const [playerId, country] of Object.entries(assignments)) {
    updates[`players/${playerId}/assignedCountry`] = country;
  }
  await update(ref(db, `rooms/${roomId}`), updates);
}

export async function setEndVote(
  roomId: string,
  vote: EndGameVoteState | null
): Promise<void> {
  const db = getFirebaseDb();
  await update(ref(db, `rooms/${roomId}`), {
    endVote: vote,
    lastActivity: Date.now(),
  });
}

export async function castEndVote(
  roomId: string,
  playerId: string,
  choice: "yes" | "no"
): Promise<void> {
  const db = getFirebaseDb();
  await update(ref(db, `rooms/${roomId}/endVote/votes`), {
    [playerId]: choice,
  });
}

export async function setArchiveTimer(roomId: string, archiveAt: number): Promise<void> {
  const db = getFirebaseDb();
  await update(ref(db, `rooms/${roomId}`), { archiveAt });
}

export async function clearArchiveTimer(roomId: string): Promise<void> {
  const db = getFirebaseDb();
  await update(ref(db, `rooms/${roomId}`), { archiveAt: null });
}

export function joinErrorMessage(error: JoinError): string {
  switch (error) {
    case "not_found":
      return "Room not found. Check the code and try again.";
    case "in_progress":
      return "This game is already in progress.";
    case "full":
      return "This game is full.";
    case "no_name":
      return "Please enter a display name first.";
  }
}
