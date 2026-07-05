import type { CountryId } from "../types/hex";
import { COUNTRY_CONFIGS } from "../types/hex";
import type { RouteType, PlacedBuilding, InfraType, TransportRoute } from "../types/game";
import { INFRA_CAPACITY, INFRA_EMISSIONS } from "../types/game";

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

/** Get all infrastructure of a given type for a country. */
export function getInfraForCountry(
  country: CountryId,
  infraType: InfraType,
  buildings: PlacedBuilding[]
): PlacedBuilding[] {
  return buildings.filter((b) => b.type === infraType && b.countryId === country);
}

/** Count active routes using a specific facility. */
export function countRoutesOnFacility(
  facilityId: string,
  routes: TransportRoute[]
): number {
  return routes.filter(
    (r) =>
      r.status !== "disrupted" &&
      (r.fromFacilityId === facilityId || r.toFacilityId === facilityId)
  ).length;
}

/** Check if a facility has spare capacity for a new route. */
export function hasFacilityCapacity(
  facility: PlacedBuilding,
  routes: TransportRoute[]
): boolean {
  const used = countRoutesOnFacility(facility.id, routes);
  return used < INFRA_CAPACITY[facility.tier];
}

/** Find a facility with spare capacity in a country for a given infra type. */
export function findAvailableFacility(
  country: CountryId,
  infraType: InfraType,
  buildings: PlacedBuilding[],
  routes: TransportRoute[]
): PlacedBuilding | null {
  const facilities = getInfraForCountry(country, infraType, buildings);
  for (const f of facilities) {
    if (hasFacilityCapacity(f, routes)) return f;
  }
  return null;
}

/** Calculate emissions for a route based on the lower-tier endpoint facility. */
export function calculateRouteEmissions(
  infraType: InfraType,
  fromFacility: PlacedBuilding,
  toFacility: PlacedBuilding
): number {
  const minTier = Math.min(fromFacility.tier, toFacility.tier) as 1 | 2 | 3;
  return INFRA_EMISSIONS[infraType][minTier];
}

/** A possible route option the player can choose. */
export interface RouteOption {
  routeType: RouteType;
  path: CountryId[];
  transitRegions: CountryId[];
  emissionsPerCycle: number;
  fromFacilityId?: string;
  toFacilityId?: string;
  label: string;
}

/** Infrastructure type needed for a route type. */
function infraForRouteType(rt: RouteType): InfraType {
  if (rt === "air") return "airport";
  if (rt === "sea") return "dock";
  return "transport_center";
}

/**
 * Find all possible route options between two regions.
 * Returns route options grouped by type (land, air, sea).
 */
export function findRouteOptions(
  from: CountryId,
  to: CountryId,
  buildings: PlacedBuilding[],
  existingRoutes: TransportRoute[]
): RouteOption[] {
  const options: RouteOption[] = [];

  // Land routes — only if land-connected
  if (hasLandConnection(from, to)) {
    const landPaths = findAllLandPaths(from, to, 3);
    for (const path of landPaths) {
      const transit = path.slice(1, -1);
      // Need transport center with capacity at both endpoints
      const fromFac = findAvailableFacility(from, "transport_center", buildings, existingRoutes);
      const toFac = findAvailableFacility(to, "transport_center", buildings, existingRoutes);
      if (!fromFac || !toFac) continue;
      const emissions = calculateRouteEmissions("transport_center", fromFac, toFac);

      options.push({
        routeType: "land",
        path,
        transitRegions: transit,
        emissionsPerCycle: emissions,
        fromFacilityId: fromFac.id,
        toFacilityId: toFac.id,
        label: transit.length > 0
          ? `Land via ${transit.map((c) => COUNTRY_CONFIGS[c].name).join(" → ")}`
          : `Direct land route`,
      });
    }
  }

  // Air routes — any two regions with airports
  const fromAir = findAvailableFacility(from, "airport", buildings, existingRoutes);
  const toAir = findAvailableFacility(to, "airport", buildings, existingRoutes);
  if (fromAir && toAir) {
    const emissions = calculateRouteEmissions("airport", fromAir, toAir);
    options.push({
      routeType: "air",
      path: [from, to],
      transitRegions: [],
      emissionsPerCycle: emissions,
      fromFacilityId: fromAir.id,
      toFacilityId: toAir.id,
      label: "Air route (direct)",
    });
  }

  // Sea routes — any two regions with docks
  const fromDock = findAvailableFacility(from, "dock", buildings, existingRoutes);
  const toDock = findAvailableFacility(to, "dock", buildings, existingRoutes);
  if (fromDock && toDock) {
    const emissions = calculateRouteEmissions("dock", fromDock, toDock);
    options.push({
      routeType: "sea",
      path: [from, to],
      transitRegions: [],
      emissionsPerCycle: emissions,
      fromFacilityId: fromDock.id,
      toFacilityId: toDock.id,
      label: "Sea route (direct)",
    });
  }

  return options;
}

/** Format a route path as human-readable string. */
export function formatRoutePath(path: CountryId[]): string {
  return path.map((c) => COUNTRY_CONFIGS[c].name).join(" → ");
}

/** Get infra type label for display. */
export function infraLabel(rt: RouteType): string {
  if (rt === "air") return "Airport";
  if (rt === "sea") return "Dock";
  return "Transport Center";
}
