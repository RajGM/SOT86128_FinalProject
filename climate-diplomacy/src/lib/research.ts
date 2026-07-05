import type { BuildCategory, BuildType, RegionState } from "../types/game";
import { BUILD_BY_ID } from "../config/builds";

export function getResearchCost(category: BuildCategory, level: number): number {
  const base = 50;
  return base * (level + 1);
}

export function getResearchBonus(level: number): number {
  return level * 0.05;
}

export function canInfiniteResearch(
  region: RegionState,
  category: BuildCategory,
  maxTierBuildings: number
): boolean {
  return maxTierBuildings >= 1;
}

export function applyResearchUpgrade(
  region: RegionState,
  category: BuildCategory
): { region: RegionState; cost: number; newLevel: number } | null {
  const currentLevel = region.researchLevels[category] ?? 0;
  const cost = getResearchCost(category, currentLevel);
  if (region.money < cost) return null;

  return {
    region: {
      ...region,
      money: region.money - cost,
      researchLevels: { ...region.researchLevels, [category]: currentLevel + 1 },
    },
    cost,
    newLevel: currentLevel + 1,
  };
}

export function getBreakthroughDescription(name: string): string {
  const descriptions: Record<string, string> = {
    "Carbon Capture Retrofit": "Unlocks sustainable upgrade path for fossil plants — reduces CO2 by 40% per unit output.",
    "Fusion Energy (preview)": "High clean energy breakthrough; requires USA + EU + 2 random partners.",
    "Vertical Farming": "High-tech food production with 50% less water and energy.",
    "Zero-Emission Transport": "Electric aviation and hydrogen shipping — zero CO₂ from air/sea trade.",
  };
  return descriptions[name] ?? "Fundamental capability unlock for participating regions.";
}

export function countTier3ByCategory(
  buildings: { type: BuildType; tier: number }[],
  category?: BuildCategory
): number {
  return buildings.filter((b) => {
    const def = BUILD_BY_ID[b.type];
    if (category && def.category !== category) return false;
    return b.tier === 3;
  }).length;
}

export const BREAKTHROUGH_NAMES = [
  "Carbon Capture Retrofit",
  "Fusion Energy",
  "Vertical Farming",
  "Green Steel Process",
];

export const LICENSING_MODELS = [
  { id: "one_time" as const, label: "One-time fee", description: "Large lump sum; buyer owns permanently." },
  { id: "royalty" as const, label: "Royalty agreement", description: "Small upfront; ongoing % of revenue." },
];
