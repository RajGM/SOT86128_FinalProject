import { useEffect } from "react";
import { AudioManager } from "../audio/AudioManager";
import { isMusicEnabled } from "../lib/playerIdentity";

/** Starts lobby/landing ambient music after the first user interaction unlocks audio. */
export function useLobbyMusic(): void {
  useEffect(() => {
    if (!isMusicEnabled()) return;
    AudioManager.getInstance().playMusic("ambient-main");
  }, []);

  useEffect(() => {
    const start = () => {
      const audio = AudioManager.getInstance();
      audio.unlockFromGesture("lobby");
      if (isMusicEnabled()) audio.playMusic("ambient-main");
    };
    window.addEventListener("pointerdown", start, { once: true, capture: true });
    window.addEventListener("keydown", start, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", start, true);
      window.removeEventListener("keydown", start, true);
    };
  }, []);
}
