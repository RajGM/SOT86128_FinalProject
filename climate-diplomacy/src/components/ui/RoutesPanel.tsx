import { useState } from "react";
import { useGame } from "../../context/GameContext";
import { COUNTRY_CONFIGS, type CountryId } from "../../types/hex";
import { formatRoutePath } from "../../lib/routeDetection";
import { getTransitIncome, getTransitCosts } from "../../lib/tradeRules";
import { getHubCapacity, getHubsForCountry, getCountryMaxHubTier } from "../../lib/transportHub";

export function RoutesPanel() {
  const {
    gameState,
    viewCountry,
    respondTransitRequest,
    cancelTransit,
    acceptTransitTerms,
    getRoutePreview,
    getTransportCapacity,
    proposeTrade,
  } = useGame();

  const [destination, setDestination] = useState<CountryId>("eu");
  const [transitFeeModel, setTransitFeeModel] = useState<"flat" | "commission">("flat");
  const [transitFeeAmount, setTransitFeeAmount] = useState(10);

  const countryIds = (Object.keys(COUNTRY_CONFIGS) as CountryId[]).filter(
    (id) => id !== viewCountry
  );

  const buildings = Object.values(gameState.tileBuildings);
  const myHubs = getHubsForCountry(viewCountry, buildings);
  const maxTier = getCountryMaxHubTier(viewCountry, buildings);
  const capacity = getTransportCapacity(viewCountry);
  const routePreview = getRoutePreview(viewCountry, destination);

  const myRoutes = gameState.transportRoutes.filter(
    (r) => r.from === viewCountry || r.to === viewCountry
  );

  const incomingRequests = gameState.transitRequests.filter(
    (r) => r.transitRegion === viewCountry && r.status === "pending"
  );

  const myTransitAgreements = gameState.transitAgreements.filter(
    (a) => a.transitRegion === viewCountry || a.payer === viewCountry
  );

  const transitIncome = getTransitIncome(gameState.transitAgreements, viewCountry);
  const transitCosts = getTransitCosts(gameState.transitAgreements, viewCountry);

  return (
    <div>
      <div className="section-title">Transport — {COUNTRY_CONFIGS[viewCountry].name}</div>
      <div className="card">
        <div style={{ fontSize: 11, lineHeight: 1.8 }}>
          <div>Transport Hubs: {myHubs.length} · Max tier: T{maxTier || "—"}</div>
          <div>Capacity: {capacity.used}/{capacity.total} units used this cycle</div>
          {myHubs.map((h) => (
            <div key={h.id} style={{ color: "rgba(255,255,255,0.7)" }}>
              T{h.tier} hub ({h.q},{h.r}) — {getHubCapacity(h)} units/cycle
              {h.extraLevel ? ` · +${h.extraLevel} post-T3` : ""}
            </div>
          ))}
        </div>
      </div>

      <div className="section-title">Route Preview</div>
      <div className="card">
        <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Destination</label>
        <select
          value={destination}
          onChange={(e) => setDestination(e.target.value as CountryId)}
          style={{ width: "100%", padding: 6, background: "#2a2a3e", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4 }}
        >
          {countryIds.map((id) => (
            <option key={id} value={id}>{COUNTRY_CONFIGS[id].name}</option>
          ))}
        </select>

        {routePreview ? (
          <div style={{ fontSize: 11, marginTop: 8 }}>
            <div style={{ fontWeight: 600 }}>
              {routePreview.routeType.toUpperCase()}: {routePreview.label}
            </div>
            <div>Path: {formatRoutePath(routePreview.path)}</div>
            <div>{routePreview.emissionsPerUnit} CO₂ per unit</div>
            {routePreview.needsTransitApproval && (
              <div style={{ color: "#eab308", marginTop: 4 }}>
                Transit approval needed — propose a trade to request transit
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "#ef4444", marginTop: 8 }}>
            No route — build or upgrade a Transport Hub
          </div>
        )}

        {routePreview?.needsTransitApproval && (
          <button
            className="overlay-btn"
            style={{ marginTop: 8, width: "100%", fontSize: 11 }}
            onClick={() => proposeTrade(viewCountry, destination, "food", 1, "one_time")}
          >
            Request Transit (initiate route)
          </button>
        )}
      </div>

      <div className="section-title">Active Routes ({myRoutes.length})</div>
      {myRoutes.length === 0 && (
        <div className="card" style={{ color: "rgba(255,255,255,0.5)" }}>
          Routes are created automatically when you trade.
        </div>
      )}
      {myRoutes.map((r) => (
        <div key={r.id} className="card" style={{ opacity: r.status === "disrupted" ? 0.5 : 1 }}>
          <div style={{ fontWeight: 600, fontSize: 12 }}>
            {r.routeType.toUpperCase()}: {formatRoutePath(r.path)}
          </div>
          <div style={{ fontSize: 11 }}>
            <span style={{ color: r.status === "active" ? "#22c55e" : r.status === "pending" ? "#eab308" : "#ef4444" }}>
              {r.status}
            </span>
            {" · "}{r.emissionsPerUnit} CO₂/unit
          </div>
        </div>
      ))}

      {incomingRequests.length > 0 && (
        <>
          <div className="section-title">Transit Requests ({incomingRequests.length})</div>
          {incomingRequests.map((req) => (
            <div key={req.id} className="card">
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                {COUNTRY_CONFIGS[req.traderFrom].name} → {COUNTRY_CONFIGS[req.traderTo].name}
              </div>
              <div style={{ fontSize: 11 }}>
                {req.routeType} · {formatRoutePath(req.path)}
              </div>
              <div style={{ marginTop: 6, display: "flex", gap: 6, alignItems: "center" }}>
                <select
                  value={transitFeeModel}
                  onChange={(e) => setTransitFeeModel(e.target.value as "flat" | "commission")}
                  style={{ padding: 4, background: "#2a2a3e", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, fontSize: 11 }}
                >
                  <option value="flat">Flat fee/cycle</option>
                  <option value="commission">Commission %</option>
                </select>
                <input
                  type="number"
                  value={transitFeeAmount}
                  min={1}
                  onChange={(e) => setTransitFeeAmount(Number(e.target.value))}
                  style={{ width: 60, padding: 4, background: "#2a2a3e", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4, fontSize: 11 }}
                />
              </div>
              <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                <button className="overlay-btn primary" style={{ fontSize: 11 }} onClick={() => respondTransitRequest(req.id, transitFeeModel, transitFeeAmount, true)}>
                  Approve
                </button>
                <button className="overlay-btn" style={{ fontSize: 11 }} onClick={() => respondTransitRequest(req.id, "flat", 0, false)}>
                  Deny
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {myTransitAgreements.length > 0 && (
        <>
          <div className="section-title">Transit Agreements</div>
          <div className="card" style={{ fontSize: 11 }}>
            Income: +{transitIncome}/cycle · Costs: -{transitCosts}/cycle · Net: {transitIncome - transitCosts}/cycle
          </div>
          {myTransitAgreements.map((a) => (
            <div key={a.id} className="card" style={{ opacity: a.status === "cancelled" ? 0.4 : 1 }}>
              <div style={{ fontSize: 12 }}>
                {COUNTRY_CONFIGS[a.traderFrom].name} → {COUNTRY_CONFIGS[a.traderTo].name}
                {a.transitRegion === viewCountry ? " (you transit)" : " (you pay)"}
              </div>
              <div style={{ fontSize: 11 }}>
                {a.feeModel === "flat" ? `${a.feeAmount}/cycle` : `${a.feeAmount}% commission`} · {a.status}
              </div>
              {a.status === "pending" && a.payer === viewCountry && (
                <button className="overlay-btn" style={{ fontSize: 11, marginTop: 4 }} onClick={() => acceptTransitTerms(a.id)}>Accept Terms</button>
              )}
              {a.status === "active" && (
                <button className="overlay-btn" style={{ fontSize: 11, marginTop: 4, color: "#ef4444" }} onClick={() => cancelTransit(a.id)}>Cancel</button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
