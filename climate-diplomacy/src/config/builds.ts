import type { BuildDefinition, BuildType } from "../types/game";

/** Canonical UI order for the Build Panel and build catalogs. */
export const BUILD_DISPLAY_ORDER: BuildType[] = [
  "city",
  "farm",
  "extractor",
  "transport_hub",
  "industrial_complex",
  "manufacturing",
  "fossil_plant",
  "green_plant",
  "nuclear_plant",
];

const BUILD_DISPLAY_INDEX = Object.fromEntries(
  BUILD_DISPLAY_ORDER.map((id, index) => [id, index])
) as Record<BuildType, number>;

export function compareBuildsByDisplayOrder(a: BuildType, b: BuildType): number {
  return BUILD_DISPLAY_INDEX[a] - BUILD_DISPLAY_INDEX[b];
}

export const BUILD_DEFINITIONS: BuildDefinition[] = [
  // --- Population (1) ---
  {
    id: "city",
    name: "City",
    category: "population",
    description: "Fast population and money growth; heavy food and energy demands, happiness cost.",
    workforce: 10,
    costByTier: {
      1: { money: 100 },
      2: { money: 175 },
      3: { money: 275 },
    },
    effectsByTier: {
      1: { food: -20, energy: -15, population: 40, money: 15, co2: 5, happiness: -2 },
      2: { food: -40, energy: -30, population: 80, money: 30, co2: 8, happiness: -3 },
      3: { food: -65, energy: -50, population: 130, money: 50, co2: 10, happiness: -5 },
    },
    consequenceLines: ["Population +++", "Money +", "Heavy food & energy demand", "Happiness −", "Adds per-capita drain each cycle"],
  },
  // --- Food (1) ---
  {
    id: "farm",
    name: "Farm",
    category: "food",
    description: "Food production on agricultural tiles. Yield drops as global temperature rises.",
    workforce: 5,
    costByTier: {
      1: { money: 40 },
      2: { money: 70 },
      3: { money: 110 },
    },
    effectsByTier: {
      1: { food: 30 },
      2: { food: 55, energy: -3 },
      3: { food: 85, energy: -8 },
    },
    consequenceLines: ["Food +++", "Agricultural tiles only", "−20% yield above +2°C", "−40% yield above +3°C"],
  },
  // --- Extraction (1) ---
  {
    id: "extractor",
    name: "Resource Extractor",
    category: "extraction",
    description: "Mines fuel, uranium, or rare earth from deposit tiles each cycle.",
    workforce: 5,
    costByTier: {
      1: { money: 70 },
      2: { money: 125 },
      3: { money: 195 },
    },
    effectsByTier: {
      1: {},
      2: {},
      3: {},
    },
    consequenceLines: ["Deposit tile only", "2/4/7 units per cycle by tier", "No research unlock needed"],
  },
  // --- Transport (1) ---
  {
    id: "transport_hub",
    name: "Transport Hub",
    category: "transport",
    description:
      "Enables trade by tier: T1 land neighbors, T2 sea (coastal), T3 air anywhere. Capacity stacks across hubs.",
    workforce: 6,
    costByTier: {
      1: { money: 80 },
      2: { money: 150 },
      3: { money: 240 },
    },
    effectsByTier: {
      1: { money: -10 },
      2: { money: -18 },
      3: { money: -28 },
    },
    consequenceLines: [
      "T1: land neighbors · 20 units/cycle",
      "T2: +sea routes · 40 units/cycle (coastal tile)",
      "T3: +air anywhere · 60 units/cycle",
      "Post-T3: +20 capacity / +50 cost per level",
    ],
  },
  // --- Economy (2) ---
  {
    id: "industrial_complex",
    name: "Industrial Complex",
    category: "production",
    description: "Converts energy into money. Energy source defines your carbon footprint.",
    workforce: 20,
    costByTier: {
      1: { money: 100 },
      2: { money: 175 },
      3: { money: 270 },
    },
    effectsByTier: {
      1: { energy: -15, money: 35, co2: 8 },
      2: { energy: -25, money: 65, co2: 12 },
      3: { energy: -40, money: 95, co2: 15 },
    },
    consequenceLines: ["Money ++", "High energy demand", "High workforce (20)"],
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    category: "production",
    description: "Converts energy into technology — the only domestic tech source in the game.",
    workforce: 15,
    costByTier: {
      1: { money: 120 },
      2: { money: 210 },
      3: { money: 320 },
    },
    effectsByTier: {
      1: { energy: -10, money: -5, technology: 5, co2: 5 },
      2: { energy: -18, money: -8, technology: 8, co2: 8 },
      3: { energy: -25, money: -10, technology: 12, co2: 8 },
    },
    consequenceLines: ["Technology + (only source)", "+50% tech if rare earth stockpile ≥ 1"],
  },
  // --- Energy (3) ---
  {
    id: "fossil_plant",
    name: "Fossil Plant",
    category: "energy",
    description: "Cheap fossil energy; consumes fuel each cycle. High emissions.",
    workforce: 10,
    costByTier: {
      1: { money: 60 },
      2: { money: 105 },
      3: { money: 160 },
    },
    effectsByTier: {
      1: { energy: 40, co2: 30 },
      2: { energy: 65, co2: 45 },
      3: { energy: 90, co2: 55 },
    },
    consequenceLines: ["Energy +++", "CO₂ +++", "Consumes fuel/cycle", "Idle without fuel stockpile"],
  },
  {
    id: "green_plant",
    name: "Green Plant",
    category: "energy",
    description: "Clean renewable energy; expensive upfront, needs technology, recurring upkeep.",
    workforce: 8,
    costByTier: {
      1: { money: 120, tech: 10 },
      2: { money: 210, tech: 18 },
      3: { money: 320, tech: 23 },
    },
    effectsByTier: {
      1: { energy: 25, money: -5 },
      2: { energy: 45, money: -4 },
      3: { energy: 70, money: -3 },
    },
    consequenceLines: ["Energy ++ → +++", "CO₂ zero", "+30% energy on desert tile", "Requires technology to build"],
  },
  {
    id: "nuclear_plant",
    name: "Nuclear Plant",
    category: "energy",
    description: "Maximum clean energy; consumes uranium from stockpile. High cost, happiness penalty.",
    workforce: 15,
    costByTier: {
      1: { money: 200, tech: 15 },
      2: { money: 350, tech: 25 },
      3: { money: 530, tech: 33 },
    },
    demolishCostRatio: 0.35,
    demolishRefundRatio: 0.25,
    upgradeCostRatio: 0.85,
    effectsByTier: {
      1: { energy: 60, money: -15, happiness: -5 },
      2: { energy: 90, money: -12, happiness: -3 },
      3: { energy: 120, money: -10, happiness: -1 },
    },
    consequenceLines: ["Energy +++", "CO₂ zero", "Consumes uranium/cycle", "Happiness penalty (shrinks with tier)"],
  },
];

export const BUILD_BY_ID = Object.fromEntries(
  BUILD_DEFINITIONS.map((b) => [b.id, b])
) as Record<string, BuildDefinition>;

export const TRADE_ITEMS: { id: string; label: string; description: string }[] = [
  { id: "money", label: "Money", description: "Climate finance, compensation, investment" },
  { id: "energy", label: "Energy", description: "Covers shortages, enables industry" },
  { id: "food", label: "Food", description: "Supports population and happiness" },
  { id: "population", label: "Population", description: "Labor migration — workers for buildings" },
  { id: "fuel", label: "Fuel", description: "Oil, gas, coal — cheap energy but high CO₂" },
  { id: "rare_earth", label: "Rare Earth", description: "Manufacturing & industrial inputs" },
  { id: "uranium", label: "Uranium", description: "Nuclear fuel and advanced energy" },
  { id: "technology", label: "Technology", description: "Engineering capacity — build green/nuclear, tradeable" },
  { id: "transit_permission", label: "Transit Permission", description: "Enables indirect land trade" },
  { id: "hub_upgrade", label: "Hub Upgrade", description: "Upgrade another country's transport hub tier (negotiated deal)" },
];
