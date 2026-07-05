import { useState } from "react";
import { useGame } from "../../context/GameContext";
import { COUNTRY_CONFIGS, type CountryId } from "../../types/hex";
import {
  COUNTRY_SHORT_NAMES,
  getLastCycleRelationDelta,
  getRelationColor,
  getRelationHistoryForPair,
  getRelationLabel,
  isTradePartner,
} from "../../lib/relationMechanics";

export function RelationsMatrix() {
  const { gameState, viewCountry } = useGame();
  const [selectedOther, setSelectedOther] = useState<CountryId | null>(null);

  const countryIds = Object.keys(COUNTRY_CONFIGS) as CountryId[];

  return (
    <>
      <div className="section-title">Relations Matrix</div>
      <div className="card relations-matrix-wrap">
        <table className="relations-matrix">
          <thead>
            <tr>
              <th />
              {countryIds.map((id) => (
                <th key={id} className={id === viewCountry ? "matrix-highlight" : ""}>
                  {COUNTRY_SHORT_NAMES[id]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {countryIds.map((rowId) => (
              <tr key={rowId} className={rowId === viewCountry ? "matrix-highlight-row" : ""}>
                <th className={rowId === viewCountry ? "matrix-highlight" : ""}>
                  {COUNTRY_SHORT_NAMES[rowId]}
                </th>
                {countryIds.map((colId) => {
                  if (rowId === colId) {
                    return <td key={colId} className="matrix-self">—</td>;
                  }
                  const score = gameState.regions[rowId].relations[colId] ?? 50;
                  const isViewerCell = rowId === viewCountry;
                  return (
                    <td key={colId}>
                      <button
                        type="button"
                        className={`matrix-cell ${isViewerCell ? "clickable" : ""}`}
                        style={{ background: getRelationColor(score), color: score >= 40 ? "#111" : "#fff" }}
                        disabled={!isViewerCell}
                        onClick={() => isViewerCell && setSelectedOther(colId)}
                        title={`${COUNTRY_CONFIGS[rowId].name} → ${COUNTRY_CONFIGS[colId].name}: ${score}`}
                      >
                        {score}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
          Your row is highlighted. Click a cell to inspect relations from {COUNTRY_CONFIGS[viewCountry].name}.
        </p>
      </div>

      {selectedOther && (
        <RelationDetailModal
          other={selectedOther}
          onClose={() => setSelectedOther(null)}
        />
      )}
    </>
  );
}

function RelationDetailModal({
  other,
  onClose,
}: {
  other: CountryId;
  onClose: () => void;
}) {
  const { gameState, viewCountry } = useGame();
  const score = gameState.regions[viewCountry].relations[other] ?? 50;
  const label = getRelationLabel(score);
  const partner = isTradePartner(gameState.tradePartners, viewCountry, other);
  const lastDelta = getLastCycleRelationDelta(
    gameState.relationEvents,
    viewCountry,
    other,
    gameState.cycle
  );
  const history = getRelationHistoryForPair(gameState.relationEvents, viewCountry, other);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Relations with {COUNTRY_CONFIGS[other].name}</h3>
          <button type="button" className="overlay-btn" onClick={onClose}>Close</button>
        </div>
        <div className="modal-body">
          <div style={{ fontSize: 18, fontWeight: 700, color: getRelationColor(score) }}>
            {score} ({label})
            {lastDelta !== 0 && (
              <span style={{ fontSize: 13, marginLeft: 8 }}>
                {lastDelta > 0 ? "↑" : "↓"} {lastDelta > 0 ? "+" : ""}{lastDelta} from last cycle
              </span>
            )}
          </div>

          {partner ? (
            <>
              <div className="section-title" style={{ marginTop: 16 }}>History</div>
              <div className="relation-history">
                {history.length === 0 && (
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                    No events yet — starting relations at 50.
                  </div>
                )}
                {history.map((e) => {
                  const directed = e.fromCountry === viewCountry;
                  const deltaStr = directed
                    ? (e.delta > 0 ? `+${e.delta}` : `${e.delta}`)
                    : "";
                  return (
                    <div key={e.id} className="relation-history-row">
                      <span className="relation-history-cycle">Cycle {e.cycle}:</span>
                      <span className="relation-history-desc">{e.description}</span>
                      {directed && (
                        <span
                          className="relation-history-delta"
                          style={{ color: e.delta >= 0 ? "#22c55e" : "#ef4444" }}
                        >
                          {deltaStr}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div className="relation-history-row" style={{ opacity: 0.6 }}>
                  <span className="relation-history-cycle">Cycle 1:</span>
                  <span className="relation-history-desc">Starting relations</span>
                  <span className="relation-history-delta">50</span>
                </div>
              </div>
            </>
          ) : (
            <p style={{ marginTop: 12, color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
              No diplomatic history — establish trade to learn more.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
