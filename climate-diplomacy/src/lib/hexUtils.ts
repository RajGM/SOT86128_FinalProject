import { HEX_SIZE } from "../config/constants";
import type { HexData } from "../types/hex";

const NEIGHBOR_DIRS_EVEN: [number, number][] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];

const NEIGHBOR_DIRS_ODD: [number, number][] = [
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 0],
  [0, -1],
];

export function getHexNeighborCoords(q: number, r: number): [number, number][] {
  const dirs = r % 2 === 0 ? NEIGHBOR_DIRS_EVEN : NEIGHBOR_DIRS_ODD;
  return dirs.map(([dq, dr]) => [q + dq, r + dr] as [number, number]);
}

export function createHexLookup(hexes: HexData[]): Map<string, HexData> {
  const lookup = new Map<string, HexData>();
  for (const hex of hexes) {
    lookup.set(`${hex.q},${hex.r}`, hex);
  }
  return lookup;
}

/**
 * Convert offset coordinates (q, r) to pixel position for flat-top hexagons.
 * Using offset coordinates (even-r offset) for a grid layout.
 */
export function hexToPixel(q: number, r: number): { x: number; y: number } {
  const width = Math.sqrt(3) * HEX_SIZE;
  const height = 2 * HEX_SIZE;
  const x = q * width + (r % 2 === 1 ? width / 2 : 0);
  const y = r * height * 0.75;
  return { x, y };
}

/**
 * Generate the 6 corner points of a flat-top hexagon centered at (cx, cy).
 */
export function hexCorners(cx: number, cy: number, size: number = HEX_SIZE): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const px = cx + size * Math.cos(angle);
    const py = cy + size * Math.sin(angle);
    points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return points.join(" ");
}

/**
 * Get the total pixel dimensions of the map.
 */
export function getMapDimensions(cols: number, rows: number): { width: number; height: number } {
  const lastCol = hexToPixel(cols - 1, 1); // odd row has extra offset
  const lastRow = hexToPixel(0, rows - 1);
  return {
    width: lastCol.x + HEX_SIZE * 2,
    height: lastRow.y + HEX_SIZE * 2,
  };
}
