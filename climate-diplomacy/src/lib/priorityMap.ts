import type { CountryId } from "../types/hex";
import type { GameSuggestion, PriorityEntry, PriorityStatus, RegionState } from "../types/game";
import { REGION_PROFILES } from "../config/regionProfiles";
import { COUNTRY_CONFIGS } from "../types/hex";

function statusFromRatio(value: number, thresholds: [number, number, number]): PriorityStatus {
  if (value >= thresholds[0]) return "green";
  if (value >= thresholds[1]) return "yellow";
  if (value >= thresholds[2]) return "orange";
  return "red";
}

export function computePriorityMap(region: RegionState, id: CountryId): PriorityEntry[] {
  const foodPerPop = region.food / Math.max(region.population, 1) * 100;
  const energyPerPop = region.energy / Math.max(region.population, 1) * 100;

  return [
    {
      category: "money",
      status: statusFromRatio(region.money, [400, 250, 150]),
      label: `Money: ${Math.round(region.money)}`,
    },
    {
      category: "energy",
      status: statusFromRatio(energyPerPop, [0.35, 0.2, 0.12]),
      label: `Energy: ${Math.round(region.energy)}`,
    },
    {
      category: "food",
      status: statusFromRatio(foodPerPop, [0.3, 0.2, 0.12]),
      label: `Food: ${Math.round(region.food)}`,
    },
    {
      category: "population",
      status: region.population > 1000 ? "orange" : region.population > 500 ? "yellow" : "green",
      label: `Population: ${Math.round(region.population)}`,
    },
    {
      category: "happiness",
      status: statusFromRatio(region.happiness, [70, 60, 50]),
      label: `Happiness: ${Math.round(region.happiness)}%`,
    },
    {
      category: "emissions",
      status: region.co2 > 500 ? "red" : region.co2 > 300 ? "orange" : region.co2 > 150 ? "yellow" : "green",
      label: `CO₂: ${Math.round(region.co2)}`,
    },
    {
      category: "trade_access",
      status: "yellow",
      label: "Trade access: moderate",
    },
    {
      category: "technology",
      status: statusFromRatio(region.technology, [70, 50, 35]),
      label: `Technology: ${Math.round(region.technology)}`,
    },
  ];
}

export function generateSuggestions(
  region: RegionState,
  id: CountryId
): GameSuggestion[] {
  const suggestions: GameSuggestion[] = [];
  const profile = REGION_PROFILES[id];
  const foodPerPop = region.food / Math.max(region.population, 1);

  if (region.energy / region.population < 0.2) {
    suggestions.push({
      id: "energy-shortage",
      priority: 1,
      text: `Your energy shortage threatens industry. Recommended: build a fossil or renewable plant, import energy from OPEC+, or trade for fuel deposits.`,
    });
  }

  if (foodPerPop < 0.2) {
    suggestions.push({
      id: "food-shortage",
      priority: 2,
      text: `Food per population is low. Recommended: build farm, import food from Latin America, or negotiate aid.`,
    });
  }

  if (id !== "china" && region.technology < 50) {
    suggestions.push({
      id: "rare-earths",
      priority: 3,
      text: `China controls rare earths. Green technology costs will be higher unless you trade, invest, or find alternative suppliers.`,
    });
  }

  if (id === "eu" || id === "china") {
    suggestions.push({
      id: "transit-russia",
      priority: 4,
      text: `Russia is an intermediate land route between EU and China. Transit permission may be valuable.`,
    });
  }

  if (profile.agenda.some((a) => a.toLowerCase().includes("clean"))) {
    suggestions.push({
      id: "coal-agenda",
      priority: 5,
      text: `A planned fuel plant improves energy but lowers happiness because your agenda favors clean transition.`,
    });
  }

  return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 3);
}

export const PRIORITY_COLORS: Record<PriorityStatus, string> = {
  green: "#22c55e",
  yellow: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
};

export function getCountryName(id: CountryId): string {
  return COUNTRY_CONFIGS[id].name;
}
