import type { CountryId } from "../types/hex";
import { COUNTRY_CONFIGS } from "../types/hex";
import type {
  ComplianceResult,
  CycleTradeOffer,
  GameState,
  PendingSummitVote,
  RegionState,
  SummitBoundaryType,
  SummitResolution,
  SummitVoteChoice,
  TradeItem,
} from "../types/game";
import { computeAllCountryComparisons, DEVELOPING_RECIPIENTS, getStartingMoney } from "./comparisonMetrics";
import { calculateTaxCollected } from "./carbonTaxMechanics";
import { computePerCapitaConsumption } from "./populationMechanics";

const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS) as CountryId[];

export const SUMMIT_VOTE_DURATION_MS = 30_000;

export type BotStrategy =
  | "fossil_maximiser"
  | "green_pioneer"
  | "pragmatic_balancer"
  | "development_first";

export const BOT_STRATEGY_BY_COUNTRY: Record<CountryId, BotStrategy> = {
  opec: "fossil_maximiser",
  russia: "fossil_maximiser",
  eu: "green_pioneer",
  latam: "green_pioneer",
  usa: "pragmatic_balancer",
  china: "pragmatic_balancer",
  india: "development_first",
  africa: "development_first",
};

export interface BoundaryBreachResult {
  boundaryType: SummitBoundaryType;
  severityLevel: number;
  threshold: number;
  reductionPercent?: number;
  resolutionText: string;
  targetCountries: CountryId[] | "all";
}

function foodCyclesRemaining(region: RegionState): number {
  const drain = computePerCapitaConsumption(region.population).food;
  if (drain <= 0) return Infinity;
  return region.food / drain;
}

function energyCyclesRemaining(region: RegionState): number {
  const drain = computePerCapitaConsumption(region.population).energy;
  if (drain <= 0) return Infinity;
  return region.energy / drain;
}

function hasNegativeResourceBalance(region: RegionState): boolean {
  const drain = computePerCapitaConsumption(region.population);
  return region.food < drain.food || region.energy < drain.energy;
}

function getTopEmittersByCycleCo2(
  cycleCo2ByCountry: Partial<Record<CountryId, number>>,
  count: number
): CountryId[] {
  return [...ALL_COUNTRIES]
    .sort((a, b) => (cycleCo2ByCountry[b] ?? 0) - (cycleCo2ByCountry[a] ?? 0))
    .slice(0, count);
}

function countriesAboveGlobalPerCapitaCo2(
  regions: Record<CountryId, RegionState>
): CountryId[] {
  const totalCo2 = ALL_COUNTRIES.reduce((s, id) => s + regions[id].co2, 0);
  const totalPop = ALL_COUNTRIES.reduce((s, id) => s + regions[id].population, 0);
  const globalAvg = totalCo2 / Math.max(totalPop, 1);
  return ALL_COUNTRIES.filter((id) => {
    const r = regions[id];
    return r.co2 / Math.max(r.population, 1) > globalAvg;
  });
}

function getCrisisCountries(regions: Record<CountryId, RegionState>): CountryId[] {
  return ALL_COUNTRIES.filter((id) => regions[id].happiness < 30);
}

export function isCeilingResolution(boundaryType: SummitBoundaryType): boolean {
  return boundaryType === "temperature" || boundaryType === "co2_concentration";
}

export function checkBoundariesInOrder(ctx: {
  regions: Record<CountryId, RegionState>;
  globalTemperature: number;
  globalCo2ThisCycle: number;
  worldHappiness: number;
  cycle: number;
  climateFinanceGiven: Partial<Record<CountryId, number>>;
  peakGlobalPopulation: number;
  currentGlobalPopulation: number;
  cycleCo2ByCountry: Partial<Record<CountryId, number>>;
}): BoundaryBreachResult | null {
  const {
    regions,
    globalTemperature,
    globalCo2ThisCycle,
    worldHappiness,
    cycle,
    climateFinanceGiven,
    peakGlobalPopulation,
    currentGlobalPopulation,
    cycleCo2ByCountry,
  } = ctx;

  // Boundary 1: Temperature
  if (globalTemperature >= 2.5) {
    return {
      boundaryType: "temperature",
      severityLevel: 3,
      threshold: 60,
      resolutionText: "All countries must set carbon tax ≥ 60",
      targetCountries: "all",
    };
  }
  if (globalTemperature >= 2.0) {
    return {
      boundaryType: "temperature",
      severityLevel: 2,
      threshold: 40,
      resolutionText: "All countries must set carbon tax ≥ 40",
      targetCountries: "all",
    };
  }
  if (globalTemperature >= 1.5) {
    return {
      boundaryType: "temperature",
      severityLevel: 1,
      threshold: 20,
      resolutionText: "All countries must set carbon tax ≥ 20",
      targetCountries: "all",
    };
  }

  // Boundary 2: CO₂ concentration (global flow per cycle)
  if (globalCo2ThisCycle >= 600) {
    return {
      boundaryType: "co2_concentration",
      severityLevel: 3,
      threshold: 15,
      reductionPercent: 15,
      resolutionText:
        "All countries above global per-capita CO₂ average must reduce national CO₂ by 15% within 3 cycles",
      targetCountries: countriesAboveGlobalPerCapitaCo2(regions),
    };
  }
  if (globalCo2ThisCycle >= 400) {
    return {
      boundaryType: "co2_concentration",
      severityLevel: 2,
      threshold: 20,
      reductionPercent: 20,
      resolutionText: "Top 3 emitters must reduce national CO₂ by 20% within 3 cycles",
      targetCountries: getTopEmittersByCycleCo2(cycleCo2ByCountry, 3),
    };
  }
  if (globalCo2ThisCycle >= 200) {
    return {
      boundaryType: "co2_concentration",
      severityLevel: 1,
      threshold: 10,
      reductionPercent: 10,
      resolutionText: "Top 3 emitters must reduce national CO₂ by 10% within 3 cycles",
      targetCountries: getTopEmittersByCycleCo2(cycleCo2ByCountry, 3),
    };
  }

  // Boundary 3: Human development
  const humanDevTriggers: string[] = [];
  for (const id of ALL_COUNTRIES) {
    const r = regions[id];
    if (foodCyclesRemaining(r) < 5) humanDevTriggers.push(`${id}:food`);
    if (energyCyclesRemaining(r) < 5) humanDevTriggers.push(`${id}:energy`);
    if (r.money < 10) humanDevTriggers.push(`${id}:money`);
  }
  const deficitCount = ALL_COUNTRIES.filter((id) => hasNegativeResourceBalance(regions[id])).length;
  if (deficitCount >= 3) humanDevTriggers.push("systemic:deficit");

  if (humanDevTriggers.length > 0) {
    const highSeverity = humanDevTriggers.length >= 2;
    return {
      boundaryType: "human_development",
      severityLevel: highSeverity ? 2 : 1,
      threshold: highSeverity ? 150 : 100,
      resolutionText: highSeverity
        ? "Countries with food > 150 OR energy > 150 must create at least one trade offer at 0.5:1 money ratio (subsidised) to a deficit country this cycle"
        : "Countries with food > 100 OR energy > 100 must create at least one trade offer of surplus resource to a deficit country at 1:1 money ratio this cycle",
      targetCountries: "all",
    };
  }

  // Boundary 4: Inequality
  const inequalityTriggers: string[] = [];
  const monies = ALL_COUNTRIES.map((id) => regions[id].money);
  const richest = Math.max(...monies);
  const poorest = Math.min(...monies);
  if (poorest > 0 && richest > poorest * 4) inequalityTriggers.push("wealth_gap");

  const techs = ALL_COUNTRIES.map((id) => regions[id].technology);
  const highestTech = Math.max(...techs);
  const lowestTech = Math.min(...techs);
  if (lowestTech > 0 && highestTech > lowestTech * 3) inequalityTriggers.push("tech_gap");

  const rows = computeAllCountryComparisons({
    regions,
    tileBuildings: {},
    tradeAgreements: [],
    transportRoutes: [],
    transitAgreements: [],
    transitRequests: [],
    highlightedRoutes: [],
    transportCapacityUsed: {},
    breakthroughProposal: null,
    combinedProjects: [],
    researchLicenses: [],
    worldHappiness,
    globalTemperature,
    cycle,
    testingMode: true,
    cycleStartCo2: {},
    cycleStartCarbonTax: {},
    previousCycleCo2: {},
    summitVotes: [],
    climateFinanceGiven,
    gapScoreHistory: {},
    lastFactionTempThreshold: 0,
    factionCycleEvents: {},
    relationEvents: [],
    tradePartners: {},
    relationAlerts: [],
    climateFinanceThisCycle: {},
    activeSummitResolutions: [],
    summitHistory: [],
    pendingSummitVote: null,
    summitComplianceResults: [],
    summitComplianceAlerts: [],
    peakGlobalPopulation,
    cycleTradeOffers: [],
    cycleCompletedTransfers: [],
    tradeRestrictionSuspensionUntil: 0,
    summitNonComplianceStrikes: {},
  } as GameState);
  const pioneer = rows.find((r) => r.rank === 1);
  const laggard = rows.find((r) => r.rank === 8);
  if (pioneer && laggard && laggard.compositeGap - pioneer.compositeGap > 0.7) {
    inequalityTriggers.push("pioneer_gap");
  }

  if (cycle > 10) {
    for (const dev of DEVELOPING_RECIPIENTS) {
      if (getStartingMoney(dev) < 40 && (climateFinanceGiven[dev] ?? 0) === 0) {
        inequalityTriggers.push("climate_finance_failure");
        break;
      }
    }
  }

  if (inequalityTriggers.length > 0) {
    const highSeverity = inequalityTriggers.length >= 2;
    return {
      boundaryType: "inequality",
      severityLevel: highSeverity ? 2 : 1,
      threshold: highSeverity ? 15 : 10,
      resolutionText: highSeverity
        ? "Countries with money > 60 must contribute 15 money OR 8 technology to countries with money < 30 or tech < 20. Contributions count toward climate finance."
        : "Countries with money > 60 must contribute 10 money OR 5 technology to countries with money < 30 or tech < 20.",
      targetCountries: "all",
    };
  }

  // Boundary 5: Political stability
  const stabilityTriggers: string[] = [];
  if (worldHappiness < 55) stabilityTriggers.push("avg_happiness");
  const concernedCount = ALL_COUNTRIES.filter((id) => regions[id].happiness < 50).length;
  if (concernedCount >= 3) stabilityTriggers.push("widespread_discontent");
  const crisisCountries = getCrisisCountries(regions);
  if (crisisCountries.length > 0) stabilityTriggers.push("crisis");
  if (
    peakGlobalPopulation > 0 &&
    currentGlobalPopulation < peakGlobalPopulation * 0.9
  ) {
    stabilityTriggers.push("population_decline");
  }

  if (stabilityTriggers.length > 0) {
    const hasCrisis = crisisCountries.length > 0;
    return {
      boundaryType: "political_stability",
      severityLevel: hasCrisis ? 2 : 1,
      threshold: 10,
      resolutionText: hasCrisis
        ? "Countries with happiness > 60 must contribute 10 money to each crisis country. Trade restrictions suspended for 3 cycles."
        : "All active trade restrictions (relations < 20 blocks) are suspended for 3 cycles. All countries must set carbon tax no higher than current level (freeze, not raise).",
      targetCountries: hasCrisis ? crisisCountries : "all",
    };
  }

  return null;
}

export function createPendingVote(
  breach: BoundaryBreachResult,
  cycle: number
): PendingSummitVote {
  return {
    cycle,
    boundaryType: breach.boundaryType,
    resolutionText: breach.resolutionText,
    threshold: breach.threshold,
    reductionPercent: breach.reductionPercent,
    severityLevel: breach.severityLevel,
    targetCountries: breach.targetCountries,
    votes: {},
    deadlineAt: Date.now() + SUMMIT_VOTE_DURATION_MS,
  };
}

function estimateTaxComplianceCost(region: RegionState, requiredTax: number): number {
  const gap = Math.max(0, requiredTax - region.carbonTax);
  if (gap <= 0) return 0;
  return calculateTaxCollected(region.co2, gap);
}

function countryHasSurplus(region: RegionState, threshold: number): boolean {
  return region.food > threshold || region.energy > threshold;
}

export function computeBotVote(
  countryId: CountryId,
  pending: PendingSummitVote,
  regions: Record<CountryId, RegionState>
): SummitVoteChoice {
  const strategy = BOT_STRATEGY_BY_COUNTRY[countryId];
  const ceiling = isCeilingResolution(pending.boundaryType);
  const region = regions[countryId];

  if (strategy === "fossil_maximiser") {
    if (ceiling) return "no";
    if (pending.boundaryType === "inequality" || pending.boundaryType === "human_development") {
      return region.money > 60 || region.food > 100 || region.energy > 100 ? "no" : "yes";
    }
    if (pending.boundaryType === "political_stability") {
      return region.happiness > 60 ? "no" : "yes";
    }
    return "no";
  }

  if (strategy === "green_pioneer") return "yes";

  if (strategy === "development_first") {
    if (pending.boundaryType === "inequality" || pending.boundaryType === "human_development") {
      return "yes";
    }
    if (ceiling) {
      return estimateTaxComplianceCost(region, pending.threshold) < 25 ? "yes" : "no";
    }
    return region.happiness < 50 ? "yes" : "abstain";
  }

  // pragmatic_balancer
  if (ceiling) {
    const cost = estimateTaxComplianceCost(region, pending.threshold);
    return cost < 20 ? "yes" : "no";
  }
  if (pending.boundaryType === "human_development" || pending.boundaryType === "inequality") {
    const isContributor =
      region.money > 60 || region.food > pending.threshold || region.energy > pending.threshold;
    if (!isContributor) return "yes";
    return countryHasSurplus(region, pending.threshold) ? "no" : "yes";
  }
  if (pending.boundaryType === "political_stability") {
    return region.happiness > 60 ? "no" : "yes";
  }
  return "abstain";
}

export function tallySummitVote(
  votes: Partial<Record<CountryId, SummitVoteChoice>>
): { passed: boolean; yesCount: number; noCount: number; abstainCount: number } {
  let yesCount = 0;
  let noCount = 0;
  let abstainCount = 0;
  for (const id of ALL_COUNTRIES) {
    const v = votes[id] ?? "abstain";
    if (v === "yes") yesCount++;
    else if (v === "no") noCount++;
    else abstainCount++;
  }
  const nonAbstain = yesCount + noCount;
  const requiredYes = nonAbstain > 0 ? Math.floor(nonAbstain / 2) + 1 : 5;
  const passed = yesCount > noCount && yesCount >= requiredYes;
  return { passed, yesCount, noCount, abstainCount };
}

export function activateResolution(
  pending: PendingSummitVote,
  passed: boolean,
  regions: Record<CountryId, RegionState>,
  cycle: number
): SummitResolution {
  const id = `summit-${cycle}-${pending.boundaryType}-${Date.now()}`;
  const baselineCo2: Partial<Record<CountryId, number>> = {};
  let targets: CountryId[] =
    pending.targetCountries === "all" ? [...ALL_COUNTRIES] : [...pending.targetCountries];

  if (pending.boundaryType === "co2_concentration") {
    for (const t of targets) {
      baselineCo2[t] = regions[t].co2;
    }
  }

  const carbonTaxCeilingAtPassage: Partial<Record<CountryId, number>> = {};
  if (pending.boundaryType === "political_stability" && pending.severityLevel === 1) {
    for (const id of ALL_COUNTRIES) {
      carbonTaxCeilingAtPassage[id] = regions[id].carbonTax;
    }
  }

  return {
    id,
    cycle,
    boundaryType: pending.boundaryType,
    resolutionText: pending.resolutionText,
    threshold: pending.threshold,
    reductionPercent: pending.reductionPercent,
    severityLevel: pending.severityLevel,
    targetCountries: targets,
    votes: { ...pending.votes },
    passed,
    baselineCo2: Object.keys(baselineCo2).length > 0 ? baselineCo2 : undefined,
    complianceDeadline:
      pending.boundaryType === "co2_concentration" ? cycle + 3 : undefined,
    carbonTaxCeilingAtPassage:
      Object.keys(carbonTaxCeilingAtPassage).length > 0
        ? carbonTaxCeilingAtPassage
        : undefined,
    tradeRestrictionsSuspendedUntil:
      pending.boundaryType === "political_stability" ? cycle + 3 : undefined,
    expiresOnSafe:
      pending.boundaryType === "human_development" ||
      pending.boundaryType === "inequality",
    active: passed,
  };
}

export function replaceSupersededResolutions(
  active: SummitResolution[],
  newResolution: SummitResolution
): SummitResolution[] {
  if (!newResolution.active) return active;
  let next = active.map((r) => {
    if (
      r.boundaryType === newResolution.boundaryType &&
      r.active &&
      newResolution.boundaryType === "temperature"
    ) {
      return { ...r, active: false };
    }
    return r;
  });
  if (newResolution.active) {
    next = [...next, newResolution];
  }
  return next;
}

function isDeficitCountry(region: RegionState): boolean {
  return (
    hasNegativeResourceBalance(region) ||
    foodCyclesRemaining(region) < 5 ||
    energyCyclesRemaining(region) < 5 ||
    region.money < 10
  );
}

function isPoorCountry(region: RegionState): boolean {
  return region.money < 30 || region.technology < 20;
}

function isRichCountry(region: RegionState): boolean {
  return region.money > 60;
}

function isWealthyStable(region: RegionState): boolean {
  return region.happiness > 60;
}

export function getResolutionTargets(
  resolution: SummitResolution,
  regions: Record<CountryId, RegionState>
): CountryId[] {
  if (resolution.boundaryType === "temperature") {
    return [...ALL_COUNTRIES];
  }
  if (resolution.boundaryType === "co2_concentration") {
    return resolution.targetCountries;
  }
  if (resolution.boundaryType === "human_development") {
    const surplusThreshold = resolution.threshold;
    return ALL_COUNTRIES.filter((id) => {
      const r = regions[id];
      return r.food > surplusThreshold || r.energy > surplusThreshold;
    });
  }
  if (resolution.boundaryType === "inequality") {
    return ALL_COUNTRIES.filter((id) => isRichCountry(regions[id]));
  }
  if (resolution.boundaryType === "political_stability") {
    if (resolution.severityLevel && resolution.severityLevel >= 2) {
      return ALL_COUNTRIES.filter((id) => isWealthyStable(regions[id]));
    }
    return [...ALL_COUNTRIES];
  }
  return resolution.targetCountries;
}

export function checkResolutionCompliance(
  resolution: SummitResolution,
  countryId: CountryId,
  regions: Record<CountryId, RegionState>,
  cycle: number,
  cycleTradeOffers: CycleTradeOffer[],
  cycleCompletedTransfers: GameState["cycleCompletedTransfers"]
): ComplianceResult {
  if (!resolution.active || !resolution.passed) {
    return {
      countryId,
      resolutionId: resolution.id,
      compliant: true,
      reason: "Resolution not active",
    };
  }

  const targets = getResolutionTargets(resolution, regions);
  if (!targets.includes(countryId) && resolution.boundaryType !== "political_stability") {
    return {
      countryId,
      resolutionId: resolution.id,
      compliant: true,
      reason: "Not a target country",
    };
  }

  const region = regions[countryId];

  if (resolution.boundaryType === "temperature") {
    const compliant = region.carbonTax >= resolution.threshold;
    return {
      countryId,
      resolutionId: resolution.id,
      compliant,
      reason: compliant
        ? `Tax rate ${region.carbonTax} ≥ required ${resolution.threshold}`
        : `Tax rate ${region.carbonTax} < required ${resolution.threshold}`,
    };
  }

  if (resolution.boundaryType === "co2_concentration") {
    const baseline = resolution.baselineCo2?.[countryId];
    if (baseline === undefined) {
      return {
        countryId,
        resolutionId: resolution.id,
        compliant: true,
        reason: "Not a CO₂ reduction target",
      };
    }
    const pct = (resolution.reductionPercent ?? resolution.threshold) / 100;
    const maxAllowed = baseline * (1 - pct);
    const compliant = region.co2 <= maxAllowed;
    const pastDeadline = resolution.complianceDeadline !== undefined && cycle > resolution.complianceDeadline;
    if (pastDeadline) {
      return {
        countryId,
        resolutionId: resolution.id,
        compliant,
        reason: compliant
          ? `CO₂ ${region.co2} ≤ target ${Math.round(maxAllowed)} (locked)`
          : `CO₂ ${region.co2} > target ${Math.round(maxAllowed)} (deadline passed)`,
      };
    }
    return {
      countryId,
      resolutionId: resolution.id,
      compliant,
      reason: compliant
        ? `CO₂ ${region.co2} ≤ interim target ${Math.round(maxAllowed)}`
        : `CO₂ ${region.co2} > interim target ${Math.round(maxAllowed)}`,
    };
  }

  if (resolution.boundaryType === "human_development") {
    const surplusThreshold = resolution.threshold;
    if (region.food <= surplusThreshold && region.energy <= surplusThreshold) {
      return {
        countryId,
        resolutionId: resolution.id,
        compliant: true,
        reason: "Not a surplus country",
      };
    }
    const deficitIds = ALL_COUNTRIES.filter((id) => isDeficitCountry(regions[id]));
    const offered = cycleTradeOffers.some(
      (o) =>
        o.from === countryId &&
        deficitIds.includes(o.to) &&
        (o.item === "food" || o.item === "energy")
    );
    return {
      countryId,
      resolutionId: resolution.id,
      compliant: offered,
      reason: offered
        ? `Created trade offer to deficit country`
        : `No outgoing food/energy offer to a deficit country`,
    };
  }

  if (resolution.boundaryType === "inequality") {
    if (!isRichCountry(region)) {
      return {
        countryId,
        resolutionId: resolution.id,
        compliant: true,
        reason: "Not a wealthy contributor",
      };
    }
    const minMoney = resolution.threshold;
    const minTech = resolution.severityLevel && resolution.severityLevel >= 2 ? 8 : 5;
    const transfer = cycleCompletedTransfers.find(
      (t) =>
        t.from === countryId &&
        isPoorCountry(regions[t.to]) &&
        ((t.item === "money" && t.amount >= minMoney) ||
          (t.item === "technology" && t.amount >= minTech))
    );
    return {
      countryId,
      resolutionId: resolution.id,
      compliant: !!transfer,
      reason: transfer
        ? `Sent ${transfer.amount} ${transfer.item} to ${COUNTRY_CONFIGS[transfer.to].name}`
        : `No qualifying transfer (${minMoney} money or ${minTech} tech to poor country)`,
    };
  }

  if (resolution.boundaryType === "political_stability") {
    if (resolution.severityLevel && resolution.severityLevel >= 2) {
      if (!isWealthyStable(region)) {
        return {
          countryId,
          resolutionId: resolution.id,
          compliant: true,
          reason: "Not a wealthy stable contributor",
        };
      }
      const crisisIds = getCrisisCountries(regions);
      const allMet = crisisIds.every((crisisId) =>
        cycleCompletedTransfers.some(
          (t) => t.from === countryId && t.to === crisisId && t.item === "money" && t.amount >= 10
        )
      );
      return {
        countryId,
        resolutionId: resolution.id,
        compliant: allMet,
        reason: allMet
          ? `Contributed 10 money to each crisis country`
          : `Missing 10 money contribution to crisis country`,
      };
    }
    const ceiling = resolution.carbonTaxCeilingAtPassage?.[countryId];
    if (ceiling !== undefined && region.carbonTax > ceiling) {
      return {
        countryId,
        resolutionId: resolution.id,
        compliant: false,
        reason: `Carbon tax ${region.carbonTax} exceeds freeze at ${ceiling}`,
      };
    }
    return {
      countryId,
      resolutionId: resolution.id,
      compliant: true,
      reason: "Trade suspension is mechanical; carbon tax within freeze",
    };
  }

  return {
    countryId,
    resolutionId: resolution.id,
    compliant: true,
    reason: "Unknown resolution type",
  };
}

export function shouldExpireResolution(
  resolution: SummitResolution,
  regions: Record<CountryId, RegionState>,
  cycle: number,
  worldHappiness: number,
  peakGlobalPopulation: number,
  currentGlobalPopulation: number,
  climateFinanceGiven: Partial<Record<CountryId, number>>
): boolean {
  if (!resolution.active) return false;

  if (resolution.boundaryType === "co2_concentration") {
    return resolution.complianceDeadline !== undefined && cycle > resolution.complianceDeadline;
  }

  if (resolution.boundaryType === "political_stability") {
    return (
      resolution.tradeRestrictionsSuspendedUntil !== undefined &&
      cycle > resolution.tradeRestrictionsSuspendedUntil
    );
  }

  if (resolution.boundaryType === "human_development") {
    const anyTrigger =
      ALL_COUNTRIES.some(
        (id) =>
          foodCyclesRemaining(regions[id]) < 5 ||
          energyCyclesRemaining(regions[id]) < 5 ||
          regions[id].money < 10
      ) ||
      ALL_COUNTRIES.filter((id) => hasNegativeResourceBalance(regions[id])).length >= 3;
    return !anyTrigger;
  }

  if (resolution.boundaryType === "inequality") {
    return !inequalityStillBreached(regions, climateFinanceGiven, cycle);
  }

  void worldHappiness;
  void peakGlobalPopulation;
  void currentGlobalPopulation;
  void climateFinanceGiven;
  return false;
}

export function getCarbonTaxFloor(state: GameState, countryId: CountryId): number {
  let floor = 0;
  for (const r of state.activeSummitResolutions) {
    if (!r.active || !r.passed || r.boundaryType !== "temperature") continue;
    floor = Math.max(floor, r.threshold);
  }
  void countryId;
  return floor;
}

export function getCarbonTaxCeiling(state: GameState, countryId: CountryId): number | null {
  for (const r of state.activeSummitResolutions) {
    if (!r.active || !r.passed || r.boundaryType !== "political_stability") continue;
    if (r.severityLevel && r.severityLevel >= 2) continue;
    const ceiling = r.carbonTaxCeilingAtPassage?.[countryId];
    if (ceiling !== undefined) return ceiling;
  }
  return null;
}

export function isTradeRestrictionSuspended(state: GameState, cycle: number): boolean {
  return state.tradeRestrictionSuspensionUntil > cycle;
}

export function getYesVoters(resolution: SummitResolution): CountryId[] {
  return ALL_COUNTRIES.filter((id) => resolution.votes[id] === "yes");
}

export function humanDevelopmentStillBreached(
  regions: Record<CountryId, RegionState>
): boolean {
  if (ALL_COUNTRIES.some((id) => foodCyclesRemaining(regions[id]) < 5)) return true;
  if (ALL_COUNTRIES.some((id) => energyCyclesRemaining(regions[id]) < 5)) return true;
  if (ALL_COUNTRIES.some((id) => regions[id].money < 10)) return true;
  if (ALL_COUNTRIES.filter((id) => hasNegativeResourceBalance(regions[id])).length >= 3) {
    return true;
  }
  return false;
}

export function inequalityStillBreached(
  regions: Record<CountryId, RegionState>,
  climateFinanceGiven: Partial<Record<CountryId, number>>,
  cycle: number,
  comparisonRows?: ReturnType<typeof computeAllCountryComparisons>
): boolean {
  const monies = ALL_COUNTRIES.map((id) => regions[id].money);
  const richest = Math.max(...monies);
  const poorest = Math.min(...monies);
  if (poorest > 0 && richest > poorest * 4) return true;

  const techs = ALL_COUNTRIES.map((id) => regions[id].technology);
  if (Math.min(...techs) > 0 && Math.max(...techs) > Math.min(...techs) * 3) return true;

  if (comparisonRows) {
    const pioneer = comparisonRows.find((r) => r.rank === 1);
    const laggard = comparisonRows.find((r) => r.rank === 8);
    if (pioneer && laggard && laggard.compositeGap - pioneer.compositeGap > 0.7) return true;
  }

  if (cycle > 10) {
    for (const dev of DEVELOPING_RECIPIENTS) {
      if (getStartingMoney(dev) < 40 && (climateFinanceGiven[dev] ?? 0) === 0) return true;
    }
  }
  return false;
}

export function recordCompletedTransfer(
  transfers: GameState["cycleCompletedTransfers"],
  from: CountryId,
  to: CountryId,
  item: TradeItem,
  amount: number,
  cycle: number
): GameState["cycleCompletedTransfers"] {
  return [...transfers, { from, to, item, amount, cycle }];
}

export function recordTradeOffer(
  offers: CycleTradeOffer[],
  from: CountryId,
  to: CountryId,
  item: TradeItem,
  amount: number,
  cycle: number
): CycleTradeOffer[] {
  return [...offers, { from, to, item, amount, cycle }];
}
