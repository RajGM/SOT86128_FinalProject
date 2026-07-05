import { useMemo } from "react";
import type { TransportRoute } from "../../types/game";
import type { CountryId } from "../../types/hex";
import { COUNTRY_CONFIGS } from "../../types/hex";
import { hexToPixel } from "../../lib/hexUtils";

interface RouteLinesProps {
  routes: TransportRoute[];
  highlightedIds: string[];
}

const STATUS_STROKE: Record<string, string> = {
  active: "#22c55e",
  pending: "#eab308",
  disrupted: "#ef4444",
};

function getDashArray(routeType: string): string {
  switch (routeType) {
    case "air": return "8 4";
    case "sea": return "2 4";
    default: return "none";
  }
}

function countryCenter(countryId: CountryId): { x: number; y: number } {
  const cfg = COUNTRY_CONFIGS[countryId];
  return hexToPixel(cfg.centerQ, cfg.centerR);
}

function buildPathD(path: CountryId[]): string {
  if (path.length < 2) return "";
  const points = path.map(countryCenter);
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

export function RouteLines({ routes, highlightedIds }: RouteLinesProps) {
  const visibleRoutes = useMemo(
    () => routes.filter((r) => highlightedIds.length === 0 || highlightedIds.includes(r.id)),
    [routes, highlightedIds]
  );

  if (visibleRoutes.length === 0) return null;

  return (
    <g className="route-lines" pointerEvents="none">
      {visibleRoutes.map((route) => {
        const d = buildPathD(route.path);
        if (!d) return null;
        const isHighlighted = highlightedIds.includes(route.id);
        const stroke = STATUS_STROKE[route.status] ?? "#888";
        const dash = getDashArray(route.routeType);

        return (
          <path
            key={route.id}
            d={d}
            fill="none"
            stroke={stroke}
            strokeWidth={isHighlighted ? 3 : 1.5}
            strokeDasharray={dash}
            opacity={isHighlighted ? 0.9 : 0.5}
          />
        );
      })}
    </g>
  );
}
