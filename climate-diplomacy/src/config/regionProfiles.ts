import type { CountryId } from "../types/hex";
import type { RegionProfile } from "../types/game";

export const REGION_PROFILES: Record<CountryId, RegionProfile> = {
  usa: {
    id: "usa",
    mainRichness: "Money & industrial capacity",
    secondaryStrength: "Food, oil/gas, technology",
    mainWeakness: "High emissions, political polarization",
    agenda: ["Money", "Industry", "Consumer prices", "Technology", "Moderate transition"],
    startingResources: {
      money: 85, energy: 42, food: 38, population: 33,
      happiness: 72, co2: 72, technology: 75,
    },
  },
  eu: {
    id: "eu",
    mainRichness: "Technology & regulation",
    secondaryStrength: "Green industry, finance",
    mainWeakness: "Limited raw resources, energy dependence",
    agenda: ["Clean energy", "Regulation", "International cooperation", "Social stability"],
    startingResources: {
      money: 62, energy: 28, food: 24, population: 22,
      happiness: 78, co2: 20, technology: 85,
    },
  },
  russia: {
    id: "russia",
    mainRichness: "Gas & coal",
    secondaryStrength: "Land, minerals, northern route leverage",
    mainWeakness: "Fossil dependence, lower diversification",
    agenda: ["Fossil revenue", "Energy leverage", "Stability", "Slow transition"],
    startingResources: {
      money: 38, energy: 48, food: 20, population: 18,
      happiness: 65, co2: 37, technology: 55,
    },
  },
  china: {
    id: "china",
    mainRichness: "Manufacturing & rare earths",
    secondaryStrength: "Coal, technology scaling",
    mainWeakness: "High energy demand, high emissions",
    agenda: ["Manufacturing", "Energy security", "Technology", "Stability"],
    startingResources: {
      money: 72, energy: 56, food: 42, population: 90,
      happiness: 68, co2: 78, technology: 70,
    },
  },
  india: {
    id: "india",
    mainRichness: "Population & solar potential",
    secondaryStrength: "Food potential, low historical emissions",
    mainWeakness: "Energy shortage, lower money/technology",
    agenda: ["Development", "Energy access", "Food security", "Climate justice"],
    startingResources: {
      money: 28, energy: 18, food: 32, population: 88,
      happiness: 62, co2: 13, technology: 45,
    },
  },
  opec: {
    id: "opec",
    mainRichness: "Oil & gas",
    secondaryStrength: "Solar potential, fossil export revenue",
    mainWeakness: "Low food diversity, fossil lock-in",
    agenda: ["Fossil exports", "Money", "Stability", "Paid diversification"],
    startingResources: {
      money: 54, energy: 62, food: 14, population: 28,
      happiness: 70, co2: 42, technology: 40,
    },
  },
  latam: {
    id: "latam",
    mainRichness: "Food & forests",
    secondaryStrength: "Hydro, minerals/lithium",
    mainWeakness: "Infrastructure and finance gaps",
    agenda: ["Food exports", "Forest protection payments", "Development finance"],
    startingResources: {
      money: 32, energy: 22, food: 48, population: 52,
      happiness: 66, co2: 10, technology: 38,
    },
  },
  africa: {
    id: "africa",
    mainRichness: "Solar & minerals",
    secondaryStrength: "Population growth, food potential",
    mainWeakness: "Energy access and capital shortage",
    agenda: ["Energy access", "Development", "Climate finance", "Food security"],
    startingResources: {
      money: 18, energy: 12, food: 26, population: 82,
      happiness: 58, co2: 7, technology: 30,
    },
  },
};
