import type { ResourceDeposit } from "../types/hex";
import { RESOURCE_LABELS } from "../types/hex";
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

export interface ExtractionResearchDef {
  deposit: ResourceDeposit;
  name: string;
  description: string;
  cost: number;
}

export const EXTRACTION_RESEARCH: ExtractionResearchDef[] = [
  {
    deposit: "fuel",
    name: "Fuel Extraction",
    description: "Unlock extractors to harvest oil, gas, and coal deposits.",
    cost: 80,
  },
  {
    deposit: "uranium",
    name: "Uranium Extraction",
    description: "Unlock extractors to harvest uranium for nuclear fuel.",
    cost: 120,
  },
  {
    deposit: "rare_earth",
    name: "Rare Earth Extraction",
    description: "Unlock extractors to harvest rare earth minerals for industry.",
    cost: 100,
  },
];

export function isExtractionUnlocked(
  region: RegionState,
  deposit: ResourceDeposit
): boolean {
  return region.extractionUnlocks[deposit] === true;
}

export function applyExtractionResearch(
  region: RegionState,
  deposit: ResourceDeposit
): { region: RegionState; cost: number } | null {
  if (region.extractionUnlocks[deposit]) return null;
  const def = EXTRACTION_RESEARCH.find((r) => r.deposit === deposit);
  if (!def || region.money < def.cost) return null;

  return {
    region: {
      ...region,
      money: region.money - def.cost,
      extractionUnlocks: { ...region.extractionUnlocks, [deposit]: true },
    },
    cost: def.cost,
  };
}

export function getExtractionResearchLabel(deposit: ResourceDeposit): string {
  return EXTRACTION_RESEARCH.find((r) => r.deposit === deposit)?.name
    ?? `${RESOURCE_LABELS[deposit]} Extraction`;
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
