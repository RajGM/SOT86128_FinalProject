import type { HexData } from "../types/hex";
import type { CountryId } from "../types/hex";
import type { PlacedBuilding } from "../types/game";
import { createHexLookup, getHexNeighborCoords } from "./hexUtils";

/** Units of resources movable per cycle by hub tier (before post-T3 bonuses). */
export const HUB_BASE_CAPACITY: Record<1 | 2 | 3, number> = { 1: 20, 2: 40, 3: 60 };

/** Post-T3 capacity bonus per extra upgrade level. */
export const HUB_EXTRA_CAPACITY_PER_LEVEL = 20;

/** Post-T3 recurring cost increase per extra level (money/cycle). */
export const HUB_EXTRA_UPKEEP_PER_LEVEL = 8;

/** Post-T3 upgrade cost (money). */
export const HUB_POST_T3_UPGRADE_COST = 50;

/** CO₂ emitted per unit of resource moved by route type. */
export const ROUTE_CO2_PER_UNIT: Record<"land" | "sea" | "air", number> = {
  land: 3,
  sea: 5,
  air: 8,
};

export function isCoastalTile(hex: HexData, hexLookup: Map<string, HexData>): boolean {
  if (hex.terrain === "ocean" || hex.terrain === "arctic") return false;
  if (hex.terrain === "coastal") return true;
  return getHexNeighborCoords(hex.q, hex.r).some(([nq, nr]) => {
    const neighbor = hexLookup.get(`${nq},${nr}`);
    return neighbor?.terrain === "ocean";
  });
}

export function countryHasCoast(countryId: CountryId, hexes: HexData[]): boolean {
  const lookup = createHexLookup(hexes);
  for (const hex of hexes) {
    if (hex.countryId !== countryId) continue;
    if (isCoastalTile(hex, lookup)) return true;
  }
  return false;
}

export function getHubsForCountry(
  countryId: CountryId,
  buildings: PlacedBuilding[]
): PlacedBuilding[] {
  return buildings.filter((b) => b.type === "transport_hub" && b.countryId === countryId);
}

export function getHubCapacity(hub: PlacedBuilding): number {
  const base = HUB_BASE_CAPACITY[hub.tier];
  const extra = hub.tier >= 3 ? (hub.extraLevel ?? 0) * HUB_EXTRA_CAPACITY_PER_LEVEL : 0;
  return base + extra;
}

export function getCountryTotalCapacity(
  countryId: CountryId,
  buildings: PlacedBuilding[]
): number {
  return getHubsForCountry(countryId, buildings).reduce((sum, h) => sum + getHubCapacity(h), 0);
}

/** Highest hub tier in the country (determines air reach). */
export function getCountryMaxHubTier(
  countryId: CountryId,
  buildings: PlacedBuilding[]
): 0 | 1 | 2 | 3 {
  const hubs = getHubsForCountry(countryId, buildings);
  if (hubs.length === 0) return 0;
  return Math.max(...hubs.map((h) => h.tier)) as 1 | 2 | 3;
}

/** Sea routes require a T2+ hub placed on a coastal tile. */
export function countryHasSeaReach(
  countryId: CountryId,
  buildings: PlacedBuilding[],
  hexes: HexData[]
): boolean {
  const lookup = createHexLookup(hexes);
  for (const hub of getHubsForCountry(countryId, buildings)) {
    if (hub.tier < 2) continue;
    const hex = lookup.get(`${hub.q},${hub.r}`);
    if (hex && isCoastalTile(hex, lookup)) return true;
  }
  return false;
}

export function countryHasAnyHub(
  countryId: CountryId,
  buildings: PlacedBuilding[]
): boolean {
  return getHubsForCountry(countryId, buildings).length > 0;
}

export function getHubRecurringCost(hub: PlacedBuilding): number {
  const base = { 1: 10, 2: 18, 3: 28 }[hub.tier];
  const extra =
    hub.tier >= 3 ? (hub.extraLevel ?? 0) * HUB_EXTRA_UPKEEP_PER_LEVEL : 0;
  return base + extra;
}
