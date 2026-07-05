import { useMemo, useState } from "react";
import { useGame } from "../../context/GameContext";
import {
  computeAllCountryComparisons,
  getCurrentPioneer,
  gapCellColor,
  statusLabel,
  METRIC_HEADERS,
  type ComparisonMetricKey,
  type CountryComparisonRow,
} from "../../lib/comparisonMetrics";
import { COUNTRY_CONFIGS, type CountryId } from "../../types/hex";
import "./overlay.css";

type SortKey = ComparisonMetricKey | "compositeGap" | "rank" | "country";

const METRIC_KEYS: ComparisonMetricKey[] = [
  "co2PerCapita",
  "greenRatio",
  "carbonTax",
  "co2Trend",
  "summitVotes",
  "climateFinance",
];

function formatRawValue(key: ComparisonMetricKey, row: CountryComparisonRow): string {
  const v = row.raw[key];
  switch (key) {
    case "co2PerCapita":
      return v.toFixed(2);
    case "greenRatio":
      return `${Math.round(v * 100)}%`;
    case "carbonTax":
      return String(Math.round(v));
    case "co2Trend":
      return v >= 0 ? `+${Math.round(v)}` : String(Math.round(v));
    case "summitVotes":
      return `${Math.round(v * 100)}%`;
    case "climateFinance":
      return String(Math.round(v));
    default:
      return String(v);
  }
}

function RadarChart({
  playerGaps,
  pioneerGaps,
  playerColor,
}: {
  playerGaps: CountryComparisonRow["gaps"];
  pioneerGaps: CountryComparisonRow["gaps"];
  playerColor: string;
}) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 82;
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
  const pioneerPoints = METRIC_KEYS.map((_, i) => pointFor(pioneerGaps, i));

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  const rings = [0.25, 0.5, 0.75, 1];

  return (
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
        const lx = cx + (maxR + 14) * Math.cos(a);
        const ly = cy + (maxR + 14) * Math.sin(a);
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
      <path d={toPath(pioneerPoints)} fill="rgba(34,197,94,0.15)" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4 3" />
      <path d={toPath(playerPoints)} fill={`${playerColor}33`} stroke={playerColor} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={3} fill="rgba(255,255,255,0.4)" />
      <text x={cx} y={size - 6} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={8}>
        center = pioneer · edge = laggard
      </text>
    </svg>
  );
}

function TrendChart({
  history,
  countryIds,
}: {
  history: Partial<Record<CountryId, { cycle: number; gap: number }[]>>;
  countryIds: CountryId[];
}) {
  const width = 420;
  const height = 180;
  const pad = { top: 12, right: 12, bottom: 28, left: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const allPoints = countryIds.flatMap((id) => history[id] ?? []);
  const minCycle = allPoints.length ? Math.min(...allPoints.map((p) => p.cycle)) : 1;
  const maxCycle = allPoints.length ? Math.max(...allPoints.map((p) => p.cycle)) : 1;
  const cycleRange = Math.max(maxCycle - minCycle, 1);

  const xFor = (cycle: number) => pad.left + ((cycle - minCycle) / cycleRange) * plotW;
  const yFor = (gap: number) => pad.top + gap * plotH;

  return (
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
          <text x={pad.left - 6} y={yFor(g) + 3} textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize={8}>
            {g.toFixed(2)}
          </text>
        </g>
      ))}
      {countryIds.map((id) => {
        const pts = history[id] ?? [];
        if (pts.length < 2) return null;
        const d = pts
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
      <text x={width / 2} y={height - 6} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={9}>
        Cycle →
      </text>
      <text
        x={10}
        y={height / 2}
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize={8}
        transform={`rotate(-90 10 ${height / 2})`}
      >
        Gap score
      </text>
    </svg>
  );
}

export function ComparisonDashboard() {
  const { gameState, viewCountry, comparisonOpen, setComparisonOpen } = useGame();
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortAsc, setSortAsc] = useState(true);

  const rows = useMemo(() => computeAllCountryComparisons(gameState), [gameState]);
  const pioneer = useMemo(() => getCurrentPioneer(rows), [rows]);
  const playerRow = rows.find((r) => r.countryId === viewCountry) ?? rows[0];

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === "country") {
        av = a.name;
        bv = b.name;
      } else if (sortKey === "rank") {
        av = a.rank;
        bv = b.rank;
      } else if (sortKey === "compositeGap") {
        av = a.compositeGap;
        bv = b.compositeGap;
      } else {
        av = a.raw[sortKey];
        bv = b.raw[sortKey];
      }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key === "rank" || key === "country");
    }
  };

  if (!comparisonOpen) return null;

  const countryIds = Object.keys(COUNTRY_CONFIGS) as CountryId[];

  return (
    <div className="modal-backdrop" onClick={() => setComparisonOpen(false)}>
      <div className="modal-content comparison-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Comparison Dashboard</span>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
              Pioneer/Laggard gap approach · Liefferink et al. (2009)
            </div>
          </div>
          <button className="overlay-btn" onClick={() => setComparisonOpen(false)}>✕</button>
        </div>

        <div className="modal-body comparison-body">
          <div className="section-title">Rankings — gap from current pioneer</div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: "0 0 8px" }}>
            Click column headers to sort. Green = close to pioneer, red = close to laggard.
            Bottom 2 composite gap = Pioneer · Top 2 = Laggard.
          </p>
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("rank")} className="sortable">
                    Rank {sortKey === "rank" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  <th onClick={() => handleSort("country")} className="sortable">
                    Country {sortKey === "country" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  {METRIC_KEYS.map((key) => (
                    <th key={key} onClick={() => handleSort(key)} className="sortable" title={`Pioneer: ${METRIC_HEADERS[key].pioneerHint}`}>
                      {METRIC_HEADERS[key].label}
                      <span className="pioneer-hint"> ({METRIC_HEADERS[key].pioneerHint})</span>
                      {sortKey === key ? (sortAsc ? " ↑" : " ↓") : ""}
                    </th>
                  ))}
                  <th onClick={() => handleSort("compositeGap")} className="sortable">
                    Gap Score {sortKey === "compositeGap" ? (sortAsc ? "↑" : "↓") : ""}
                  </th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr
                    key={row.countryId}
                    className={row.countryId === viewCountry ? "comparison-row-player" : ""}
                  >
                    <td>{row.rank}</td>
                    <td style={{ fontWeight: 600 }}>
                      <span className="country-dot" style={{ background: row.color }} />
                      {row.name}
                    </td>
                    {METRIC_KEYS.map((key) => (
                      <td
                        key={key}
                        style={{
                          background: gapCellColor(row.gaps[key]),
                          color: row.gaps[key] > 0.5 ? "#fff" : "#111",
                        }}
                      >
                        {formatRawValue(key, row)}
                      </td>
                    ))}
                    <td
                      style={{
                        background: gapCellColor(row.compositeGap),
                        fontWeight: 700,
                        color: row.compositeGap > 0.5 ? "#fff" : "#111",
                      }}
                    >
                      {row.compositeGap.toFixed(2)}
                    </td>
                    <td>{statusLabel(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="comparison-charts">
            <div className="comparison-chart-panel">
              <div className="section-title">Gap Radar — {playerRow.name} vs Pioneer</div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: "0 0 8px" }}>
                Solid = your country · Dashed green = current pioneer ({pioneer.name})
              </p>
              <div className="comparison-radar-wrap">
                <RadarChart
                  playerGaps={playerRow.gaps}
                  pioneerGaps={pioneer.gaps}
                  playerColor={playerRow.color}
                />
                <div className="comparison-legend">
                  <div><span style={{ color: playerRow.color }}>■</span> {playerRow.name}</div>
                  <div><span style={{ color: "#22c55e" }}>▬</span> {pioneer.name} (pioneer)</div>
                </div>
              </div>
            </div>

            <div className="comparison-chart-panel">
              <div className="section-title">Historical Trend — composite gap over cycles</div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", margin: "0 0 8px" }}>
                Lines moving down = catching up · up = falling behind · crossing = rank change
              </p>
              <TrendChart history={gameState.gapScoreHistory} countryIds={countryIds} />
              <div className="comparison-trend-legend">
                {countryIds.map((id) => (
                  <span key={id} style={{ color: COUNTRY_CONFIGS[id].color }}>
                    ▬ {COUNTRY_CONFIGS[id].name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
