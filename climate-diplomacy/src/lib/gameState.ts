import type { CountryId } from "../types/hex";
import type { HexData, ResourceDeposit } from "../types/hex";
import { COUNTRY_CONFIGS, emptyDepositCounts } from "../types/hex";
import type {
  GameState,
  RegionState,
  ResourceTotals,
  BreakthroughProposal,
  CombinedResearchProject,
  BuildEffects,
  TradeItem,
} from "../types/game";
import { REGION_PROFILES } from "../config/regionProfiles";

const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS) as CountryId[];

const DEPOSIT_TRADE_ITEMS: ResourceDeposit[] = [
  "fuel", "rare_earth", "uranium", "mixed",
];

export function isDepositTradeItem(item: TradeItem): item is ResourceDeposit {
  return (DEPOSIT_TRADE_ITEMS as string[]).includes(item);
}

export function countDepositsByCountry(
  hexes: HexData[]
): Record<CountryId, Record<ResourceDeposit, number>> {
  const result = {} as Record<CountryId, Record<ResourceDeposit, number>>;
  for (const id of ALL_COUNTRIES) {
    result[id] = emptyDepositCounts();
  }
  for (const hex of hexes) {
    if (hex.countryId && hex.resource) {
      result[hex.countryId][hex.resource]++;
    }
  }
  return result;
}

export function aggregateDeposits(
  regions: Record<CountryId, RegionState>
): Record<ResourceDeposit, number> {
  const totals = emptyDepositCounts();
  for (const id of ALL_COUNTRIES) {
    for (const key of DEPOSIT_TRADE_ITEMS) {
      totals[key] += regions[id].deposits[key];
    }
  }
  return totals;
}

function createRegionState(id: CountryId, deposits: Record<ResourceDeposit, number>): RegionState {
  const profile = REGION_PROFILES[id];
  const relations: Partial<Record<CountryId, number>> = {};
  for (const other of ALL_COUNTRIES) {
    if (other !== id) relations[other] = 50;
  }
  return {
    ...profile.startingResources,
    deposits: { ...deposits },
    researchLevels: {},
    extractionUnlocks: {},
    breakthroughs: [],
    relations,
  };
}

function pickRandomPartners(exclude: CountryId[], count: number, seed: number): CountryId[] {
  const pool = ALL_COUNTRIES.filter((c) => !exclude.includes(c));
  const result: CountryId[] = [];
  let s = seed;
  for (let i = 0; i < count && pool.length > 0; i++) {
    s = (s * 16807) % 2147483647;
    const idx = s % pool.length;
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

export function createInitialGameState(hexes: HexData[] = []): GameState {
  const depositCounts = countDepositsByCountry(hexes);
  const regions = {} as Record<CountryId, RegionState>;
  for (const id of ALL_COUNTRIES) {
    regions[id] = createRegionState(id, depositCounts[id]);
  }

  const optionalPartners = pickRandomPartners(["usa", "eu"], 2, 42);

  const breakthroughProposal: BreakthroughProposal = {
    id: "bt-1",
    name: "Carbon Capture Retrofit",
    requiredParticipants: ["usa", "eu", ...optionalPartners],
    optionalParticipants: [],
    agreed: [],
    refused: [],
    cost: 200,
  };

  const combinedProjects: CombinedResearchProject[] = [
    {
      id: "cr-1",
      name: "Advanced Solar Storage",
      goal: "Grid-scale battery integration for solar regions",
      participants: ["eu", "usa", "india"],
      contributions: { eu: 80, usa: 70, india: 30 },
      progress: 120,
      target: 200,
      complete: false,
    },
  ];

  return {
    regions,
    tileBuildings: {},
    tradeAgreements: [],
    transportRoutes: [],
    transitAgreements: [],
    transitRequests: [],
    highlightedRoutes: [],
    breakthroughProposal,
    combinedProjects,
    researchLicenses: [
      {
        id: "lic-1",
        breakthrough: "Fusion Energy (preview)",
        seller: "usa",
        model: "one_time",
        price: 350,
        status: "offered",
      },
    ],
    worldHappiness: 64,
    globalTemperature: 1.0,
    cycle: 1,
    testingMode: true,
  };
}

export function aggregateResources(regions: Record<CountryId, RegionState>): ResourceTotals {
  const totals: ResourceTotals = {
    money: 0, energy: 0, food: 0, population: 0,
    happiness: 0, co2: 0, technology: 0, goods: 0,
  };
  const ids = Object.keys(regions) as CountryId[];
  for (const id of ids) {
    const r = regions[id];
    totals.money += r.money;
    totals.energy += r.energy;
    totals.food += r.food;
    totals.population += r.population;
    totals.happiness += r.happiness;
    totals.co2 += r.co2;
    totals.technology += r.technology;
    totals.goods += r.goods;
  }
  totals.happiness = Math.round(totals.happiness / ids.length);
  totals.technology = Math.round(totals.technology / ids.length);
  return totals;
}

export function applyTradeTransfer(
  from: RegionState,
  to: RegionState,
  item: TradeItem,
  amount: number
): { from: RegionState; to: RegionState } | null {
  if (amount <= 0) return null;

  if (isDepositTradeItem(item)) {
    if (from.deposits[item] < amount) return null;
    return {
      from: {
        ...from,
        deposits: { ...from.deposits, [item]: from.deposits[item] - amount },
      },
      to: {
        ...to,
        deposits: { ...to.deposits, [item]: to.deposits[item] + amount },
      },
    };
  }

  const abstractDelta: BuildEffects = {
    money: item === "money" ? amount : 0,
    energy: item === "energy" ? amount : 0,
    food: item === "food" ? amount : 0,
    technology: item === "technology" ? amount : 0,
    goods: item === "goods" ? amount : 0,
  };

  const fromAbstract: BuildEffects = {
    money: item === "money" ? -amount : 0,
    energy: item === "energy" ? -amount : 0,
    food: item === "food" ? -amount : 0,
    technology: item === "technology" ? -amount : 0,
    goods: item === "goods" ? -amount : 0,
  };

  if (item === "money" && from.money < amount) return null;
  if (item === "energy" && from.energy < amount) return null;
  if (item === "food" && from.food < amount) return null;
  if (item === "technology" && from.technology < amount) return null;
  if (item === "goods" && from.goods < amount) return null;

  return {
    from: applyEffectsToRegion(from, fromAbstract),
    to: applyEffectsToRegion(to, abstractDelta),
  };
}

export function getRegionForHex(countryId: CountryId | null): CountryId {
  return countryId ?? "usa";
}

const REGION_EFFECT_KEYS: (keyof BuildEffects)[] = [
  "money", "energy", "food", "population", "happiness", "co2", "technology", "goods",
];

export function applyEffectsToRegion(
  region: RegionState,
  effects: BuildEffects
): RegionState {
  const next = { ...region };
  for (const key of REGION_EFFECT_KEYS) {
    const delta = effects[key];
    if (delta !== undefined) {
      next[key] = Math.max(0, next[key] + delta);
    }
  }
  return next;
}

export function co2TemperatureDelta(co2?: number): number {
  return (co2 ?? 0) * 0.001;
}

export function getNextBreakthroughPartners(cycle: number): CountryId[] {
  return pickRandomPartners(["usa", "eu"], 2, cycle * 7919);
}

/** Bonus yield multiplier when extractor sits on a matching deposit tile. */
const EXTRACTOR_DEPOSIT_BONUS = 3;
/** Base yield per tier when no matching tile deposit. */
const EXTRACTOR_BASE_YIELD = 1;
/** Region aggregate divisor for reduced off-deposit extraction. */
const EXTRACTOR_AGGREGATE_DIVISOR = 25;

function computeExtractorYields(
  hexes: HexData[],
  prev: GameState
): Record<CountryId, Record<ResourceDeposit, number>> {
  const hexMap = new Map(hexes.map((h) => [`${h.q},${h.r}`, h]));
  const tileDepositCounts = countDepositsByCountry(hexes);
  const yields = {} as Record<CountryId, Record<ResourceDeposit, number>>;

  for (const id of ALL_COUNTRIES) {
    yields[id] = emptyDepositCounts();
  }

  for (const building of Object.values(prev.tileBuildings)) {
    if (building.type !== "extractor" || !building.countryId) continue;

    const region = prev.regions[building.countryId];
    const hex = hexMap.get(`${building.q},${building.r}`);
    const regionCounts = tileDepositCounts[building.countryId];

    for (const deposit of DEPOSIT_TRADE_ITEMS) {
      if (!region.extractionUnlocks[deposit]) continue;

      let amount: number;
      if (hex?.resource === deposit) {
        amount = building.tier * EXTRACTOR_DEPOSIT_BONUS;
      } else {
        const aggregate = regionCounts[deposit] ?? 0;
        amount = Math.max(
          EXTRACTOR_BASE_YIELD,
          Math.round(building.tier * EXTRACTOR_BASE_YIELD * (aggregate / EXTRACTOR_AGGREGATE_DIVISOR))
        );
      }
      yields[building.countryId][deposit] += amount;
    }
  }

  return yields;
}

/**
 * Process one cycle:
 * 0. Extractor passive yields
 * 1. Deduct infrastructure upkeep
 * 2. Auto-deduct flat transit fees
 * 3. Process continuous trades (commission, emissions, resource transfer)
 * 4. Auto-disrupt transit on low relations
 * 5. Advance cycle
 */
export function processCycle(prev: GameState, hexes: HexData[] = []): GameState {
  let regions = { ...prev.regions };
  let transitAgreements = [...prev.transitAgreements];
  let transportRoutes = [...prev.transportRoutes];
  let tradeAgreements = [...prev.tradeAgreements];
  let globalTemperature = prev.globalTemperature;

  // 0. Extractor passive yields
  if (hexes.length > 0) {
    const extractorYields = computeExtractorYields(hexes, prev);
    for (const id of ALL_COUNTRIES) {
      const r = regions[id];
      const added = extractorYields[id];
      const deposits = { ...r.deposits };
      for (const dep of DEPOSIT_TRADE_ITEMS) {
        deposits[dep] += added[dep];
      }
      regions = { ...regions, [id]: { ...r, deposits } };
    }
  }

  // 1. Infrastructure upkeep — deduct per facility
  const INFRA_TYPES = ["airport", "dock", "transport_center"] as const;
  const UPKEEP: Record<1 | 2 | 3, number> = { 1: 20, 2: 35, 3: 50 };
  for (const building of Object.values(prev.tileBuildings)) {
    if (!INFRA_TYPES.includes(building.type as typeof INFRA_TYPES[number])) continue;
    if (!building.countryId) continue;
    const r = regions[building.countryId];
    regions = {
      ...regions,
      [building.countryId]: { ...r, money: r.money - UPKEEP[building.tier] },
    };
  }

  // 2. Auto-deduct flat transit fees
  for (const agreement of transitAgreements) {
    if (agreement.status !== "active" || agreement.feeModel !== "flat") continue;
    const payer = regions[agreement.payer];
    const transit = regions[agreement.transitRegion];
    if (payer.money >= agreement.feeAmount) {
      regions = {
        ...regions,
        [agreement.payer]: { ...payer, money: payer.money - agreement.feeAmount },
        [agreement.transitRegion]: { ...transit, money: transit.money + agreement.feeAmount },
      };
    } else {
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

  // 3. Process continuous trades
  for (const trade of tradeAgreements) {
    if (!trade.active || trade.tradeMode !== "continuous") continue;
    const route = transportRoutes.find((r) => r.id === trade.routeId);

    // Apply transport emissions from route
    const co2 = route?.emissionsPerCycle ?? 0;
    if (co2 > 0) {
      const fromRegion = regions[trade.from];
      regions = {
        ...regions,
        [trade.from]: { ...fromRegion, co2: fromRegion.co2 + co2 },
      };
      globalTemperature += co2TemperatureDelta(co2);
    }

    // Apply commission fees
    const routeTransits = transitAgreements.filter(
      (a) => a.routeId === trade.routeId && a.status === "active" && a.feeModel === "commission"
    );
    const tradeValue = trade.item === "money" ? trade.amount : trade.amount * 0.5;
    for (const transit of routeTransits) {
      const fee = Math.round(tradeValue * (transit.feeAmount / 100));
      const p = regions[transit.payer];
      const t = regions[transit.transitRegion];
      regions = {
        ...regions,
        [transit.payer]: { ...p, money: p.money - fee },
        [transit.transitRegion]: { ...t, money: t.money + fee },
      };
    }

    // Transfer resources
    const fromR = regions[trade.from];
    const toR = regions[trade.to];
    const transferred = applyTradeTransfer(fromR, toR, trade.item, trade.amount);
    if (transferred) {
      regions = {
        ...regions,
        [trade.from]: transferred.from,
        [trade.to]: transferred.to,
      };
    }
  }

  // 4. Auto-disrupt transit on low relations
  for (const agreement of transitAgreements) {
    if (agreement.status !== "active") continue;
    const transitRelations = regions[agreement.transitRegion].relations;
    const relFrom = transitRelations[agreement.traderFrom] ?? 50;
    const relTo = transitRelations[agreement.traderTo] ?? 50;
    if (relFrom < 30 || relTo < 30) {
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
    ...prev,
    regions,
    transitAgreements,
    transportRoutes,
    tradeAgreements,
    globalTemperature,
    cycle: prev.cycle + 1,
  };
}
