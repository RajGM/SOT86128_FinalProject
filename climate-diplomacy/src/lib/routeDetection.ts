import type { CountryId, HexData } from "../types/hex";
import { COUNTRY_CONFIGS } from "../types/hex";
import type { RouteType, PlacedBuilding, TransportRoute, TransitAgreement } from "../types/game";
import {
  countryHasCoast,
  countryHasSeaReach,
  getCountryMaxHubTier,
  countryHasAnyHub,
  ROUTE_CO2_PER_UNIT,
  getHubsForCountry,
} from "./transportHub";

/** Border adjacency between regions (shared hex borders). */
export const BORDER_PAIRS: [CountryId, CountryId][] = [
  ["usa", "latam"],
  ["eu", "russia"],
  ["eu", "africa"],
  ["russia", "china"],
  ["russia", "opec"],
  ["china", "india"],
  ["china", "opec"],
  ["india", "opec"],
  ["opec", "africa"],
  ["africa", "latam"],
];

export function sharesBorder(a: CountryId, b: CountryId): boolean {
  return BORDER_PAIRS.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a)
  );
}

export function getBorderNeighbors(country: CountryId): CountryId[] {
  const neighbors: CountryId[] = [];
  for (const [a, b] of BORDER_PAIRS) {
    if (a === country) neighbors.push(b);
    if (b === country) neighbors.push(a);
  }
  return neighbors;
}

/** BFS: find ALL land paths between two regions via border adjacency (up to maxPaths). */
export function findAllLandPaths(
  from: CountryId,
  to: CountryId,
  maxPaths = 5
): CountryId[][] {
  if (from === to) return [[from]];
  const results: CountryId[][] = [];
  const queue: CountryId[][] = [[from]];

  while (queue.length > 0 && results.length < maxPaths) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    for (const neighbor of getBorderNeighbors(current)) {
      if (path.includes(neighbor)) continue;
      const nextPath = [...path, neighbor];
      if (neighbor === to) {
        results.push(nextPath);
      } else {
        queue.push(nextPath);
      }
    }
  }
  return results;
}

/** Check if two regions are connected by land at all. */
export function hasLandConnection(from: CountryId, to: CountryId): boolean {
  if (from === to) return true;
  const visited = new Set<CountryId>([from]);
  const queue: CountryId[] = [from];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of getBorderNeighbors(current)) {
      if (neighbor === to) return true;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return false;
}

/** Check if all transit regions on a path have active agreements for this trader pair. */
export function hasActiveTransitForPath(
  path: CountryId[],
  traderFrom: CountryId,
  traderTo: CountryId,
  transitAgreements: TransitAgreement[]
): boolean {
  const transitRegions = path.slice(1, -1);
  if (transitRegions.length === 0) return true;

  return transitRegions.every((transitRegion) =>
    transitAgreements.some(
      (a) =>
        a.status === "active" &&
        a.transitRegion === transitRegion &&
        a.traderFrom === traderFrom &&
        a.traderTo === traderTo
    )
  );
}

/** A resolved route the system auto-selects (cheapest available). */
export interface RouteOption {
  routeType: RouteType;
  path: CountryId[];
  transitRegions: CountryId[];
  emissionsPerUnit: number;
  fromHubId?: string;
  label: string;
  needsTransitApproval: boolean;
}

function landRouteLabel(path: CountryId[]): string {
  const transit = path.slice(1, -1);
  return transit.length > 0
    ? `Land via ${transit.map((c) => COUNTRY_CONFIGS[c].name).join(" → ")}`
    : "Direct land route";
}

function pickOriginHub(
  countryId: CountryId,
  buildings: PlacedBuilding[]
): PlacedBuilding | undefined {
  return getHubsForCountry(countryId, buildings)[0];
}

/**
 * Find the cheapest auto-route between two regions using hub tier reach.
 * Priority: land → sea → air.
 */
export function findBestRoute(
  from: CountryId,
  to: CountryId,
  buildings: PlacedBuilding[],
  hexes: HexData[],
  transitAgreements: TransitAgreement[]
): RouteOption | null {
  if (!countryHasAnyHub(from, buildings)) return null;

  const maxTier = getCountryMaxHubTier(from, buildings);
  if (maxTier < 1) return null;

  const originHub = pickOriginHub(from, buildings);

  // 1. Land — T1+ and land-connected
  if (maxTier >= 1 && hasLandConnection(from, to)) {
    const landPaths = findAllLandPaths(from, to, 5);
    const scored = landPaths.map((path) => {
      const transitRegions = path.slice(1, -1);
      const hasTransit = hasActiveTransitForPath(path, from, to, transitAgreements);
      return { path, transitRegions, hasTransit, len: path.length };
    });
    scored.sort((a, b) => {
      if (a.hasTransit !== b.hasTransit) return a.hasTransit ? -1 : 1;
      return a.len - b.len;
    });

    for (const { path, transitRegions, hasTransit } of scored) {
      return {
        routeType: "land",
        path,
        transitRegions,
        emissionsPerUnit: ROUTE_CO2_PER_UNIT.land,
        fromHubId: originHub?.id,
        label: landRouteLabel(path),
        needsTransitApproval: transitRegions.length > 0 && !hasTransit,
      };
    }
  }

  // 2. Sea — no land path, T2+ coastal hub, partner has coast
  if (
    !hasLandConnection(from, to) &&
    countryHasSeaReach(from, buildings, hexes) &&
    countryHasCoast(to, hexes)
  ) {
    return {
      routeType: "sea",
      path: [from, to],
      transitRegions: [],
      emissionsPerUnit: ROUTE_CO2_PER_UNIT.sea,
      fromHubId: originHub?.id,
      label: "Sea route",
      needsTransitApproval: false,
    };
  }

  // 3. Air — T3+
  if (maxTier >= 3) {
    return {
      routeType: "air",
      path: [from, to],
      transitRegions: [],
      emissionsPerUnit: ROUTE_CO2_PER_UNIT.air,
      fromHubId: originHub?.id,
      label: "Air route (direct)",
      needsTransitApproval: false,
    };
  }

  return null;
}

/** All viable route options (for preview UI). */
export function findRouteOptions(
  from: CountryId,
  to: CountryId,
  buildings: PlacedBuilding[],
  hexes: HexData[],
  transitAgreements: TransitAgreement[]
): RouteOption[] {
  const best = findBestRoute(from, to, buildings, hexes, transitAgreements);
  if (!best) return [];

  const options: RouteOption[] = [best];
  const maxTier = getCountryMaxHubTier(from, buildings);

  if (maxTier >= 1 && hasLandConnection(from, to) && best.routeType !== "land") {
    for (const path of findAllLandPaths(from, to, 3)) {
      const transitRegions = path.slice(1, -1);
      const hasTransit = hasActiveTransitForPath(path, from, to, transitAgreements);
      options.push({
        routeType: "land",
        path,
        transitRegions,
        emissionsPerUnit: ROUTE_CO2_PER_UNIT.land,
        fromHubId: pickOriginHub(from, buildings)?.id,
        label: landRouteLabel(path),
        needsTransitApproval: transitRegions.length > 0 && !hasTransit,
      });
    }
  }

  return options;
}

/** Find an existing active route between two countries. */
export function findExistingRoute(
  from: CountryId,
  to: CountryId,
  routes: TransportRoute[]
): TransportRoute | undefined {
  return routes.find(
    (r) =>
      r.status === "active" &&
      ((r.from === from && r.to === to) || (r.from === to && r.to === from))
  );
}

/** Format a route path as human-readable string. */
export function formatRoutePath(path: CountryId[]): string {
  return path.map((c) => COUNTRY_CONFIGS[c].name).join(" → ");
}

/** Get route type label for display. */
export function routeTypeLabel(rt: RouteType): string {
  if (rt === "air") return "Air";
  if (rt === "sea") return "Sea";
  return "Land";
}
