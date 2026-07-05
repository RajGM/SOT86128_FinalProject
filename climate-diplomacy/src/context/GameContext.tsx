import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { CountryId, HexData } from "../types/hex";
import { COUNTRY_CONFIGS } from "../types/hex";
import type {
  GameState,
  BuildType,
  PlacedBuilding,
  TradeItem,
  TradeMode,
  TransitFeeModel,
} from "../types/game";
import {
  applyClimateFinanceGivenRelation,
  applyOneSidedRelation,
  applySummitVoteRelations,
  applyTradeRelationEffects,
  applyTransitApprovedRelations,
  canInitiateTrade,
  getTradeTransportUnits,
  markTradePartners,
  RELATION_EVENT_DELTAS,
  shouldApplyClimateFinanceRelation,
} from "../lib/relationMechanics";
import {
  createInitialGameState,
  getRegionForHex,
  co2TemperatureDelta,
  processCycle,
  applyTradeTransfer,
  getHubUpgradeMoneyCost,
  applyHubUpgradeFromTrade,
  applyClimateFinanceUpdate,
} from "../lib/gameState";
import {
  createPlacedBuilding,
  getBuildCost,
  getBuildTechCost,
  getBuildDefinition,
  getDemolishCost,
  getUpgradeCost,
  getUpgradeTechCost,
  canAffordBuild,
  canAffordUpgrade,
  canUpgradeTier,
  canPostTier3Upgrade,
  getPostTier3UpgradeCost,
  canBuildOnTile,
  canPlaceTransportHub,
} from "../lib/buildRules";
import { createHexLookup } from "../lib/hexUtils";
import {
  createTradeAgreement,
  createTransportRoute,
  createTransitRequests,
  createTransitAgreement,
} from "../lib/tradeRules";
import { findBestRoute, findRouteOptions, findExistingRoute, type RouteOption } from "../lib/routeDetection";
import { getCountryTotalCapacity } from "../lib/transportHub";
import { tileKey } from "../types/game";
import { BUILD_BY_ID } from "../config/builds";
import { isConstructionBlocked } from "../lib/populationMechanics";
import {
  createEmptyFactionCycleEvents,
  recordBuildFactionEvent,
} from "../lib/factionMechanics";

interface GameContextValue {
  hexes: HexData[];
  gameState: GameState;
  selectedHex: HexData | null;
  setSelectedHex: (hex: HexData | null) => void;
  viewCountry: CountryId;
  setViewCountry: (id: CountryId) => void;
  resourcesExpanded: boolean;
  toggleResourcesExpanded: () => void;
  dashboardOpen: boolean;
  dashboardTab: "technology" | "diplomacy" | "trade" | "routes";
  setDashboardOpen: (open: boolean) => void;
  setDashboardTab: (tab: "technology" | "diplomacy" | "trade" | "routes") => void;
  comparisonOpen: boolean;
  setComparisonOpen: (open: boolean) => void;
  buildPanelOpen: boolean;
  setBuildPanelOpen: (open: boolean) => void;
  placeBuild: (type: BuildType, tier: 1 | 2 | 3) => void;
  demolishBuild: () => void;
  upgradeBuild: () => void;
  postTier3Upgrade: () => void;
  getRoutePreview: (from: CountryId, to: CountryId) => RouteOption | null;
  getTransportCapacity: (countryId: CountryId) => { total: number; used: number; remaining: number };
  proposeTrade: (
    from: CountryId,
    to: CountryId,
    item: TradeItem,
    amount: number,
    tradeMode?: TradeMode,
    hubUpgrade?: {
      hubUpgradeBuildingId: string;
      hubUpgradeToTier?: 2 | 3;
      hubUpgradeExtraLevels?: number;
      hubUpgradePayer?: CountryId;
    }
  ) => void;
  respondTransitRequest: (requestId: string, feeModel: TransitFeeModel, feeAmount: number, accept: boolean) => void;
  cancelTransit: (agreementId: string, cancelledBy: CountryId) => void;
  cancelTrade: (tradeId: string) => void;
  acceptTransitTerms: (agreementId: string) => void;
  advanceCycle: () => void;
  dismissRelationAlerts: () => void;
  setCarbonTax: (countryId: CountryId, newRate: number) => void;
  recordSummitVote: (countryId: CountryId, votedYes: boolean) => void;
  highlightFacilityRoutes: (countryId: CountryId) => void;
  clearHighlightedRoutes: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ hexes, children }: { hexes: HexData[]; children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState(hexes));
  const hexLookup = useMemo(() => createHexLookup(hexes), [hexes]);
  const [selectedHex, setSelectedHex] = useState<HexData | null>(null);
  const [viewCountry, setViewCountry] = useState<CountryId>("usa");
  const [resourcesExpanded, setResourcesExpanded] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<"technology" | "diplomacy" | "trade" | "routes">("technology");
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [buildPanelOpen, setBuildPanelOpen] = useState(false);

  const toggleResourcesExpanded = useCallback(() => {
    setResourcesExpanded((v) => !v);
  }, []);

  const resolveRegionId = useCallback(
    (hex: HexData) =>
      gameState.testingMode && !hex.countryId ? viewCountry : getRegionForHex(hex.countryId),
    [gameState.testingMode, viewCountry]
  );

  const placeBuild = useCallback(
    (type: BuildType, tier: 1 | 2 | 3) => {
      if (!selectedHex) return;
      const build = getBuildDefinition(type);
      const key = tileKey(selectedHex.q, selectedHex.r);
      const regionId = resolveRegionId(selectedHex);

      setGameState((prev) => {
        const region = prev.regions[regionId];
        if (prev.tileBuildings[key]) return prev;
        if (!canAffordBuild(region.money, region.technology, build, tier)) return prev;

        const placement = canBuildOnTile(
          selectedHex,
          build,
          prev.tileBuildings,
          tier,
          prev.testingMode,
          hexLookup,
          region.technology
        );
        if (!placement.available) return prev;
        if (isConstructionBlocked(region.happiness)) return prev;

        const placed = createPlacedBuilding(type, tier, selectedHex);
        if (prev.testingMode && !selectedHex.countryId) {
          placed.countryId = regionId;
        }

        const cost = getBuildCost(build, tier);
        const techCost = getBuildTechCost(build, tier);

        const prevEvents = prev.factionCycleEvents[regionId] ?? createEmptyFactionCycleEvents();
        const buildEvents = recordBuildFactionEvent(prevEvents, type);

        return {
          ...prev,
          tileBuildings: { ...prev.tileBuildings, [key]: placed },
          factionCycleEvents: {
            ...prev.factionCycleEvents,
            [regionId]: buildEvents,
          },
          regions: {
            ...prev.regions,
            [regionId]: {
              ...region,
              money: region.money - cost,
              technology: region.technology - techCost,
            },
          },
        };
      });
    },
    [selectedHex, resolveRegionId, hexLookup]
  );

  const demolishBuild = useCallback(() => {
    if (!selectedHex) return;
    const key = tileKey(selectedHex.q, selectedHex.r);
    const regionId = resolveRegionId(selectedHex);

    setGameState((prev) => {
      const existing = prev.tileBuildings[key];
      if (!existing) return prev;

      const build = getBuildDefinition(existing.type);
      const { demolitionFee, netMoneyChange } = getDemolishCost(build, existing.tier);
      const region = prev.regions[regionId];
      if (region.money < demolitionFee) return prev;

      const { [key]: _removed, ...remainingBuildings } = prev.tileBuildings;

      // Disrupt routes using this facility
      const disruptedRouteIds = new Set(
        prev.transportRoutes
          .filter((r) => r.fromHubId === existing.id)
          .map((r) => r.id)
      );

      return {
        ...prev,
        tileBuildings: remainingBuildings,
        transportRoutes: prev.transportRoutes.map((r) =>
          disruptedRouteIds.has(r.id) ? { ...r, status: "disrupted" as const } : r
        ),
        tradeAgreements: prev.tradeAgreements.map((a) =>
          disruptedRouteIds.has(a.routeId) ? { ...a, active: false } : a
        ),
        regions: {
          ...prev.regions,
          [regionId]: {
            ...region,
            money: region.money + netMoneyChange,
          },
        },
      };
    });
  }, [selectedHex, resolveRegionId]);

  const upgradeBuild = useCallback(() => {
    if (!selectedHex) return;
    const key = tileKey(selectedHex.q, selectedHex.r);
    const regionId = resolveRegionId(selectedHex);

    setGameState((prev) => {
      const existing = prev.tileBuildings[key];
      if (!existing || !canUpgradeTier(existing.tier)) return prev;

      const build = getBuildDefinition(existing.type);
      const upgradeCost = getUpgradeCost(build, existing.tier);
      const upgradeTechCost = getUpgradeTechCost(build, existing.tier);
      if (upgradeCost === null) return prev;

      const region = prev.regions[regionId];
      if (!canAffordUpgrade(region.money, region.technology, build, existing.tier)) return prev;

      const nextTier = (existing.tier + 1) as 2 | 3;

      if (existing.type === "transport_hub" && nextTier >= 2) {
        const hubCheck = canPlaceTransportHub(selectedHex, nextTier, hexLookup, prev.testingMode);
        if (!hubCheck.available) return prev;
      }

      return {
        ...prev,
        tileBuildings: {
          ...prev.tileBuildings,
          [key]: { ...existing, tier: nextTier },
        },
        regions: {
          ...prev.regions,
          [regionId]: {
            ...region,
            money: region.money - upgradeCost,
            technology: region.technology - upgradeTechCost,
          },
        },
      };
    });
  }, [selectedHex, resolveRegionId]);

  const postTier3Upgrade = useCallback(() => {
    if (!selectedHex) return;
    const key = tileKey(selectedHex.q, selectedHex.r);
    const regionId = resolveRegionId(selectedHex);

    setGameState((prev) => {
      const existing = prev.tileBuildings[key];
      if (!existing || !canPostTier3Upgrade(existing.type, existing.tier)) return prev;

      const build = getBuildDefinition(existing.type);
      const extraLevel = existing.extraLevel ?? 0;
      const cost = getPostTier3UpgradeCost(build, extraLevel);
      const region = prev.regions[regionId];
      if (region.money < cost) return prev;

      return {
        ...prev,
        tileBuildings: {
          ...prev.tileBuildings,
          [key]: { ...existing, extraLevel: extraLevel + 1 },
        },
        regions: {
          ...prev.regions,
          [regionId]: { ...region, money: region.money - cost },
        },
      };
    });
  }, [selectedHex, resolveRegionId, hexLookup]);

  const buildingsList = useMemo(
    () => Object.values(gameState.tileBuildings),
    [gameState.tileBuildings]
  );

  const getRoutePreview = useCallback(
    (from: CountryId, to: CountryId): RouteOption | null => {
      return findBestRoute(
        from,
        to,
        buildingsList,
        hexes,
        gameState.transitAgreements
      );
    },
    [buildingsList, hexes, gameState.transitAgreements]
  );

  const getTransportCapacity = useCallback(
    (countryId: CountryId) => {
      const total = getCountryTotalCapacity(countryId, buildingsList);
      const used = gameState.transportCapacityUsed[countryId] ?? 0;
      return { total, used, remaining: Math.max(0, total - used) };
    },
    [buildingsList, gameState.transportCapacityUsed]
  );

  const proposeTrade = useCallback(
    (
      from: CountryId,
      to: CountryId,
      item: TradeItem,
      amount: number,
      tradeMode: TradeMode = "one_time",
      hubUpgrade?: {
        hubUpgradeBuildingId: string;
        hubUpgradeToTier?: 2 | 3;
        hubUpgradeExtraLevels?: number;
        hubUpgradePayer?: CountryId;
      }
    ) => {
      setGameState((prev) => {
        if (amount <= 0) return prev;

        const buildings = Object.values(prev.tileBuildings);
        const capacity = getCountryTotalCapacity(from, buildings);
        const used = prev.transportCapacityUsed[from] ?? 0;
        const transportUnits = item === "hub_upgrade" ? 0 : getTradeTransportUnits(prev.regions, from, to, amount);

        if (transportUnits > 0 && used + transportUnits > capacity) return prev;

        let tradePartners = markTradePartners(prev.tradePartners, from, to);
        let regions = prev.regions;
        let relationEvents = [...prev.relationEvents];
        let relationAlerts = [...prev.relationAlerts];

        if (!canInitiateTrade(regions, from, to)) {
          const toName = COUNTRY_CONFIGS[to].name;
          const rejectResult = applyOneSidedRelation(
            regions,
            from,
            to,
            RELATION_EVENT_DELTAS.trade_rejected,
            "trade_rejected",
            prev.cycle,
            `Trade proposal rejected by ${toName}`,
            relationEvents,
            relationAlerts
          );
          return {
            ...prev,
            tradePartners,
            regions: rejectResult.regions,
            relationEvents: rejectResult.relationEvents,
            relationAlerts: rejectResult.relationAlerts,
          };
        }

        let route = item === "hub_upgrade"
          ? { id: "hub-upgrade", status: "active" as const, emissionsPerUnit: 0, from: from, to: to, routeType: "land" as const, path: [from, to] }
          : findExistingRoute(from, to, prev.transportRoutes);
        let transportRoutes = prev.transportRoutes;
        let transitRequests = prev.transitRequests;

        if (item !== "hub_upgrade" && !route) {
          const option = findBestRoute(from, to, buildings, hexes, prev.transitAgreements);
          if (!option) return prev;

          const newRoute = createTransportRoute(option);
          route = newRoute;
          transportRoutes = [...transportRoutes, newRoute];
          if (option.transitRegions.length > 0) {
            transitRequests = [...transitRequests, ...createTransitRequests(newRoute)];
          }

          if (option.needsTransitApproval) {
            return {
              ...prev,
              transportRoutes,
              transitRequests,
            };
          }
        }

        if (!route || route.status !== "active") return prev;

        const agreement = createTradeAgreement(
          from,
          to,
          item,
          amount,
          route.id,
          tradeMode,
          hubUpgrade
        );

        if (tradeMode === "one_time") {
          const co2 = (route.emissionsPerUnit ?? 0) * transportUnits;
          const fromR = prev.regions[from];
          const toR = prev.regions[to];

          let transferred = applyTradeTransfer(fromR, toR, item, amount);
          if (item !== "hub_upgrade" && !transferred) return prev;

          let tileBuildings = prev.tileBuildings;

          if (item === "hub_upgrade" && hubUpgrade) {
            const upgraded = applyHubUpgradeFromTrade(tileBuildings, agreement);
            if (!upgraded) return prev;
            tileBuildings = upgraded;
            const upgradeCost = getHubUpgradeMoneyCost(agreement);
            const payer = hubUpgrade.hubUpgradePayer ?? from;
            if (upgradeCost > 0) {
              if (regions[payer].money < upgradeCost) return prev;
              regions = {
                ...regions,
                [payer]: { ...regions[payer], money: regions[payer].money - upgradeCost },
              };
            }
          } else if (transferred) {
            const fromWithCo2 =
              co2 > 0
                ? { ...transferred.from, co2: transferred.from.co2 + co2 }
                : transferred.from;
            regions = { ...regions, [from]: fromWithCo2, [to]: transferred.to };
          }

          let tradeRel = applyTradeRelationEffects(
            regions,
            from,
            to,
            item,
            amount,
            prev.cycle,
            relationEvents,
            relationAlerts
          );
          regions = tradeRel.regions;
          relationEvents = tradeRel.relationEvents;
          relationAlerts = tradeRel.relationAlerts;

          if (shouldApplyClimateFinanceRelation(to, item)) {
            const cfRel = applyClimateFinanceGivenRelation(
              regions,
              from,
              to,
              prev.cycle,
              relationEvents,
              relationAlerts
            );
            regions = cfRel.regions;
            relationEvents = cfRel.relationEvents;
            relationAlerts = cfRel.relationAlerts;
          }

          let climateFinanceThisCycle = { ...prev.climateFinanceThisCycle };
          if (shouldApplyClimateFinanceRelation(to, item)) {
            climateFinanceThisCycle = {
              ...climateFinanceThisCycle,
              [from]: (climateFinanceThisCycle[from] ?? 0) + amount,
            };
          }

          return {
            ...prev,
            tileBuildings,
            transportRoutes,
            transitRequests,
            tradeAgreements: [...prev.tradeAgreements, agreement],
            tradePartners,
            regions,
            relationEvents,
            relationAlerts,
            climateFinanceGiven: applyClimateFinanceUpdate(
              prev.climateFinanceGiven,
              from,
              to,
              item,
              amount
            ),
            climateFinanceThisCycle,
            transportCapacityUsed: {
              ...prev.transportCapacityUsed,
              [from]: used + transportUnits,
            },
            globalTemperature: prev.globalTemperature + co2TemperatureDelta(co2),
          };
        }

        const startRel = applyTradeRelationEffects(
          regions,
          from,
          to,
          item,
          amount,
          prev.cycle,
          relationEvents,
          relationAlerts
        );

        return {
          ...prev,
          transportRoutes,
          transitRequests,
          tradeAgreements: [...prev.tradeAgreements, agreement],
          tradePartners,
          regions: startRel.regions,
          relationEvents: startRel.relationEvents,
          relationAlerts: startRel.relationAlerts,
        };
      });
    },
    [hexes]
  );

  const respondTransitRequest = useCallback(
    (requestId: string, feeModel: TransitFeeModel, feeAmount: number, accept: boolean) => {
      setGameState((prev) => {
        const request = prev.transitRequests.find((r) => r.id === requestId);
        if (!request || request.status !== "pending") return prev;

        const updatedRequests = prev.transitRequests.map((r) =>
          r.id === requestId ? { ...r, status: "responded" as const } : r
        );

        let tradePartners = markTradePartners(prev.tradePartners, request.traderFrom, request.traderTo);
        tradePartners = markTradePartners(tradePartners, request.transitRegion, request.traderFrom);
        tradePartners = markTradePartners(tradePartners, request.transitRegion, request.traderTo);

        if (!accept) {
          const denierName = COUNTRY_CONFIGS[request.transitRegion].name;
          let regions = prev.regions;
          let relationEvents = [...prev.relationEvents];
          let relationAlerts = [...prev.relationAlerts];

          for (const trader of [request.traderFrom, request.traderTo]) {
            const result = applyOneSidedRelation(
              regions,
              trader,
              request.transitRegion,
              RELATION_EVENT_DELTAS.transit_denied,
              "transit_denied",
              prev.cycle,
              `Transit denied by ${denierName}`,
              relationEvents,
              relationAlerts
            );
            regions = result.regions;
            relationEvents = result.relationEvents;
            relationAlerts = result.relationAlerts;
          }

          return {
            ...prev,
            transitRequests: updatedRequests,
            transportRoutes: prev.transportRoutes.map((r) =>
              r.id === request.routeId ? { ...r, status: "disrupted" as const } : r
            ),
            tradeAgreements: prev.tradeAgreements.map((a) =>
              a.routeId === request.routeId ? { ...a, active: false } : a
            ),
            tradePartners,
            regions,
            relationEvents,
            relationAlerts,
          };
        }

        const route = prev.transportRoutes.find((r) => r.id === request.routeId);
        if (!route) return prev;

        const agreement = createTransitAgreement(route, request.transitRegion, feeModel, feeAmount, route.from);

        const allTransitRegions = route.path.slice(1, -1);
        const respondedRegions = updatedRequests
          .filter((r) => r.routeId === request.routeId && r.status === "responded")
          .map((r) => r.transitRegion);
        const activeAgreements = prev.transitAgreements.filter(
          (a) => a.routeId === request.routeId && a.status === "active"
        );
        const allApproved = respondedRegions.length >= allTransitRegions.length;

        let transportRoutes = prev.transportRoutes;
        if (allApproved && activeAgreements.length + 1 >= allTransitRegions.length) {
          transportRoutes = prev.transportRoutes.map((r) =>
            r.id === request.routeId ? { ...r, status: "active" as const } : r
          );
        }

        const approveRel = applyTransitApprovedRelations(
          prev.regions,
          request.transitRegion,
          request.traderFrom,
          request.traderTo,
          prev.cycle,
          prev.relationEvents,
          prev.relationAlerts
        );

        return {
          ...prev,
          transitRequests: updatedRequests,
          transitAgreements: [...prev.transitAgreements, agreement],
          transportRoutes,
          tradePartners,
          regions: approveRel.regions,
          relationEvents: approveRel.relationEvents,
          relationAlerts: approveRel.relationAlerts,
        };
      });
    },
    []
  );

  const acceptTransitTerms = useCallback((agreementId: string) => {
    setGameState((prev) => {
      const agreement = prev.transitAgreements.find((a) => a.id === agreementId);
      if (!agreement || agreement.status !== "pending") return prev;

      const updatedAgreements = prev.transitAgreements.map((a) =>
        a.id === agreementId ? { ...a, status: "active" as const } : a
      );

      const route = prev.transportRoutes.find((r) => r.id === agreement.routeId);
      if (!route) return { ...prev, transitAgreements: updatedAgreements };

      const allTransitRegions = route.path.slice(1, -1);
      const activeForRoute = updatedAgreements.filter(
        (a) => a.routeId === agreement.routeId && a.status === "active"
      );

      let transportRoutes = prev.transportRoutes;
      if (activeForRoute.length >= allTransitRegions.length) {
        transportRoutes = prev.transportRoutes.map((r) =>
          r.id === agreement.routeId ? { ...r, status: "active" as const } : r
        );
      }

      const payer = prev.regions[agreement.payer];
      const transitRegion = prev.regions[agreement.transitRegion];
      let regions = prev.regions;

      if (agreement.feeModel === "flat" && payer.money >= agreement.feeAmount) {
        regions = {
          ...regions,
          [agreement.payer]: { ...payer, money: payer.money - agreement.feeAmount },
          [agreement.transitRegion]: { ...transitRegion, money: transitRegion.money + agreement.feeAmount },
        };
      }

      return { ...prev, transitAgreements: updatedAgreements, transportRoutes, regions };
    });
  }, []);

  const cancelTransit = useCallback((agreementId: string, cancelledBy: CountryId) => {
    setGameState((prev) => {
      const agreement = prev.transitAgreements.find((a) => a.id === agreementId);
      if (!agreement) return prev;

      let regions = prev.regions;
      let relationEvents = [...prev.relationEvents];
      let relationAlerts = [...prev.relationAlerts];

      if (cancelledBy === agreement.transitRegion) {
        const cancellerName = COUNTRY_CONFIGS[agreement.transitRegion].name;
        for (const trader of [agreement.traderFrom, agreement.traderTo]) {
          const result = applyOneSidedRelation(
            regions,
            trader,
            agreement.transitRegion,
            RELATION_EVENT_DELTAS.transit_cancelled,
            "transit_cancelled",
            prev.cycle,
            `Transit cancelled by ${cancellerName}`,
            relationEvents,
            relationAlerts
          );
          regions = result.regions;
          relationEvents = result.relationEvents;
          relationAlerts = result.relationAlerts;
        }
      }

      return {
        ...prev,
        transitAgreements: prev.transitAgreements.map((a) =>
          a.id === agreementId ? { ...a, status: "cancelled" as const } : a
        ),
        transportRoutes: prev.transportRoutes.map((r) =>
          r.id === agreement.routeId ? { ...r, status: "disrupted" as const } : r
        ),
        tradeAgreements: prev.tradeAgreements.map((a) =>
          a.routeId === agreement.routeId ? { ...a, active: false } : a
        ),
        regions,
        relationEvents,
        relationAlerts,
      };
    });
  }, []);

  const cancelTrade = useCallback((tradeId: string) => {
    setGameState((prev) => {
      const trade = prev.tradeAgreements.find((t) => t.id === tradeId);
      if (!trade || !trade.active) return prev;

      const senderName = COUNTRY_CONFIGS[trade.from].name;
      const cancelResult = applyOneSidedRelation(
        prev.regions,
        trade.to,
        trade.from,
        RELATION_EVENT_DELTAS.trade_cancelled,
        "trade_cancelled",
        prev.cycle,
        `Trade deal cancelled by ${senderName}`,
        prev.relationEvents,
        prev.relationAlerts
      );

      return {
        ...prev,
        tradeAgreements: prev.tradeAgreements.map((t) =>
          t.id === tradeId ? { ...t, active: false } : t
        ),
        regions: cancelResult.regions,
        relationEvents: cancelResult.relationEvents,
        relationAlerts: cancelResult.relationAlerts,
      };
    });
  }, []);

  const dismissRelationAlerts = useCallback(() => {
    setGameState((prev) => ({ ...prev, relationAlerts: [] }));
  }, []);

  const advanceCycle = useCallback(() => {
    setGameState((prev) => processCycle(prev, hexes));
  }, [hexes]);

  const setCarbonTax = useCallback((countryId: CountryId, newRate: number) => {
    setGameState((prev) => {
      const region = prev.regions[countryId];
      const clamped = Math.max(0, Math.min(100, newRate));
      const delta = clamped - region.carbonTax;
      if (delta === 0) return prev;

      const prevEvents = prev.factionCycleEvents[countryId] ?? createEmptyFactionCycleEvents();
      const events = {
        ...prevEvents,
        carbonTaxIncrease: delta > 0 ? prevEvents.carbonTaxIncrease + delta : prevEvents.carbonTaxIncrease,
        carbonTaxDecrease: delta < 0 ? prevEvents.carbonTaxDecrease + Math.abs(delta) : prevEvents.carbonTaxDecrease,
      };

      return {
        ...prev,
        regions: {
          ...prev.regions,
          [countryId]: { ...region, carbonTax: clamped },
        },
        factionCycleEvents: {
          ...prev.factionCycleEvents,
          [countryId]: events,
        },
      };
    });
  }, []);

  const recordSummitVote = useCallback((countryId: CountryId, votedYes: boolean) => {
    const resolution = "Emission Limits";
    setGameState((prev) => {
      const prevEvents = prev.factionCycleEvents[countryId] ?? createEmptyFactionCycleEvents();
      const events = {
        ...prevEvents,
        votedYesEmissionLimits: votedYes || prevEvents.votedYesEmissionLimits,
        votedNoEmissionLimits: !votedYes || prevEvents.votedNoEmissionLimits,
      };
      if (votedYes) {
        events.votedNoEmissionLimits = false;
      } else {
        events.votedYesEmissionLimits = false;
      }

      const voteChoice = votedYes ? ("yes" as const) : ("no" as const);
      const summitVotes = [...prev.summitVotes];
      const existingIndex = summitVotes.findIndex(
        (v) => v.cycle === prev.cycle && v.resolution === resolution
      );
      let record;
      if (existingIndex >= 0) {
        record = {
          ...summitVotes[existingIndex],
          votes: { ...summitVotes[existingIndex].votes, [countryId]: voteChoice },
        };
        summitVotes[existingIndex] = record;
      } else {
        record = { cycle: prev.cycle, resolution, votes: { [countryId]: voteChoice } };
        summitVotes.push(record);
      }

      const summitRel = applySummitVoteRelations(
        prev.regions,
        countryId,
        voteChoice,
        record,
        prev.cycle,
        prev.relationEvents,
        prev.relationAlerts
      );

      return {
        ...prev,
        summitVotes,
        regions: summitRel.regions,
        relationEvents: summitRel.relationEvents,
        relationAlerts: summitRel.relationAlerts,
        factionCycleEvents: {
          ...prev.factionCycleEvents,
          [countryId]: events,
        },
      };
    });
  }, []);

  const highlightFacilityRoutes = useCallback((countryId: CountryId) => {
    setGameState((prev) => {
      const routeIds = prev.transportRoutes
        .filter((r) => r.from === countryId || r.to === countryId)
        .map((r) => r.id);
      return { ...prev, highlightedRoutes: routeIds };
    });
  }, []);

  const clearHighlightedRoutes = useCallback(() => {
    setGameState((prev) => ({ ...prev, highlightedRoutes: [] }));
  }, []);

  const handleSetSelectedHex = useCallback((hex: HexData | null) => {
    setSelectedHex(hex);
    if (hex?.countryId) setViewCountry(hex.countryId);
    setBuildPanelOpen(!!hex);
    setGameState((prev) => ({ ...prev, highlightedRoutes: [] }));
  }, []);

  return (
    <GameContext.Provider
      value={{
        hexes,
        gameState,
        selectedHex,
        setSelectedHex: handleSetSelectedHex,
        viewCountry,
        setViewCountry,
        resourcesExpanded,
        toggleResourcesExpanded,
        dashboardOpen,
        dashboardTab,
        setDashboardOpen,
        setDashboardTab,
        comparisonOpen,
        setComparisonOpen,
        buildPanelOpen,
        setBuildPanelOpen,
        placeBuild,
        demolishBuild,
        upgradeBuild,
        postTier3Upgrade,
        getRoutePreview,
        getTransportCapacity,
        proposeTrade,
        advanceCycle,
        setCarbonTax,
        recordSummitVote,
        respondTransitRequest,
        cancelTransit,
        cancelTrade,
        acceptTransitTerms,
        highlightFacilityRoutes,
        clearHighlightedRoutes,
        dismissRelationAlerts,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

export { BUILD_BY_ID };
