import { useState } from "react";
import { useGame } from "../../context/GameContext";
import { TRADE_ITEMS } from "../../config/builds";
import { COUNTRY_CONFIGS, type CountryId } from "../../types/hex";
import type { TradeItem, TradeMode } from "../../types/game";
import { formatRoutePath } from "../../lib/routeDetection";
import { getHubsForCountry } from "../../lib/transportHub";

export function TradePanel() {
  const { gameState, viewCountry, proposeTrade, getRoutePreview, getTransportCapacity } = useGame();
  const [partner, setPartner] = useState<CountryId>("eu");
  const [item, setItem] = useState<TradeItem>("food");
  const [amount, setAmount] = useState(50);
  const [tradeMode, setTradeMode] = useState<TradeMode>("one_time");
  const [hubTargetId, setHubTargetId] = useState("");
  const [hubTargetTier, setHubTargetTier] = useState<2 | 3>(2);

  const countryIds = (Object.keys(COUNTRY_CONFIGS) as CountryId[]).filter(
    (id) => id !== viewCountry
  );

  const routePreview = getRoutePreview(viewCountry, partner);
  const capacity = getTransportCapacity(viewCountry);
  const partnerHubs = getHubsForCountry(partner, Object.values(gameState.tileBuildings));
  const transportNeeded = item !== "hub_upgrade";
  const effectiveAmount = transportNeeded ? amount : 0;
  const canTrade =
    (!transportNeeded || (routePreview && !routePreview.needsTransitApproval)) &&
    effectiveAmount <= capacity.remaining &&
    amount > 0;

  return (
    <div>
      <div className="section-title">Trade — {COUNTRY_CONFIGS[viewCountry].name}</div>

      <div className="card" style={{ fontSize: 11, marginBottom: 8 }}>
        Transport capacity: {capacity.used}/{capacity.total} units used this cycle
        {capacity.total === 0 && (
          <span style={{ color: "#ef4444" }}> — build a Transport Hub first</span>
        )}
      </div>

      <div className="card">
        <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Trade partner</label>
        <select
          value={partner}
          onChange={(e) => setPartner(e.target.value as CountryId)}
          style={{ width: "100%", padding: 6, background: "#2a2a3e", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4 }}
        >
          {countryIds.map((id) => (
            <option key={id} value={id}>{COUNTRY_CONFIGS[id].name}</option>
          ))}
        </select>

        {transportNeeded && (
          <div style={{ fontSize: 11, marginTop: 8 }}>
            {routePreview ? (
              <>
                <span style={{ color: "#22c55e" }}>Auto-route: {routePreview.routeType.toUpperCase()}</span>
                {" · "}{formatRoutePath(routePreview.path)}
                {" · "}{routePreview.emissionsPerUnit} CO₂/unit
                {routePreview.needsTransitApproval && (
                  <div style={{ color: "#eab308", marginTop: 4 }}>
                    Transit approval required — check Routes tab
                  </div>
                )}
                {effectiveAmount > capacity.remaining && (
                  <div style={{ color: "#ef4444", marginTop: 4 }}>
                    Insufficient capacity — max {capacity.remaining} units this cycle
                  </div>
                )}
              </>
            ) : (
              <span style={{ color: "#ef4444" }}>
                No route available — upgrade your Transport Hub tier
              </span>
            )}
          </div>
        )}

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

        {item === "hub_upgrade" && (
          <>
            <label style={{ fontSize: 11, display: "block", margin: "8px 0 4px" }}>Partner hub to upgrade</label>
            <select
              value={hubTargetId}
              onChange={(e) => setHubTargetId(e.target.value)}
              style={{ width: "100%", padding: 6, background: "#2a2a3e", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4 }}
            >
              <option value="">— Select hub —</option>
              {partnerHubs.map((h) => (
                <option key={h.id} value={h.id}>
                  T{h.tier} hub at ({h.q},{h.r})
                </option>
              ))}
            </select>
            <label style={{ fontSize: 11, display: "block", margin: "8px 0 4px" }}>Upgrade to tier</label>
            <select
              value={hubTargetTier}
              onChange={(e) => setHubTargetTier(Number(e.target.value) as 2 | 3)}
              style={{ width: "100%", padding: 6, background: "#2a2a3e", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4 }}
            >
              <option value={2}>Tier 2 (sea)</option>
              <option value={3}>Tier 3 (air)</option>
            </select>
          </>
        )}

        {item !== "hub_upgrade" && (
          <>
            <label style={{ fontSize: 11, display: "block", margin: "8px 0 4px" }}>Amount</label>
            <input
              type="number"
              value={amount}
              min={1}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{ width: "100%", padding: 6, background: "#2a2a3e", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4 }}
            />
          </>
        )}

        {item !== "hub_upgrade" && (
          <>
            <label style={{ fontSize: 11, display: "block", margin: "8px 0 4px" }}>Trade mode</label>
            <select
              value={tradeMode}
              onChange={(e) => setTradeMode(e.target.value as TradeMode)}
              style={{ width: "100%", padding: 6, background: "#2a2a3e", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4 }}
            >
              <option value="one_time">One-time exchange</option>
              <option value="continuous">Continuous (each cycle)</option>
            </select>
          </>
        )}

        <button
          className="overlay-btn primary"
          style={{ marginTop: 8 }}
          disabled={!canTrade || (item === "hub_upgrade" && !hubTargetId)}
          onClick={() => {
            if (item === "hub_upgrade" && hubTargetId) {
              proposeTrade(viewCountry, partner, item, hubTargetTier, "one_time", {
                hubUpgradeBuildingId: hubTargetId,
                hubUpgradeToTier: hubTargetTier,
                hubUpgradePayer: viewCountry,
              });
            } else {
              proposeTrade(viewCountry, partner, item, amount, tradeMode);
            }
          }}
        >
          Propose Trade
        </button>
      </div>

      <div className="section-title">Active Agreements</div>
      {gameState.tradeAgreements.length === 0 && (
        <div className="card" style={{ color: "rgba(255,255,255,0.5)" }}>No trade agreements yet.</div>
      )}
      {gameState.tradeAgreements.map((a) => {
        const route = gameState.transportRoutes.find((r) => r.id === a.routeId);
        return (
          <div key={a.id} className="card" style={{ opacity: a.active ? 1 : 0.5 }}>
            {COUNTRY_CONFIGS[a.from].name} → {COUNTRY_CONFIGS[a.to].name}:{" "}
            {TRADE_ITEMS.find((t) => t.id === a.item)?.label ?? a.item}
            {a.item !== "hub_upgrade" && ` (${a.amount})`}
            {a.item === "hub_upgrade" && a.hubUpgradeToTier && ` → T${a.hubUpgradeToTier}`}
            {route && ` via ${route.routeType}`}
            {a.tradeMode === "continuous" ? " · continuous" : ""}
            {!a.active && " · HALTED"}
          </div>
        );
      })}
    </div>
  );
}
