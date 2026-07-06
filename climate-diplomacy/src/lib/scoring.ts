import type { CountryId } from "../types/hex";
import { COUNTRY_CONFIGS } from "../types/hex";
import type { GameState, PlacedBuilding } from "../types/game";
import type {
  HumanPlayerMeta,
  PlayerResult,
  PodiumAward,
  ScoreBadge,
  SpecialAward,
} from "../types/multiplayer";
import {
  computeAllCountryComparisons,
  computeSummitYesPercent,
  displayScoreFromGap,
} from "./comparisonMetrics";

const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS) as CountryId[];

const PODIUM_AWARDS: Exclude<PodiumAward, null>[] = [
  "climate_pioneer",
  "green_leader",
  "sustainable_achiever",
];

export const BADGE_LABELS: Record<ScoreBadge, string> = {
  pioneer: "Pioneer",
  progressive: "Progressive",
  laggard: "Laggard",
  blocker: "Climate Blocker",
};

export const BADGE_COLORS: Record<ScoreBadge, string> = {
  pioneer: "#22c55e",
  progressive: "#3b82f6",
  laggard: "#f97316",
  blocker: "#ef4444",
};

export const PODIUM_LABELS: Record<Exclude<PodiumAward, null>, string> = {
  climate_pioneer: "CLIMATE PIONEER",
  green_leader: "GREEN LEADER",
  sustainable_achiever: "SUSTAINABLE ACHIEVER",
};

export const PODIUM_MEDALS = ["🥇", "🥈", "🥉"] as const;

export function scoreBadgeFromDisplay(displayScore: number): ScoreBadge {
  if (displayScore >= 75) return "pioneer";
  if (displayScore >= 50) return "progressive";
  if (displayScore >= 25) return "laggard";
  return "blocker";
}

function countFossilPlants(buildings: PlacedBuilding[], countryId: CountryId): number {
  return buildings.filter((b) => b.countryId === countryId && b.type === "fossil_plant").length;
}

function tieBreakCompare(a: PlayerResult, b: PlayerResult, gameState: GameState): number {
  const co2Cmp = a.raw.co2PerCapita - b.raw.co2PerCapita;
  if (co2Cmp !== 0) return co2Cmp;
  const happyCmp = b.finalHappiness - a.finalHappiness;
  if (happyCmp !== 0) return happyCmp;
  const aPeak = gameState.peakGreenRatioCycle[a.country] ?? Infinity;
  const bPeak = gameState.peakGreenRatioCycle[b.country] ?? Infinity;
  return aPeak - bPeak;
}

function uniqueWinner<T extends CountryId>(
  scores: { countryId: T; value: number }[],
  higherIsBetter: boolean
): T | null {
  if (scores.length === 0) return null;
  const sorted = [...scores].sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value
  );
  const best = sorted[0]!.value;
  const winners = sorted.filter((s) => s.value === best);
  return winners.length === 1 ? winners[0]!.countryId : null;
}

export function buildPlayerResults(
  gameState: GameState,
  humanPlayers: Record<string, HumanPlayerMeta>
): PlayerResult[] {
  const rows = computeAllCountryComparisons(gameState);
  const countryToPlayer = new Map<CountryId, { name: string; isBot: boolean }>();

  for (const meta of Object.values(humanPlayers)) {
    countryToPlayer.set(meta.country, {
      name: meta.name,
      isBot: !meta.connected || meta.exited === true,
    });
  }

  const results: PlayerResult[] = rows.map((row) => {
    const region = gameState.regions[row.countryId];
    const player = countryToPlayer.get(row.countryId);
    const displayScore = displayScoreFromGap(row.compositeGap);
    return {
      country: row.countryId,
      playerName: player?.name ?? "(bot)",
      isBot: player?.isBot ?? true,
      displayScore,
      compositeGap: row.compositeGap,
      rank: 0,
      badge: scoreBadgeFromDisplay(displayScore),
      podiumAward: null,
      raw: row.raw,
      gaps: row.gaps,
      finalMoney: Math.round(region.money),
      finalHappiness: Math.round(region.happiness),
      finalPopulation: Math.round(region.population),
      totalCo2: Math.round(region.co2),
      finalTechnology: Math.round(region.technology),
    };
  });

  results.sort((a, b) => {
    if (b.displayScore !== a.displayScore) return b.displayScore - a.displayScore;
    return tieBreakCompare(a, b, gameState);
  });

  results.forEach((r, i) => {
    r.rank = i + 1;
    if (i < 3) r.podiumAward = PODIUM_AWARDS[i]!;
  });

  return results;
}

export function computeSpecialAwards(
  gameState: GameState,
  results: PlayerResult[]
): SpecialAward[] {
  const awards: SpecialAward[] = [];
  const buildings = Object.values(gameState.tileBuildings);

  const gapHistories = ALL_COUNTRIES.map((id) => {
    const pts = gameState.gapScoreHistory[id] ?? [];
    if (pts.length < 2) return { countryId: id, improvement: 0, firstHalf: 0, secondHalf: 0 };
    const mid = Math.ceil(pts.length / 2);
    const firstHalf = pts.slice(0, mid);
    const secondHalf = pts.slice(mid);
    const avgFirst =
      firstHalf.reduce((s, p) => s + p.gap, 0) / Math.max(firstHalf.length, 1);
    const avgSecond =
      secondHalf.reduce((s, p) => s + p.gap, 0) / Math.max(secondHalf.length, 1);
    return {
      countryId: id,
      improvement: avgFirst - avgSecond,
      firstHalf: avgFirst,
      secondHalf: avgSecond,
    };
  });
  const turnaroundWinner = uniqueWinner(
    gapHistories.map((g) => ({ countryId: g.countryId, value: g.improvement })),
    true
  );
  if (turnaroundWinner && gapHistories.find((g) => g.countryId === turnaroundWinner)!.improvement > 0) {
    const g = gapHistories.find((x) => x.countryId === turnaroundWinner)!;
    const firstScore = displayScoreFromGap(g.firstHalf);
    const secondScore = displayScoreFromGap(g.secondHalf);
    awards.push({
      id: "turnaround",
      emoji: "🔄",
      label: "Biggest Turnaround",
      countryId: turnaroundWinner,
      detail: `${COUNTRY_CONFIGS[turnaroundWinner].name} (gap improved ${firstScore} → ${secondScore})`,
    });
  }

  const diplomatScores = ALL_COUNTRIES.map((id) => ({
    countryId: id,
    value:
      computeSummitYesPercent(
        id,
        gameState.summitVotes,
        gameState.summitNonComplianceStrikes[id] ?? 0
      ) * 100 +
      (gameState.climateFinanceGiven[id] ?? 0),
  }));
  const diplomatWinner = uniqueWinner(diplomatScores, true);
  if (diplomatWinner) {
    const yesPct = computeSummitYesPercent(
      diplomatWinner,
      gameState.summitVotes,
      gameState.summitNonComplianceStrikes[diplomatWinner] ?? 0
    );
    const finance = gameState.climateFinanceGiven[diplomatWinner] ?? 0;
    if (yesPct > 0 || finance > 0) {
      awards.push({
        id: "diplomat",
        emoji: "🤝",
        label: "Climate Diplomat",
        countryId: diplomatWinner,
        detail: `${COUNTRY_CONFIGS[diplomatWinner].name} (${Math.round(yesPct * 100)}% YES votes, ${Math.round(finance)} finance)`,
      });
    }
  }

  const happinessAvgs = ALL_COUNTRIES.map((id) => {
    const pts = gameState.happinessHistory[id] ?? [];
    const avg =
      pts.length > 0
        ? pts.reduce((s, p) => s + p.happiness, 0) / pts.length
        : gameState.regions[id].happiness;
    return { countryId: id, value: avg };
  });
  const championWinner = uniqueWinner(happinessAvgs, true);
  if (championWinner) {
    const avg = happinessAvgs.find((h) => h.countryId === championWinner)!.value;
    awards.push({
      id: "champion",
      emoji: "😊",
      label: "People's Champion",
      countryId: championWinner,
      detail: `${COUNTRY_CONFIGS[championWinner].name} (avg happiness ${Math.round(avg)})`,
    });
  }

  const industrialistScores = results.map((r) => ({
    countryId: r.country,
    value: r.finalTechnology - r.raw.co2PerCapita * 10,
  }));
  const industrialistWinner = uniqueWinner(industrialistScores, true);
  if (industrialistWinner) {
    const r = results.find((x) => x.country === industrialistWinner)!;
    awards.push({
      id: "industrialist",
      emoji: "🏭",
      label: "Green Industrialist",
      countryId: industrialistWinner,
      detail: `${COUNTRY_CONFIGS[industrialistWinner].name} (tech ${r.finalTechnology}, CO₂/cap ${r.raw.co2PerCapita.toFixed(2)})`,
    });
  }

  const trapScores = ALL_COUNTRIES.map((id) => ({
    countryId: id,
    value: countFossilPlants(buildings, id) * 100 - gameState.regions[id].happiness,
  }));
  const trapWinner = uniqueWinner(trapScores, true);
  if (trapWinner) {
    const fossils = countFossilPlants(buildings, trapWinner);
    const happy = gameState.regions[trapWinner].happiness;
    if (fossils >= 2 && happy < 50) {
      awards.push({
        id: "trap",
        emoji: "⛽",
        label: "Fossil Trap Victim",
        countryId: trapWinner,
        detail: `${COUNTRY_CONFIGS[trapWinner].name} (${fossils} fossil plants, happiness ${Math.round(happy)})`,
      });
    }
  }

  return awards.slice(0, 3);
}

export function votesNeededToPass(humanCount: number): number {
  if (humanCount <= 1) return 1;
  return Math.floor(humanCount / 2) + 1;
}

export const VOTE_COOLDOWN_MS = 7 * 60 * 1000;
export const VOTE_DURATION_MS = 60 * 1000;
export const STATS_VIEW_MS = 30 * 1000;
export const ARCHIVE_GRACE_MS = 3 * 60 * 1000;
export const ROOM_IDLE_MS = 30 * 60 * 1000;
