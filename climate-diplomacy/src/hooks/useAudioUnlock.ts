import { useEffect, useState } from "react";
import { AudioManager } from "../audio/AudioManager";

export function useAudioUnlocked(): boolean {
  const [unlocked, setUnlocked] = useState(() => AudioManager.getInstance().isUnlocked());

  useEffect(() => {
    return AudioManager.getInstance().onUnlockChange(() => setUnlocked(true));
  }, []);

  return unlocked;
}
