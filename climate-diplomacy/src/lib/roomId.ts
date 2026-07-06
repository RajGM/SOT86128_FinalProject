import { get, ref } from "firebase/database";
import { getFirebaseDb } from "../config/firebase";

const ROOM_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomIdCandidate(): string {
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += ROOM_ID_CHARS[Math.floor(Math.random() * ROOM_ID_CHARS.length)];
  }
  return id;
}

export async function generateUniqueRoomId(): Promise<string> {
  const db = getFirebaseDb();
  for (let attempt = 0; attempt < 20; attempt++) {
    const id = generateRoomIdCandidate();
    const snap = await get(ref(db, `rooms/${id}`));
    if (!snap.exists()) return id;
  }
  throw new Error("Could not generate a unique room ID. Please try again.");
}
