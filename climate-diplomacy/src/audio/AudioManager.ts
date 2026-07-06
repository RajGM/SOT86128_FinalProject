import { isMusicEnabled } from "../lib/playerIdentity";
import {
  AUDIO_STORAGE_KEY,
  DEFAULT_AUDIO_CONFIG,
  MUSIC_REGISTRY,
  SOUND_REGISTRY,
  type AudioConfig,
  type MusicId,
  type SoundId,
} from "./soundRegistry";

type VolumeCategory = "master" | "music" | "sfx";

const DEV = import.meta.env.DEV;

function loadConfig(): AudioConfig {
  try {
    const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AUDIO_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AudioConfig>;
    return {
      masterVolume: clamp01(parsed.masterVolume ?? DEFAULT_AUDIO_CONFIG.masterVolume),
      musicVolume: clamp01(parsed.musicVolume ?? DEFAULT_AUDIO_CONFIG.musicVolume),
      sfxVolume: clamp01(parsed.sfxVolume ?? DEFAULT_AUDIO_CONFIG.sfxVolume),
      muted: parsed.muted ?? DEFAULT_AUDIO_CONFIG.muted,
    };
  } catch {
    return { ...DEFAULT_AUDIO_CONFIG };
  }
}

function saveConfig(config: AudioConfig): void {
  localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(config));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function logPlayError(context: string, err: unknown): void {
  if (!DEV) return;
  const e = err as { name?: string; message?: string };
  console.warn(
    `[Audio] play() failed (${context}):`,
    e?.name ?? "Error",
    e?.message ?? err,
    "| userActivation:",
    typeof navigator !== "undefined" ? navigator.userActivation?.isActive : "n/a"
  );
}

export class AudioManager {
  private static instance: AudioManager;

  private sounds = new Map<string, HTMLAudioElement>();
  private music: HTMLAudioElement | null = null;
  private musicFadeId: number | null = null;
  private currentMusicId: MusicId | null = null;
  private config: AudioConfig;
  private unlocked = false;
  private unlockListeners = new Set<() => void>();
  /** Pre-warmed elements so play() can run synchronously inside a user gesture. */
  private musicCache = new Map<MusicId, HTMLAudioElement>();

  private constructor() {
    this.config = loadConfig();
    if (typeof window !== "undefined") {
      for (const id of Object.keys(MUSIC_REGISTRY) as MusicId[]) {
        this.warmMusicTrack(id);
      }
      const unlock = () => this.unlockFromGesture("window-listener");
      window.addEventListener("pointerdown", unlock, { once: true, capture: true });
      window.addEventListener("keydown", unlock, { once: true, capture: true });
    }
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  getConfig(): AudioConfig {
    return { ...this.config };
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  onUnlockChange(listener: () => void): () => void {
    this.unlockListeners.add(listener);
    return () => this.unlockListeners.delete(listener);
  }

  /** Call only from a user-gesture handler (click / pointerdown / keydown). */
  unlockFromGesture(source = "unknown"): void {
    if (this.unlocked) return;
    this.unlocked = true;
    if (DEV) {
      console.info("[Audio] unlocked via", source);
    }
    this.primeAudioInGesture();
    this.notifyUnlock();
    this.resumeMusic();
  }

  /** @deprecated Use unlockFromGesture inside event handlers. */
  unlock(): void {
    this.unlockFromGesture("unlock()");
  }

  private notifyUnlock(): void {
    for (const listener of this.unlockListeners) listener();
  }

  private warmMusicTrack(trackId: MusicId): void {
    if (this.musicCache.has(trackId)) return;
    const def = MUSIC_REGISTRY[trackId];
    const el = new Audio(def.url);
    el.loop = true;
    el.preload = "auto";
    el.load();
    this.musicCache.set(trackId, el);
  }

  /** Play a near-silent clip in the gesture stack so Chrome allows later playback. */
  private primeAudioInGesture(): void {
    try {
      const el = this.getSoundElement("click");
      const prev = el.volume;
      el.volume = 0.001;
      void el
        .play()
        .then(() => {
          el.pause();
          el.currentTime = 0;
          el.volume = prev;
        })
        .catch((err) => logPlayError("prime", err));
    } catch {
      // ignore
    }
  }

  /** Call play() synchronously in the user-gesture stack (required by Chrome). */
  private tryPlay(el: HTMLAudioElement, context: string): void {
    if (el.readyState < HTMLMediaElement.HAVE_METADATA) {
      el.load();
    }
    void el.play().catch((err) => logPlayError(context, err));
  }

  private resumeMusic(): void {
    if (!this.music || !this.currentMusicId || !isMusicEnabled() || this.config.muted) return;
    this.tryPlay(this.music, "resume-music");
    const targetVol = this.effectiveMusicVolume(this.currentMusicId);
    if (targetVol > 0) this.music.volume = targetVol;
  }

  private getSoundElement(soundId: SoundId): HTMLAudioElement {
    const def = SOUND_REGISTRY[soundId];
    let el = this.sounds.get(soundId);
    if (!el) {
      el = new Audio(def.url);
      el.preload = "auto";
      el.load();
      this.sounds.set(soundId, el);
    }
    return el;
  }

  private effectiveSfxVolume(soundId: SoundId): number {
    if (this.config.muted) return 0;
    return this.config.masterVolume * this.config.sfxVolume * SOUND_REGISTRY[soundId].volume;
  }

  private effectiveMusicVolume(trackId: MusicId): number {
    if (this.config.muted) return 0;
    return this.config.masterVolume * this.config.musicVolume * MUSIC_REGISTRY[trackId].volume;
  }

  play(soundId: SoundId): void {
    if (!this.unlocked || this.config.muted) return;
    const el = this.getSoundElement(soundId);
    const vol = this.effectiveSfxVolume(soundId);
    if (vol <= 0) return;

    try {
      const clone = el.cloneNode(true) as HTMLAudioElement;
      clone.volume = vol;
      void clone.play().catch((err) => logPlayError(`sfx:${soundId}`, err));
    } catch {
      // ignore playback errors
    }
  }

  playMusic(trackId: MusicId): void {
    if (!isMusicEnabled()) {
      this.stopMusic();
      return;
    }

    if (this.currentMusicId === trackId && this.music) {
      if (this.unlocked && !this.config.muted) this.resumeMusic();
      return;
    }

    const def = MUSIC_REGISTRY[trackId];
    const targetVol = this.effectiveMusicVolume(trackId);
    const crossfadeMs = def.crossfadeMs;

    if (this.musicFadeId !== null) {
      window.clearInterval(this.musicFadeId);
      this.musicFadeId = null;
    }

    const previous = this.music;

    const next = this.getMusicElement(trackId);
    next.currentTime = 0;
    next.volume = 0;
    this.music = next;
    this.currentMusicId = trackId;

    if (this.unlocked && !this.config.muted) {
      this.tryPlay(next, `music:${trackId}`);
    }

    const steps = Math.max(1, Math.round(crossfadeMs / 50));
    let step = 0;
    const startPrevVol = previous?.volume ?? 0;

    this.musicFadeId = window.setInterval(() => {
      step += 1;
      const t = step / steps;
      if (next) next.volume = targetVol * t;
      if (previous && previous !== next) previous.volume = startPrevVol * (1 - t);

      if (step >= steps) {
        if (this.musicFadeId !== null) {
          window.clearInterval(this.musicFadeId);
          this.musicFadeId = null;
        }
        if (previous && previous !== next) {
          previous.pause();
        }
        if (next) next.volume = targetVol;
      }
    }, 50);
  }

  private getMusicElement(trackId: MusicId): HTMLAudioElement {
    this.warmMusicTrack(trackId);
    return this.musicCache.get(trackId)!;
  }

  stopMusic(): void {
    if (this.musicFadeId !== null) {
      window.clearInterval(this.musicFadeId);
      this.musicFadeId = null;
    }
    if (this.music) {
      this.music.pause();
      this.music = null;
    }
    this.currentMusicId = null;
  }(targetVolume: number, durationMs: number): void {
    if (!this.music || !this.currentMusicId) return;
    const trackId = this.currentMusicId;
    const maxVol = this.effectiveMusicVolume(trackId);
    const endVol = clamp01(targetVolume) * maxVol;
    const startVol = this.music.volume;
    const steps = Math.max(1, Math.round(durationMs / 50));
    let step = 0;

    if (this.musicFadeId !== null) {
      window.clearInterval(this.musicFadeId);
    }

    this.musicFadeId = window.setInterval(() => {
      step += 1;
      const t = step / steps;
      if (this.music) {
        this.music.volume = startVol + (endVol - startVol) * t;
      }
      if (step >= steps && this.musicFadeId !== null) {
        window.clearInterval(this.musicFadeId);
        this.musicFadeId = null;
      }
    }, 50);
  }

  setVolume(category: VolumeCategory, value: number): void {
    const v = clamp01(value);
    if (category === "master") this.config.masterVolume = v;
    else if (category === "music") this.config.musicVolume = v;
    else this.config.sfxVolume = v;
    saveConfig(this.config);
    if (this.music && this.currentMusicId) {
      this.music.volume = this.effectiveMusicVolume(this.currentMusicId);
    }
  }

  setMuted(muted: boolean): void {
    this.config.muted = muted;
    saveConfig(this.config);
    if (muted) {
      if (this.music) this.music.volume = 0;
    } else if (this.music && this.currentMusicId) {
      this.music.volume = this.effectiveMusicVolume(this.currentMusicId);
      if (this.unlocked) this.resumeMusic();
    }
  }

  mute(): void {
    this.setMuted(true);
  }

  unmute(): void {
    this.setMuted(false);
  }

  toggleMute(): void {
    this.setMuted(!this.config.muted);
  }
}

export function playSound(soundId: SoundId): void {
  AudioManager.getInstance().play(soundId);
}
