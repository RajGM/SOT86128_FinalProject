import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { CountryId, HexData } from "../types/hex";
import type {
  GameState,
  BuildType,
  PlacedBuilding,
  TradeItem,
  TradeMode,
  TransitFeeModel,
} from "../types/game";
import { createInitialGameState, getRegionForHex, applyEffectsToRegion, co2TemperatureDelta, processCycle } from "../lib/gameState";
import {
  createPlacedBuilding,
  getBuildCost,
  getBuildDefinition,
  getDemolishCost,
  getUpgradeCost,
  getEffectDelta,
  reverseEffects,
  canUpgradeTier,
  canPostTier3Upgrade,
  getPostTier3UpgradeCost,
} from "../lib/buildRules";
import {
  createTradeAgreement,
  createTransportRoute,
  createTransitRequests,
  createTransitAgreement,
} from "../lib/tradeRules";
import { findRouteOptions, type RouteOption } from "../lib/routeDetection";
import { applyResearchUpgrade } from "../lib/research";
import type { BuildCategory } from "../types/game";
import { tileKey } from "../types/game";
import { BUILD_BY_ID } from "../config/builds";

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
  dashboardTab: "research" | "diplomacy" | "trade" | "routes";
  setDashboardOpen: (open: boolean) => void;
  setDashboardTab: (tab: "research" | "diplomacy" | "trade" | "routes") => void;
  buildPanelOpen: boolean;
  setBuildPanelOpen: (open: boolean) => void;
  placeBuild: (type: BuildType, tier: 1 | 2 | 3) => void;
  demolishBuild: () => void;
  upgradeBuild: () => void;
  postTier3Upgrade: () => void;
  getRouteOptions: (from: CountryId, to: CountryId) => RouteOption[];
  createRoute: (option: RouteOption) => void;
  proposeTrade: (from: CountryId, to: CountryId, item: TradeItem, amount: number, routeId: string, tradeMode?: TradeMode) => void;
  agreeBreakthrough: (country: CountryId) => void;
  joinCombinedResearch: (projectId: string, country: CountryId, amount: number) => void;
  purchaseResearchLicense: (licenseId: string, buyer: CountryId) => void;
  applyIncrementalResearch: (category: BuildCategory) => void;
  respondTransitRequest: (requestId: string, feeModel: TransitFeeModel, feeAmount: number, accept: boolean) => void;
  cancelTransit: (agreementId: string) => void;
  acceptTransitTerms: (agreementId: string) => void;
  advanceCycle: () => void;
  highlightFacilityRoutes: (countryId: CountryId) => void;
  clearHighlightedRoutes: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ hexes, children }: { hexes: HexData[]; children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [selectedHex, setSelectedHex] = useState<HexData | null>(null);
  const [viewCountry, setViewCountry] = useState<CountryId>("usa");
  const [resourcesExpanded, setResourcesExpanded] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<"research" | "diplomacy" | "trade" | "routes">("research");
  const [buildPanelOpen, setBuildPanelOpen] = useState(false);

  const toggleResourcesExpanded = useCallback(() => {
    setResourcesExpanded((v) => !v);
  }, []);

  const placeBuild = useCallback(
    (type: BuildType, tier: 1 | 2 | 3) => {
      if (!selectedHex) return;
      const build = getBuildDefinition(type);
      const cost = getBuildCost(build, tier);
      const key = tileKey(selectedHex.q, selectedHex.r);
      const regionId = getRegionForHex(selectedHex.countryId);
      const effects = build.effectsByTier[tier];

      setGameState((prev) => {
        const region = prev.regions[regionId];
        if (region.money < cost || prev.tileBuildings[key]) return prev;

        const placed = createPlacedBuilding(type, tier, selectedHex);
        return {
          ...prev,
          tileBuildings: { ...prev.tileBuildings, [key]: placed },
          regions: {
            ...prev.regions,
            [regionId]: applyEffectsToRegion(
              { ...region, money: region.money - cost },
              effects
            ),
          },
          globalTemperature: prev.globalTemperature + co2TemperatureDelta(effects.co2),
        };
      });
    },
    [selectedHex]
  );

  const demolishBuild = useCallback(() => {
    if (!selectedHex) return;
    const key = tileKey(selectedHex.q, selectedHex.r);
    const regionId = getRegionForHex(selectedHex.countryId);

    setGameState((prev) => {
      const existing = prev.tileBuildings[key];
      if (!existing) return prev;

      const build = getBuildDefinition(existing.type);
      const { demolitionFee, netMoneyChange } = getDemolishCost(build, existing.tier);
      const region = prev.regions[regionId];
      if (region.money < demolitionFee) return prev;

      const tierEffects = build.effectsByTier[existing.tier];
      const reversed = reverseEffects(tierEffects);
      const { [key]: _removed, ...remainingBuildings } = prev.tileBuildings;

      // Disrupt routes using this facility
      const disruptedRouteIds = new Set(
        prev.transportRoutes
          .filter((r) => r.fromFacilityId === existing.id || r.toFacilityId === existing.id)
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
          [regionId]: applyEffectsToRegion(
            { ...region, money: region.money + netMoneyChange },
            reversed
          ),
        },
        globalTemperature: prev.globalTemperature + co2TemperatureDelta(reversed.co2),
      };
    });
  }, [selectedHex]);

  const upgradeBuild = useCallback(() => {
    if (!selectedHex) return;
    const key = tileKey(selectedHex.q, selectedHex.r);
    const regionId = getRegionForHex(selectedHex.countryId);

    setGameState((prev) => {
      const existing = prev.tileBuildings[key];
      if (!existing || !canUpgradeTier(existing.tier)) return prev;

      const build = getBuildDefinition(existing.type);
      const upgradeCost = getUpgradeCost(build, existing.tier);
      if (upgradeCost === null) return prev;

      const region = prev.regions[regionId];
      if (region.money < upgradeCost) return prev;

      const nextTier = (existing.tier + 1) as 2 | 3;
      const delta = getEffectDelta(build, existing.tier, nextTier);

      return {
        ...prev,
        tileBuildings: {
          ...prev.tileBuildings,
          [key]: { ...existing, tier: nextTier },
        },
        regions: {
          ...prev.regions,
          [regionId]: applyEffectsToRegion(
            { ...region, money: region.money - upgradeCost },
            delta
          ),
        },
        globalTemperature: prev.globalTemperature + co2TemperatureDelta(delta.co2),
      };
    });
  }, [selectedHex]);

  const postTier3Upgrade = useCallback(() => {
    if (!selectedHex) return;
    const key = tileKey(selectedHex.q, selectedHex.r);
    const regionId = getRegionForHex(selectedHex.countryId);

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
  }, [selectedHex]);

  // Route system — separate from trades
  const getRouteOptions = useCallback(
    (from: CountryId, to: CountryId): RouteOption[] => {
      return findRouteOptions(from, to, Object.values(gameState.tileBuildings), gameState.transportRoutes);
    },
    [gameState.tileBuildings, gameState.transportRoutes]
  );

  const createRoute = useCallback(
    (option: RouteOption) => {
      setGameState((prev) => {
        const route = createTransportRoute(option);
        const transitRequests = option.transitRegions.length > 0
          ? createTransitRequests(route)
          : [];

        return {
          ...prev,
          transportRoutes: [...prev.transportRoutes, route],
          transitRequests: [...prev.transitRequests, ...transitRequests],
        };
      });
    },
    []
  );

  const proposeTrade = useCallback(
    (from: CountryId, to: CountryId, item: TradeItem, amount: number, routeId: string, tradeMode: TradeMode = "one_time") => {
      setGameState((prev) => {
        const route = prev.transportRoutes.find((r) => r.id === routeId);
        if (!route || route.status !== "active") return prev;

        const agreement = createTradeAgreement(from, to, item, amount, routeId, tradeMode);

        // For one-time trades, apply immediately
        if (tradeMode === "one_time") {
          const co2 = route.emissionsPerCycle;
          const fromR = prev.regions[from];
          const toR = prev.regions[to];
          return {
            ...prev,
            tradeAgreements: [...prev.tradeAgreements, agreement],
            regions: {
              ...prev.regions,
              [from]: applyEffectsToRegion(fromR, {
                money: item === "money" ? -amount : 0,
                energy: item === "energy" ? -amount : 0,
                food: item === "food" ? -amount : 0,
                co2: co2 > 0 ? co2 : undefined,
              }),
              [to]: applyEffectsToRegion(toR, {
                money: item === "money" ? amount : 0,
                energy: item === "energy" ? amount : 0,
                food: item === "food" ? amount : 0,
              }),
            },
            globalTemperature: prev.globalTemperature + co2TemperatureDelta(co2),
          };
        }

        // Continuous trades are processed each cycle
        return {
          ...prev,
          tradeAgreements: [...prev.tradeAgreements, agreement],
        };
      });
    },
    []
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
    setGameState((prev) => processCycle(prev));
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

  const agreeBreakthrough = useCallback((country: CountryId) => {
    setGameState((prev) => {
      if (!prev.breakthroughProposal) return prev;
      const agreed = [...prev.breakthroughProposal.agreed, country];
      const allAgreed =
        prev.breakthroughProposal.requiredParticipants.every((c) => agreed.includes(c));
      const next = {
        ...prev,
        breakthroughProposal: { ...prev.breakthroughProposal, agreed },
      };
      if (allAgreed) {
        for (const c of prev.breakthroughProposal.requiredParticipants) {
          next.regions = {
            ...next.regions,
            [c]: {
              ...next.regions[c],
              breakthroughs: [...next.regions[c].breakthroughs, prev.breakthroughProposal.name],
              technology: next.regions[c].technology + 10,
            },
          };
        }
      }
      return next;
    });
  }, []);

  const joinCombinedResearch = useCallback(
    (projectId: string, country: CountryId, amount: number) => {
      setGameState((prev) => ({
        ...prev,
        combinedProjects: prev.combinedProjects.map((p) => {
          if (p.id !== projectId) return p;
          const participants = p.participants.includes(country)
            ? p.participants
            : [...p.participants, country];
          const contributions = {
            ...p.contributions,
            [country]: (p.contributions[country] ?? 0) + amount,
          };
          const progress = p.progress + amount;
          return { ...p, participants, contributions, progress, complete: progress >= p.target };
        }),
        regions: {
          ...prev.regions,
          [country]: applyEffectsToRegion(prev.regions[country], { money: -amount }),
        },
      }));
    },
    []
  );

  const purchaseResearchLicense = useCallback((licenseId: string, buyer: CountryId) => {
    setGameState((prev) => {
      const license = prev.researchLicenses.find((l) => l.id === licenseId);
      if (!license || !license.price) return prev;
      const buyerRegion = prev.regions[buyer];
      if (buyerRegion.money < license.price) return prev;

      return {
        ...prev,
        researchLicenses: prev.researchLicenses.map((l) =>
          l.id === licenseId ? { ...l, status: "accepted" as const, buyer } : l
        ),
        regions: {
          ...prev.regions,
          [buyer]: {
            ...buyerRegion,
            money: buyerRegion.money - license.price,
            breakthroughs: [...buyerRegion.breakthroughs, license.breakthrough],
            technology: buyerRegion.technology + 5,
          },
          [license.seller]: {
            ...prev.regions[license.seller],
            money: prev.regions[license.seller].money + license.price,
          },
        },
      };
    });
  }, []);

  const applyIncrementalResearch = useCallback((category: BuildCategory) => {
    setGameState((prev) => {
      const region = prev.regions[viewCountry];
      const result = applyResearchUpgrade(region, category);
      if (!result) return prev;
      return { ...prev, regions: { ...prev.regions, [viewCountry]: result.region } };
    });
  }, [viewCountry]);

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
        getRouteOptions,
        createRoute,
        proposeTrade,
        agreeBreakthrough,
        joinCombinedResearch,
        purchaseResearchLicense,
        applyIncrementalResearch,
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
