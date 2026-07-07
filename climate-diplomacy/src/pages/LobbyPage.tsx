import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDisplayName, getPlayerId } from "../lib/playerIdentity";
import type { Room } from "../types/multiplayer";
import {
  joinRoom,
  leaveRoom,
  setPlayerReady,
  setupPresence,
  subscribeRoom,
} from "../services/roomService";
import { startGame } from "../services/gameService";
import { generateMap } from "../lib/mapGenerator";
import { MusicToggle, SettingsGear } from "../components/settings/SettingsGear";
import { useLobbyMusic } from "../hooks/useLobbyMusic";
import "../components/ui/overlay.css";
import "../styles/lobby.css";

export function LobbyPage() {
  const { roomId = "" } = useParams();
  const navigate = useNavigate();
  const playerId = useMemo(() => getPlayerId(), []);
  const [room, setRoom] = useState<Room | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const hexes = useMemo(() => generateMap(42), []);

  useLobbyMusic();

  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeRoom(roomId, setRoom);
    return unsub;
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    void setupPresence(roomId, playerId);
    const name = getDisplayName();
    if (name) void joinRoom(roomId, playerId, name);
  }, [roomId, playerId]);

  useEffect(() => {
    if (room?.status === "active") {
      navigate(`/game/${roomId}`);
    }
  }, [room?.status, navigate, roomId]);

  const me = room?.players[playerId];
  const isHost = room?.hostId === playerId;
  const playerIds = room
    ? Object.keys(room.players).sort(
        (a, b) => room.players[a].joinedAt - room.players[b].joinedAt
      )
    : [];

  const readyCount = playerIds.filter(
    (id) => id !== room?.hostId && room?.players[id].ready
  ).length;

  const canStart =
    isHost &&
    (playerIds.length === 1 || readyCount >= 1);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReady = async () => {
    if (!room) return;
    await setPlayerReady(roomId, playerId, !me?.ready);
  };

  const handleLeave = async () => {
    setBusy(true);
    await leaveRoom(roomId, playerId);
    navigate("/");
  };

  const handleStart = useCallback(async () => {
    if (!room || !canStart) return;
    setBusy(true);
    try {
      await startGame(room, hexes);
      navigate(`/game/${roomId}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to start game");
    } finally {
      setBusy(false);
    }
  }, [room, canStart, hexes, navigate, roomId]);

  if (!room) {
    return (
      <div className="lobby-page">
        <div className="overlay-panel lobby-card">Loading lobby…</div>
      </div>
    );
  }

  const slots = Array.from({ length: room.settings.maxPlayers }, (_, i) => playerIds[i] ?? null);

  return (
    <div className="lobby-page">
      <div className="lobby-card overlay-panel">
        <div className="lobby-header">
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>LOBBY</div>
            <div className="lobby-room-id">Room: {roomId}</div>
          </div>
          <button type="button" className="overlay-btn" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy ID 📋"}
          </button>
        </div>

        <div className="lobby-meta">
          <div>Host: {room.hostName}</div>
          <div>
            Settings: Standard mid-game scenario, {room.settings.cycleTimerMinutes} min cycles,{" "}
            {room.settings.maxPlayers} max
          </div>
        </div>

        <div className="settings-section-title" style={{ borderTop: "none", paddingTop: 0 }}>
          Players ({playerIds.length}/{room.settings.maxPlayers})
        </div>
        <div className="player-list">
          {slots.map((pid, i) => {
            if (!pid) {
              return (
                <div key={`empty-${i}`} className="player-row empty">
                  {i + 1}. (waiting…)
                </div>
              );
            }
            const p = room.players[pid];
            const isPlayerHost = pid === room.hostId;
            return (
              <div key={pid} className="player-row">
                <span>
                  {i + 1}. {p.name}
                  {isPlayerHost ? " (Host)" : ""}
                  {p.connected === false ? " — disconnected" : ""}
                </span>
                <span className={p.ready ? "player-ready" : "player-not-ready"}>
                  {p.ready ? "● Ready" : "○ Not Ready"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="lobby-hint">
          Remaining countries filled by bots.
          <br />
          Countries assigned randomly when game starts.
        </div>

        <div className="lobby-actions">
          <div className="lobby-actions-host">
            <button type="button" className="overlay-btn" onClick={handleReady} disabled={busy}>
              {me?.ready ? "Not Ready" : "Ready"}
            </button>
            <button type="button" className="overlay-btn danger" onClick={handleLeave} disabled={busy}>
              Leave Lobby
            </button>
          </div>
          {isHost && (
            <button
              type="button"
              className="overlay-btn primary"
              disabled={!canStart || busy}
              onClick={handleStart}
            >
              Start Game
            </button>
          )}
        </div>
      </div>

      <MusicToggle />
      <SettingsGear roomId={roomId} playerId={playerId} />
    </div>
  );
}
