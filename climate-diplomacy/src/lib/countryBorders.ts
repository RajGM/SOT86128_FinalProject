import { HexData, CountryId } from "../types/hex";
import { hexToPixel } from "./hexUtils";
import { HEX_SIZE } from "../config/constants";

interface Point {
  x: number;
  y: number;
}

interface BorderEdge {
  p1: Point;
  p2: Point;
}

const NEIGHBOR_DIRS_EVEN: [number, number][] = [
  [0, -1], // NE
  [1, 0], // E
  [0, 1], // SE
  [-1, 1], // SW
  [-1, 0], // W
  [-1, -1], // NW
];

const NEIGHBOR_DIRS_ODD: [number, number][] = [
  [1, -1], // NE
  [1, 0], // E
  [1, 1], // SE
  [0, 1], // SW
  [-1, 0], // W
  [0, -1], // NW
];

// Flat-top hex: edge i runs from corner i to corner i+1
const EDGE_TO_DIR = [1, 2, 3, 4, 5, 0];

function pointKey(p: Point): string {
  return `${p.x.toFixed(3)},${p.y.toFixed(3)}`;
}

function edgeKey(p1: Point, p2: Point): string {
  const a = pointKey(p1);
  const b = pointKey(p2);
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function cornerPoint(cx: number, cy: number, cornerIndex: number): Point {
  const angle = (Math.PI / 180) * (60 * cornerIndex - 30);
  return {
    x: cx + HEX_SIZE * Math.cos(angle),
    y: cy + HEX_SIZE * Math.sin(angle),
  };
}

function getNeighborAtEdge(q: number, r: number, edge: number): [number, number] {
  const dirs = r % 2 === 0 ? NEIGHBOR_DIRS_EVEN : NEIGHBOR_DIRS_ODD;
  const [dq, dr] = dirs[EDGE_TO_DIR[edge]];
  return [q + dq, r + dr];
}

function collectBorderEdges(
  hexes: HexData[],
  countryId: CountryId,
  lookup: Map<string, CountryId | null>
): BorderEdge[] {
  const edges: BorderEdge[] = [];

  for (const hex of hexes) {
    if (hex.countryId !== countryId) continue;

    const { x, y } = hexToPixel(hex.q, hex.r);

    for (let edge = 0; edge < 6; edge++) {
      const [nq, nr] = getNeighborAtEdge(hex.q, hex.r, edge);
      const neighborCountry = lookup.get(`${nq},${nr}`) ?? null;
      if (neighborCountry === countryId) continue;

      const p1 = cornerPoint(x, y, edge);
      const p2 = cornerPoint(x, y, (edge + 1) % 6);
      edges.push({ p1, p2 });
    }
  }

  return edges;
}

function stitchEdges(edges: BorderEdge[]): string[] {
  if (edges.length === 0) return [];

  const adj = new Map<string, { point: Point; edgeKey: string }[]>();

  for (const { p1, p2 } of edges) {
    const k1 = pointKey(p1);
    const k2 = pointKey(p2);
    const ek = edgeKey(p1, p2);
    if (!adj.has(k1)) adj.set(k1, []);
    if (!adj.has(k2)) adj.set(k2, []);
    adj.get(k1)!.push({ point: p2, edgeKey: ek });
    adj.get(k2)!.push({ point: p1, edgeKey: ek });
  }

  const used = new Set<string>();
  const paths: string[] = [];

  for (const { p1, p2 } of edges) {
    const startEdge = edgeKey(p1, p2);
    if (used.has(startEdge)) continue;

    const parts = [`M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`];
    used.add(startEdge);

    let from = p1;
    let to = p2;
    parts.push(`L ${to.x.toFixed(2)} ${to.y.toFixed(2)}`);

    while (true) {
      const toKey = pointKey(to);
      const fromKey = pointKey(from);
      const connections = adj.get(toKey) ?? [];

      let next: { point: Point; edgeKey: string } | null = null;
      for (const conn of connections) {
        if (pointKey(conn.point) === fromKey) continue;
        if (used.has(conn.edgeKey)) continue;
        next = conn;
        break;
      }

      if (!next) break;

      used.add(next.edgeKey);
      from = to;
      to = next.point;
      parts.push(`L ${to.x.toFixed(2)} ${to.y.toFixed(2)}`);

      if (pointKey(to) === pointKey(p1)) {
        parts.push("Z");
        break;
      }
    }

    paths.push(parts.join(" "));
  }

  return paths;
}

export interface CountryBorder {
  countryId: CountryId;
  paths: string[];
}

export function computeCountryBorders(hexes: HexData[]): CountryBorder[] {
  const lookup = new Map<string, CountryId | null>();
  for (const hex of hexes) {
    lookup.set(`${hex.q},${hex.r}`, hex.countryId);
  }

  const countryIds = new Set<CountryId>();
  for (const hex of hexes) {
    if (hex.countryId) countryIds.add(hex.countryId);
  }

  const borders: CountryBorder[] = [];

  for (const countryId of countryIds) {
    const edges = collectBorderEdges(hexes, countryId, lookup);
    const paths = stitchEdges(edges);
    if (paths.length > 0) {
      borders.push({ countryId, paths });
    }
  }

  return borders;
}
