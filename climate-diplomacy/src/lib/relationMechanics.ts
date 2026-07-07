import type { CountryId } from "../types/hex";
import { COUNTRY_CONFIGS } from "../types/hex";
import type {
  GameState,
  PlacedBuilding,
  RegionState,
  RelationAlert,
  RelationEvent,
  RelationEventType,
  SummitVoteChoice,
  SummitVoteRecord,
  TradeAgreement,
  TradeItem,
  TransitAgreement,
} from "../types/game";
import { REGION_PROFILES } from "../config/regionProfiles";
import {
  DEVELOPING_RECIPIENTS,
  getStartingMoney,
  isClimateFinanceTransfer,
} from "./comparisonMetrics";
import { countFactionBuildings, computeFactionPercents } from "./factionMechanics";
import { computeTemperatureHappinessDelta } from "./populationMechanics";

const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS) as CountryId[];

export const RELATION_START = 50;
export const RELATION_TRANSIT_THRESHOLD = 30;
export const RELATION_TRADE_THRESHOLD = 20;
export const RELATION_FRIENDLY_THRESHOLD = 70;
export const RELATION_ALLIED_THRESHOLD = 80;

export const CLIMATE_FINANCE_RESOLUTION = "Climate Finance Pledge";

export const RELATION_EVENT_DELTAS: Record<RelationEventType, number> = {
  trade_completed: 3,
  continuous_trade: 1,
  trade_rejected: -2,
  trade_cancelled: -5,
  population_traded: 5,
  hub_upgrade_gifted: 8,
  technology_traded: 4,
  transit_approved: 3,
  transit_denied: -5,
  transit_fee_paid: 1,
  transit_cancelled: -6,
  summit_same_vote: 2,
  summit_opposite_vote: -3,
  summit_non_compliance: -4,
  top_emitter_damage: -1,
  co2_decreased: 1,
  climate_finance_given: 5,
  climate_finance_defaulted: -4,
};

export type RelationLabel =
  | "Allied"
  | "Friendly"
  | "Neutral"
  | "Strained"
  | "Hostile";

export function getRelationLabel(score: number): RelationLabel {
  if (score >= 80) return "Allied";
  if (score >= 60) return "Friendly";
  if (score >= 40) return "Neutral";
  if (score >= 20) return "Strained";
  return "Hostile";
}

export function getRelationColor(score: number): string {
  if (score >= 80) return "#15803d";
  if (score >= 60) return "#22c55e";
  if (score >= 40) return "#eab308";
  if (score >= 20) return "#f97316";
  return "#ef4444";
}

export const COUNTRY_SHORT_NAMES: Record<CountryId, string> = {
  usa: "USA",
  eu: "EU",
  russia: "RUS",
  china: "CHN",
  india: "IND",
  opec: "OPEC",
  latam: "LAT",
  africa: "AFR",
};

function clampRelation(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function getRelation(regions: Record<CountryId, RegionState>, from: CountryId, to: CountryId): number {
  return regions[from].relations[to] ?? RELATION_START;
}

function setRelation(
  regions: Record<CountryId, RegionState>,
  from: CountryId,
  to: CountryId,
  score: number
): Record<CountryId, RegionState> {
  const prev = getRelation(regions, from, to);
  const next = clampRelation(score);
  if (prev === next) return regions;
  return {
    ...regions,
    [from]: {
      ...regions[from],
      relations: { ...regions[from].relations, [to]: next },
    },
  };
}

let eventCounter = 0;

export function createRelationEvent(
  cycle: number,
  fromCountry: CountryId,
  toCountry: CountryId,
  event: RelationEventType,
  delta: number,
  description: string
): RelationEvent {
  eventCounter += 1;
  return {
    id: `rel-${cycle}-${eventCounter}-${Math.random().toString(36).slice(2, 6)}`,
    cycle,
    fromCountry,
    toCountry,
    event,
    delta,
    description,
  };
}

function detectThresholdAlerts(
  viewer: CountryId,
  other: CountryId,
  prevScore: number,
  nextScore: number
): RelationAlert[] {
  const alerts: RelationAlert[] = [];
  const otherName = COUNTRY_CONFIGS[other].name;

  if (prevScore >= RELATION_TRANSIT_THRESHOLD && nextScore < RELATION_TRANSIT_THRESHOLD) {
    alerts.push({
      id: `alert-${viewer}-${other}-30-${Date.now()}`,
      viewer,
      other,
      threshold: 30,
      direction: "below",
      message: `⚠️ Relations with ${otherName} critically low. Transit routes at risk.`,
    });
  }
  if (prevScore >= RELATION_TRADE_THRESHOLD && nextScore < RELATION_TRADE_THRESHOLD) {
    alerts.push({
      id: `alert-${viewer}-${other}-20-${Date.now()}`,
      viewer,
      other,
      threshold: 20,
      direction: "below",
      message: `🚫 Relations with ${otherName} hostile. New trade proposals will be auto-rejected.`,
    });
  }
  if (prevScore < RELATION_FRIENDLY_THRESHOLD && nextScore >= RELATION_FRIENDLY_THRESHOLD) {
    alerts.push({
      id: `alert-${viewer}-${other}-70-${Date.now()}`,
      viewer,
      other,
      threshold: 70,
      direction: "above",
      message: `🤝 Relations with ${otherName} friendly. Transit commissions reduced 50%.`,
    });
  }
  if (prevScore < RELATION_ALLIED_THRESHOLD && nextScore >= RELATION_ALLIED_THRESHOLD) {
    alerts.push({
      id: `alert-${viewer}-${other}-80-${Date.now()}`,
      viewer,
      other,
      threshold: 80,
      direction: "above",
      message: `⭐ Alliance with ${otherName}. Trade capacity costs halved.`,
    });
  }
  return alerts;
}

export interface RelationUpdateResult {
  regions: Record<CountryId, RegionState>;
  relationEvents: RelationEvent[];
  relationAlerts: RelationAlert[];
}

export function applyOneSidedRelation(
  regions: Record<CountryId, RegionState>,
  from: CountryId,
  to: CountryId,
  delta: number,
  event: RelationEventType,
  cycle: number,
  description: string,
  existingEvents: RelationEvent[] = [],
  existingAlerts: RelationAlert[] = []
): RelationUpdateResult {
  const prevScore = getRelation(regions, from, to);
  const nextScore = clampRelation(prevScore + delta);
  const nextRegions = setRelation(regions, from, to, nextScore);
  const relEvent = createRelationEvent(cycle, from, to, event, delta, description);
  const alerts = [
    ...existingAlerts,
    ...detectThresholdAlerts(from, to, prevScore, nextScore),
  ];
  return {
    regions: nextRegions,
    relationEvents: [...existingEvents, relEvent],
    relationAlerts: alerts,
  };
}

export function applyBilateralRelation(
  regions: Record<CountryId, RegionState>,
  a: CountryId,
  b: CountryId,
  delta: number,
  event: RelationEventType,
  cycle: number,
  descriptionA: string,
  descriptionB: string,
  existingEvents: RelationEvent[] = [],
  existingAlerts: RelationAlert[] = []
): RelationUpdateResult {
  let result = applyOneSidedRelation(
    regions,
    a,
    b,
    delta,
    event,
    cycle,
    descriptionA,
    existingEvents,
    existingAlerts
  );
  result = applyOneSidedRelation(
    result.regions,
    b,
    a,
    delta,
    event,
    cycle,
    descriptionB,
    result.relationEvents,
    result.relationAlerts
  );
  return result;
}

export function markTradePartners(
  tradePartners: Partial<Record<CountryId, CountryId[]>>,
  a: CountryId,
  b: CountryId
): Partial<Record<CountryId, CountryId[]>> {
  const addPartner = (owner: CountryId, partner: CountryId): CountryId[] => {
    const current = tradePartners[owner] ?? [];
    if (current.includes(partner)) return current;
    return [...current, partner];
  };
  return {
    ...tradePartners,
    [a]: addPartner(a, b),
    [b]: addPartner(b, a),
  };
}

export function isTradePartner(
  tradePartners: Partial<Record<CountryId, CountryId[]>>,
  viewer: CountryId,
  other: CountryId
): boolean {
  return (tradePartners[viewer] ?? []).includes(other);
}

export function canInitiateTrade(
  regions: Record<CountryId, RegionState>,
  from: CountryId,
  to: CountryId,
  tradeRestrictionSuspended = false
): boolean {
  if (tradeRestrictionSuspended) return true;
  return getRelation(regions, to, from) >= RELATION_TRADE_THRESHOLD;
}

/** Transport units consumed per trade amount (allied discount at 80+). */
export function getTradeTransportUnits(
  regions: Record<CountryId, RegionState>,
  from: CountryId,
  to: CountryId,
  amount: number
): number {
  const relFrom = getRelation(regions, from, to);
  const relTo = getRelation(regions, to, from);
  const allied = relFrom >= RELATION_ALLIED_THRESHOLD && relTo >= RELATION_ALLIED_THRESHOLD;
  return allied ? amount * 0.5 : amount;
}

/** Commission multiplier when transit country is friendly (70+) toward payer. */
export function getTransitCommissionMultiplier(
  regions: Record<CountryId, RegionState>,
  transitRegion: CountryId,
  payer: CountryId
): number {
  const rel = getRelation(regions, transitRegion, payer);
  return rel >= RELATION_FRIENDLY_THRESHOLD ? 0.5 : 1;
}

export function getTradeRelationDelta(item: TradeItem): {
  event: RelationEventType;
  delta: number;
} {
  if (item === "population") return { event: "population_traded", delta: RELATION_EVENT_DELTAS.population_traded };
  if (item === "hub_upgrade") return { event: "hub_upgrade_gifted", delta: RELATION_EVENT_DELTAS.hub_upgrade_gifted };
  if (item === "technology") return { event: "technology_traded", delta: RELATION_EVENT_DELTAS.technology_traded };
  return { event: "trade_completed", delta: RELATION_EVENT_DELTAS.trade_completed };
}

export function describeTradeEvent(
  item: TradeItem,
  amount: number,
  from: CountryId,
  to: CountryId
): { descriptionA: string; descriptionB: string } {
  const fromName = COUNTRY_CONFIGS[from].name;
  const toName = COUNTRY_CONFIGS[to].name;
  if (item === "population") {
    return {
      descriptionA: `Population traded (${amount} → ${toName})`,
      descriptionB: `Population traded (${amount} from ${fromName})`,
    };
  }
  if (item === "hub_upgrade") {
    return {
      descriptionA: `Hub tier upgrade gifted to ${toName}`,
      descriptionB: `Hub tier upgrade received from ${fromName}`,
    };
  }
  if (item === "technology") {
    return {
      descriptionA: `Technology traded (${amount} tech → ${toName})`,
      descriptionB: `Technology traded (${amount} tech from ${fromName})`,
    };
  }
  return {
    descriptionA: `Trade completed (${amount} ${item} → ${toName})`,
    descriptionB: `Trade completed (${amount} ${item} from ${fromName})`,
  };
}

export function applyTradeRelationEffects(
  regions: Record<CountryId, RegionState>,
  from: CountryId,
  to: CountryId,
  item: TradeItem,
  amount: number,
  cycle: number,
  relationEvents: RelationEvent[],
  relationAlerts: RelationAlert[]
): RelationUpdateResult {
  const { event, delta } = getTradeRelationDelta(item);
  const { descriptionA, descriptionB } = describeTradeEvent(item, amount, from, to);
  return applyBilateralRelation(
    regions,
    from,
    to,
    delta,
    event,
    cycle,
    descriptionA,
    descriptionB,
    relationEvents,
    relationAlerts
  );
}

export function applyTransitApprovedRelations(
  regions: Record<CountryId, RegionState>,
  transitRegion: CountryId,
  traderFrom: CountryId,
  traderTo: CountryId,
  cycle: number,
  relationEvents: RelationEvent[],
  relationAlerts: RelationAlert[]
): RelationUpdateResult {
  const transitName = COUNTRY_CONFIGS[transitRegion].name;
  let result: RelationUpdateResult = {
    regions,
    relationEvents,
    relationAlerts,
  };

  const pairs: [CountryId, CountryId, string][] = [
    [transitRegion, traderFrom, `Transit approved (through ${transitName})`],
    [traderFrom, transitRegion, `Transit approved (through ${transitName})`],
    [transitRegion, traderTo, `Transit approved (through ${transitName})`],
    [traderTo, transitRegion, `Transit approved (through ${transitName})`],
    [traderFrom, traderTo, `Transit approved (through ${transitName})`],
    [traderTo, traderFrom, `Transit approved (through ${transitName})`],
  ];

  for (const [from, to, desc] of pairs) {
    result = applyOneSidedRelation(
      result.regions,
      from,
      to,
      RELATION_EVENT_DELTAS.transit_approved,
      "transit_approved",
      cycle,
      desc,
      result.relationEvents,
      result.relationAlerts
    );
  }
  return result;
}

export function applySummitVoteRelations(
  regions: Record<CountryId, RegionState>,
  voter: CountryId,
  vote: SummitVoteChoice,
  record: SummitVoteRecord,
  cycle: number,
  relationEvents: RelationEvent[],
  relationAlerts: RelationAlert[]
): RelationUpdateResult {
  let result: RelationUpdateResult = { regions, relationEvents, relationAlerts };
  if (vote === "abstain") return result;

  for (const other of ALL_COUNTRIES) {
    if (other === voter) continue;
    const otherVote = record.votes[other];
    if (!otherVote || otherVote === "abstain") continue;

    const same = vote === otherVote;
    const delta = same
      ? RELATION_EVENT_DELTAS.summit_same_vote
      : RELATION_EVENT_DELTAS.summit_opposite_vote;
    const event = same ? "summit_same_vote" : "summit_opposite_vote";
    const resolution = record.resolution;
    const descA = same
      ? `Voted same way on ${resolution}`
      : `Voted opposite on ${resolution}`;
    const descB = same
      ? `Voted same way on ${resolution}`
      : `Voted opposite on ${resolution}`;

    result = applyBilateralRelation(
      result.regions,
      voter,
      other,
      delta,
      event,
      cycle,
      descA,
      descB,
      result.relationEvents,
      result.relationAlerts
    );
  }
  return result;
}

/** Apply summit vote relation effects once per country pair (batch finalize). */
export function applyAllSummitVoteRelations(
  regions: Record<CountryId, RegionState>,
  votes: Partial<Record<CountryId, SummitVoteChoice>>,
  record: SummitVoteRecord,
  cycle: number,
  relationEvents: RelationEvent[],
  relationAlerts: RelationAlert[]
): RelationUpdateResult {
  let result: RelationUpdateResult = { regions, relationEvents, relationAlerts };
  const resolution = record.resolution;

  for (let i = 0; i < ALL_COUNTRIES.length; i++) {
    for (let j = i + 1; j < ALL_COUNTRIES.length; j++) {
      const a = ALL_COUNTRIES[i];
      const b = ALL_COUNTRIES[j];
      const voteA = votes[a];
      const voteB = votes[b];
      if (!voteA || !voteB || voteA === "abstain" || voteB === "abstain") continue;

      const same = voteA === voteB;
      const delta = same
        ? RELATION_EVENT_DELTAS.summit_same_vote
        : RELATION_EVENT_DELTAS.summit_opposite_vote;
      const event = same ? "summit_same_vote" : "summit_opposite_vote";
      const desc = same
        ? `Voted same way on ${resolution}`
        : `Voted opposite on ${resolution}`;

      result = applyBilateralRelation(
        result.regions,
        a,
        b,
        delta,
        event,
        cycle,
        desc,
        desc,
        result.relationEvents,
        result.relationAlerts
      );
    }
  }
  return result;
}

export function applySummitNonComplianceRelations(
  regions: Record<CountryId, RegionState>,
  violator: CountryId,
  compliantCountries: CountryId[],
  resolutionText: string,
  cycle: number,
  relationEvents: RelationEvent[],
  relationAlerts: RelationAlert[]
): RelationUpdateResult {
  let result: RelationUpdateResult = { regions, relationEvents, relationAlerts };
  const violatorName = COUNTRY_CONFIGS[violator].name;

  for (const compliant of compliantCountries) {
    if (compliant === violator) continue;
    result = applyOneSidedRelation(
      result.regions,
      compliant,
      violator,
      RELATION_EVENT_DELTAS.summit_non_compliance,
      "summit_non_compliance",
      cycle,
      `${violatorName} non-compliant with "${resolutionText}"`,
      result.relationEvents,
      result.relationAlerts
    );
  }
  return result;
}

export function applyClimateFinanceGivenRelation(
  regions: Record<CountryId, RegionState>,
  from: CountryId,
  to: CountryId,
  cycle: number,
  relationEvents: RelationEvent[],
  relationAlerts: RelationAlert[]
): RelationUpdateResult {
  const fromName = COUNTRY_CONFIGS[from].name;
  return applyOneSidedRelation(
    regions,
    to,
    from,
    RELATION_EVENT_DELTAS.climate_finance_given,
    "climate_finance_given",
    cycle,
    `Climate finance received from ${fromName}`,
    relationEvents,
    relationAlerts
  );
}

function getTopEmitters(regions: Record<CountryId, RegionState>, count: number): CountryId[] {
  return [...ALL_COUNTRIES]
    .sort((a, b) => regions[b].co2 - regions[a].co2)
    .slice(0, count);
}

function hasGreenMajority(
  countryId: CountryId,
  buildings: PlacedBuilding[]
): boolean {
  const profile = REGION_PROFILES[countryId];
  const counts = countFactionBuildings(buildings, countryId);
  const percents = computeFactionPercents(profile, counts);
  return percents.greenPercent > 50;
}

export interface CycleRelationContext {
  regions: Record<CountryId, RegionState>;
  relationEvents: RelationEvent[];
  relationAlerts: RelationAlert[];
  tradeAgreements: TradeAgreement[];
  transitAgreements: TransitAgreement[];
  transportRoutes: GameState["transportRoutes"];
  climateFinanceThisCycle: Partial<Record<CountryId, number>>;
  summitVotes: SummitVoteRecord[];
  cycle: number;
  prevTemperature: number;
  nextTemperature: number;
  happinessBeforeTemp: Partial<Record<CountryId, number>>;
  cycleStartCo2: Partial<Record<CountryId, number>>;
  buildings: PlacedBuilding[];
}

export function processCycleRelations(ctx: CycleRelationContext): CycleRelationContext {
  let {
    regions,
    relationEvents,
    relationAlerts,
    tradeAgreements,
    transitAgreements,
    transportRoutes,
  } = ctx;
  const { cycle, buildings, prevTemperature, nextTemperature, happinessBeforeTemp } = ctx;

  // 1. Continuous trade +1 both sides
  for (const trade of tradeAgreements) {
    if (!trade.active || trade.tradeMode !== "continuous") continue;
    const route = transportRoutes.find((r) => r.id === trade.routeId);
    if (!route || route.status !== "active") continue;

    const desc = describeTradeEvent(trade.item, trade.amount, trade.from, trade.to);
    const result = applyBilateralRelation(
      regions,
      trade.from,
      trade.to,
      RELATION_EVENT_DELTAS.continuous_trade,
      "continuous_trade",
      cycle,
      `Continuous trade active (${trade.amount} ${trade.item})`,
      `Continuous trade active (${trade.amount} ${trade.item})`,
      relationEvents,
      relationAlerts
    );
    regions = result.regions;
    relationEvents = result.relationEvents;
    relationAlerts = result.relationAlerts;
    void desc;
  }

  // 2. Top-3 emitters: victims whose happiness dropped from temperature feel -1 toward emitter
  const topEmitters = new Set(getTopEmitters(regions, 3));
  const tempDelta = computeTemperatureHappinessDelta(nextTemperature) -
    computeTemperatureHappinessDelta(prevTemperature);

  if (tempDelta < 0) {
    for (const victim of ALL_COUNTRIES) {
      const before = happinessBeforeTemp[victim] ?? regions[victim].happiness;
      const after = regions[victim].happiness;
      if (after >= before) continue;

      for (const emitter of topEmitters) {
        if (emitter === victim) continue;
        const emitterName = COUNTRY_CONFIGS[emitter].name;
        const result = applyOneSidedRelation(
          regions,
          victim,
          emitter,
          RELATION_EVENT_DELTAS.top_emitter_damage,
          "top_emitter_damage",
          cycle,
          `${emitterName} is top-3 emitter, your happiness dropped`,
          relationEvents,
          relationAlerts
        );
        regions = result.regions;
        relationEvents = result.relationEvents;
        relationAlerts = result.relationAlerts;
      }
    }
  }

  // 3. CO₂ decreased: green-majority countries +1 toward decreaser
  for (const decr of ALL_COUNTRIES) {
    const startCo2 = ctx.cycleStartCo2[decr] ?? regions[decr].co2;
    const endCo2 = regions[decr].co2;
    if (endCo2 >= startCo2) continue;

    const decrName = COUNTRY_CONFIGS[decr].name;
    for (const observer of ALL_COUNTRIES) {
      if (observer === decr) continue;
      if (!hasGreenMajority(observer, buildings)) continue;

      const result = applyOneSidedRelation(
        regions,
        observer,
        decr,
        RELATION_EVENT_DELTAS.co2_decreased,
        "co2_decreased",
        cycle,
        `${decrName}'s CO₂ decreased this cycle`,
        relationEvents,
        relationAlerts
      );
      regions = result.regions;
      relationEvents = result.relationEvents;
      relationAlerts = result.relationAlerts;
    }
  }

  // 4. Transit fee paid (flat fees handled in gameState; commission in trade loop)
  // Applied inline during fee payment in gameState via applyTransitFeeRelation

  // 5. Climate finance defaults for passed pledge this cycle
  const pledge = ctx.summitVotes.find(
    (v) => v.cycle === cycle && v.resolution === CLIMATE_FINANCE_RESOLUTION
  );
  if (pledge) {
    const yesCount = ALL_COUNTRIES.filter((id) => pledge.votes[id] === "yes").length;
    if (yesCount >= 5) {
      const donors = ALL_COUNTRIES.filter((id) => getStartingMoney(id) >= 40);
      for (const donor of donors) {
        if (pledge.votes[donor] !== "yes") continue;
        if ((ctx.climateFinanceThisCycle[donor] ?? 0) > 0) continue;
        const donorName = COUNTRY_CONFIGS[donor].name;
        for (const dev of DEVELOPING_RECIPIENTS) {
          const result = applyOneSidedRelation(
            regions,
            dev,
            donor,
            RELATION_EVENT_DELTAS.climate_finance_defaulted,
            "climate_finance_defaulted",
            cycle,
            `${donorName} defaulted on climate finance pledge`,
            relationEvents,
            relationAlerts
          );
          regions = result.regions;
          relationEvents = result.relationEvents;
          relationAlerts = result.relationAlerts;
        }
      }
    }
  }

  // 6. Auto-cancel transit below 30 (returns updated agreements/routes)
  for (const agreement of transitAgreements) {
    if (agreement.status !== "active") continue;
    const relFrom = getRelation(regions, agreement.transitRegion, agreement.traderFrom);
    const relTo = getRelation(regions, agreement.transitRegion, agreement.traderTo);
    if (relFrom < RELATION_TRANSIT_THRESHOLD || relTo < RELATION_TRANSIT_THRESHOLD) {
      transitAgreements = transitAgreements.map((a) =>
        a.id === agreement.id ? { ...a, status: "cancelled" as const } : a
      );
      transportRoutes = transportRoutes.map((r) =>
        r.id === agreement.routeId ? { ...r, status: "disrupted" as const } : r
      );
      tradeAgreements = tradeAgreements.map((a) =>
        a.routeId === agreement.routeId ? { ...a, active: false } : a
      );
    }
  }

  return {
    ...ctx,
    regions,
    relationEvents,
    relationAlerts,
    tradeAgreements,
    transitAgreements,
    transportRoutes,
  };
}

export function applyTransitFeeRelation(
  regions: Record<CountryId, RegionState>,
  payer: CountryId,
  transitRegion: CountryId,
  cycle: number,
  relationEvents: RelationEvent[],
  relationAlerts: RelationAlert[]
): RelationUpdateResult {
  const transitName = COUNTRY_CONFIGS[transitRegion].name;
  return applyOneSidedRelation(
    regions,
    payer,
    transitRegion,
    RELATION_EVENT_DELTAS.transit_fee_paid,
    "transit_fee_paid",
    cycle,
    `Transit fee paid (→ ${transitName})`,
    relationEvents,
    relationAlerts
  );
}

export function getRelationHistoryForPair(
  relationEvents: RelationEvent[],
  a: CountryId,
  b: CountryId
): RelationEvent[] {
  return relationEvents
    .filter(
      (e) =>
        (e.fromCountry === a && e.toCountry === b) ||
        (e.fromCountry === b && e.toCountry === a)
    )
    .sort((x, y) => y.cycle - x.cycle || y.id.localeCompare(x.id));
}

export function getLastCycleRelationDelta(
  relationEvents: RelationEvent[],
  viewer: CountryId,
  other: CountryId,
  cycle: number
): number {
  return relationEvents
    .filter(
      (e) =>
        e.cycle === cycle - 1 &&
        ((e.fromCountry === viewer && e.toCountry === other) ||
          (e.fromCountry === other && e.toCountry === viewer))
    )
    .reduce((sum, e) => sum + (e.fromCountry === viewer ? e.delta : 0), 0);
}

export function shouldApplyClimateFinanceRelation(
  to: CountryId,
  item: TradeItem
): boolean {
  return isClimateFinanceTransfer(to, item) && getStartingMoney(to) < 40;
}
