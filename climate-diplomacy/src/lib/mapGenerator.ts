import { HexData, CountryId, TerrainType, ResourceDeposit, COUNTRY_CONFIGS } from "../types/hex";
import { MAP_COLS, MAP_ROWS } from "../config/constants";

/**
 * Generates a simplified world hex map with 8 countries/blocs.
 *
 * Layout (equirectangular-ish, 60 cols x 30 rows):
 *   - Rows 0-2: Arctic
 *   - Rows 3-25: Main landmasses
 *   - Rows 27-28: Antarctic (arctic)
 *   - Row 29: Southern ocean
 *
 * Country placement approximates real-world positions:
 *   USA:           cols 3-16,  rows 7-15   (North America)
 *   Latin America: cols 5-15,  rows 16-23  (Central + South America)
 *   EU:            cols 24-31, rows 6-12   (Western Europe)
 *   Russia:        cols 28-55, rows 2-8    (Northern Eurasia)
 *   Africa:        cols 24-33, rows 14-23  (Sub-Saharan Africa)
 *   OPEC+:         cols 28-42, rows 8-18  (Central Asia, Middle East, Pakistan)
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

      // Far east / Mongolia north — land border with China
      if (q >= 40 && q <= 51 && r >= 7 && r <= 8) return true;

      if (q > 42 && r > 7) return false;
      // Leave southern Central Asia to OPEC+ (Kazakhstan, etc.)
      if (r >= 8 && q >= 34 && q < 40) return false;
      if (r >= 7 && q >= 38 && q < 40) return false;
      return true;
    },
  },
  {
    id: "china",
    minQ: 40, maxQ: 53,
    minR: 9, maxR: 17,
    mask: (q, r) => {
      // Northern China / Manchuria — land border with Russia
      if (r >= 9 && r <= 10 && q >= 40 && q <= 51) return true;

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
      // Indian subcontinent — exclude Pakistan/western border
      if (q < 39 && r <= 17) return false;
      if (q < 38 && r >= 18) return false;
      const midQ = 41;
      const maxDist = 20 - r;
      if (Math.abs(q - midQ) > maxDist * 0.7) return false;
      return true;
    },
  },
  {
    id: "opec",
    minQ: 28, maxQ: 42,
    minR: 8, maxR: 18,
    mask: (q, r) => {
      // Kazakhstan & Central Asia (Kazakhstan, Uzbekistan, Turkmenistan)
      if (r <= 10) {
        if (q < 33 || q > 38) return false;
        if (r <= 8 && q < 35) return false;
        // Eastern corridor reserved for Russia–China border (Mongolia)
        if (r >= 8 && q >= 37) return false;
        return true;
      }

      // Iran, Caucasus approaches, Fertile Crescent (r 11-13)
      if (r >= 11 && r <= 13) {
        if (q >= 28 && q <= 36) return true;
        if (q >= 37 && q <= 40) return true;
        return false;
      }

      // Arabian Peninsula, Gulf states, eastern Iran (r 14-16)
      if (r >= 14 && r <= 16) {
        if (q >= 28 && q <= 37) return true;
        // Pakistan
        if (q >= 36 && q <= 40) return true;
        return false;
      }

      // Yemen, Oman, southern Pakistan (r 17-18)
      if (r >= 17) {
        if (q >= 30 && q <= 37) return true;
        if (q >= 37 && q <= 39) return true;
        return false;
      }

      return false;
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
      // Avoid OPEC+ overlap (Middle East, Central Asia, Pakistan)
      if (q >= 30 && r >= 10 && r <= 18) return false;
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
  // Arctic rows (north and south)
  if (r <= 2) return "arctic";
  if (r >= 29) return "ocean";
  if (r >= 27) return "arctic";

  // No country assigned — decide ocean vs neutral land
  if (countryId === null) {
    // Eurasian interior gaps (Caucasus, Turkey buffer — not claimed by blocs)
    const isEurasianGap = q >= 28 && q <= 33 && r >= 9 && r <= 12;
    // Also Southeast Asia / Indonesia region
    const isSEAsia = q >= 45 && q <= 55 && r >= 14 && r <= 22;
    // North Africa / Sahara (between EU and sub-Saharan Africa)
    const isNorthAfrica = q >= 22 && q <= 34 && r >= 12 && r <= 16;
    // Canadian / Alaskan land
    const isNorthAmerica = q >= 2 && q <= 18 && r >= 3 && r <= 7;
    // Between USA and Latin America
    const isCentralAm = q >= 5 && q <= 16 && r >= 14 && r <= 17;

    if (isEurasianGap) {
      const v = rand();
      if (v < 0.7) return v < 0.3 ? "mountain" : v < 0.5 ? "land" : "desert";
      return "ocean";
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
      if (q >= 40 && r >= 7) {
        // Far east / Mongolia — forest and taiga
        if (roll < 0.4) return "forest";
        if (roll < 0.55) return "land";
        if (roll < 0.7) return "mountain";
        return roll < 0.85 ? "agricultural" : "arctic";
      }
      if (r <= 3) return roll < 0.5 ? "arctic" : "forest";
      if (roll < 0.35) return "forest";
      if (roll < 0.45) return "mountain";
      if (roll < 0.55) return "arctic";
      if (roll < 0.7) return "land";
      return roll < 0.85 ? "agricultural" : "coastal";

    case "china":
      if (r <= 10 && q >= 40) {
        // Northern China — steppe and mountains bordering Russia
        if (roll < 0.35) return "desert";
        if (roll < 0.5) return "mountain";
        if (roll < 0.65) return "land";
        return "agricultural";
      }
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
      if (r <= 10) {
        // Central Asia steppe/desert
        if (roll < 0.45) return "desert";
        if (roll < 0.65) return "land";
        if (roll < 0.8) return "mountain";
        return "coastal";
      }
      if (q >= 36 && r >= 14) {
        // Pakistan — mountains and agriculture
        if (roll < 0.35) return "mountain";
        if (roll < 0.55) return "agricultural";
        if (roll < 0.7) return "desert";
        return "land";
      }
      // Middle East core
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
  q: number,
  r: number,
  terrain: TerrainType,
  countryId: CountryId | null,
  rand: () => number
): ResourceDeposit | null {
  if (countryId === null || terrain === "ocean" || terrain === "arctic") return null;

  const roll = rand();
  const resourceThreshold = (countryId === "latam" || countryId === "africa") ? 0.35 : 0.25;

  if (roll > resourceThreshold) {
    if (terrain === "agricultural" || terrain === "forest" || terrain === "land") {
      return rand() < 0.35 ? "mixed" : null;
    }
    return null;
  }

  const resourceRoll = rand();

  switch (countryId) {
    case "usa":
      if (terrain === "desert" || terrain === "land") {
        if (resourceRoll < 0.65) return "fuel";
      }
      if (terrain === "agricultural" || terrain === "forest") return "mixed";
      if (resourceRoll < 0.2) return "uranium";
      if (resourceRoll < 0.35) return "rare_earth";
      return "mixed";

    case "eu":
      if (terrain === "coastal") return resourceRoll < 0.4 ? "mixed" : null;
      if (terrain === "agricultural" || terrain === "forest") return "mixed";
      if (terrain === "mountain" && resourceRoll < 0.35) return "uranium";
      if (terrain === "mountain" && resourceRoll < 0.55) return "rare_earth";
      return resourceRoll < 0.3 ? "mixed" : null;

    case "russia":
      if (resourceRoll < 0.55) return "fuel";
      if (resourceRoll < 0.65) return "uranium";
      if (terrain === "forest") return resourceRoll < 0.8 ? "mixed" : null;
      return resourceRoll < 0.75 ? "fuel" : null;

    case "china":
      if (resourceRoll < 0.45) return "rare_earth";
      if (resourceRoll < 0.6) return "fuel";
      if (terrain === "agricultural") return "mixed";
      return resourceRoll < 0.75 ? "mixed" : null;

    case "india":
      if (terrain === "agricultural" || terrain === "forest") return "mixed";
      if (terrain === "desert" || terrain === "land") {
        if (resourceRoll < 0.4) return "fuel";
      }
      if (resourceRoll < 0.35) return "rare_earth";
      return "mixed";

    case "opec":
      if (r <= 10) {
        if (resourceRoll < 0.5) return "fuel";
        if (resourceRoll < 0.65) return "uranium";
        return resourceRoll < 0.8 ? "fuel" : null;
      }
      if (q >= 36 && r >= 14) {
        if (terrain === "agricultural") return "mixed";
        if (resourceRoll < 0.35) return "fuel";
        return "mixed";
      }
      if (resourceRoll < 0.65) return "fuel";
      if (terrain === "coastal") return resourceRoll < 0.5 ? "fuel" : "mixed";
      return null;

    case "latam":
      if (terrain === "forest") return resourceRoll < 0.45 ? "mixed" : null;
      if (terrain === "land" || terrain === "desert") {
        if (resourceRoll < 0.3) return "fuel";
        if (resourceRoll < 0.5) return "rare_earth";
      }
      if (terrain === "agricultural") return "mixed";
      return resourceRoll < 0.4 ? "mixed" : null;

    case "africa":
      if (terrain === "mountain" || terrain === "land") {
        if (resourceRoll < 0.35) return "rare_earth";
        if (resourceRoll < 0.5) return "uranium";
        if (resourceRoll < 0.6) return "fuel";
      }
      if (terrain === "forest" || terrain === "agricultural") return "mixed";
      if (terrain === "coastal") return resourceRoll < 0.45 ? "fuel" : resourceRoll < 0.6 ? "mixed" : null;
      return resourceRoll < 0.35 ? "mixed" : null;

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
      const resource = assignResource(q, r, terrain, countryId, rand);

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
