import type { CountryId } from "../types/hex";
import type {
  TradeAgreement,
  TradeItem,
  TransportRoute,
  TransitAgreement,
  TransitRequest,
  TradeMode,
  TransitFeeModel,
} from "../types/game";
import type { RouteOption } from "./routeDetection";

export function createTransportRoute(option: RouteOption): TransportRoute {
  const hasPendingTransit = option.needsTransitApproval;
  return {
    id: `route-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    from: option.path[0],
    to: option.path[option.path.length - 1],
    routeType: option.routeType,
    path: option.path,
    status: hasPendingTransit ? "pending" : "active",
    emissionsPerUnit: option.emissionsPerUnit,
    fromHubId: option.fromHubId,
  };
}

export function createTransitRequests(route: TransportRoute): TransitRequest[] {
  const transitRegions = route.path.slice(1, -1);
  return transitRegions.map((transitRegion) => ({
    id: `treq-${Date.now()}-${transitRegion}-${Math.random().toString(36).slice(2, 4)}`,
    routeId: route.id,
    traderFrom: route.from,
    traderTo: route.to,
    transitRegion,
    routeType: route.routeType,
    path: route.path,
    status: "pending" as const,
  }));
}

export function createTransitAgreement(
  route: TransportRoute,
  transitRegion: CountryId,
  feeModel: TransitFeeModel,
  feeAmount: number,
  payer: CountryId
): TransitAgreement {
  return {
    id: `tagree-${Date.now()}-${transitRegion}`,
    routeId: route.id,
    traderFrom: route.from,
    traderTo: route.to,
    transitRegion,
    feeModel,
    feeAmount,
    status: "pending",
    payer,
  };
}

export function createTradeAgreement(
  from: CountryId,
  to: CountryId,
  item: TradeItem,
  amount: number,
  routeId: string,
  tradeMode: TradeMode = "one_time",
  hubUpgrade?: {
    hubUpgradeBuildingId: string;
    hubUpgradeToTier?: 2 | 3;
    hubUpgradeExtraLevels?: number;
    hubUpgradePayer?: CountryId;
  }
): TradeAgreement {
  return {
    id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    from,
    to,
    item,
    amount,
    routeId,
    active: true,
    tradeMode,
    ...hubUpgrade,
  };
}

export function getTransitIncome(
  agreements: TransitAgreement[],
  country: CountryId
): number {
  return agreements
    .filter((a) => a.transitRegion === country && a.status === "active" && a.feeModel === "flat")
    .reduce((sum, a) => sum + a.feeAmount, 0);
}

export function getTransitCosts(
  agreements: TransitAgreement[],
  country: CountryId
): number {
  return agreements
    .filter((a) => a.payer === country && a.status === "active" && a.feeModel === "flat")
    .reduce((sum, a) => sum + a.feeAmount, 0);
}

export const RELATION_TRANSIT_THRESHOLD = 30;
export { RELATION_TRADE_THRESHOLD } from "./relationMechanics";
