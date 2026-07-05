import type { CountryId } from "../types/hex";
import type { HexData, ResourceDeposit } from "../types/hex";
import { COUNTRY_CONFIGS, emptyDepositCounts } from "../types/hex";
import type {
  GameState,
  RegionState,
  ResourceTotals,
  BuildEffects,
  TradeItem,
  PlacedBuilding,
  TradeAgreement,
} from "../types/game";
import { REGION_PROFILES } from "../config/regionProfiles";
import { BUILD_BY_ID } from "../config/builds";
import {
  computeIdleBuildingIds,
  computeMaterialShortageIdleIds,
  consumePlantMaterials,
  getExtractorYield,
  computeBuildingYields,
  computeBuildingCosts,
  computeFarmClimateFoodAdjustment,
} from "./buildEconomics";
import {
  applyHappinessUpdate,
  applyPopulationEffects,
  clampResourceFloors,
  computePerCapitaConsumption,
} from "./populationMechanics";
import { HUB_POST_T3_UPGRADE_COST } from "./transportHub";

const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS) as CountryId[];

const DEPOSIT_TRADE_ITEMS: ResourceDeposit[] = ["fuel", "rare_earth", "uranium"];

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

function createRegionState(id: CountryId): RegionState {
  const profile = REGION_PROFILES[id];
  const relations: Partial<Record<CountryId, number>> = {};
  for (const other of ALL_COUNTRIES) {
    if (other !== id) relations[other] = 50;
  }
  return {
    ...profile.startingResources,
    deposits: emptyDepositCounts(),
    researchLevels: {},
    extractionUnlocks: {},
    breakthroughs: [],
    relations,
  };
}

export function createInitialGameState(_hexes: HexData[] = []): GameState {
  const regions = {} as Record<CountryId, RegionState>;
  for (const id of ALL_COUNTRIES) {
    regions[id] = createRegionState(id);
  }

  return {
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
    worldHappiness: 64,
    globalTemperature: 1.0,
    cycle: 1,
    testingMode: true,
  };
}

export function aggregateResources(regions: Record<CountryId, RegionState>): ResourceTotals {
  const totals: ResourceTotals = {
    money: 0, energy: 0, food: 0, population: 0,
    happiness: 0, co2: 0, technology: 0,
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
    population: item === "population" ? amount : 0,
    technology: item === "technology" ? amount : 0,
  };

  const fromAbstract: BuildEffects = {
    money: item === "money" ? -amount : 0,
    energy: item === "energy" ? -amount : 0,
    food: item === "food" ? -amount : 0,
    population: item === "population" ? -amount : 0,
    technology: item === "technology" ? -amount : 0,
  };

  if (item === "money" && from.money < amount) return null;
  if (item === "energy" && from.energy < amount) return null;
  if (item === "food" && from.food < amount) return null;
  if (item === "population" && from.population < amount) return null;
  if (item === "technology" && from.technology < amount) return null;

  return {
    from: applyEffectsToRegion(from, fromAbstract),
    to: applyEffectsToRegion(to, abstractDelta),
  };
}

/** Apply hub upgrade from a trade agreement. Returns updated buildings or null if invalid. */
export function applyHubUpgradeFromTrade(
  tileBuildings: Record<string, PlacedBuilding>,
  trade: TradeAgreement
): Record<string, PlacedBuilding> | null {
  if (trade.item !== "hub_upgrade" || !trade.hubUpgradeBuildingId) return null;

  const building = Object.values(tileBuildings).find((b) => b.id === trade.hubUpgradeBuildingId);
  if (!building || building.type !== "transport_hub") return null;

  const key = `${building.q},${building.r}`;
  let updated = { ...building };

  if (trade.hubUpgradeToTier && trade.hubUpgradeToTier > building.tier) {
    updated = { ...updated, tier: trade.hubUpgradeToTier };
  }
  if (trade.hubUpgradeExtraLevels && trade.hubUpgradeExtraLevels > 0) {
    updated = {
      ...updated,
      extraLevel: (updated.extraLevel ?? 0) + trade.hubUpgradeExtraLevels,
    };
  }

  return { ...tileBuildings, [key]: updated };
}

export function getHubUpgradeMoneyCost(trade: TradeAgreement): number {
  if (trade.item !== "hub_upgrade") return 0;
  if (trade.hubUpgradeExtraLevels) {
    return HUB_POST_T3_UPGRADE_COST * trade.hubUpgradeExtraLevels;
  }
  if (trade.hubUpgradeToTier === 2) return 70;
  if (trade.hubUpgradeToTier === 3) return 90;
  return 0;
}

export function getRegionForHex(countryId: CountryId | null): CountryId {
  return countryId ?? "usa";
}

const REGION_EFFECT_KEYS: (keyof BuildEffects)[] = [
  "money", "energy", "food", "population", "happiness", "co2", "technology",
];

/** Allow food/energy to go negative briefly for shortage detection. */
export function applyEffectsToRegion(
  region: RegionState,
  effects: BuildEffects
): RegionState {
  const next = { ...region };
  for (const key of REGION_EFFECT_KEYS) {
    const delta = effects[key];
    if (delta !== undefined) {
      if (key === "food" || key === "energy") {
        next[key] = next[key] + delta;
      } else {
        next[key] = Math.max(0, next[key] + delta);
      }
    }
  }
  return next;
}

export function co2TemperatureDelta(co2?: number): number {
  return (co2 ?? 0) * 0.001;
}

/**
 * Process one cycle per population-mechanics.md:
 * 1. Per-capita consumption
 * 2. Workforce check (LIFO idle; crisis forces all idle)
 * 3. Extraction
 * 4. Material consumption (fuel/uranium)
 * 5. Building yields
 * 6. Building recurring costs + infra upkeep
 * 7. Trade processing
 * 8. CO₂ sum
 * 9. Temperature update
 * 10. Climate effects — farm yield penalty above +2.0°C
 * 11. Happiness update (CO₂, temperature, shortage)
 * 12. Population effects (loss, riots)
 * 13. Clamp food/energy floors
 * 14. Advance cycle
 */
export function processCycle(prev: GameState, hexes: HexData[] = []): GameState {
  let regions = { ...prev.regions };
  let tileBuildings = { ...prev.tileBuildings };
  let transitAgreements = [...prev.transitAgreements];
  let transportRoutes = [...prev.transportRoutes];
  let tradeAgreements = [...prev.tradeAgreements];
  let globalTemperature = prev.globalTemperature;
  let cycleCo2 = 0;

  const hexMap = new Map(hexes.map((h) => [`${h.q},${h.r}`, h]));

  // Reset per-cycle transport capacity at start of trade processing
  let transportCapacityUsed: Partial<Record<CountryId, number>> = {};

  // 1. Per-capita consumption
  for (const id of ALL_COUNTRIES) {
    const region = regions[id];
    const drain = computePerCapitaConsumption(region.population);
    regions = {
      ...regions,
      [id]: {
        ...region,
        food: region.food - drain.food,
        energy: region.energy - drain.energy,
        money: Math.max(0, region.money - drain.money),
      },
    };
  }

  // Per-region building processing (steps 2–6)
  for (const id of ALL_COUNTRIES) {
    const regionBuildings = Object.values(tileBuildings).filter(
      (b) => b.countryId === id
    );
    let region = regions[id];
    const startHappiness = region.happiness;

    // 2. Workforce check (crisis/collapse forces all buildings idle)
    const workforceIdle = computeIdleBuildingIds(regionBuildings, region.population, startHappiness);

    // 3. Extraction
    for (const building of regionBuildings) {
      if (building.type !== "extractor") continue;
      const hex = hexMap.get(`${building.q},${building.r}`);
      const yieldResult = getExtractorYield(building, hex, workforceIdle.has(building.id));
      if (yieldResult) {
        const deposits = { ...region.deposits };
        deposits[yieldResult.deposit] += yieldResult.amount;
        region = { ...region, deposits };
      }
    }

    // 4. Material consumption check + deduct
    const materialIdle = computeMaterialShortageIdleIds(
      regionBuildings,
      workforceIdle,
      region.deposits
    );
    region = {
      ...region,
      deposits: consumePlantMaterials(
        regionBuildings,
        workforceIdle,
        materialIdle,
        region.deposits
      ),
    };

    // 5. Building yields (unrest halves city growth)
    for (const building of regionBuildings) {
      const hex = hexMap.get(`${building.q},${building.r}`);
      const yields = computeBuildingYields(
        building,
        hex,
        region.deposits.rare_earth,
        workforceIdle,
        materialIdle,
        startHappiness
      );
      if (Object.keys(yields).length > 0) {
        region = applyEffectsToRegion(region, yields);
        cycleCo2 += yields.co2 ?? 0;
      }
    }

    // 6. Building recurring costs
    for (const building of regionBuildings) {
      const costs = computeBuildingCosts(building, workforceIdle, materialIdle);
      if (Object.keys(costs).length > 0) {
        region = applyEffectsToRegion(region, costs);
        cycleCo2 += costs.co2 ?? 0;
      }
    }

    regions = { ...regions, [id]: region };
  }

  // 7. Trade processing (continuous trades; capacity + CO₂ per unit)
  for (const trade of tradeAgreements) {
    if (!trade.active || trade.tradeMode !== "continuous") continue;
    const route = transportRoutes.find((r) => r.id === trade.routeId);
    if (!route || route.status !== "active") continue;

    const co2 = (route.emissionsPerUnit ?? 0) * trade.amount;
    if (co2 > 0) {
      const fromRegion = regions[trade.from];
      regions = {
        ...regions,
        [trade.from]: { ...fromRegion, co2: fromRegion.co2 + co2 },
      };
      cycleCo2 += co2;
    }

    transportCapacityUsed = {
      ...transportCapacityUsed,
      [trade.from]: (transportCapacityUsed[trade.from] ?? 0) + trade.amount,
    };

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

    const fromR = regions[trade.from];
    const toR = regions[trade.to];
    let transferred = applyTradeTransfer(fromR, toR, trade.item, trade.amount);

    if (trade.item === "hub_upgrade") {
      const upgraded = applyHubUpgradeFromTrade(tileBuildings, trade);
      if (upgraded) tileBuildings = upgraded;
      const upgradeCost = getHubUpgradeMoneyCost(trade);
      const payer = trade.hubUpgradePayer ?? trade.from;
      if (upgradeCost > 0 && regions[payer].money >= upgradeCost) {
        regions = {
          ...regions,
          [payer]: { ...regions[payer], money: regions[payer].money - upgradeCost },
        };
      }
      transferred = { from: fromR, to: toR };
    }

    if (transferred) {
      regions = {
        ...regions,
        [trade.from]: transferred.from,
        [trade.to]: transferred.to,
      };
    }
  }

  // Flat transit fees (part of trade step)
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

  // 8–9. CO₂ sum → temperature
  globalTemperature += co2TemperatureDelta(cycleCo2);

  // 10. Climate effects — farm yield penalty above +2.0°C (uses updated temperature)
  for (const id of ALL_COUNTRIES) {
    const regionBuildings = Object.values(tileBuildings).filter((b) => b.countryId === id);
    let region = regions[id];
    const startHappiness = region.happiness;
    const workforceIdle = computeIdleBuildingIds(regionBuildings, region.population, startHappiness);
    const materialIdle = computeMaterialShortageIdleIds(
      regionBuildings,
      workforceIdle,
      region.deposits
    );

    for (const building of regionBuildings) {
      if (building.type !== "farm") continue;
      if (workforceIdle.has(building.id) || materialIdle.has(building.id)) continue;
      const baseFood = BUILD_BY_ID.farm.effectsByTier[building.tier].food ?? 0;
      if (baseFood <= 0) continue;
      const adjustment = computeFarmClimateFoodAdjustment(baseFood, globalTemperature);
      if (adjustment !== 0) {
        region = { ...region, food: region.food + adjustment };
      }
    }

    regions = { ...regions, [id]: region };
  }

  // 11. Happiness update (uses post-temperature global temp)
  for (const id of ALL_COUNTRIES) {
    regions = {
      ...regions,
      [id]: applyHappinessUpdate(regions[id], globalTemperature),
    };
  }

  // 12. Population effects (loss, collapse riots)
  const popResult = applyPopulationEffects(
    regions,
    tileBuildings,
    ALL_COUNTRIES
  );
  regions = popResult.regions;
  tileBuildings = popResult.tileBuildings;

  // 13. Clamp food/energy floors
  for (const id of ALL_COUNTRIES) {
    regions = {
      ...regions,
      [id]: clampResourceFloors(regions[id]),
    };
  }

  const worldHappiness = Math.round(
    ALL_COUNTRIES.reduce((sum, id) => sum + regions[id].happiness, 0) / ALL_COUNTRIES.length
  );

  // Auto-disrupt transit on low relations
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
    tileBuildings,
    transitAgreements,
    transportRoutes,
    tradeAgreements,
    transportCapacityUsed,
    globalTemperature,
    worldHappiness,
    cycle: prev.cycle + 1,
  };
}
