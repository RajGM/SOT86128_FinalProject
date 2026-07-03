export type TerrainType =
  | "land"
  | "coastal"
  | "desert"
  | "mountain"
  | "forest"
  | "agricultural"
  | "ocean"
  | "arctic";

export type CountryId = "usa" | "eu" | "russia" | "china" | "india" | "opec" | "latam" | "africa";

export type ResourceDeposit =
  | "oil"
  | "coal"
  | "natural_gas"
  | "rare_earth"
  | "uranium"
  | "solar_potential"
  | "wind_potential"
  | "arable";

export interface HexData {
  q: number;
  r: number;
  terrain: TerrainType;
  countryId: CountryId | null;
  resource: ResourceDeposit | null;
}

export interface CountryConfig {
  id: CountryId;
  name: string;
  color: string;
  borderColor: string;
  hexCount: number;
  centerQ: number;
  centerR: number;
  radiusQ: number;
  radiusR: number;
}

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  land: "#8fbc8f",
  coastal: "#b0d4b0",
  desert: "#f0dc82",
  mountain: "#a0a0a0",
  forest: "#2d8a4e",
  agricultural: "#c8e67e",
  ocean: "#3a7bd5",
  arctic: "#e8f0f8",
};

export const COUNTRY_CONFIGS: Record<CountryId, CountryConfig> = {
  usa: {
    id: "usa", name: "United States", color: "#3b82f6", borderColor: "#1d4ed8",
    hexCount: 80, centerQ: 8, centerR: 10, radiusQ: 6, radiusR: 4,
  },
  eu: {
    id: "eu", name: "European Union", color: "#eab308", borderColor: "#a16207",
    hexCount: 35, centerQ: 27, centerR: 8, radiusQ: 3, radiusR: 3,
  },
  russia: {
    id: "russia", name: "Russia", color: "#ef4444", borderColor: "#b91c1c",
    hexCount: 130, centerQ: 38, centerR: 5, radiusQ: 10, radiusR: 3,
  },
  china: {
    id: "china", name: "China", color: "#f97316", borderColor: "#c2410c",
    hexCount: 75, centerQ: 47, centerR: 12, radiusQ: 5, radiusR: 4,
  },
  india: {
    id: "india", name: "India", color: "#22c55e", borderColor: "#15803d",
    hexCount: 25, centerQ: 40, centerR: 16, radiusQ: 3, radiusR: 3,
  },
  opec: {
    id: "opec", name: "OPEC+", color: "#a855f7", borderColor: "#7e22ce",
    hexCount: 60, centerQ: 33, centerR: 14, radiusQ: 4, radiusR: 3,
  },
  latam: {
    id: "latam", name: "Latin America", color: "#14b8a6", borderColor: "#0d9488",
    hexCount: 50, centerQ: 10, centerR: 19, radiusQ: 4, radiusR: 4,
  },
  africa: {
    id: "africa", name: "Africa", color: "#f59e0b", borderColor: "#d97706",
    hexCount: 65, centerQ: 27, centerR: 18, radiusQ: 4, radiusR: 5,
  },
};
