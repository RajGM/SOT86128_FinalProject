import { useState } from "react";
import { useGame } from "../../context/GameContext";
import { TRADE_ITEMS } from "../../config/builds";
import { COUNTRY_CONFIGS } from "../../types/hex";
import type { TradeItem, TradeMode } from "../../types/game";
import { formatRoutePath } from "../../lib/routeDetection";

export function TradePanel() {
  const { gameState, viewCountry, proposeTrade } = useGame();
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [item, setItem] = useState<TradeItem>("food");
  const [amount, setAmount] = useState(50);
  const [tradeMode, setTradeMode] = useState<TradeMode>("one_time");

  const activeRoutes = gameState.transportRoutes.filter(
    (r) => r.status === "active" && (r.from === viewCountry || r.to === viewCountry)
  );

  const selectedRoute = activeRoutes.find((r) => r.id === selectedRouteId);
  const partner = selectedRoute
    ? (selectedRoute.from === viewCountry ? selectedRoute.to : selectedRoute.from)
    : null;

  return (
    <div>
      <div className="section-title">Trade — {COUNTRY_CONFIGS[viewCountry].name}</div>

      {activeRoutes.length === 0 ? (
        <div className="card" style={{ borderColor: "rgba(239,68,68,0.4)" }}>
          <strong>No active routes</strong>
          <div style={{ fontSize: 11, marginTop: 4 }}>
            Establish a route first in the Routes tab, then trade on it.
          </div>
        </div>
      ) : (
        <div className="card">
          <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Select Route</label>
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            style={{ width: "100%", padding: 6, background: "#2a2a3e", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4 }}
          >
            <option value="">— Pick a route —</option>
            {activeRoutes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.routeType.toUpperCase()}: {formatRoutePath(r.path)} ({r.emissionsPerCycle} CO₂)
              </option>
            ))}
          </select>

          {selectedRoute && partner && (
            <>
              <div style={{ fontSize: 11, marginTop: 8, color: "rgba(255,255,255,0.6)" }}>
                Trading with: <strong>{COUNTRY_CONFIGS[partner].name}</strong>
              </div>

              <label style={{ fontSize: 11, display: "block", margin: "8px 0 4px" }}>Trade item</label>
              <select
                value={item}
                onChange={(e) => setItem(e.target.value as TradeItem)}
                style={{ width: "100%", padding: 6, background: "#2a2a3e", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4 }}
              >
                {TRADE_ITEMS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>

              <label style={{ fontSize: 11, display: "block", margin: "8px 0 4px" }}>Amount</label>
              <input
                type="number"
                value={amount}
                min={1}
                onChange={(e) => setAmount(Number(e.target.value))}
                style={{ width: "100%", padding: 6, background: "#2a2a3e", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4 }}
              />

              <label style={{ fontSize: 11, display: "block", margin: "8px 0 4px" }}>Trade mode</label>
              <select
                value={tradeMode}
                onChange={(e) => setTradeMode(e.target.value as TradeMode)}
                style={{ width: "100%", padding: 6, background: "#2a2a3e", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4 }}
              >
                <option value="one_time">One-time exchange</option>
                <option value="continuous">Continuous (each cycle)</option>
              </select>

              <button
                className="overlay-btn primary"
                style={{ marginTop: 8 }}
                onClick={() => proposeTrade(viewCountry, partner, item, amount, selectedRoute.id, tradeMode)}
              >
                Propose Trade
              </button>
            </>
          )}
        </div>
      )}

      <div className="section-title">Active Agreements</div>
      {gameState.tradeAgreements.length === 0 && (
        <div className="card" style={{ color: "rgba(255,255,255,0.5)" }}>No trade agreements yet.</div>
      )}
      {gameState.tradeAgreements.map((a) => {
        const route = gameState.transportRoutes.find((r) => r.id === a.routeId);
        return (
          <div key={a.id} className="card" style={{ opacity: a.active ? 1 : 0.5 }}>
            {COUNTRY_CONFIGS[a.from].name} → {COUNTRY_CONFIGS[a.to].name}:{" "}
            {TRADE_ITEMS.find((t) => t.id === a.item)?.label ?? a.item} ({a.amount})
            {route && ` via ${route.routeType}`}
            {a.tradeMode === "continuous" ? " · continuous" : ""}
            {!a.active && " · HALTED"}
          </div>
        );
      })}
    </div>
  );
}
