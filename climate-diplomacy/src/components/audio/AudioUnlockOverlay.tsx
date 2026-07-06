import { useCallback } from "react";
import { AudioManager } from "../../audio/AudioManager";
import { isMusicEnabled } from "../../lib/playerIdentity";
import { useAudioUnlocked } from "../../hooks/useAudioUnlock";
import "./audio-unlock.css";

/**
 * Chrome blocks autoplay until a user gesture calls play() synchronously.
 * This overlay guarantees that first tap runs unlock + music in the gesture stack.
 */
export function AudioUnlockOverlay() {
  const unlocked = useAudioUnlocked();

  const handleUnlock = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const audio = AudioManager.getInstance();
    audio.unlockFromGesture("overlay");
    if (isMusicEnabled()) {
      audio.playMusic("ambient-main");
    }
  }, []);

  if (unlocked) return null;

  return (
    <div
      className="audio-unlock-overlay"
      role="button"
      tabIndex={0}
      aria-label="Tap to enable sound"
      onPointerDown={handleUnlock}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          AudioManager.getInstance().unlockFromGesture("overlay-key");
          if (isMusicEnabled()) {
            AudioManager.getInstance().playMusic("ambient-main");
          }
        }
      }}
    >
      <div className="audio-unlock-card">
        <div className="audio-unlock-icon" aria-hidden>
          🔇
        </div>
        <div className="audio-unlock-title">Tap to enable sound</div>
        <div className="audio-unlock-hint">
          Chrome requires a click before music and effects can play.
        </div>
      </div>
    </div>
  );
}
