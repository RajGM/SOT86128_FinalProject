import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { CountryId, HexData } from "../types/hex";
import { COUNTRY_CONFIGS } from "../types/hex";
import type {
  GameState,
  BuildType,
  PlacedBuilding,
  TradeItem,
  TradeMode,
  TransitFeeModel,
  CarbonTaxRecycling,
} from "../types/game";
import {
  applyClimateFinanceGivenRelation,
  applyOneSidedRelation,
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
  hydrateGameState,
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
  canUpgradeTier,
  canPostTier3Upgrade,
  getPostTier3UpgradeCost,
  canBuildOnTile,
  canBuildInTerritory,
  canPlayerBuildOnHex,
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
import {
  resolveSubsidizedMoneyCost,
  snapCarbonTaxRate,
} from "../lib/carbonTaxMechanics";
import {
  getCarbonTaxCeiling,
  getCarbonTaxFloor,
  isTradeRestrictionSuspended,
  recordCompletedTransfer,
  recordTradeOffer,
} from "../lib/summitMechanics";
import { playSound } from "../audio/AudioManager";
import { resolveBotCountries, runBotTurns } from "../lib/botAI";

export interface MultiplayerConfig {
  roomId: string;
  playerId: string;
  isHost: boolean;
  assignedCountry: CountryId;
  playerName: string;
  syncedState?: GameState | null;
  syncedVersion?: number;
  onStateSync?: (state: GameState) => void;
  /** Countries with a connected human player (not bot-operated). */
  humanPlayerCountries?: CountryId[];
  botControlled?: Partial<Record<CountryId, boolean>>;
}

interface GameContextValue {
  hexes: HexData[];
  isTestScenario: boolean;
  multiplayer: MultiplayerConfig | null;
  gameState: GameState;
  selectedHex: HexData | null;
  setSelectedHex: (hex: HexData | null) => void;
  viewCountry: CountryId;
  /** Country used for build ownership checks — locked to assigned country in multiplayer. */
  playerBuildCountry: CountryId;
  setViewCountry: (id: CountryId) => void;
  resourcesExpanded: boolean;
  toggleResourcesExpanded: () => void;
  dashboardOpen: boolean;
  dashboardTab: "technology" | "diplomacy" | "trade" | "routes" | "summit";
  setDashboardOpen: (open: boolean) => void;
  setDashboardTab: (tab: "technology" | "diplomacy" | "trade" | "routes" | "summit") => void;
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
  setCarbonTaxRecycling: (countryId: CountryId, recycling: CarbonTaxRecycling) => void;
  highlightFacilityRoutes: (countryId: CountryId) => void;
  clearHighlightedRoutes: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  hexes,
  children,
  initialState,
  isTestScenario = false,
  multiplayer = null,
}: {
  hexes: HexData[];
  children: ReactNode;
  initialState?: GameState;
  isTestScenario?: boolean;
  multiplayer?: MultiplayerConfig | null;
}) {
  const [gameState, setGameStateInternal] = useState<GameState>(
    () =>
      initialState
        ? hydrateGameState(initialState, hexes)
        : createInitialGameState(hexes)
  );
  const lastSyncedVersion = useRef(0);
  const skipNextSync = useRef(false);
  const syncAllowedRef = useRef(!multiplayer);

  useEffect(() => {
    if (!multiplayer?.syncedState || multiplayer.syncedVersion === undefined) return;
    if (multiplayer.syncedVersion <= lastSyncedVersion.current) return;

    lastSyncedVersion.current = multiplayer.syncedVersion;
    syncAllowedRef.current = true;

    if (multiplayer.isHost) return;

    setGameStateInternal((prev) => {
      const remote = hydrateGameState(multiplayer.syncedState!, hexes);
      if (remote === prev) return prev;
      skipNextSync.current = true;
      return remote;
    });
  }, [multiplayer?.syncedState, multiplayer?.syncedVersion, multiplayer?.isHost, hexes]);

  const hexLookup = useMemo(() => createHexLookup(hexes), [hexes]);
  const [selectedHex, setSelectedHex] = useState<HexData | null>(null);
  const [viewCountry, setViewCountry] = useState<CountryId>(
    () => multiplayer?.assignedCountry ?? "usa"
  );

  const botCountries = useMemo(() => {
    if (multiplayer?.humanPlayerCountries) {
      return resolveBotCountries(multiplayer.humanPlayerCountries, multiplayer.botControlled);
    }
    return resolveBotCountries([viewCountry]);
  }, [multiplayer?.humanPlayerCountries, multiplayer?.botControlled, viewCountry]);

  const [resourcesExpanded, setResourcesExpanded] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<"technology" | "diplomacy" | "trade" | "routes" | "summit">("technology");
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [buildPanelOpen, setBuildPanelOpen] = useState(false);

  const setGameState = useCallback(
    (updater: GameState | ((prev: GameState) => GameState)) => {
      setGameStateInternal((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (multiplayer?.onStateSync && !skipNextSync.current && syncAllowedRef.current) {
          multiplayer.onStateSync(next);
        }
        skipNextSync.current = false;
        return next;
      });
    },
    [multiplayer]
  );

  useEffect(() => {
    if (!multiplayer?.assignedCountry) return;
    setViewCountry(multiplayer.assignedCountry);
  }, [multiplayer?.assignedCountry]);

  const playerBuildCountry = useMemo(() => {
    if (!gameState.testingMode && multiplayer?.assignedCountry) {
      return multiplayer.assignedCountry;
    }
    return viewCountry;
  }, [gameState.testingMode, multiplayer?.assignedCountry, viewCountry]);

  const toggleResourcesExpanded = useCallback(() => {
    setResourcesExpanded((v) => !v);
  }, []);

  const resolveRegionId = useCallback(
    (hex: HexData) => {
      if (!gameState.testingMode) {
        return multiplayer?.assignedCountry ?? viewCountry;
      }
      return !hex.countryId ? viewCountry : getRegionForHex(hex.countryId);
    },
    [gameState.testingMode, viewCountry, multiplayer?.assignedCountry]
  );

  const placeBuild = useCallback(
    (type: BuildType, tier: 1 | 2 | 3) => {
      if (!selectedHex) return;
      const build = getBuildDefinition(type);
      const key = tileKey(selectedHex.q, selectedHex.r);
      const regionId = resolveRegionId(selectedHex);

      let placed = false;
      setGameState((prev) => {
        const region = prev.regions[regionId];
        const baseCost = getBuildCost(build, tier);
        const techCost = getBuildTechCost(build, tier);
        const { cost, greenSubsidyPool } = resolveSubsidizedMoneyCost(region, type, baseCost);
        if (region.money < cost || region.technology < techCost) return prev;
        if (prev.tileBuildings[key]) return prev;

        const placement = canBuildOnTile(
          selectedHex,
          build,
          prev.tileBuildings,
          tier,
          prev.testingMode,
          hexLookup,
          region.technology,
          prev.testingMode ? undefined : playerBuildCountry
        );
        if (!placement.available) return prev;
        if (isConstructionBlocked(region.happiness)) return prev;

        const newBuilding = createPlacedBuilding(type, tier, selectedHex);
        if (prev.testingMode && !selectedHex.countryId) {
          newBuilding.countryId = regionId;
        }

        const prevEvents = prev.factionCycleEvents[regionId] ?? createEmptyFactionCycleEvents();
        const buildEvents = recordBuildFactionEvent(prevEvents, type);

        placed = true;
        return {
          ...prev,
          tileBuildings: { ...prev.tileBuildings, [key]: newBuilding },
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
              greenSubsidyPool,
            },
          },
        };
      });
      if (placed) playSound("build-place");
    },
    [selectedHex, resolveRegionId, hexLookup, playerBuildCountry]
  );

  const demolishBuild = useCallback(() => {
    if (!selectedHex) return;
    const key = tileKey(selectedHex.q, selectedHex.r);
    const regionId = resolveRegionId(selectedHex);

    let demolished = false;
    setGameState((prev) => {
      const territoryCheck = canBuildInTerritory(
        selectedHex,
        prev.testingMode ? undefined : playerBuildCountry,
        prev.testingMode
      );
      if (!territoryCheck.available) return prev;

      const existing = prev.tileBuildings[key];
      if (!existing) return prev;

      const build = getBuildDefinition(existing.type);
      const { demolitionFee, netMoneyChange } = getDemolishCost(build, existing.tier);
      const region = prev.regions[regionId];
      if (region.money < demolitionFee) return prev;

      const { [key]: _removed, ...remainingBuildings } = prev.tileBuildings;

      const disruptedRouteIds = new Set(
        prev.transportRoutes
          .filter((r) => r.fromHubId === existing.id)
          .map((r) => r.id)
      );

      demolished = true;
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
    if (demolished) playSound("build-demolish");
  }, [selectedHex, resolveRegionId, playerBuildCountry]);

  const upgradeBuild = useCallback(() => {
    if (!selectedHex) return;
    const key = tileKey(selectedHex.q, selectedHex.r);
    const regionId = resolveRegionId(selectedHex);

    let upgraded = false;
    setGameState((prev) => {
      const territoryCheck = canBuildInTerritory(
        selectedHex,
        prev.testingMode ? undefined : playerBuildCountry,
        prev.testingMode
      );
      if (!territoryCheck.available) return prev;

      const existing = prev.tileBuildings[key];
      if (!existing || !canUpgradeTier(existing.tier)) return prev;

      const build = getBuildDefinition(existing.type);
      const upgradeCost = getUpgradeCost(build, existing.tier);
      const upgradeTechCost = getUpgradeTechCost(build, existing.tier);
      if (upgradeCost === null) return prev;

      const region = prev.regions[regionId];
      const { cost: subsidizedUpgradeCost, greenSubsidyPool } = resolveSubsidizedMoneyCost(
        region,
        existing.type,
        upgradeCost
      );
      if (region.money < subsidizedUpgradeCost || region.technology < upgradeTechCost) return prev;

      const nextTier = (existing.tier + 1) as 2 | 3;

      if (existing.type === "transport_hub" && nextTier >= 2) {
        const hubCheck = canPlaceTransportHub(selectedHex, nextTier, hexLookup, prev.testingMode);
        if (!hubCheck.available) return prev;
      }

      upgraded = true;
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
            money: region.money - subsidizedUpgradeCost,
            technology: region.technology - upgradeTechCost,
            greenSubsidyPool,
          },
        },
      };
    });
    if (upgraded) playSound("build-upgrade");
  }, [selectedHex, resolveRegionId, hexLookup, playerBuildCountry]);

  const postTier3Upgrade = useCallback(() => {
    if (!selectedHex) return;
    const key = tileKey(selectedHex.q, selectedHex.r);
    const regionId = resolveRegionId(selectedHex);

    setGameState((prev) => {
      const territoryCheck = canBuildInTerritory(
        selectedHex,
        prev.testingMode ? undefined : playerBuildCountry,
        prev.testingMode
      );
      if (!territoryCheck.available) return prev;

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
  }, [selectedHex, resolveRegionId, playerBuildCountry]);

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
      let tradeSound: "trade-propose" | "trade-accept" | "trade-reject" | null = null;
      let playCoin = false;

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

        if (!canInitiateTrade(
          regions,
          from,
          to,
          isTradeRestrictionSuspended(prev, prev.cycle)
        )) {
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
          tradeSound = "trade-reject";
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
          let cycleCompletedTransfers = [...prev.cycleCompletedTransfers];
          let cycleTradeOffers = [...prev.cycleTradeOffers];

          if (shouldApplyClimateFinanceRelation(to, item)) {
            climateFinanceThisCycle = {
              ...climateFinanceThisCycle,
              [from]: (climateFinanceThisCycle[from] ?? 0) + amount,
            };
          }

          if (item === "food" || item === "energy" || item === "money" || item === "technology") {
            cycleTradeOffers = recordTradeOffer(cycleTradeOffers, from, to, item, amount, prev.cycle);
          }
          if (transferred && (item === "money" || item === "technology" || item === "food" || item === "energy")) {
            cycleCompletedTransfers = recordCompletedTransfer(
              cycleCompletedTransfers,
              from,
              to,
              item,
              amount,
              prev.cycle
            );
          }

          tradeSound = "trade-accept";
          if (item === "money") playCoin = true;

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
            cycleTradeOffers,
            cycleCompletedTransfers,
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

        let cycleTradeOffers = [...prev.cycleTradeOffers];
        if (item === "food" || item === "energy" || item === "money" || item === "technology") {
          cycleTradeOffers = recordTradeOffer(cycleTradeOffers, from, to, item, amount, prev.cycle);
        }

        tradeSound = "trade-propose";

        return {
          ...prev,
          transportRoutes,
          transitRequests,
          tradeAgreements: [...prev.tradeAgreements, agreement],
          tradePartners,
          regions: startRel.regions,
          relationEvents: startRel.relationEvents,
          relationAlerts: startRel.relationAlerts,
          cycleTradeOffers,
        };
      });

      if (tradeSound) playSound(tradeSound);
      if (playCoin) playSound("coin");
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
    let cancelled = false;
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

      cancelled = true;
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
    if (cancelled) playSound("trade-reject");
  }, []);

  const dismissRelationAlerts = useCallback(() => {
    setGameState((prev) => ({ ...prev, relationAlerts: [] }));
  }, []);

  const advanceCycle = useCallback(() => {
    setGameState((prev) => processCycle(runBotTurns(prev, hexes, botCountries), hexes));
  }, [hexes, botCountries]);

  const setCarbonTax = useCallback((countryId: CountryId, newRate: number) => {
    let changed = false;
    setGameState((prev) => {
      if (prev.gameMode && !prev.gameMode.enableCarbonTax) return prev;
      const region = prev.regions[countryId];
      const floor = getCarbonTaxFloor(prev, countryId);
      const ceiling = getCarbonTaxCeiling(prev, countryId) ?? 100;
      const clamped = snapCarbonTaxRate(newRate, floor, ceiling);
      if (clamped === region.carbonTax) return prev;

      changed = true;
      return {
        ...prev,
        regions: {
          ...prev.regions,
          [countryId]: { ...region, carbonTax: clamped },
        },
      };
    });
    if (changed) playSound("slider-tick");
  }, []);

  const setCarbonTaxRecycling = useCallback((countryId: CountryId, recycling: CarbonTaxRecycling) => {
    let changed = false;
    setGameState((prev) => {
      const region = prev.regions[countryId];
      if (region.carbonTaxRecycling === recycling) return prev;

      changed = true;
      return {
        ...prev,
        regions: {
          ...prev.regions,
          [countryId]: { ...region, carbonTaxRecycling: recycling },
        },
      };
    });
    if (changed) playSound("toggle");
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
    if (hex?.countryId && gameState.testingMode) {
      setViewCountry(hex.countryId);
    }
    const canBuild = canPlayerBuildOnHex(
      hex,
      gameState.testingMode,
      playerBuildCountry
    );
    setBuildPanelOpen(!!hex && canBuild);
    setGameState((prev) => ({ ...prev, highlightedRoutes: [] }));
  }, [gameState.testingMode, playerBuildCountry, setGameState]);

  return (
    <GameContext.Provider
      value={{
        hexes,
        isTestScenario,
        multiplayer,
        gameState,
        selectedHex,
        setSelectedHex: handleSetSelectedHex,
        viewCountry,
        playerBuildCountry,
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
        setCarbonTaxRecycling,
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
