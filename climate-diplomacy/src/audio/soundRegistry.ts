import click from "../assets/audio/ui/click.wav";
import tabSwitch from "../assets/audio/ui/tab-switch.wav";
import hover from "../assets/audio/ui/hover.wav";
import openPanel from "../assets/audio/ui/open-panel.wav";
import closePanel from "../assets/audio/ui/close-panel.wav";
import toggle from "../assets/audio/ui/toggle.wav";
import buildPlace from "../assets/audio/game/build-place.wav";
import buildUpgrade from "../assets/audio/game/build-upgrade.wav";
import buildDemolish from "../assets/audio/game/build-demolish.wav";
import cycleTick from "../assets/audio/game/cycle-tick.wav";
import cycleComplete from "../assets/audio/game/cycle-complete.wav";
import tradePropose from "../assets/audio/game/trade-propose.wav";
import tradeAccept from "../assets/audio/game/trade-accept.wav";
import tradeReject from "../assets/audio/game/trade-reject.wav";
import coin from "../assets/audio/game/coin.wav";
import sliderTick from "../assets/audio/game/slider-tick.wav";
import warning from "../assets/audio/alerts/warning.wav";
import crisis from "../assets/audio/alerts/crisis.wav";
import tempMilestone from "../assets/audio/alerts/temp-milestone.wav";
import summitGavel from "../assets/audio/alerts/summit-gavel.wav";
import voteCast from "../assets/audio/summit/vote-cast.wav";
import resolutionPass from "../assets/audio/summit/resolution-pass.wav";
import resolutionFail from "../assets/audio/summit/resolution-fail.wav";
import ambientMain from "../assets/audio/music/ambient-main.wav";
import ambientTension from "../assets/audio/music/ambient-tension.wav";
import ambientSummit from "../assets/audio/music/ambient-summit.wav";

export type SoundId =
  | "click"
  | "tab-switch"
  | "hover"
  | "open-panel"
  | "close-panel"
  | "toggle"
  | "build-place"
  | "build-upgrade"
  | "build-demolish"
  | "cycle-tick"
  | "cycle-complete"
  | "trade-propose"
  | "trade-accept"
  | "trade-reject"
  | "coin"
  | "slider-tick"
  | "warning"
  | "crisis"
  | "temp-milestone"
  | "summit-gavel"
  | "vote-cast"
  | "resolution-pass"
  | "resolution-fail";

export type MusicId = "ambient-main" | "ambient-tension" | "ambient-summit";

export interface SoundDefinition {
  url: string;
  volume: number;
}

export const SOUND_REGISTRY: Record<SoundId, SoundDefinition> = {
  click: { url: click, volume: 0.4 },
  "tab-switch": { url: tabSwitch, volume: 0.3 },
  hover: { url: hover, volume: 0.2 },
  "open-panel": { url: openPanel, volume: 0.3 },
  "close-panel": { url: closePanel, volume: 0.25 },
  toggle: { url: toggle, volume: 0.3 },
  "build-place": { url: buildPlace, volume: 0.5 },
  "build-upgrade": { url: buildUpgrade, volume: 0.5 },
  "build-demolish": { url: buildDemolish, volume: 0.45 },
  "cycle-tick": { url: cycleTick, volume: 0.25 },
  "cycle-complete": { url: cycleComplete, volume: 0.5 },
  "trade-propose": { url: tradePropose, volume: 0.4 },
  "trade-accept": { url: tradeAccept, volume: 0.5 },
  "trade-reject": { url: tradeReject, volume: 0.4 },
  coin: { url: coin, volume: 0.3 },
  "slider-tick": { url: sliderTick, volume: 0.15 },
  warning: { url: warning, volume: 0.5 },
  crisis: { url: crisis, volume: 0.6 },
  "temp-milestone": { url: tempMilestone, volume: 0.55 },
  "summit-gavel": { url: summitGavel, volume: 0.5 },
  "vote-cast": { url: voteCast, volume: 0.4 },
  "resolution-pass": { url: resolutionPass, volume: 0.5 },
  "resolution-fail": { url: resolutionFail, volume: 0.45 },
};

export const MUSIC_REGISTRY: Record<
  MusicId,
  { url: string; volume: number; crossfadeMs: number }
> = {
  "ambient-main": { url: ambientMain, volume: 0.25, crossfadeMs: 2000 },
  "ambient-tension": { url: ambientTension, volume: 0.3, crossfadeMs: 2000 },
  "ambient-summit": { url: ambientSummit, volume: 0.3, crossfadeMs: 1500 },
};

export const AUDIO_STORAGE_KEY = "climateDiplomacy_audio";

export const DEFAULT_AUDIO_CONFIG = {
  masterVolume: 0.6,
  musicVolume: 0.3,
  sfxVolume: 0.5,
  muted: false,
} as const;

export type AudioConfig = {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
};
