import type { CountryId } from "../types/hex";
import type {
  GameState,
  RegionState,
  ResourceTotals,
  BreakthroughProposal,
  CombinedResearchProject,
  BuildEffects,
} from "../types/game";
import { REGION_PROFILES } from "../config/regionProfiles";
import { COUNTRY_CONFIGS } from "../types/hex";

const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS) as CountryId[];

function createRegionState(id: CountryId): RegionState {
  const profile = REGION_PROFILES[id];
  const relations: Partial<Record<CountryId, number>> = {};
  for (const other of ALL_COUNTRIES) {
    if (other !== id) relations[other] = 50;
  }
  return {
    ...profile.startingResources,
    researchLevels: {},
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

export function createInitialGameState(): GameState {
  const regions = {} as Record<CountryId, RegionState>;
  for (const id of ALL_COUNTRIES) {
    regions[id] = createRegionState(id);
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

/**
 * Process one cycle:
 * 0. Deduct infrastructure upkeep
 * 1. Auto-deduct flat transit fees
 * 2. Process continuous trades (commission, emissions, resource transfer)
 * 3. Auto-disrupt transit on low relations
 * 4. Advance cycle
 */
export function processCycle(prev: GameState): GameState {
  let regions = { ...prev.regions };
  let transitAgreements = [...prev.transitAgreements];
  let transportRoutes = [...prev.transportRoutes];
  let tradeAgreements = [...prev.tradeAgreements];
  let globalTemperature = prev.globalTemperature;

  // 0. Infrastructure upkeep — deduct per facility
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

  // 1. Auto-deduct flat transit fees
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

  // 2. Process continuous trades
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
    regions = {
      ...regions,
      [trade.from]: applyEffectsToRegion(fromR, {
        money: trade.item === "money" ? -trade.amount : 0,
        energy: trade.item === "energy" ? -trade.amount : 0,
        food: trade.item === "food" ? -trade.amount : 0,
      }),
      [trade.to]: applyEffectsToRegion(toR, {
        money: trade.item === "money" ? trade.amount : 0,
        energy: trade.item === "energy" ? trade.amount : 0,
        food: trade.item === "food" ? trade.amount : 0,
      }),
    };
  }

  // 3. Auto-disrupt transit on low relations
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
