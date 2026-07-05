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
      money: 850, energy: 420, food: 380, population: 330,
      happiness: 72, co2: 520, technology: 75, goods: 280,
    },
  },
  eu: {
    id: "eu",
    mainRichness: "Technology & regulation",
    secondaryStrength: "Green industry, finance",
    mainWeakness: "Limited raw resources, energy dependence",
    agenda: ["Clean energy", "Regulation", "International cooperation", "Social stability"],
    startingResources: {
      money: 620, energy: 280, food: 240, population: 220,
      happiness: 78, co2: 180, technology: 85, goods: 210,
    },
  },
  russia: {
    id: "russia",
    mainRichness: "Gas & coal",
    secondaryStrength: "Land, minerals, northern route leverage",
    mainWeakness: "Fossil dependence, lower diversification",
    agenda: ["Fossil revenue", "Energy leverage", "Stability", "Slow transition"],
    startingResources: {
      money: 380, energy: 480, food: 200, population: 180,
      happiness: 65, co2: 340, technology: 55, goods: 120,
    },
  },
  china: {
    id: "china",
    mainRichness: "Manufacturing & rare earths",
    secondaryStrength: "Coal, technology scaling",
    mainWeakness: "High energy demand, high emissions",
    agenda: ["Manufacturing", "Energy security", "Technology", "Stability"],
    startingResources: {
      money: 720, energy: 560, food: 420, population: 1400,
      happiness: 68, co2: 680, technology: 70, goods: 450,
    },
  },
  india: {
    id: "india",
    mainRichness: "Population & solar potential",
    secondaryStrength: "Food potential, low historical emissions",
    mainWeakness: "Energy shortage, lower money/technology",
    agenda: ["Development", "Energy access", "Food security", "Climate justice"],
    startingResources: {
      money: 280, energy: 180, food: 320, population: 1380,
      happiness: 62, co2: 120, technology: 45, goods: 150,
    },
  },
  opec: {
    id: "opec",
    mainRichness: "Oil & gas",
    secondaryStrength: "Solar potential, fossil export revenue",
    mainWeakness: "Low food diversity, fossil lock-in",
    agenda: ["Fossil exports", "Money", "Stability", "Paid diversification"],
    startingResources: {
      money: 540, energy: 620, food: 140, population: 280,
      happiness: 70, co2: 380, technology: 40, goods: 90,
    },
  },
  latam: {
    id: "latam",
    mainRichness: "Food & forests",
    secondaryStrength: "Hydro, minerals/lithium",
    mainWeakness: "Infrastructure and finance gaps",
    agenda: ["Food exports", "Forest protection payments", "Development finance"],
    startingResources: {
      money: 320, energy: 220, food: 480, population: 420,
      happiness: 66, co2: 90, technology: 38, goods: 110,
    },
  },
  africa: {
    id: "africa",
    mainRichness: "Solar & minerals",
    secondaryStrength: "Population growth, food potential",
    mainWeakness: "Energy access and capital shortage",
    agenda: ["Energy access", "Development", "Climate finance", "Food security"],
    startingResources: {
      money: 180, energy: 120, food: 260, population: 1300,
      happiness: 58, co2: 60, technology: 30, goods: 80,
    },
  },
};
