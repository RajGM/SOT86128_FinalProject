import { useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import type { CycleTimer } from "../../types/multiplayer";

type CyclePhase = "playing" | "advancing";

interface MultiplayerCycleControllerProps {
  cycleTimer: CycleTimer | undefined;
  onTimerReset: () => void | Promise<void>;
}

/** Host-only: when the Firebase cycle timer expires, advance the cycle (bots + processCycle). */
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
    if (gameState.gameMode?.manualCycleAdvance) return;
    if (cycleTimer.durationMs <= 0) return;

    const check = () => {
      if (phaseRef.current !== "playing") return;

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
  }, [isHost, cycleTimer, advanceCycle, gameState.cycle, gameState.testingMode, gameState.gameMode?.manualCycleAdvance]);

  useEffect(() => {
    if (!isHost || phaseRef.current !== "advancing") return;
    if (gameState.cycle <= cycleAtAdvanceRef.current) return;

    phaseRef.current = "playing";
    void onTimerReset();
  }, [isHost, gameState.cycle, onTimerReset]);

  return null;
}
