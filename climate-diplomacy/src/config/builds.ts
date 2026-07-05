import type { BuildDefinition } from "../types/game";

export const BUILD_DEFINITIONS: BuildDefinition[] = [
  // --- Energy (7) ---
  {
    id: "coal_plant", name: "Coal Plant", category: "energy",
    description: "Cheap fossil energy; very high emissions. Build anywhere.",
    baseCost: 80,
    effectsByTier: {
      1: { energy: 45, co2: 35, money: 10 },
      2: { energy: 70, co2: 50, money: 15 },
      3: { energy: 95, co2: 55, money: 20 },
    },
    consequenceLines: ["Energy +++", "CO2 +++", "Happiness - if clean agenda"],
  },
  {
    id: "gas_plant", name: "Gas Plant", category: "energy",
    description: "Reliable fossil energy with lower CO2 than coal/oil.",
    baseCost: 110,
    effectsByTier: {
      1: { energy: 35, co2: 18, money: 12 },
      2: { energy: 55, co2: 25, money: 20 },
      3: { energy: 75, co2: 28, money: 28 },
    },
    consequenceLines: ["Energy ++", "CO2 ++", "Fossil dependent"],
  },
  {
    id: "oil_plant", name: "Oil Plant", category: "energy",
    description: "High energy output; strong money synergy.",
    baseCost: 120,
    effectsByTier: {
      1: { energy: 40, co2: 25, money: 15 },
      2: { energy: 65, co2: 35, money: 25 },
      3: { energy: 90, co2: 40, money: 35 },
    },
    consequenceLines: ["Energy +++", "Money potential +", "CO2 +++"],
  },
  {
    id: "nuclear_plant", name: "Nuclear Plant", category: "energy",
    description: "High clean energy; requires uranium inputs over time.",
    baseCost: 250,
    demolishCostRatio: 0.35,
    demolishRefundRatio: 0.25,
    upgradeCostRatio: 0.85,
    effectsByTier: {
      1: { energy: 60, co2: -15, happiness: -3 },
      2: { energy: 90, co2: -20, happiness: -2 },
      3: { energy: 120, co2: -25 },
    },
    consequenceLines: ["Energy +++", "CO2 --", "High cost", "Happiness risk if agenda opposes"],
  },
  {
    id: "solar_plant", name: "Solar Plant", category: "energy",
    description: "Clean renewable energy; build anywhere.",
    baseCost: 130,
    effectsByTier: {
      1: { energy: 20, co2: -8, money: -5 },
      2: { energy: 35, co2: -12, money: -3 },
      3: { energy: 50, co2: -15 },
    },
    consequenceLines: ["Energy ++", "CO2 --", "Lower reliability unless upgraded"],
  },
  {
    id: "wind_plant", name: "Wind Plant", category: "energy",
    description: "Clean wind energy; build anywhere.",
    baseCost: 120,
    effectsByTier: {
      1: { energy: 18, co2: -7 },
      2: { energy: 32, co2: -11 },
      3: { energy: 48, co2: -14 },
    },
    consequenceLines: ["Energy ++", "CO2 --", "Intermittent output"],
  },
  {
    id: "hydro_plant", name: "Hydro Plant", category: "energy",
    description: "Stable clean energy; build anywhere.",
    baseCost: 150,
    effectsByTier: {
      1: { energy: 30, co2: -5 },
      2: { energy: 50, co2: -8 },
      3: { energy: 70, co2: -10 },
    },
    consequenceLines: ["Energy ++", "CO2 -", "Clean stable output"],
  },
  // --- Production (1, 3 tiers) ---
  {
    id: "industrial_complex", name: "Industrial Complex", category: "production",
    description: "Unified manufacturing — money, goods, and technology output scales by tier.",
    baseCost: 100,
    tierRequirements: { 2: "Stable energy supply", 3: "High technology base" },
    effectsByTier: {
      1: { money: 30, goods: 15, energy: -10, co2: 8, technology: 2 },
      2: { money: 55, goods: 35, energy: -18, co2: 12, technology: 4 },
      3: { money: 85, goods: 55, energy: -25, co2: 10, technology: 6, happiness: -2 },
    },
    consequenceLines: ["Money +++", "Goods ++", "Energy demand +", "Technology progress +"],
  },
  // --- Population (2) ---
  {
    id: "village", name: "Village", category: "population",
    description: "Adds population slowly; supports rural stability.",
    baseCost: 60,
    demolishCostRatio: 0.15,
    demolishRefundRatio: 0.45,
    effectsByTier: {
      1: { population: 15, food: -5 },
      2: { population: 30, food: -10 },
      3: { population: 50, food: -15 },
    },
    consequenceLines: ["Population +", "Food demand + slowly"],
  },
  {
    id: "city", name: "City", category: "population",
    description: "Workforce and economic scale; higher demand.",
    baseCost: 100,
    effectsByTier: {
      1: { population: 40, money: 10, energy: -15, food: -20, happiness: -2 },
      2: { population: 80, money: 25, energy: -30, food: -40 },
      3: { population: 130, money: 45, energy: -50, food: -65, happiness: -3 },
    },
    consequenceLines: ["Population ++", "Money potential +", "Energy & food demand ++"],
  },
  // --- Food (1) ---
  {
    id: "farm", name: "Farm", category: "food",
    description: "Basic food production; build anywhere.",
    baseCost: 50,
    effectsByTier: {
      1: { food: 30 },
      2: { food: 55, energy: -3 },
      3: { food: 85, energy: -8 },
    },
    consequenceLines: ["Food +++", "Climate vulnerability"],
  },
  // --- Transport (3) ---
  {
    id: "dock", name: "Dock/Port", category: "transport",
    description: "Enables sea trade routes. Capacity: T1=2, T2=4, T3=6 routes.",
    baseCost: 120,
    effectsByTier: {
      1: { money: 15 },
      2: { money: 30 },
      3: { money: 50 },
    },
    consequenceLines: ["Enables sea routes", "Tier sets route capacity"],
  },
  {
    id: "airport", name: "Airport", category: "transport",
    description: "Enables air trade routes. Capacity: T1=2, T2=4, T3=6 routes.",
    baseCost: 140,
    effectsByTier: {
      1: { money: 10, co2: 5 },
      2: { money: 20, co2: 4 },
      3: { money: 35, co2: 3 },
    },
    consequenceLines: ["Enables air routes", "Highest emissions", "Tier sets route capacity"],
  },
  {
    id: "transport_center", name: "Land Transport Center", category: "transport",
    description: "Enables land/border trade routes. Capacity: T1=2, T2=4, T3=6 routes.",
    baseCost: 100,
    effectsByTier: {
      1: { money: 10 },
      2: { money: 20 },
      3: { money: 35 },
    },
    consequenceLines: ["Enables land routes", "Lowest emissions", "Requires land adjacency chain"],
  },
  // --- Extraction ---
  {
    id: "extractor", name: "Resource Extractor", category: "extraction",
    description: "Extracts map deposits each cycle. Bonus yield on deposit tiles; base yield elsewhere. Requires extraction research unlocks.",
    baseCost: 90,
    effectsByTier: {
      1: { money: -5, co2: 2 },
      2: { money: -8, co2: 3 },
      3: { money: -12, co2: 4 },
    },
    consequenceLines: ["Passive deposit yield/cycle", "Bonus on deposit tiles", "Needs extraction research"],
  },
];

export const BUILD_BY_ID = Object.fromEntries(
  BUILD_DEFINITIONS.map((b) => [b.id, b])
) as Record<string, BuildDefinition>;

export const TRADE_ITEMS: { id: string; label: string; description: string }[] = [
  { id: "money", label: "Money", description: "Climate finance, compensation, investment" },
  { id: "energy", label: "Energy", description: "Covers shortages, enables industry" },
  { id: "food", label: "Food", description: "Supports population and happiness" },
  { id: "fuel", label: "Fuel", description: "Oil, gas, coal — cheap energy but high CO₂" },
  { id: "rare_earth", label: "Rare Earth", description: "Manufacturing & industrial inputs" },
  { id: "uranium", label: "Uranium", description: "Nuclear fuel and advanced energy" },
  { id: "mixed", label: "Mixed/Land", description: "Arable land, forests, general resources" },
  { id: "technology", label: "Technology", description: "Enables higher-tier builds" },
  { id: "goods", label: "Goods", description: "Supports money and happiness" },
  { id: "transit_permission", label: "Transit Permission", description: "Enables indirect land trade" },
  { id: "airspace_permission", label: "Airspace Permission", description: "Enables air routes" },
  { id: "research", label: "Research", description: "Breakthroughs and incremental upgrades" },
];
