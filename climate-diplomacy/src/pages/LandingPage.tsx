import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isFirebaseConfigured } from "../config/firebase";
import { getDisplayName, getPlayerId, setDisplayName } from "../lib/playerIdentity";
import { formatPresetLabel } from "../lib/roomPresets";
import type { ActiveRoomIndex, PresetId, RoomSettings } from "../types/multiplayer";
import {
  createRoom,
  joinRoom,
  joinErrorMessage,
  pruneStaleActiveRooms,
  subscribeActiveRooms,
} from "../services/roomService";
import { HostSettingsModal } from "../components/lobby/HostSettingsModal";
import { JoinModal } from "../components/lobby/JoinModal";
import { MusicToggle, SettingsGear } from "../components/settings/SettingsGear";
import { useLobbyMusic } from "../hooks/useLobbyMusic";
import "../components/ui/overlay.css";
import "../styles/lobby.css";

export function LandingPage() {
  const navigate = useNavigate();
  const playerId = useMemo(() => getPlayerId(), []);
  const [name, setName] = useState(getDisplayName);
  const [activeRooms, setActiveRooms] = useState<Record<string, ActiveRoomIndex>>({});
  const [showHost, setShowHost] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useLobbyMusic();

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    void pruneStaleActiveRooms();
    return subscribeActiveRooms(setActiveRooms);
  }, []);

  const requireName = useCallback((): boolean => {
    if (!name.trim()) {
      alert("Please enter a display name first.");
      return false;
    }
    setDisplayName(name.trim());
    return true;
  }, [name]);

  const handleCreate = async (settings: RoomSettings) => {
    if (!requireName()) return;
    setBusy(true);
    try {
      const roomId = await createRoom(playerId, name.trim(), settings);
      navigate(`/lobby/${roomId}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create room");
    } finally {
      setBusy(false);
      setShowHost(false);
    }
  };

  const handleJoin = async (roomId: string) => {
    if (!requireName()) return;
    setBusy(true);
    setJoinError(null);
    try {
      const result = await joinRoom(roomId, playerId, name.trim());
      if (!result.ok) {
        setJoinError(joinErrorMessage(result.error));
        return;
      }
      navigate(`/lobby/${result.roomId}`);
      setShowJoin(false);
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setBusy(false);
    }
  };

  const sortedRooms = useMemo(() => {
    return Object.entries(activeRooms)
      .map(([id, meta]) => ({ id, ...meta }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [activeRooms]);

  return (
    <div className="landing-page">
      <div className="landing-card overlay-panel">
        <div className="landing-title">🌍 CLIMATE DIPLOMACY</div>
        <div className="landing-subtitle">
          Environmental Politics Simulation Game
        </div>

        {!isFirebaseConfigured && (
          <div className="firebase-banner">
            Firebase is not configured. Copy <code>.env.example</code> to <code>.env</code> and add
            your credentials to use multiplayer. Single-player test mode at{" "}
            <a href="/test" style={{ color: "#93c5fd" }}>
              /test
            </a>{" "}
            still works.
          </div>
        )}

        <input
          className="landing-input"
          placeholder="Display Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="landing-actions">
          <button
            type="button"
            className="overlay-btn primary"
            disabled={!isFirebaseConfigured}
            onClick={() => requireName() && setShowHost(true)}
          >
            Host Game
          </button>
          <button
            type="button"
            className="overlay-btn"
            disabled={!isFirebaseConfigured}
            onClick={() => requireName() && setShowJoin(true)}
          >
            Join Game
          </button>
        </div>

        {isFirebaseConfigured && (
          <div className="active-games-section">
            <div className="active-games-title">── Active Games ──</div>
            {sortedRooms.length === 0 && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
                No active games yet — host one!
              </div>
            )}
            {sortedRooms.map((room) => {
              const joinable =
                room.status === "waiting" && room.playerCount < room.maxPlayers;
              return (
                <div
                  key={room.id}
                  className={`active-game-row ${joinable ? "" : "disabled"}`}
                  onClick={() => joinable && handleJoin(room.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && joinable && void handleJoin(room.id)}
                >
                  <div>
                    <div className="active-game-name">{room.hostName}&apos;s game</div>
                    <div className="active-game-meta">
                      {room.status === "active" ? "In Progress" : "Waiting"} · {formatPresetLabel(room.preset as PresetId)}
                    </div>
                  </div>
                  <div className="active-game-meta">
                    {room.playerCount}/{room.maxPlayers}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <a href="/test" className="overlay-btn" style={{ display: "inline-block", textDecoration: "none" }}>
            Test Scenario (/test)
          </a>
        </div>
      </div>

      <MusicToggle />
      <SettingsGear playerId={playerId} onDisplayNameChange={setName} />

      {showHost && (
        <HostSettingsModal
          onClose={() => setShowHost(false)}
          onCreate={handleCreate}
          busy={busy}
        />
      )}
      {showJoin && (
        <JoinModal
          onClose={() => {
            setShowJoin(false);
            setJoinError(null);
          }}
          onJoin={handleJoin}
          busy={busy}
          error={joinError}
        />
      )}
    </div>
  );
}
