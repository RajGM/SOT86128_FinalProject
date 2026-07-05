import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import type { CountryId, HexData } from "../types/hex";
import type {
  GameState,
  BuildType,
  PlacedBuilding,
  TradeItem,
  TradeMode,
  TransitFeeModel,
} from "../types/game";
import { createInitialGameState, getRegionForHex, co2TemperatureDelta, processCycle, applyTradeTransfer, getHubUpgradeMoneyCost, applyHubUpgradeFromTrade } from "../lib/gameState";
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
  cancelTransit: (agreementId: string) => void;
  acceptTransitTerms: (agreementId: string) => void;
  advanceCycle: () => void;
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

        return {
          ...prev,
          tileBuildings: { ...prev.tileBuildings, [key]: placed },
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
        const transportUnits = item === "hub_upgrade" ? 0 : amount;

        if (transportUnits > 0 && used + transportUnits > capacity) return prev;

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
          let regions = { ...prev.regions };

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

          return {
            ...prev,
            tileBuildings,
            transportRoutes,
            transitRequests,
            tradeAgreements: [...prev.tradeAgreements, agreement],
            regions,
            transportCapacityUsed: {
              ...prev.transportCapacityUsed,
              [from]: used + transportUnits,
            },
            globalTemperature: prev.globalTemperature + co2TemperatureDelta(co2),
          };
        }

        return {
          ...prev,
          transportRoutes,
          transitRequests,
          tradeAgreements: [...prev.tradeAgreements, agreement],
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

        if (!accept) {
          return {
            ...prev,
            transitRequests: updatedRequests,
            transportRoutes: prev.transportRoutes.map((r) =>
              r.id === request.routeId ? { ...r, status: "disrupted" as const } : r
            ),
            tradeAgreements: prev.tradeAgreements.map((a) =>
              a.routeId === request.routeId ? { ...a, active: false } : a
            ),
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

        return {
          ...prev,
          transitRequests: updatedRequests,
          transitAgreements: [...prev.transitAgreements, agreement],
          transportRoutes,
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

  const cancelTransit = useCallback((agreementId: string) => {
    setGameState((prev) => {
      const agreement = prev.transitAgreements.find((a) => a.id === agreementId);
      if (!agreement) return prev;

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
      };
    });
  }, []);

  const advanceCycle = useCallback(() => {
    setGameState((prev) => processCycle(prev, hexes));
  }, [hexes]);

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
        respondTransitRequest,
        cancelTransit,
        acceptTransitTerms,
        highlightFacilityRoutes,
        clearHighlightedRoutes,
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
