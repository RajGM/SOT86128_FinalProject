import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GameProvider, type MultiplayerConfig } from "../context/GameContext";
import { HexMap } from "../components/map/HexMap";
import { generateMap } from "../lib/mapGenerator";
import { getDisplayName, getPlayerId } from "../lib/playerIdentity";
import type { GameData, PlayerResult, Room } from "../types/multiplayer";
import {
  archiveAndCleanup,
  endGame,
  pushGameStateImmediate,
  setBotControlled,
  subscribeGame,
  setStateVersionBaseline,
  syncGameState,
  updateCycleTimer,
  updateHumanPlayerMeta,
  cancelPendingGameStateSync,
  cacheRemoteGameState,
} from "../services/gameService";
import {
  clearArchiveTimer,
  joinRoom,
  setArchiveTimer,
  setEndVote,
  setupPresence,
  subscribeRoom,
} from "../services/roomService";
import { GameTopBar } from "../components/game/GameTopBar";
import { MultiplayerCycleController } from "../components/game/MultiplayerCycleController";
import { StatsScreen } from "../components/endgame/StatsScreen";
import { EndGameVoteModal, useEndGameVote } from "../components/endgame/EndGameVoteModal";
import { SettingsGear } from "../components/settings/SettingsGear";
import { STATS_VIEW_MS, ARCHIVE_GRACE_MS } from "../lib/scoring";
import "../components/ui/overlay.css";

export function GamePage() {
  const { roomId = "" } = useParams();
  const navigate = useNavigate();
  const playerId = useMemo(() => getPlayerId(), []);
  const playerName = useMemo(() => getDisplayName(), []);
  const hexes = useMemo(() => generateMap(42), []);

  const [gameData, setGameData] = useState<GameData | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [results, setResults] = useState<PlayerResult[] | null>(null);
  const [cycleRemainingSec, setCycleRemainingSec] = useState<number | undefined>();

  const isHost = gameData?.hostId === playerId;
  const myMeta = gameData?.humanPlayers[playerId];
  const assignedCountry = myMeta?.country;

  const { vote, canCallVote, startVote } = useEndGameVote(room, playerId);

  useEffect(() => {
    if (!roomId) return;
    return subscribeGame(roomId, setGameData);
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !gameData) return;
    cancelPendingGameStateSync();
    if (gameData.stateVersion != null) {
      setStateVersionBaseline(gameData.stateVersion);
    }
    cacheRemoteGameState(roomId, gameData.gameState);
  }, [roomId, gameData?.stateVersion, gameData?.gameState]);

  useEffect(() => {
    if (!roomId) return;
    return subscribeRoom(roomId, setRoom);
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !assignedCountry) return;
    void setupPresence(roomId, playerId);
    const name = getDisplayName();
    if (name) void joinRoom(roomId, playerId, name);
    void updateHumanPlayerMeta(roomId, playerId, { connected: true, exited: false });
  }, [roomId, playerId, assignedCountry]);

  useEffect(() => {
    if (!gameData?.cycleTimer || gameData.cycleTimer.durationMs <= 0) {
      setCycleRemainingSec(undefined);
      return;
    }
    const tick = () => {
      const elapsed = Date.now() - gameData.cycleTimer.startedAt;
      const remaining = Math.max(0, Math.ceil((gameData.cycleTimer.durationMs - elapsed) / 1000));
      setCycleRemainingSec(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [gameData?.cycleTimer]);

  useEffect(() => {
    if (!room || !gameData || !isHost) return;

    for (const [pid, meta] of Object.entries(gameData.humanPlayers)) {
      const roomPlayer = room.players[pid];
      const connected = roomPlayer?.connected !== false && !meta.exited;
      if (connected !== meta.connected) {
        void updateHumanPlayerMeta(roomId, pid, { connected });
        void setBotControlled(roomId, meta.country, !connected);
      }
    }

    const anyConnected = Object.entries(gameData.humanPlayers).some(([pid, meta]) => {
      const roomPlayer = room.players[pid];
      return roomPlayer?.connected !== false && !meta.exited;
    });

    if (!anyConnected) {
      void setArchiveTimer(roomId, Date.now() + ARCHIVE_GRACE_MS);
    } else {
      void clearArchiveTimer(roomId);
    }
  }, [room, gameData, isHost, roomId]);

  useEffect(() => {
    if (!room?.archiveAt || !isHost) return;
    const delay = room.archiveAt - Date.now();
    if (delay <= 0) {
      void endGame(roomId, "all_left").then(setResults);
      return;
    }
    const id = setTimeout(() => {
      void endGame(roomId, "all_left").then(setResults);
    }, delay);
    return () => clearTimeout(id);
  }, [room?.archiveAt, isHost, roomId]);

  useEffect(() => {
    if (room?.status === "ending" && gameData && !results) {
      void endGame(roomId, gameData.endReason ?? "vote_ended").then(setResults);
    }
  }, [room?.status, gameData, results, roomId]);

  const handleStateSync = useCallback(
    (state: import("../types/game").GameState) => {
      if (!roomId) return;
      if (isHost) {
        void pushGameStateImmediate(roomId, state, true);
      } else {
        syncGameState(roomId, state, false);
      }
    },
    [roomId, isHost]
  );

  const handleCycleTimerReset = useCallback(() => {
    if (!roomId || !isHost || !gameData) return;
    const durationMs =
      gameData.settings.cycleTimerMinutes > 0
        ? gameData.settings.cycleTimerMinutes * 60_000
        : 0;
    if (durationMs <= 0) return;
    void updateCycleTimer(roomId, Date.now(), durationMs);
  }, [roomId, isHost, gameData]);

  const multiplayerConfig = useMemo((): MultiplayerConfig | null => {
    if (!gameData || !assignedCountry) return null;
    const humanPlayerCountries = Object.values(gameData.humanPlayers)
      .filter((m) => m.connected && !m.exited)
      .map((m) => m.country);
    return {
      roomId,
      playerId,
      isHost,
      assignedCountry,
      playerName: myMeta?.name ?? playerName,
      syncedState: gameData.gameState,
      syncedVersion: gameData.stateVersion ?? 0,
      onStateSync: handleStateSync,
      humanPlayerCountries,
      botControlled: gameData.botControlled,
    };
  }, [
    gameData,
    assignedCountry,
    roomId,
    playerId,
    isHost,
    myMeta?.name,
    playerName,
    handleStateSync,
  ]);

  const humanPlayerIds = useMemo(
    () => (gameData ? Object.keys(gameData.humanPlayers) : []),
    [gameData]
  );

  const handleExit = async () => {
    if (!assignedCountry) {
      navigate("/");
      return;
    }
    await updateHumanPlayerMeta(roomId, playerId, { connected: false, exited: true });
    navigate("/");
  };

  const handleHostEnd = async () => {
    if (!window.confirm("End the game immediately for all players?")) return;
    const res = await endGame(roomId, "host_ended");
    setResults(res);
  };

  const handleEndGameVote = async () => {
    if (vote?.active) return;
    if (!canCallVote()) {
      alert("You must wait 7 minutes before calling another vote.");
      return;
    }
    if (!window.confirm("Call a vote to end the game?")) return;
    await startVote(roomId, myMeta?.name ?? playerName);
  };

  const handleVoteComplete = async (passed: boolean) => {
    await setEndVote(roomId, null);
    if (passed) {
      const res = await endGame(roomId, "vote_ended");
      setResults(res);
    } else if (vote?.callerId === playerId) {
      alert("Vote failed.");
    }
  };

  const handleReturnHome = useCallback(async () => {
    await archiveAndCleanup(roomId);
    navigate("/");
  }, [navigate, roomId]);

  useEffect(() => {
    if (!results) return;
    const id = setTimeout(() => {
      void handleReturnHome();
    }, STATS_VIEW_MS);
    return () => clearTimeout(id);
  }, [results, handleReturnHome]);

  if (!gameData || !assignedCountry || !multiplayerConfig) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a2e", color: "#fff" }}>
        Loading game…
      </div>
    );
  }

  return (
    <>
      {results && (
        <StatsScreen
          results={results}
          gameState={gameData.gameState}
          viewCountry={assignedCountry}
          finalCycle={gameData.gameState.cycle}
          finalTemperature={gameData.gameState.globalTemperature}
          countdownSec={STATS_VIEW_MS / 1000}
          onReturn={() => void handleReturnHome()}
        />
      )}

      {vote?.active && (
        <EndGameVoteModal
          roomId={roomId}
          playerId={playerId}
          vote={vote}
          humanPlayerIds={humanPlayerIds}
          onVoteComplete={(passed) => void handleVoteComplete(passed)}
          onCancelled={() => void setEndVote(roomId, null)}
        />
      )}

      <GameProvider
        hexes={hexes}
        initialState={gameData.gameState}
        isTestScenario={false}
        multiplayer={multiplayerConfig}
      >
        <div style={{ position: "relative", height: "100vh" }} className="game-shell game-shell--multiplayer">
          <GameTopBar
            onExit={() => void handleExit()}
            onEndGame={() => void handleEndGameVote()}
            onHostEnd={() => void handleHostEnd()}
            cycleRemainingSec={cycleRemainingSec}
          />
          <MultiplayerCycleController
            cycleTimer={gameData.cycleTimer}
            onTimerReset={handleCycleTimerReset}
          />
          <HexMap hexes={hexes} multiplayerMode />
        </div>
        <SettingsGear roomId={roomId} playerId={playerId} />
      </GameProvider>
    </>
  );
}
