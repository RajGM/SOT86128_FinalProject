/**
 * Transport CO₂ per unit is defined in transportHub.ts ROUTE_CO2_PER_UNIT.
 */

export function emissionsLabel(emissionsPerUnit: number): string {
  if (emissionsPerUnit === 0) return "Zero emissions";
  if (emissionsPerUnit <= 3) return "Low emissions";
  if (emissionsPerUnit <= 5) return "Medium emissions";
  return "High emissions";
}
