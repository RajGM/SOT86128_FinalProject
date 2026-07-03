import { HexData, CountryId, TerrainType, ResourceDeposit, COUNTRY_CONFIGS } from "../types/hex";
import { MAP_COLS, MAP_ROWS } from "../config/constants";

/**
 * Generates a simplified world hex map with 8 countries/blocs.
 *
 * Layout (equirectangular-ish, 60 cols x 30 rows):
 *   - Rows 0-2: Arctic
 *   - Rows 3-25: Main landmasses
 *   - Rows 26-29: Southern ocean / Antarctic
 *
 * Country placement approximates real-world positions:
 *   USA:           cols 3-16,  rows 7-15   (North America)
 *   Latin America: cols 5-15,  rows 16-23  (Central + South America)
 *   EU:            cols 24-31, rows 6-12   (Western Europe)
 *   Russia:        cols 28-55, rows 2-8    (Northern Eurasia)
 *   Africa:        cols 24-33, rows 14-23  (Sub-Saharan Africa)
 *   OPEC+:         cols 29-37, rows 12-18  (Middle East + N.Africa)
 *   India:         cols 37-43, rows 14-20  (South Asia)
 *   China:         cols 42-53, rows 9-17   (East Asia)
 */

// Seed-based pseudo-random for deterministic maps
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

interface CountryRegion {
  id: CountryId;
  minQ: number; maxQ: number;
  minR: number; maxR: number;
  mask?: (q: number, r: number) => boolean;
}

const COUNTRY_REGIONS: CountryRegion[] = [
  {
    id: "usa",
    minQ: 3, maxQ: 16,
    minR: 7, maxR: 15,
    mask: (q, r) => {
      if (q > 13 && r > 13) return false;
      if (q < 5 && r < 9) return false;
      return true;
    },
  },
  {
    id: "eu",
    minQ: 24, maxQ: 31,
    minR: 6, maxR: 12,
    mask: (q, r) => {
      if (r > 10 && q > 29) return false;
      if (r < 7 && q < 25) return false;
      return true;
    },
  },
  {
    id: "russia",
    minQ: 28, maxQ: 55,
    minR: 2, maxR: 8,
    mask: (q, r) => {
      if (q < 32 && r > 6) return false;
      if (q > 52 && r > 5) return false;
      if (q > 42 && r > 7) return false;
      return true;
    },
  },
  {
    id: "china",
    minQ: 42, maxQ: 53,
    minR: 9, maxR: 17,
    mask: (q, r) => {
      if (q < 45 && r > 15) return false;
      if (q > 51 && r < 11) return false;
      if (q > 51 && r > 15) return false;
      return true;
    },
  },
  {
    id: "india",
    minQ: 37, maxQ: 43,
    minR: 14, maxR: 20,
    mask: (q, r) => {
      const midQ = 40;
      const maxDist = 20 - r;
      if (Math.abs(q - midQ) > maxDist * 0.7) return false;
      return true;
    },
  },
  {
    id: "opec",
    minQ: 29, maxQ: 37,
    minR: 12, maxR: 18,
    mask: (q, r) => {
      if (q < 31 && r < 14) return false;
      if (q > 35 && r > 16) return false;
      return true;
    },
  },
  {
    id: "latam",
    minQ: 5, maxQ: 15,
    minR: 16, maxR: 23,
    mask: (q, r) => {
      // Central America narrow strip at top
      if (r <= 17 && (q < 7 || q > 12)) return false;
      // South America widens then narrows
      if (r >= 18 && q < 7) return false;
      if (r >= 20 && q > 13) return false;
      if (r >= 22 && (q < 8 || q > 12)) return false;
      if (r >= 23 && (q < 9 || q > 11)) return false;
      return true;
    },
  },
  {
    id: "africa",
    minQ: 24, maxQ: 33,
    minR: 14, maxR: 23,
    mask: (q, r) => {
      // Avoid OPEC+ overlap
      if (q >= 29 && r <= 18) return false;
      // Northern Africa wider
      if (r <= 15 && (q < 25 || q > 32)) return false;
      // Narrows in the south
      if (r >= 20 && q > 31) return false;
      if (r >= 21 && (q < 26 || q > 30)) return false;
      if (r >= 22 && (q < 27 || q > 29)) return false;
      if (r >= 23 && (q < 27 || q > 28)) return false;
      return true;
    },
  },
];

function assignCountry(q: number, r: number): CountryId | null {
  for (const region of COUNTRY_REGIONS) {
    if (
      q >= region.minQ && q <= region.maxQ &&
      r >= region.minR && r <= region.maxR
    ) {
      if (!region.mask || region.mask(q, r)) {
        return region.id;
      }
    }
  }
  return null;
}

function assignTerrain(
  q: number,
  r: number,
  countryId: CountryId | null,
  rand: () => number
): TerrainType {
  // Arctic rows
  if (r <= 2) return "arctic";
  if (r >= 27) return "ocean";

  // No country assigned — decide ocean vs neutral land
  if (countryId === null) {
    // Eurasian interior: Central Asia, Iran, Pakistan, Turkey, Caucasus
    // Between Russia (row 2-8), OPEC+ (row 12-18), India (row 14-20), China (row 9-17)
    const isEurasianInterior = q >= 28 && q <= 45 && r >= 5 && r <= 20;
    // Also Southeast Asia / Indonesia region
    const isSEAsia = q >= 45 && q <= 55 && r >= 14 && r <= 22;
    // North Africa / Sahara (between EU and sub-Saharan Africa)
    const isNorthAfrica = q >= 22 && q <= 34 && r >= 12 && r <= 16;
    // Canadian / Alaskan land
    const isNorthAmerica = q >= 2 && q <= 18 && r >= 3 && r <= 7;
    // Between USA and Latin America
    const isCentralAm = q >= 5 && q <= 16 && r >= 14 && r <= 17;

    if (isEurasianInterior) {
      const v = rand();
      if (v < 0.7) return v < 0.3 ? "desert" : v < 0.5 ? "mountain" : "land";
      return "ocean"; // Caspian, Aral, etc.
    }
    if (isNorthAfrica) {
      return rand() < 0.6 ? "desert" : "land";
    }
    if (isSEAsia) {
      const v = rand();
      if (v < 0.4) return v < 0.2 ? "forest" : "coastal";
      return "ocean"; // archipelago — mix of islands and sea
    }
    if (isNorthAmerica) {
      return rand() < 0.4 ? (rand() < 0.5 ? "forest" : "arctic") : "ocean";
    }
    if (isCentralAm) {
      return rand() < 0.35 ? "coastal" : "ocean";
    }

    // Default: scattered neutral land in land bands
    const isLandBand = r >= 5 && r <= 22;
    if (isLandBand && rand() < 0.12) return "land";
    return "ocean";
  }

  const roll = rand();

  switch (countryId) {
    case "usa":
      if (r >= 14 && q <= 8) return roll < 0.3 ? "coastal" : "agricultural";
      if (q >= 14) return roll < 0.4 ? "coastal" : "land";
      if (roll < 0.1) return "mountain";
      if (roll < 0.3) return "forest";
      if (roll < 0.6) return "agricultural";
      return "land";

    case "eu":
      if (r >= 10) return roll < 0.3 ? "coastal" : "agricultural";
      if (roll < 0.15) return "coastal";
      if (roll < 0.25) return "mountain";
      if (roll < 0.45) return "forest";
      if (roll < 0.7) return "agricultural";
      return "land";

    case "russia":
      if (r <= 3) return roll < 0.5 ? "arctic" : "forest";
      if (roll < 0.35) return "forest";
      if (roll < 0.45) return "mountain";
      if (roll < 0.55) return "arctic";
      if (roll < 0.7) return "land";
      return roll < 0.85 ? "agricultural" : "coastal";

    case "china":
      if (q >= 51) return roll < 0.5 ? "coastal" : "land";
      if (r <= 11) return roll < 0.3 ? "mountain" : "desert";
      if (roll < 0.25) return "agricultural";
      if (roll < 0.4) return "mountain";
      if (roll < 0.55) return "forest";
      return "land";

    case "india":
      if (r >= 18) return roll < 0.5 ? "coastal" : "land";
      if (r <= 15 && q <= 39) return "mountain";
      if (roll < 0.4) return "agricultural";
      if (roll < 0.55) return "land";
      if (roll < 0.7) return "forest";
      return "coastal";

    case "opec":
      if (roll < 0.55) return "desert";
      if (roll < 0.7) return "coastal";
      if (roll < 0.8) return "land";
      return "mountain";

    case "latam":
      if (r <= 17) return roll < 0.5 ? "forest" : "coastal"; // Central America
      if (q <= 8 && r >= 18) return roll < 0.6 ? "forest" : "mountain"; // Amazon/Andes
      if (roll < 0.35) return "forest"; // Amazon dominant
      if (roll < 0.5) return "agricultural"; // Pampas, cerrado
      if (roll < 0.6) return "mountain"; // Andes
      if (roll < 0.75) return "land";
      return "coastal";

    case "africa":
      if (r <= 16) return roll < 0.5 ? "desert" : "land"; // Sahel
      if (r >= 21) return roll < 0.4 ? "agricultural" : "land"; // Southern
      if (roll < 0.25) return "forest"; // Congo basin
      if (roll < 0.4) return "desert"; // Sahara edges
      if (roll < 0.55) return "agricultural"; // East African highlands
      if (roll < 0.65) return "mountain"; // Rift Valley, Atlas
      if (roll < 0.8) return "land";
      return "coastal";

    default:
      return "land";
  }
}

function assignResource(
  terrain: TerrainType,
  countryId: CountryId | null,
  rand: () => number
): ResourceDeposit | null {
  if (countryId === null || terrain === "ocean" || terrain === "arctic") return null;

  const roll = rand();
  // Higher resource chance for latam/africa to compensate for forest-heavy terrain
  const resourceThreshold = (countryId === "latam" || countryId === "africa") ? 0.35 : 0.25;
  if (roll > resourceThreshold) return null;

  const resourceRoll = rand();

  switch (countryId) {
    case "usa":
      if (terrain === "desert" || terrain === "land") {
        if (resourceRoll < 0.3) return "oil";
        if (resourceRoll < 0.5) return "coal";
        if (resourceRoll < 0.7) return "natural_gas";
      }
      if (terrain === "agricultural") return "arable";
      if (terrain === "coastal") return "wind_potential";
      if (terrain === "desert") return "solar_potential";
      return null;

    case "eu":
      if (terrain === "coastal") return resourceRoll < 0.5 ? "wind_potential" : null;
      if (terrain === "agricultural") return "arable";
      if (terrain === "mountain") return resourceRoll < 0.3 ? "uranium" : null;
      return null;

    case "russia":
      if (resourceRoll < 0.25) return "oil";
      if (resourceRoll < 0.45) return "natural_gas";
      if (resourceRoll < 0.55) return "coal";
      if (resourceRoll < 0.65) return "uranium";
      if (terrain === "forest") return null;
      return null;

    case "china":
      if (resourceRoll < 0.3) return "coal";
      if (resourceRoll < 0.5) return "rare_earth";
      if (terrain === "desert") return "solar_potential";
      if (terrain === "coastal") return "wind_potential";
      return null;

    case "india":
      if (terrain === "agricultural") return "arable";
      if (terrain === "desert" || terrain === "land") {
        if (resourceRoll < 0.3) return "coal";
        if (resourceRoll < 0.5) return "solar_potential";
      }
      if (resourceRoll < 0.3) return "rare_earth";
      return null;

    case "opec":
      if (resourceRoll < 0.45) return "oil";
      if (resourceRoll < 0.65) return "natural_gas";
      if (terrain === "desert") return "solar_potential";
      return null;

    case "latam":
      // Oil/gas rich (Venezuela, Brazil), lithium triangle, huge arable
      if (terrain === "forest") return resourceRoll < 0.3 ? "arable" : null;
      if (terrain === "land" || terrain === "desert") {
        if (resourceRoll < 0.25) return "oil";
        if (resourceRoll < 0.4) return "natural_gas";
        if (resourceRoll < 0.55) return "rare_earth"; // lithium
      }
      if (terrain === "agricultural") return "arable";
      if (terrain === "coastal") return "wind_potential";
      if (terrain === "mountain") return resourceRoll < 0.3 ? "rare_earth" : null;
      return null;

    case "africa":
      // Mineral-rich: rare earth, uranium, cobalt; huge solar potential
      if (terrain === "desert") return resourceRoll < 0.5 ? "solar_potential" : null;
      if (terrain === "mountain" || terrain === "land") {
        if (resourceRoll < 0.3) return "rare_earth"; // cobalt, coltan, platinum
        if (resourceRoll < 0.45) return "uranium"; // Niger, Namibia
        if (resourceRoll < 0.55) return "coal"; // South Africa
      }
      if (terrain === "forest") return resourceRoll < 0.3 ? "arable" : null;
      if (terrain === "agricultural") return "arable";
      if (terrain === "coastal") return resourceRoll < 0.4 ? "oil" : "wind_potential";
      return null;

    default:
      return null;
  }
}

export function generateMap(seed: number = 42): HexData[] {
  const rand = seededRandom(seed);
  const hexes: HexData[] = [];

  for (let r = 0; r < MAP_ROWS; r++) {
    for (let q = 0; q < MAP_COLS; q++) {
      const countryId = assignCountry(q, r);
      const terrain = assignTerrain(q, r, countryId, rand);
      const resource = assignResource(terrain, countryId, rand);

      hexes.push({ q, r, terrain, countryId, resource });
    }
  }

  return hexes;
}

// Count hexes per country for validation
export function countByCountry(hexes: HexData[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const hex of hexes) {
    if (hex.countryId) {
      counts[hex.countryId] = (counts[hex.countryId] || 0) + 1;
    }
  }
  return counts;
}
