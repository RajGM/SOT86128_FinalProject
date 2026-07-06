import { useEffect, useRef } from "react";
import { useGame } from "../../context/GameContext";
import { AudioManager, playSound } from "../../audio/AudioManager";
import { isMusicEnabled } from "../../lib/playerIdentity";
import { COUNTRY_CONFIGS, type CountryId } from "../../types/hex";
import type { RegionState } from "../../types/game";

const TEMP_MILESTONES = [1.5, 2.0, 2.5, 3.0];
const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS) as CountryId[];

function selectGameMusic(
  pendingSummit: boolean,
  regions: Record<CountryId, RegionState>
): "ambient-main" | "ambient-tension" | "ambient-summit" | null {
  if (!isMusicEnabled()) return null;
  if (pendingSummit) return "ambient-summit";
  if (anyCountryInCrisis(regions)) return "ambient-tension";
  return "ambient-main";
}

function anyCountryInCrisis(regions: Record<CountryId, RegionState>): boolean {
  return ALL_COUNTRIES.some((id) => regions[id].happiness < 30);
}

function applyGameMusic(
  pendingSummit: boolean,
  regions: Record<CountryId, RegionState>
): void {
  const track = selectGameMusic(pendingSummit, regions);
  const audio = AudioManager.getInstance();
  if (!track) {
    audio.stopMusic();
    return;
  }
  audio.playMusic(track);
}

function checkResourceWarnings(
  regions: Record<CountryId, RegionState>,
  viewCountry: CountryId,
  fired: Set<string>
): void {
  const r = regions[viewCountry];
  const checks: [string, boolean][] = [
    [`food-${viewCountry}`, r.food < 10],
    [`energy-${viewCountry}`, r.energy < 10],
    [`money-${viewCountry}`, r.money < 10],
  ];
  for (const [key, low] of checks) {
    if (low && !fired.has(key)) {
      fired.add(key);
      playSound("warning");
    } else if (!low) {
      fired.delete(key);
    }
  }
}

/** Wires game-state transitions and global UI click sounds. */
export function AudioController() {
  const {
    gameState,
    viewCountry,
    dashboardOpen,
    buildPanelOpen,
    comparisonOpen,
    dashboardTab,
  } = useGame();

  const prev = useRef({
    cycle: gameState.cycle,
    dashboardOpen,
    buildPanelOpen,
    comparisonOpen,
    dashboardTab,
    pendingSummit: gameState.pendingSummitVote?.cycle ?? null,
    globalTemp: gameState.globalTemperature,
    crisisCountries: new Set<string>(),
    resourceWarnKeys: new Set<string>(),
  });

  useEffect(() => {
    applyGameMusic(!!gameState.pendingSummitVote, gameState.regions);
  }, [gameState.cycle, gameState.pendingSummitVote, gameState.regions]);

  useEffect(() => {
    const start = () => {
      AudioManager.getInstance().unlockFromGesture("game");
      applyGameMusic(!!gameState.pendingSummitVote, gameState.regions);
    };
    window.addEventListener("pointerdown", start, { once: true, capture: true });
    window.addEventListener("keydown", start, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", start, true);
      window.removeEventListener("keydown", start, true);
    };
  }, [gameState.pendingSummitVote, gameState.regions]);

  useEffect(() => {
    const p = prev.current;
    if (dashboardOpen && !p.dashboardOpen) playSound("open-panel");
    if (!dashboardOpen && p.dashboardOpen) playSound("close-panel");
    if (buildPanelOpen && !p.buildPanelOpen) playSound("open-panel");
    if (!buildPanelOpen && p.buildPanelOpen) playSound("close-panel");
    if (comparisonOpen && !p.comparisonOpen) playSound("open-panel");
    if (!comparisonOpen && p.comparisonOpen) playSound("close-panel");
    if (dashboardOpen && dashboardTab !== p.dashboardTab) playSound("tab-switch");
    p.dashboardOpen = dashboardOpen;
    p.buildPanelOpen = buildPanelOpen;
    p.comparisonOpen = comparisonOpen;
    p.dashboardTab = dashboardTab;
  }, [dashboardOpen, buildPanelOpen, comparisonOpen, dashboardTab]);

  useEffect(() => {
    if (gameState.cycle > prev.current.cycle) {
      playSound("cycle-complete");
      prev.current.cycle = gameState.cycle;
    }
  }, [gameState.cycle]);

  useEffect(() => {
    const pendingCycle = gameState.pendingSummitVote?.cycle ?? null;
    if (pendingCycle !== null && pendingCycle !== prev.current.pendingSummit) {
      playSound("summit-gavel");
    }
    prev.current.pendingSummit = pendingCycle;
  }, [gameState.pendingSummitVote]);

  useEffect(() => {
    const temp = gameState.globalTemperature;
    const prevTemp = prev.current.globalTemp;
    for (const milestone of TEMP_MILESTONES) {
      if (prevTemp < milestone && temp >= milestone) {
        playSound("temp-milestone");
        break;
      }
    }
    prev.current.globalTemp = temp;
  }, [gameState.globalTemperature]);

  useEffect(() => {
    for (const id of ALL_COUNTRIES) {
      const h = gameState.regions[id].happiness;
      const wasCrisis = prev.current.crisisCountries.has(id);
      const isCrisis = h < 30;
      if (isCrisis && !wasCrisis) playSound("crisis");
      if (isCrisis) prev.current.crisisCountries.add(id);
      else prev.current.crisisCountries.delete(id);
    }
  }, [gameState.regions]);

  useEffect(() => {
    checkResourceWarnings(gameState.regions, viewCountry, prev.current.resourceWarnKeys);
  }, [gameState.regions, viewCountry]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const btn = target.closest("button, .overlay-btn, .tab-btn, .tier-option, .build-type-row");
      if (!btn) return;
      if (btn.closest(".audio-settings")) return;
      AudioManager.getInstance().unlockFromGesture("ui-click");
      playSound("click");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
