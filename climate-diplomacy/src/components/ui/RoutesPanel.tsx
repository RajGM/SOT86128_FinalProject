import { useState } from "react";
import { useGame } from "../../context/GameContext";
import { COUNTRY_CONFIGS, type CountryId } from "../../types/hex";
import { INFRA_CAPACITY } from "../../types/game";
import { formatRoutePath, type RouteOption } from "../../lib/routeDetection";
import { getTransitIncome, getTransitCosts } from "../../lib/tradeRules";
import { emissionsLabel } from "../../lib/transportEmissions";

export function RoutesPanel() {
  const {
    gameState,
    viewCountry,
    getRouteOptions,
    createRoute,
    respondTransitRequest,
    cancelTransit,
    acceptTransitTerms,
  } = useGame();

  const [destination, setDestination] = useState<CountryId>("eu");
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [transitFeeModel, setTransitFeeModel] = useState<"flat" | "commission">("flat");
  const [transitFeeAmount, setTransitFeeAmount] = useState(10);

  const countryIds = (Object.keys(COUNTRY_CONFIGS) as CountryId[]).filter(
    (id) => id !== viewCountry
  );

  const myRoutes = gameState.transportRoutes.filter(
    (r) => r.from === viewCountry || r.to === viewCountry
  );

  const allRoutes = gameState.transportRoutes;

  const incomingRequests = gameState.transitRequests.filter(
    (r) => r.transitRegion === viewCountry && r.status === "pending"
  );

  const myTransitAgreements = gameState.transitAgreements.filter(
    (a) => a.transitRegion === viewCountry || a.payer === viewCountry
  );

  const transitIncome = getTransitIncome(gameState.transitAgreements, viewCountry);
  const transitCosts = getTransitCosts(gameState.transitAgreements, viewCountry);

  const handleFindRoutes = () => {
    const options = getRouteOptions(viewCountry, destination);
    setRouteOptions(options);
    setShowOptions(true);
  };

  const handleCreateRoute = (option: RouteOption) => {
    createRoute(option);
    setShowOptions(false);
    setRouteOptions([]);
  };

  const myBuildings = Object.values(gameState.tileBuildings).filter(
    (b) => b.countryId === viewCountry
  );

  const totalCapacity = (type: "airport" | "dock" | "transport_center") =>
    myBuildings
      .filter((b) => b.type === type)
      .reduce((sum, b) => sum + INFRA_CAPACITY[b.tier], 0);

  const usedCapacity = (type: "airport" | "dock" | "transport_center") => {
    const routeType = type === "airport" ? "air" : type === "dock" ? "sea" : "land";
    return myRoutes.filter((r) => r.routeType === routeType && r.status !== "disrupted").length;
  };

  return (
    <div>
      <div className="section-title">Infrastructure — {COUNTRY_CONFIGS[viewCountry].name}</div>
      <div className="card">
        <div style={{ fontSize: 11, lineHeight: 1.8 }}>
          <div>Airports: {myBuildings.filter((b) => b.type === "airport").length} ({usedCapacity("airport")}/{totalCapacity("airport")} routes)</div>
          <div>Docks: {myBuildings.filter((b) => b.type === "dock").length} ({usedCapacity("dock")}/{totalCapacity("dock")} routes)</div>
          <div>Land Transport Centers: {myBuildings.filter((b) => b.type === "transport_center").length} ({usedCapacity("transport_center")}/{totalCapacity("transport_center")} routes)</div>
        </div>
      </div>

      <div className="section-title">Create New Route</div>
      <div className="card">
        <label style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Destination</label>
        <select
          value={destination}
          onChange={(e) => { setDestination(e.target.value as CountryId); setShowOptions(false); }}
          style={{ width: "100%", padding: 6, background: "#2a2a3e", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 4 }}
        >
          {countryIds.map((id) => (
            <option key={id} value={id}>{COUNTRY_CONFIGS[id].name}</option>
          ))}
        </select>
        <button
          className="overlay-btn primary"
          style={{ marginTop: 8, width: "100%" }}
          onClick={handleFindRoutes}
        >
          Find Available Routes
        </button>

        {showOptions && routeOptions.length === 0 && (
          <div style={{ fontSize: 11, color: "#ef4444", marginTop: 8 }}>
            No routes available. Build matching infrastructure at both regions first.
          </div>
        )}

        {showOptions && routeOptions.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
              {routeOptions.length} option{routeOptions.length > 1 ? "s" : ""} found:
            </div>
            {routeOptions.map((opt, i) => (
              <div key={i} className="card" style={{ marginBottom: 4 }}>
                <div style={{ fontWeight: 600, fontSize: 12 }}>
                  {opt.routeType.toUpperCase()}: {opt.label}
                </div>
                <div style={{ fontSize: 11, marginTop: 2 }}>
                  Path: {formatRoutePath(opt.path)}
                </div>
                <div style={{ fontSize: 11, color: opt.emissionsPerCycle > 5 ? "#f97316" : "#22c55e" }}>
                  {emissionsLabel(opt.emissionsPerCycle)} ({opt.emissionsPerCycle} CO₂/cycle)
                </div>
                {opt.transitRegions.length > 0 && (
                  <div style={{ fontSize: 11, color: "#eab308", marginTop: 2 }}>
                    Transit needed: {opt.transitRegions.map((c) => COUNTRY_CONFIGS[c].name).join(", ")}
                  </div>
                )}
                <button
                  className="overlay-btn"
                  style={{ marginTop: 4, fontSize: 11 }}
                  onClick={() => handleCreateRoute(opt)}
                >
                  Establish Route
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-title">Your Routes ({myRoutes.length})</div>
      {myRoutes.length === 0 && (
        <div className="card" style={{ color: "rgba(255,255,255,0.5)" }}>No routes yet.</div>
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
            {" · "}{r.emissionsPerCycle} CO₂/cycle
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

      <div className="section-title">All Routes (Global)</div>
      {allRoutes.length === 0 && (
        <div className="card" style={{ color: "rgba(255,255,255,0.5)" }}>No routes exist yet.</div>
      )}
      {allRoutes.map((r) => (
        <div key={r.id} className="card" style={{ opacity: r.status === "disrupted" ? 0.4 : 1 }}>
          <div style={{ fontSize: 11 }}>
            {r.routeType.toUpperCase()}: {formatRoutePath(r.path)} · {r.status} · {r.emissionsPerCycle} CO₂
          </div>
        </div>
      ))}
    </div>
  );
}
