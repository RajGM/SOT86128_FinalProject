import { useCallback } from "react";
import { AudioManager } from "../audio/AudioManager";
import type { SoundId } from "../audio/soundRegistry";

export function useSound() {
  const play = useCallback((soundId: SoundId) => {
    AudioManager.getInstance().play(soundId);
  }, []);

  return { play };
}
