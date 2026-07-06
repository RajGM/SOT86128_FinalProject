import type { CountryId } from "../types/hex";
import { COUNTRY_CONFIGS } from "../types/hex";
import type { GameState, PlacedBuilding, SummitVoteRecord, TradeItem } from "../types/game";
import { REGION_PROFILES } from "../config/regionProfiles";

const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS) as CountryId[];

const ENERGY_TYPES = new Set(["green_plant", "nuclear_plant", "fossil_plant"]);
const GREEN_TYPES = new Set(["green_plant", "nuclear_plant"]);

/** Developing recipients for climate finance (starting money < 40). */
export const DEVELOPING_RECIPIENTS: CountryId[] = ["india", "latam", "africa"];

export type PioneerStatus = "pioneer" | "middle" | "laggard";

export type ComparisonMetricKey =
  | "co2PerCapita"
  | "greenRatio"
  | "carbonTax"
  | "co2Trend"
  | "summitVotes"
  | "climateFinance";

export interface MetricGaps {
  co2PerCapita: number;
  greenRatio: number;
  carbonTax: number;
  co2Trend: number;
  summitVotes: number;
  climateFinance: number;
}

export interface MetricRawValues {
  co2PerCapita: number;
  greenRatio: number;
  carbonTax: number;
  co2Trend: number;
  summitVotes: number;
  climateFinance: number;
}

export interface CountryComparisonRow {
  countryId: CountryId;
  name: string;
  color: string;
  raw: MetricRawValues;
  gaps: MetricGaps;
  compositeGap: number;
  rank: number;
  status: PioneerStatus;
}

export const METRIC_HEADERS: Record<
  ComparisonMetricKey,
  { label: string; pioneerHint: string; sortKey: ComparisonMetricKey }
> = {
  co2PerCapita: { label: "CO₂/cap", pioneerHint: "lowest", sortKey: "co2PerCapita" },
  greenRatio: { label: "Green%", pioneerHint: "highest", sortKey: "greenRatio" },
  carbonTax: { label: "Tax", pioneerHint: "highest", sortKey: "carbonTax" },
  co2Trend: { label: "Trend", pioneerHint: "most negative", sortKey: "co2Trend" },
  summitVotes: { label: "Votes", pioneerHint: "highest yes%", sortKey: "summitVotes" },
  climateFinance: { label: "Finance", pioneerHint: "most given", sortKey: "climateFinance" },
};

function normalizeGap(value: number, best: number, worst: number, higherIsBetter: boolean): number {
  if (higherIsBetter) {
    const range = best - worst;
    if (range <= 0) return best === value ? 0 : 1;
    return (best - value) / range;
  }
  const range = worst - best;
  if (range <= 0) return best === value ? 0 : 1;
  return (value - best) / range;
}

function normalizeGapFromBest(value: number, best: number): number {
  if (best <= 0) return value <= 0 ? 0 : 1;
  return (best - value) / best;
}

export function computeCo2PerCapita(co2: number, population: number): number {
  return co2 / Math.max(population, 1);
}

export function countEnergyBuildings(
  buildings: PlacedBuilding[],
  countryId: CountryId
): { green: number; total: number } {
  let green = 0;
  let total = 0;
  for (const b of buildings) {
    if (b.countryId !== countryId || !ENERGY_TYPES.has(b.type)) continue;
    total += 1;
    if (GREEN_TYPES.has(b.type)) green += 1;
  }
  return { green, total };
}

export function computeSummitYesPercent(
  countryId: CountryId,
  summitVotes: SummitVoteRecord[],
  nonComplianceStrikes = 0
): number {
  let yesScore = 0;
  let total = 0;
  for (const record of summitVotes) {
    const vote = record.votes[countryId];
    if (!vote) continue;
    total += 1;
    if (vote === "yes") yesScore += 1;
    else if (vote === "abstain") yesScore += 0.5;
  }
  const base = total > 0 ? yesScore / total : 0;
  const penalty = Math.min(0.5, nonComplianceStrikes * 0.05);
  return Math.max(0, base - penalty);
}

export function isClimateFinanceTransfer(to: CountryId, item: TradeItem): boolean {
  return DEVELOPING_RECIPIENTS.includes(to) && (item === "money" || item === "technology");
}

export function climateFinanceAmount(item: TradeItem, amount: number): number {
  return amount;
}

export function computeCountryRawMetrics(
  state: GameState,
  countryId: CountryId
): MetricRawValues {
  const region = state.regions[countryId];
  const buildings = Object.values(state.tileBuildings ?? {});
  const { green, total } = countEnergyBuildings(buildings, countryId);
  const prevCo2 = state.previousCycleCo2?.[countryId] ?? region.co2;

  return {
    co2PerCapita: computeCo2PerCapita(region.co2, region.population),
    greenRatio: green / Math.max(total, 1),
    carbonTax: region.carbonTax,
    co2Trend: region.co2 - prevCo2,
    summitVotes: computeSummitYesPercent(
      countryId,
      state.summitVotes ?? [],
      state.summitNonComplianceStrikes?.[countryId] ?? 0
    ),
    climateFinance: state.climateFinanceGiven?.[countryId] ?? 0,
  };
}

export function computeAllCountryComparisons(state: GameState): CountryComparisonRow[] {
  const rawByCountry = {} as Record<CountryId, MetricRawValues>;
  for (const id of ALL_COUNTRIES) {
    rawByCountry[id] = computeCountryRawMetrics(state, id);
  }

  const co2PerCapValues = ALL_COUNTRIES.map((id) => rawByCountry[id].co2PerCapita);
  const greenValues = ALL_COUNTRIES.map((id) => rawByCountry[id].greenRatio);
  const taxValues = ALL_COUNTRIES.map((id) => rawByCountry[id].carbonTax);
  const trendValues = ALL_COUNTRIES.map((id) => rawByCountry[id].co2Trend);
  const voteValues = ALL_COUNTRIES.map((id) => rawByCountry[id].summitVotes);
  const financeValues = ALL_COUNTRIES.map((id) => rawByCountry[id].climateFinance);

  const co2Best = Math.min(...co2PerCapValues);
  const co2Worst = Math.max(...co2PerCapValues);
  const greenBest = Math.max(...greenValues);
  const greenWorst = Math.min(...greenValues);
  const taxBest = Math.max(...taxValues);
  const trendBest = Math.min(...trendValues);
  const trendWorst = Math.max(...trendValues);
  const voteBest = Math.max(...voteValues);
  const voteWorst = Math.min(...voteValues);
  const financeBest = Math.max(...financeValues);

  const rows: CountryComparisonRow[] = ALL_COUNTRIES.map((id) => {
    const raw = rawByCountry[id];
    const gaps: MetricGaps = {
      co2PerCapita: normalizeGap(raw.co2PerCapita, co2Best, co2Worst, false),
      greenRatio: normalizeGap(raw.greenRatio, greenBest, greenWorst, true),
      carbonTax: normalizeGapFromBest(raw.carbonTax, taxBest),
      co2Trend: normalizeGap(raw.co2Trend, trendBest, trendWorst, false),
      summitVotes: normalizeGap(raw.summitVotes, voteBest, voteWorst, true),
      climateFinance: normalizeGapFromBest(raw.climateFinance, financeBest),
    };
    const compositeGap =
      (gaps.co2PerCapita +
        gaps.greenRatio +
        gaps.carbonTax +
        gaps.co2Trend +
        gaps.summitVotes +
        gaps.climateFinance) /
      6;

    return {
      countryId: id,
      name: COUNTRY_CONFIGS[id].name,
      color: COUNTRY_CONFIGS[id].color,
      raw,
      gaps,
      compositeGap,
      rank: 0,
      status: "middle" as PioneerStatus,
    };
  });

  rows.sort((a, b) => a.compositeGap - b.compositeGap);
  rows.forEach((row, index) => {
    row.rank = index + 1;
    if (index < 2) row.status = "pioneer";
    else if (index >= rows.length - 2) row.status = "laggard";
    else row.status = "middle";
  });

  return rows;
}

export function getCurrentPioneer(rows: CountryComparisonRow[]): CountryComparisonRow {
  return rows[0] ?? rows.find((r) => r.status === "pioneer")!;
}

export function appendGapHistory(
  history: Partial<Record<CountryId, { cycle: number; gap: number }[]>>,
  cycle: number,
  rows: CountryComparisonRow[]
): Partial<Record<CountryId, { cycle: number; gap: number }[]>> {
  const next = { ...history };
  for (const row of rows) {
    const existing = next[row.countryId] ?? [];
    const last = existing[existing.length - 1];
    if (last?.cycle === cycle) {
      next[row.countryId] = [...existing.slice(0, -1), { cycle, gap: row.compositeGap }];
    } else {
      next[row.countryId] = [...existing, { cycle, gap: row.compositeGap }];
    }
  }
  return next;
}

export function appendHappinessHistory(
  history: Partial<Record<CountryId, { cycle: number; happiness: number }[]>>,
  cycle: number,
  state: GameState
): Partial<Record<CountryId, { cycle: number; happiness: number }[]>> {
  const next = { ...history };
  for (const id of ALL_COUNTRIES) {
    const existing = next[id] ?? [];
    const point = { cycle, happiness: Math.round(state.regions[id].happiness) };
    const last = existing[existing.length - 1];
    if (last?.cycle === cycle) {
      next[id] = [...existing.slice(0, -1), point];
    } else {
      next[id] = [...existing, point];
    }
  }
  return next;
}

export function updatePeakGreenTracking(
  peakRatios: Partial<Record<CountryId, number>>,
  peakCycles: Partial<Record<CountryId, number>>,
  cycle: number,
  state: GameState
): {
  peakGreenRatio: Partial<Record<CountryId, number>>;
  peakGreenRatioCycle: Partial<Record<CountryId, number>>;
} {
  const buildings = Object.values(state.tileBuildings);
  const nextRatios = { ...peakRatios };
  const nextCycles = { ...peakCycles };
  for (const id of ALL_COUNTRIES) {
    const { green, total } = countEnergyBuildings(buildings, id);
    const ratio = green / Math.max(total, 1);
    const prevPeak = nextRatios[id] ?? -1;
    if (ratio > prevPeak) {
      nextRatios[id] = ratio;
      nextCycles[id] = cycle;
    }
  }
  return { peakGreenRatio: nextRatios, peakGreenRatioCycle: nextCycles };
}

/** Display score 0–100 from composite gap (victoryConditions.md). */
export function displayScoreFromGap(compositeGap: number): number {
  return Math.round((1 - compositeGap) * 100);
}

/** Gap-based cell color: green (pioneer) → yellow → red (laggard). */
export function gapCellColor(gap: number): string {
  const g = Math.max(0, Math.min(1, gap));
  if (g <= 0.33) {
    const t = g / 0.33;
    const r = Math.round(34 + t * (234 - 34));
    const gb = Math.round(197 + t * (179 - 197));
    return `rgb(${r}, ${gb}, 40)`;
  }
  if (g <= 0.66) {
    const t = (g - 0.33) / 0.33;
    const r = Math.round(234 + t * (249 - 234));
    const gVal = Math.round(179 + t * (115 - 179));
    return `rgb(${r}, ${gVal}, 22)`;
  }
  const t = (g - 0.66) / 0.34;
  const r = Math.round(249 + t * (239 - 249));
  const gVal = Math.round(115 + t * (68 - 115));
  const b = Math.round(22 + t * (68 - 22));
  return `rgb(${r}, ${gVal}, ${b})`;
}

export function statusLabel(status: PioneerStatus): string {
  if (status === "pioneer") return "🟢 Pioneer";
  if (status === "laggard") return "🔴 Laggard";
  return "Middle";
}

export function getStartingMoney(countryId: CountryId): number {
  return REGION_PROFILES[countryId].startingResources.money;
}
