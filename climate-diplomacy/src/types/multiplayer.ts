import type { CountryId } from "./hex";
import type { GameState } from "./game";
import type { MetricGaps, MetricRawValues } from "../lib/comparisonMetrics";

export type RoomStatus = "waiting" | "active" | "ending" | "archived";
export type PresetId = "easy" | "medium" | "hard" | "custom";

/** Runtime rules derived from lobby difficulty preset. */
export interface GameModeConfig {
  preset: PresetId;
  /** Climate/temperature models inactive while cycle ≤ this value. */
  climateGraceUntilCycle: number;
  enableCarbonTax: boolean;
  enableSummitResolutions: boolean;
  /** Host manually advances cycles (no auto timer). */
  manualCycleAdvance: boolean;
}

export interface StartingInfraSettings {
  fossilPlant: boolean;
  farm: boolean;
  extractor: boolean;
  transportHub: boolean;
  manufacturing: boolean;
}

export interface RoomRules {
  carbonTax: boolean;
  summitResolutions: boolean;
  factions: boolean;
  peacefulMode: boolean;
}

export interface RoomSettings {
  preset: PresetId;
  moneyMultiplier: number;
  energyMultiplier: number;
  foodMultiplier: number;
  techMultiplier: number;
  startingTemperature: number;
  cycleTimerMinutes: number;
  maxPlayers: number;
  startingInfra: StartingInfraSettings;
  rules: RoomRules;
}

export interface RoomPlayer {
  name: string;
  joinedAt: number;
  ready: boolean;
  connected: boolean;
  assignedCountry?: CountryId;
}

export interface Room {
  roomId: string;
  hostId: string;
  hostName: string;
  status: RoomStatus;
  createdAt: number;
  lastActivity: number;
  settings: RoomSettings;
  players: Record<string, RoomPlayer>;
  archiveAt?: number;
  endVote?: EndGameVoteState | null;
}

export interface ActiveRoomIndex {
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  status: "waiting" | "active";
  preset: string;
  createdAt: number;
}

export interface CycleTimer {
  startedAt: number;
  durationMs: number;
}

export interface GameData {
  roomId: string;
  cycle: number;
  gameState: GameState;
  cycleTimer: CycleTimer;
  humanPlayers: Record<string, HumanPlayerMeta>;
  botControlled: Partial<Record<CountryId, boolean>>;
  settings: RoomSettings;
  hostId: string;
  stateVersion?: number;
  endReason?: EndReason;
  statsShownAt?: number;
}

export interface HumanPlayerMeta {
  name: string;
  country: CountryId;
  connected: boolean;
  exited?: boolean;
}

export type EndReason = "host_ended" | "vote_ended" | "all_left" | "timeout";

export type ScoreBadge = "pioneer" | "progressive" | "laggard" | "blocker";

export type PodiumAward = "climate_pioneer" | "green_leader" | "sustainable_achiever" | null;

export interface PlayerResult {
  country: CountryId;
  playerName: string;
  isBot: boolean;
  /** 0–100 display score: (1 − composite_gap) × 100 */
  displayScore: number;
  compositeGap: number;
  rank: number;
  badge: ScoreBadge;
  podiumAward: PodiumAward;
  raw: MetricRawValues;
  gaps: MetricGaps;
  finalMoney: number;
  finalHappiness: number;
  finalPopulation: number;
  totalCo2: number;
  finalTechnology: number;
}

export interface SpecialAward {
  id: string;
  emoji: string;
  label: string;
  countryId: CountryId;
  detail: string;
}

export interface ArchivedGame extends GameData {
  archivedAt: number;
  endReason: EndReason;
  finalCycle: number;
  playerResults: Record<string, PlayerResult>;
}

export interface EndGameVoteState {
  active: boolean;
  callerId: string;
  callerName: string;
  votes: Record<string, "yes" | "no">;
  startedAt: number;
  expiresAt: number;
}

export const DISPLAY_NAME_KEY = "climateDiplomacy_displayName";
export const PLAYER_ID_KEY = "climateDiplomacy_playerId";
export const MUSIC_ENABLED_KEY = "climateDiplomacy_musicEnabled";
