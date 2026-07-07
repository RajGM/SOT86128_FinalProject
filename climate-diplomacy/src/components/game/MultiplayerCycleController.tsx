import { useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import type { CycleTimer } from "../../types/multiplayer";

type CyclePhase = "playing" | "advancing" | "summit";

interface MultiplayerCycleControllerProps {
  cycleTimer: CycleTimer | undefined;
  onTimerReset: () => void | Promise<void>;
}

/**
 * Host-only: when the Firebase cycle timer expires, advance the cycle (bots +
 * processCycle). If a summit vote opens, wait for it to resolve, then reset the
 * timer for the next cycle. Non-host clients only display the countdown.
 */
export function MultiplayerCycleController({
  cycleTimer,
  onTimerReset,
}: MultiplayerCycleControllerProps) {
  const { gameState, advanceCycle, multiplayer } = useGame();
  const phaseRef = useRef<CyclePhase>("playing");
  const cycleAtAdvanceRef = useRef(gameState.cycle);

  const isHost = multiplayer?.isHost ?? false;

  useEffect(() => {
    if (!isHost || !cycleTimer || gameState.testingMode) return;

    const check = () => {
      if (phaseRef.current !== "playing") return;
      if (gameState.pendingSummitVote) return;

      const remaining =
        cycleTimer.durationMs - (Date.now() - cycleTimer.startedAt);
      if (remaining <= 0) {
        phaseRef.current = "advancing";
        cycleAtAdvanceRef.current = gameState.cycle;
        advanceCycle();
      }
    };

    check();
    const id = window.setInterval(check, 250);
    return () => window.clearInterval(id);
  }, [
    isHost,
    cycleTimer,
    advanceCycle,
    gameState.cycle,
    gameState.pendingSummitVote,
    gameState.testingMode,
  ]);

  useEffect(() => {
    if (!isHost || phaseRef.current !== "advancing") return;
    if (gameState.cycle <= cycleAtAdvanceRef.current) return;

    if (gameState.pendingSummitVote) {
      phaseRef.current = "summit";
      return;
    }

    phaseRef.current = "playing";
    void onTimerReset();
  }, [
    isHost,
    gameState.cycle,
    gameState.pendingSummitVote,
    onTimerReset,
  ]);

  useEffect(() => {
    if (!isHost || phaseRef.current !== "summit") return;
    if (gameState.pendingSummitVote) return;

    phaseRef.current = "playing";
    void onTimerReset();
  }, [isHost, gameState.pendingSummitVote, onTimerReset]);

  return null;
}
