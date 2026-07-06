import type { CountryId } from "../../types/hex";
import { COUNTRY_CONFIGS } from "../../types/hex";
import type { CountryComparisonRow } from "../../lib/comparisonMetrics";
import {
  METRIC_HEADERS,
  type ComparisonMetricKey,
} from "../../lib/comparisonMetrics";

export const METRIC_KEYS: ComparisonMetricKey[] = [
  "co2PerCapita",
  "greenRatio",
  "carbonTax",
  "co2Trend",
  "summitVotes",
  "climateFinance",
];

export function VictoryRadarChart({
  playerGaps,
  winnerGaps,
  playerColor,
  playerName,
  winnerName,
}: {
  playerGaps: CountryComparisonRow["gaps"];
  winnerGaps: CountryComparisonRow["gaps"];
  playerColor: string;
  playerName: string;
  winnerName: string;
}) {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 88;
  const labels = METRIC_KEYS.map((k) => METRIC_HEADERS[k].label);

  const angleFor = (i: number) => (Math.PI * 2 * i) / labels.length - Math.PI / 2;

  const pointFor = (gaps: CountryComparisonRow["gaps"], i: number) => {
    const key = METRIC_KEYS[i];
    const gap = gaps[key];
    const r = gap * maxR;
    const a = angleFor(i);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const playerPoints = METRIC_KEYS.map((_, i) => pointFor(playerGaps, i));
  const winnerPoints = METRIC_KEYS.map((_, i) => pointFor(winnerGaps, i));

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="victory-chart-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="comparison-radar">
        {rings.map((ring) => (
          <polygon
            key={ring}
            points={METRIC_KEYS.map((_, i) => {
              const a = angleFor(i);
              const r = ring * maxR;
              return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
            }).join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
          />
        ))}
        {METRIC_KEYS.map((_, i) => {
          const a = angleFor(i);
          const lx = cx + (maxR + 16) * Math.cos(a);
          const ly = cy + (maxR + 16) * Math.sin(a);
          return (
            <g key={i}>
              <line
                x1={cx}
                y1={cy}
                x2={cx + maxR * Math.cos(a)}
                y2={cy + maxR * Math.sin(a)}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.55)"
                fontSize={9}
              >
                {labels[i]}
              </text>
            </g>
          );
        })}
        <path
          d={toPath(winnerPoints)}
          fill="rgba(34,197,94,0.15)"
          stroke="#22c55e"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <path d={toPath(playerPoints)} fill={`${playerColor}33`} stroke={playerColor} strokeWidth={2} />
        <circle cx={cx} cy={cy} r={3} fill="rgba(255,255,255,0.4)" />
      </svg>
      <div className="victory-chart-legend">
        <span style={{ color: playerColor }}>■ {playerName}</span>
        <span style={{ color: "#22c55e" }}>▬ {winnerName} (winner)</span>
      </div>
    </div>
  );
}

export function VictoryTrendChart({
  history,
  countryIds,
}: {
  history: Partial<Record<CountryId, { cycle: number; gap: number }[]>>;
  countryIds: CountryId[];
}) {
  const width = 520;
  const height = 200;
  const pad = { top: 14, right: 14, bottom: 30, left: 40 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const allPoints = countryIds.flatMap((id) => history[id] ?? []);
  const minCycle = allPoints.length ? Math.min(...allPoints.map((p) => p.cycle)) : 1;
  const maxCycle = allPoints.length ? Math.max(...allPoints.map((p) => p.cycle)) : 1;
  const cycleRange = Math.max(maxCycle - minCycle, 1);

  const xFor = (cycle: number) => pad.left + ((cycle - minCycle) / cycleRange) * plotW;
  const yFor = (gap: number) => pad.top + gap * plotH;

  return (
    <div className="victory-chart-wrap">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="comparison-trend">
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line
              x1={pad.left}
              y1={yFor(g)}
              x2={width - pad.right}
              y2={yFor(g)}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={1}
            />
            <text x={pad.left - 8} y={yFor(g) + 3} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize={8}>
              {g.toFixed(2)}
            </text>
          </g>
        ))}
        {countryIds.map((id) => {
          const pts = history[id] ?? [];
          if (pts.length < 1) return null;
          const d =
            pts.length === 1
              ? `M ${xFor(pts[0]!.cycle).toFixed(1)} ${yFor(pts[0]!.gap).toFixed(1)}`
              : pts
                  .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(p.cycle).toFixed(1)} ${yFor(p.gap).toFixed(1)}`)
                  .join(" ");
          return (
            <path
              key={id}
              d={d}
              fill="none"
              stroke={COUNTRY_CONFIGS[id].color}
              strokeWidth={1.5}
              opacity={0.85}
            />
          );
        })}
        <text x={width / 2} y={height - 8} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={9}>
          Cycle →
        </text>
        <text
          x={12}
          y={height / 2}
          textAnchor="middle"
          fill="rgba(255,255,255,0.4)"
          fontSize={8}
          transform={`rotate(-90 12 ${height / 2})`}
        >
          Composite gap
        </text>
      </svg>
      <div className="victory-trend-legend">
        {countryIds.map((id) => (
          <span key={id} style={{ color: COUNTRY_CONFIGS[id].color }}>
            ▬ {COUNTRY_CONFIGS[id].name}
          </span>
        ))}
      </div>
    </div>
  );
}
