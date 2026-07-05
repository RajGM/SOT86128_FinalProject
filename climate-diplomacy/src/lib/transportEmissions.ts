/**
 * Transport emissions are now handled via INFRA_EMISSIONS constants in types/game.ts
 * and calculated in routeDetection.ts calculateRouteEmissions().
 *
 * This file is kept for any future emission-related utilities.
 */

export function emissionsLabel(emissions: number): string {
  if (emissions === 0) return "Zero emissions";
  if (emissions <= 2) return "Low emissions";
  if (emissions <= 5) return "Medium emissions";
  return "High emissions";
}
