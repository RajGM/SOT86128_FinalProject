import { useEffect, useMemo, useState } from "react";
import type { CountryId } from "../../types/hex";
import { COUNTRY_CONFIGS } from "../../types/hex";
import type { GameState } from "../../types/game";
import type { PlayerResult } from "../../types/multiplayer";
import {
  BADGE_COLORS,
  BADGE_LABELS,
  computeSpecialAwards,
  PODIUM_LABELS,
  PODIUM_MEDALS,
  STATS_VIEW_MS,
} from "../../lib/scoring";
import { METRIC_HEADERS, type ComparisonMetricKey } from "../../lib/comparisonMetrics";
import { VictoryRadarChart, VictoryTrendChart } from "./VictoryCharts";
import "../../styles/lobby.css";

const METRIC_KEYS: ComparisonMetricKey[] = [
  "co2PerCapita",
  "greenRatio",
  "carbonTax",
  "co2Trend",
  "summitVotes",
  "climateFinance",
];

function formatMetric(key: ComparisonMetricKey, raw: PlayerResult["raw"]): string {
  const v = raw[key];
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

interface StatsScreenProps {
  results: PlayerResult[];
  gameState: GameState;
  viewCountry: CountryId;
  finalCycle: number;
  finalTemperature: number;
  countdownSec?: number;
  archived?: boolean;
  onReturn: () => void;
}

export function StatsScreen({
  results,
  gameState,
  viewCountry,
  finalCycle,
  finalTemperature,
  countdownSec,
  archived = true,
  onReturn,
}: StatsScreenProps) {
  const [remaining, setRemaining] = useState(countdownSec ?? STATS_VIEW_MS / 1000);

  const specialAwards = useMemo(
    () => computeSpecialAwards(gameState, results),
    [gameState, results]
  );

  const podium = results.slice(0, 3);
  const winner = results[0];
  const playerResult = results.find((r) => r.country === viewCountry) ?? results[0];
  const countryIds = Object.keys(COUNTRY_CONFIGS) as CountryId[];

  useEffect(() => {
    if (countdownSec === undefined) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          onReturn();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [countdownSec, onReturn]);

  return (
    <div className="stats-screen">
      <div className="stats-panel overlay-panel stats-panel-wide">
        <h2 className="stats-title">🌍 GAME OVER — Cycle {finalCycle}</h2>
        <p className="stats-subtitle">
          Final Temperature: +{finalTemperature.toFixed(1)}°C
        </p>

        <div className="stats-divider" />

        {podium.length > 0 && (
          <div className="stats-podium">
            {podium.map((r, i) => (
              <div key={r.country} className={`stats-podium-item rank-${i + 1}`}>
                <div className="stats-podium-medal">{PODIUM_MEDALS[i]}</div>
                <div className="stats-podium-country" style={{ color: COUNTRY_CONFIGS[r.country].color }}>
                  {COUNTRY_CONFIGS[r.country].name}
                </div>
                <div className="stats-podium-player">
                  {r.isBot ? "(bot)" : r.playerName}
                </div>
                <div className="stats-podium-score">Score: {r.displayScore}</div>
                {r.podiumAward && (
                  <div className="stats-podium-award">{PODIUM_LABELS[r.podiumAward]}</div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="stats-divider" />

        <div className="settings-section-title" style={{ borderTop: "none" }}>
          Full Rankings
        </div>
        <div className="stats-table-wrap">
          <table className="stats-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Country</th>
                <th>Player</th>
                <th>Score</th>
                <th>CO₂/cap</th>
                <th>Green%</th>
                <th>Tax</th>
                <th>Badge</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.country}
                  className={r.country === viewCountry ? "stats-row-player" : ""}
                >
                  <td>{r.rank}</td>
                  <td>
                    <span className="country-dot" style={{ background: COUNTRY_CONFIGS[r.country].color }} />
                    {COUNTRY_CONFIGS[r.country].name}
                  </td>
                  <td>{r.isBot ? "(bot)" : r.playerName}</td>
                  <td className="stats-score-cell">{r.displayScore}</td>
                  <td>{formatMetric("co2PerCapita", r.raw)}</td>
                  <td>{formatMetric("greenRatio", r.raw)}</td>
                  <td>{formatMetric("carbonTax", r.raw)}</td>
                  <td>
                    <span
                      className="stats-badge"
                      style={{
                        color: BADGE_COLORS[r.badge],
                        borderColor: `${BADGE_COLORS[r.badge]}66`,
                        background: `${BADGE_COLORS[r.badge]}22`,
                      }}
                    >
                      {BADGE_LABELS[r.badge]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {specialAwards.length > 0 && (
          <>
            <div className="settings-section-title">Special Awards</div>
            <ul className="stats-awards-list">
              {specialAwards.map((a) => (
                <li key={a.id}>
                  <span className="stats-award-emoji">{a.emoji}</span>
                  <strong>{a.label}:</strong> {a.detail}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="stats-charts">
          <div className="stats-chart-panel">
            <div className="settings-section-title" style={{ borderTop: "none" }}>
              Your Journey
            </div>
            <p className="stats-chart-hint">
              Composite gap trend — lines moving down = catching up to pioneer
            </p>
            <VictoryTrendChart history={gameState.gapScoreHistory} countryIds={countryIds} />
          </div>

          {winner && playerResult && (
            <div className="stats-chart-panel">
              <div className="settings-section-title" style={{ borderTop: "none" }}>
                Radar Chart
              </div>
              <p className="stats-chart-hint">
                Your 6 metrics vs the winner — center = pioneer, edge = laggard
              </p>
              <VictoryRadarChart
                playerGaps={playerResult.gaps}
                winnerGaps={winner.gaps}
                playerColor={COUNTRY_CONFIGS[playerResult.country].color}
                playerName={COUNTRY_CONFIGS[playerResult.country].name}
                winnerName={COUNTRY_CONFIGS[winner.country].name}
              />
            </div>
          )}
        </div>

        <p className="stats-scoring-note">
          Score = (1 − composite gap) × 100 · Equal weights on{" "}
          {METRIC_KEYS.map((k) => METRIC_HEADERS[k].label).join(", ")} · Liefferink et al. (2009)
        </p>

        <div className="stats-actions">
          <button type="button" className="overlay-btn primary" onClick={onReturn}>
            Return to Menu
          </button>
        </div>

        {archived && (
          <p className="stats-archived-note">Game archived. Results saved.</p>
        )}

        {countdownSec !== undefined && remaining > 0 && (
          <p className="stats-countdown">
            Returning to menu in {remaining} seconds…
          </p>
        )}
      </div>
    </div>
  );
}
