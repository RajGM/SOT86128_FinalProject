import { DISPLAY_NAME_KEY, PLAYER_ID_KEY } from "../types/multiplayer";

export function getPlayerId(): string {
  let playerId = localStorage.getItem(PLAYER_ID_KEY);
  if (!playerId) {
    playerId = crypto.randomUUID();
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  }
  return playerId;
}

export function getDisplayName(): string {
  return localStorage.getItem(DISPLAY_NAME_KEY) ?? "";
}

export function setDisplayName(name: string): void {
  localStorage.setItem(DISPLAY_NAME_KEY, name.trim());
}

export function isMusicEnabled(): boolean {
  const raw = localStorage.getItem("climateDiplomacy_musicEnabled");
  if (raw === null) return true;
  return raw === "true";
}

export function setMusicEnabled(enabled: boolean): void {
  localStorage.setItem("climateDiplomacy_musicEnabled", String(enabled));
}
