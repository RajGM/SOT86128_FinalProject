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
import {
  applyFactionHappinessDelta,
  applyFactionSatisfactionChanges,
  countFactionBuildings,
  computeFactionPercents,
  createEmptyFactionCycleEvents,
  createInitialFactionState,
  detectTemperatureThresholdCrossing,
  FACTION_MONEY_SURPLUS_THRESHOLD,
} from "./factionMechanics";
import {
  appendGapHistory,
  appendHappinessHistory,
  computeAllCountryComparisons,
  isClimateFinanceTransfer,
  climateFinanceAmount,
  updatePeakGreenTracking,
} from "./comparisonMetrics";
import { processCarbonTaxCollection } from "./carbonTaxMechanics";
import {
  applyTransitFeeRelation,
  getTransitCommissionMultiplier,
  processCycleRelations,
  applySummitNonComplianceRelations,
} from "./relationMechanics";
import {
  checkBoundariesInOrder,
  createPendingVote,
  checkResolutionCompliance,
  getResolutionTargets,
  getYesVoters,
  shouldExpireResolution,
} from "./summitMechanics";

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
    factions: createInitialFactionState(),
    carbonTax: 0,
    carbonTaxRecycling: "dividend",
    greenSubsidyPool: 0,
  };
}

export function createInitialGameState(_hexes: HexData[] = []): GameState {
  const regions = {} as Record<CountryId, RegionState>;
  for (const id of ALL_COUNTRIES) {
    regions[id] = createRegionState(id);
  }

  const base: GameState = {
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
    cycleStartCo2: Object.fromEntries(
      ALL_COUNTRIES.map((id) => [id, regions[id].co2])
    ) as Partial<Record<CountryId, number>>,
    cycleStartCarbonTax: Object.fromEntries(
      ALL_COUNTRIES.map((id) => [id, regions[id].carbonTax])
    ) as Partial<Record<CountryId, number>>,
    previousCycleCo2: Object.fromEntries(
      ALL_COUNTRIES.map((id) => [id, regions[id].co2])
    ) as Partial<Record<CountryId, number>>,
    summitVotes: [],
    activeSummitResolutions: [],
    summitHistory: [],
    pendingSummitVote: null,
    summitComplianceResults: [],
    summitComplianceAlerts: [],
    peakGlobalPopulation: ALL_COUNTRIES.reduce(
      (s, id) => s + regions[id].population,
      0
    ),
    cycleTradeOffers: [],
    cycleCompletedTransfers: [],
    tradeRestrictionSuspensionUntil: 0,
    summitNonComplianceStrikes: {},
    climateFinanceGiven: {},
    gapScoreHistory: {},
    happinessHistory: {},
    peakGreenRatio: {},
    peakGreenRatioCycle: {},
    lastFactionTempThreshold: 0,
    factionCycleEvents: {},
    relationEvents: [],
    tradePartners: {},
    relationAlerts: [],
    climateFinanceThisCycle: {},
  };

  const initialRows = computeAllCountryComparisons(base);
  const withGap = {
    ...base,
    gapScoreHistory: appendGapHistory({}, 1, initialRows),
    happinessHistory: appendHappinessHistory({}, 1, base),
  };
  const peakTracking = updatePeakGreenTracking({}, {}, 1, withGap);
  return {
    ...withGap,
    peakGreenRatio: peakTracking.peakGreenRatio,
    peakGreenRatioCycle: peakTracking.peakGreenRatioCycle,
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

export function applyClimateFinanceUpdate(
  climateFinanceGiven: Partial<Record<CountryId, number>>,
  from: CountryId,
  to: CountryId,
  item: TradeItem,
  amount: number
): Partial<Record<CountryId, number>> {
  if (!isClimateFinanceTransfer(to, item)) return climateFinanceGiven;
  const delta = climateFinanceAmount(item, amount);
  return {
    ...climateFinanceGiven,
    [from]: (climateFinanceGiven[from] ?? 0) + delta,
  };
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
 * 11b. Faction happiness modifier (satisfaction + political balance)
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
  const cycleCo2ByCountry: Partial<Record<CountryId, number>> = {};
  let lastFactionTempThreshold = prev.lastFactionTempThreshold;
  const prevTemperature = prev.globalTemperature;
  let factionCycleEvents = { ...prev.factionCycleEvents };

  const hexMap = new Map(hexes.map((h) => [`${h.q},${h.r}`, h]));

  // Reset per-cycle transport capacity at start of trade processing
  let transportCapacityUsed: Partial<Record<CountryId, number>> = {};
  let climateFinanceGiven = { ...prev.climateFinanceGiven };
  let climateFinanceThisCycle = { ...prev.climateFinanceThisCycle };
  let relationEvents = [...prev.relationEvents];
  let relationAlerts = [...prev.relationAlerts];

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
        const co2Delta = yields.co2 ?? 0;
        if (co2Delta > 0) {
          cycleCo2 += co2Delta;
          cycleCo2ByCountry[id] = (cycleCo2ByCountry[id] ?? 0) + co2Delta;
        }
      }
    }

    // 6. Building recurring costs
    for (const building of regionBuildings) {
      const costs = computeBuildingCosts(building, workforceIdle, materialIdle);
      if (Object.keys(costs).length > 0) {
        region = applyEffectsToRegion(region, costs);
        const co2Delta = costs.co2 ?? 0;
        if (co2Delta > 0) {
          cycleCo2 += co2Delta;
          cycleCo2ByCountry[id] = (cycleCo2ByCountry[id] ?? 0) + co2Delta;
        }
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
      cycleCo2ByCountry[trade.from] = (cycleCo2ByCountry[trade.from] ?? 0) + co2;
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
      const multiplier = getTransitCommissionMultiplier(regions, transit.transitRegion, transit.payer);
      const fee = Math.round(tradeValue * (transit.feeAmount / 100) * multiplier);
      const p = regions[transit.payer];
      const t = regions[transit.transitRegion];
      regions = {
        ...regions,
        [transit.payer]: { ...p, money: p.money - fee },
        [transit.transitRegion]: { ...t, money: t.money + fee },
      };
      if (fee > 0) {
        const feeRel = applyTransitFeeRelation(
          regions,
          transit.payer,
          transit.transitRegion,
          prev.cycle,
          relationEvents,
          relationAlerts
        );
        regions = feeRel.regions;
        relationEvents = feeRel.relationEvents;
        relationAlerts = feeRel.relationAlerts;
      }
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
      climateFinanceGiven = applyClimateFinanceUpdate(
        climateFinanceGiven,
        trade.from,
        trade.to,
        trade.item,
        trade.amount
      );
      if (isClimateFinanceTransfer(trade.to, trade.item)) {
        const delta = climateFinanceAmount(trade.item, trade.amount);
        climateFinanceThisCycle = {
          ...climateFinanceThisCycle,
          [trade.from]: (climateFinanceThisCycle[trade.from] ?? 0) + delta,
        };
      }
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
      const feeRel = applyTransitFeeRelation(
        regions,
        agreement.payer,
        agreement.transitRegion,
        prev.cycle,
        relationEvents,
        relationAlerts
      );
      regions = feeRel.regions;
      relationEvents = feeRel.relationEvents;
      relationAlerts = feeRel.relationAlerts;
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

  // 8b. Carbon tax collection and recycling (before temperature update)
  const carbonTaxResult = processCarbonTaxCollection(
    regions,
    cycleCo2ByCountry,
    climateFinanceGiven,
    climateFinanceThisCycle,
    relationEvents,
    relationAlerts,
    prev.cycle
  );
  regions = carbonTaxResult.regions;
  climateFinanceGiven = carbonTaxResult.climateFinanceGiven;
  climateFinanceThisCycle = carbonTaxResult.climateFinanceThisCycle;
  relationEvents = carbonTaxResult.relationEvents;
  relationAlerts = carbonTaxResult.relationAlerts;

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
  const happinessBeforeTemp: Partial<Record<CountryId, number>> = {};
  for (const id of ALL_COUNTRIES) {
    happinessBeforeTemp[id] = regions[id].happiness;
  }

  for (const id of ALL_COUNTRIES) {
    regions = {
      ...regions,
      [id]: applyHappinessUpdate(regions[id], globalTemperature),
    };
  }

  // 11b. Faction satisfaction + happiness modifier
  const tempCrossing = detectTemperatureThresholdCrossing(
    prevTemperature,
    globalTemperature,
    lastFactionTempThreshold
  );
  if (tempCrossing.crossed) {
    lastFactionTempThreshold = tempCrossing.newLastCrossed;
  }

  const allBuildings = Object.values(tileBuildings);
  for (const id of ALL_COUNTRIES) {
    const profile = REGION_PROFILES[id];
    const region = regions[id];
    const counts = countFactionBuildings(allBuildings, id);
    const percents = computeFactionPercents(profile, counts);

    const startCo2 = prev.cycleStartCo2[id] ?? region.co2;
    const startTax = prev.cycleStartCarbonTax[id];
    const taxDelta =
      startTax !== undefined ? region.carbonTax - startTax : 0;
    const events = {
      ...(factionCycleEvents[id] ?? createEmptyFactionCycleEvents()),
      co2Increased: region.co2 > startCo2,
      co2Decreased: region.co2 < startCo2,
      moneySurplus: region.money > FACTION_MONEY_SURPLUS_THRESHOLD,
      temperatureThresholdCrossed: tempCrossing.crossed,
      carbonTaxIncrease: taxDelta > 0 ? taxDelta : 0,
      carbonTaxDecrease: taxDelta < 0 ? Math.abs(taxDelta) : 0,
    };

    const updatedFactions = applyFactionSatisfactionChanges(region.factions, events);
    const happiness = applyFactionHappinessDelta(
      region.happiness,
      percents,
      updatedFactions
    );

    regions = {
      ...regions,
      [id]: {
        ...region,
        happiness,
        factions: updatedFactions,
      },
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

  // 12b. Relations update (continuous trade, emissions, transit checks)
  const relationResult = processCycleRelations({
    regions,
    relationEvents,
    relationAlerts,
    tradeAgreements,
    transitAgreements,
    transportRoutes,
    climateFinanceThisCycle,
    summitVotes: prev.summitVotes,
    cycle: prev.cycle,
    prevTemperature,
    nextTemperature: globalTemperature,
    happinessBeforeTemp,
    cycleStartCo2: prev.cycleStartCo2,
    buildings: Object.values(tileBuildings),
  });
  regions = relationResult.regions;
  relationEvents = relationResult.relationEvents;
  relationAlerts = relationResult.relationAlerts;
  tradeAgreements = relationResult.tradeAgreements;
  transitAgreements = relationResult.transitAgreements;
  transportRoutes = relationResult.transportRoutes;

  const worldHappiness = Math.round(
    ALL_COUNTRIES.reduce((sum, id) => sum + regions[id].happiness, 0) / ALL_COUNTRIES.length
  );

  const currentGlobalPopulation = ALL_COUNTRIES.reduce(
    (sum, id) => sum + regions[id].population,
    0
  );
  const peakGlobalPopulation = Math.max(
    prev.peakGlobalPopulation,
    currentGlobalPopulation
  );

  // 12c. Summit compliance check + boundary detection
  let activeSummitResolutions = [...prev.activeSummitResolutions];
  let summitComplianceResults = [...prev.summitComplianceResults];
  let summitComplianceAlerts: string[] = [];
  let summitNonComplianceStrikes = { ...prev.summitNonComplianceStrikes };
  let factionCycleEventsFinal = { ...factionCycleEvents };
  let tradeRestrictionSuspensionUntil = prev.tradeRestrictionSuspensionUntil;

  for (const resolution of activeSummitResolutions) {
    if (
      resolution.tradeRestrictionsSuspendedUntil &&
      resolution.tradeRestrictionsSuspendedUntil > tradeRestrictionSuspensionUntil
    ) {
      tradeRestrictionSuspensionUntil = resolution.tradeRestrictionsSuspendedUntil;
    }
  }

  for (const resolution of activeSummitResolutions) {
    if (!resolution.active || !resolution.passed) continue;
    const targets = getResolutionTargets(resolution, regions);
    for (const countryId of targets) {
      const result = checkResolutionCompliance(
        resolution,
        countryId,
        regions,
        prev.cycle,
        prev.cycleTradeOffers,
        prev.cycleCompletedTransfers
      );
      summitComplianceResults.push(result);
      if (!result.compliant) {
        const countryName = COUNTRY_CONFIGS[countryId].name;
        summitComplianceAlerts.push(
          `⚠️ ${countryName} is non-compliant with "${resolution.resolutionText}". Relations deteriorating.`
        );
        summitNonComplianceStrikes = {
          ...summitNonComplianceStrikes,
          [countryId]: (summitNonComplianceStrikes[countryId] ?? 0) + 1,
        };
        const yesVoters = getYesVoters(resolution);
        const ncRel = applySummitNonComplianceRelations(
          regions,
          countryId,
          yesVoters,
          resolution.resolutionText,
          prev.cycle,
          relationEvents,
          relationAlerts
        );
        regions = ncRel.regions;
        relationEvents = ncRel.relationEvents;
        relationAlerts = ncRel.relationAlerts;

        const prevEvents =
          factionCycleEventsFinal[countryId] ?? createEmptyFactionCycleEvents();
        factionCycleEventsFinal = {
          ...factionCycleEventsFinal,
          [countryId]: { ...prevEvents, summitNonCompliance: true },
        };
        const region = regions[countryId];
        regions = {
          ...regions,
          [countryId]: {
            ...region,
            factions: applyFactionSatisfactionChanges(region.factions, {
              ...prevEvents,
              summitNonCompliance: true,
            }),
          },
        };
      }
    }
  }

  activeSummitResolutions = activeSummitResolutions.map((r) => {
    if (
      shouldExpireResolution(
        r,
        regions,
        prev.cycle,
        worldHappiness,
        peakGlobalPopulation,
        currentGlobalPopulation,
        climateFinanceGiven
      )
    ) {
      return { ...r, active: false };
    }
    return r;
  });

  let pendingSummitVote = prev.pendingSummitVote;
  if (!pendingSummitVote && !prev.pendingSummitVote) {
    const breach = checkBoundariesInOrder({
      regions,
      globalTemperature,
      globalCo2ThisCycle: cycleCo2,
      worldHappiness,
      cycle: prev.cycle,
      climateFinanceGiven,
      peakGlobalPopulation,
      currentGlobalPopulation,
      cycleCo2ByCountry,
    });
    if (breach) {
      pendingSummitVote = createPendingVote(breach, prev.cycle);
    }
  }

  const nextCycle = prev.cycle + 1;
  const snapshotState: GameState = {
    ...prev,
    regions,
    tileBuildings,
    transitAgreements,
    transportRoutes,
    tradeAgreements,
    transportCapacityUsed,
    globalTemperature,
    worldHappiness,
    climateFinanceGiven,
    climateFinanceThisCycle: {},
    relationEvents,
    relationAlerts,
    activeSummitResolutions,
    pendingSummitVote,
    summitComplianceResults,
    summitComplianceAlerts,
    peakGlobalPopulation,
    cycleTradeOffers: [],
    cycleCompletedTransfers: [],
    tradeRestrictionSuspensionUntil,
    summitNonComplianceStrikes,
    cycle: nextCycle,
  };
  const comparisonRows = computeAllCountryComparisons(snapshotState);
  const gapScoreHistory = appendGapHistory(prev.gapScoreHistory, nextCycle, comparisonRows);
  const happinessHistory = appendHappinessHistory(prev.happinessHistory, nextCycle, snapshotState);
  const peakTracking = updatePeakGreenTracking(
    prev.peakGreenRatio,
    prev.peakGreenRatioCycle,
    nextCycle,
    snapshotState
  );

  return {
    ...snapshotState,
    gapScoreHistory,
    happinessHistory,
    peakGreenRatio: peakTracking.peakGreenRatio,
    peakGreenRatioCycle: peakTracking.peakGreenRatioCycle,
    cycleStartCo2: Object.fromEntries(
      ALL_COUNTRIES.map((id) => [id, regions[id].co2])
    ) as Partial<Record<CountryId, number>>,
    cycleStartCarbonTax: Object.fromEntries(
      ALL_COUNTRIES.map((id) => [id, regions[id].carbonTax])
    ) as Partial<Record<CountryId, number>>,
    previousCycleCo2: Object.fromEntries(
      ALL_COUNTRIES.map((id) => [id, regions[id].co2])
    ) as Partial<Record<CountryId, number>>,
    lastFactionTempThreshold,
    factionCycleEvents: factionCycleEventsFinal,
  };
}
