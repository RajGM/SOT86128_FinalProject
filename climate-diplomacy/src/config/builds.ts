import type { BuildDefinition } from "../types/game";

export const BUILD_DEFINITIONS: BuildDefinition[] = [
  {
    id: "oil_plant", name: "Oil Plant", category: "energy",
    description: "High energy output; strong money synergy for oil regions.",
    requiredResource: "oil",
    baseCost: 120,
    effectsByTier: {
      1: { energy: 40, co2: 25, money: 15 },
      2: { energy: 65, co2: 35, money: 25 },
      3: { energy: 90, co2: 40, money: 35 },
    },
    consequenceLines: ["Energy +++", "Money potential +", "CO2 +++", "Happiness - if clean agenda"],
  },
  {
    id: "gas_plant", name: "Gas Plant", category: "energy",
    description: "Reliable fossil energy with lower CO2 than coal/oil.",
    requiredResource: "natural_gas",
    baseCost: 110,
    effectsByTier: {
      1: { energy: 35, co2: 18, money: 12 },
      2: { energy: 55, co2: 25, money: 20 },
      3: { energy: 75, co2: 28, money: 28 },
    },
    consequenceLines: ["Energy ++", "CO2 ++", "Fossil dependent"],
  },
  {
    id: "coal_plant", name: "Coal Plant", category: "energy",
    description: "Cheap early energy; very high emissions.",
    requiredResource: "coal",
    baseCost: 80,
    effectsByTier: {
      1: { energy: 45, co2: 35, money: 10 },
      2: { energy: 70, co2: 50, money: 15 },
      3: { energy: 95, co2: 55, money: 20 },
    },
    consequenceLines: ["Energy +++", "CO2 +++", "Happiness - if clean agenda"],
  },
  {
    id: "hydro_plant", name: "Hydro Plant", category: "energy",
    description: "Clean stable energy; limited by geography.",
    requiredTerrain: "coastal",
    baseCost: 150,
    effectsByTier: {
      1: { energy: 30, co2: -5 },
      2: { energy: 50, co2: -8 },
      3: { energy: 70, co2: -10 },
    },
    consequenceLines: ["Energy ++", "CO2 -", "Clean stable output"],
  },
  {
    id: "solar_plant", name: "Solar Plant", category: "energy",
    description: "Clean energy; strong in sunny regions.",
    requiredResource: ["solar_potential", "wind_potential"],
    baseCost: 130,
    effectsByTier: {
      1: { energy: 20, co2: -8, money: -5 },
      2: { energy: 35, co2: -12, money: -3 },
      3: { energy: 50, co2: -15 },
    },
    consequenceLines: ["Energy ++", "CO2 --", "Lower reliability unless upgraded"],
  },
  {
    id: "nuclear_plant", name: "Nuclear Plant", category: "energy",
    description: "High clean energy; political/happiness risk if agenda opposes.",
    requiredResource: "uranium",
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
    id: "industrial_complex", name: "Industrial Complex", category: "production",
    description: "Converts energy into money/GDP.",
    baseCost: 100,
    tierRequirements: { 2: "City or workforce nearby", 3: "High technology base" },
    effectsByTier: {
      1: { money: 30, energy: -10, co2: 8 },
      2: { money: 55, energy: -18, co2: 12 },
      3: { money: 85, energy: -25, co2: 10, happiness: -2 },
    },
    consequenceLines: ["Money +++", "Energy demand +", "CO2 + unless clean energy"],
  },
  {
    id: "manufacturing", name: "Manufacturing", category: "production",
    description: "Converts minerals and labor into manufactured value.",
    tierRequirements: { 2: "Mineral tile or import", 3: "Technology & stable energy" },
    baseCost: 120,
    effectsByTier: {
      1: { money: 25, goods: 15, energy: -8, co2: 6, technology: 2 },
      2: { money: 45, goods: 30, energy: -14, co2: 8, technology: 4 },
      3: { money: 70, goods: 50, energy: -20, co2: 6, technology: 6 },
    },
    consequenceLines: ["Money ++", "Goods ++", "Technology progress +"],
  },
  {
    id: "goods_production", name: "Goods Production", category: "production",
    description: "Consumer goods supporting money and happiness.",
    tierRequirements: { 1: "Manufacturing or industrial complex", 2: "Stable energy", 3: "Advanced manufacturing" },
    baseCost: 90,
    effectsByTier: {
      1: { money: 20, goods: 25, happiness: 3 },
      2: { money: 35, goods: 45, happiness: 5 },
      3: { money: 55, goods: 70, happiness: 8 },
    },
    consequenceLines: ["Money +", "Happiness + if goods per population adequate"],
  },
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
  {
    id: "green_city", name: "Green City", category: "population",
    description: "Population growth with lower environmental pressure.",
    tierRequirements: { 1: "City + clean energy share", 2: "Technology level", 3: "High clean energy & happiness" },
    baseCost: 180,
    effectsByTier: {
      1: { population: 30, happiness: 8, co2: -5, money: -10 },
      2: { population: 60, happiness: 12, co2: -10, money: -15 },
      3: { population: 100, happiness: 18, co2: -15, money: -20 },
    },
    consequenceLines: ["Population +", "Happiness ++", "CO2 lower than normal city"],
  },
  {
    id: "farm", name: "Farm", category: "food",
    description: "Basic food production on arable land.",
    requiredResource: "arable",
    baseCost: 50,
    effectsByTier: {
      1: { food: 30 },
      2: { food: 55, energy: -3 },
      3: { food: 85, energy: -8 },
    },
    consequenceLines: ["Food +++", "Climate vulnerability"],
  },
  {
    id: "high_tech_farm", name: "High-Tech Farm", category: "food",
    description: "Strong food yield; requires technology and energy.",
    requiredResource: "arable",
    tierRequirements: { 1: "Technology level", 2: "Energy stability" },
    baseCost: 120,
    effectsByTier: {
      1: { food: 50, energy: -10, money: -8, technology: 1 },
      2: { food: 80, energy: -15, money: -12, technology: 2 },
      3: { food: 120, energy: -20, money: -18, technology: 3 },
    },
    consequenceLines: ["Food +++", "Less climate vulnerability", "Higher energy use"],
  },
  {
    id: "airport", name: "Airport", category: "transport",
    description: "Enables air trade routes. Capacity: T1=2, T2=4, T3=6 routes. Upkeep per cycle.",
    baseCost: 140,
    effectsByTier: {
      1: { money: 10, co2: 5 },
      2: { money: 20, co2: 4 },
      3: { money: 35, co2: 3 },
    },
    consequenceLines: ["Enables air routes", "Highest emissions", "Tier sets route capacity"],
  },
  {
    id: "dock", name: "Dock/Port", category: "transport",
    description: "Enables sea trade. Capacity: T1=2, T2=4, T3=6 routes. Upkeep per cycle.",
    requiredTerrain: "coastal",
    baseCost: 120,
    effectsByTier: {
      1: { money: 15 },
      2: { money: 30 },
      3: { money: 50 },
    },
    consequenceLines: ["Enables sea routes", "Requires coastal tile", "Tier sets route capacity"],
  },
  {
    id: "transport_center", name: "Transport Center", category: "transport",
    description: "Enables land trade routes. Capacity: T1=2, T2=4, T3=6 routes. Upkeep per cycle.",
    requiredTerrain: ["land", "agricultural"],
    baseCost: 100,
    effectsByTier: {
      1: { money: 10 },
      2: { money: 20 },
      3: { money: 35 },
    },
    consequenceLines: ["Enables land routes", "Lowest emissions", "Requires land adjacency chain"],
  },
];

export const BUILD_BY_ID = Object.fromEntries(
  BUILD_DEFINITIONS.map((b) => [b.id, b])
) as Record<string, BuildDefinition>;

export const TRADE_ITEMS: { id: string; label: string; description: string }[] = [
  { id: "money", label: "Money", description: "Climate finance, compensation, investment" },
  { id: "energy", label: "Energy", description: "Covers shortages, enables industry" },
  { id: "food", label: "Food", description: "Supports population and happiness" },
  { id: "fossil_fuel", label: "Fossil Fuel", description: "Cheap energy but high CO2" },
  { id: "minerals", label: "Minerals/Rare Earths", description: "Manufacturing & green tech" },
  { id: "technology", label: "Technology", description: "Enables higher-tier clean builds" },
  { id: "goods", label: "Goods", description: "Supports money and happiness" },
  { id: "transit_permission", label: "Transit Permission", description: "Enables indirect land trade" },
  { id: "airspace_permission", label: "Airspace Permission", description: "Enables air routes" },
  { id: "research", label: "Research", description: "Breakthroughs and incremental upgrades" },
];
