import { useState, useMemo } from "react";
import { useGame } from "../../context/GameContext";
import {
  getAvailableBuildsForTile,
  getBuildCost,
  getBuildDefinition,
  getDemolishCost,
  getUpgradeCost,
  canUpgradeTier,
  canPostTier3Upgrade,
  getPostTier3UpgradeCost,
} from "../../lib/buildRules";
import { formatRoutePath } from "../../lib/routeDetection";
import { INFRA_CAPACITY, INFRA_EMISSIONS } from "../../types/game";
import { hexToTileTags } from "../../types/game";
import { COUNTRY_CONFIGS } from "../../types/hex";
import type { BuildType } from "../../types/game";
import { ConsequenceTree } from "./ConsequenceTree";
import "./overlay.css";

type ManageAction = "upgrade" | "demolish" | "routes" | null;

export function BuildPanel() {
  const {
    selectedHex,
    buildPanelOpen,
    setBuildPanelOpen,
    gameState,
    placeBuild,
    demolishBuild,
    upgradeBuild,
    postTier3Upgrade,
    highlightFacilityRoutes,
    clearHighlightedRoutes,
  } = useGame();

  const [selectedBuild, setSelectedBuild] = useState<{ type: BuildType; tier: 1 | 2 | 3 } | null>(null);
  const [manageAction, setManageAction] = useState<ManageAction>(null);

  const available = useMemo(() => {
    if (!selectedHex) return [];
    return getAvailableBuildsForTile(selectedHex, gameState.tileBuildings);
  }, [selectedHex, gameState.tileBuildings]);

  if (!buildPanelOpen || !selectedHex) return null;

  const tags = hexToTileTags(selectedHex);
  const existing = gameState.tileBuildings[`${selectedHex.q},${selectedHex.r}`];
  const regionId = selectedHex.countryId ?? "usa";
  const region = gameState.regions[regionId];

  const existingDef = existing ? getBuildDefinition(existing.type) : null;
  const demolishBreakdown = existingDef
    ? getDemolishCost(existingDef, existing!.tier)
    : null;
  const upgradeCost = existingDef && existing && canUpgradeTier(existing.tier)
    ? getUpgradeCost(existingDef, existing.tier)
    : null;
  const canUpgrade = upgradeCost !== null && region.money >= upgradeCost;
  const canDemolish = demolishBreakdown !== null && region.money >= demolishBreakdown.demolitionFee;
  const nextTier = existing && canUpgradeTier(existing.tier) ? ((existing.tier + 1) as 2 | 3) : null;

  const isTransport = existing?.type === "airport" || existing?.type === "dock" || existing?.type === "transport_center";
  const extraLevel = existing?.extraLevel ?? 0;
  const postTier3Cost = existingDef && existing && canPostTier3Upgrade(existing.type, existing.tier)
    ? getPostTier3UpgradeCost(existingDef, extraLevel)
    : null;

  const facilityCountry = existing?.countryId ?? regionId;
  const dependentRouteCount = isTransport && existing
    ? gameState.transportRoutes.filter(
        (r) => r.status !== "disrupted" && (r.fromFacilityId === existing.id || r.toFacilityId === existing.id)
      ).length
    : 0;
  const facilityCapacity = existing ? INFRA_CAPACITY[existing.tier] : 0;

  const panelTitle = existing ? "Manage Build" : "Build on";

  return (
    <div
      className="modal-backdrop"
      style={{ alignItems: "flex-end", justifyContent: "flex-start", padding: "0 0 60px 200px" }}
      onClick={() => setBuildPanelOpen(false)}
    >
      <div
        className="modal-content"
        style={{ width: 420, maxHeight: "70vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span style={{ fontWeight: 700 }}>
            {panelTitle} ({selectedHex.q}, {selectedHex.r})
          </span>
          <button className="overlay-btn" onClick={() => setBuildPanelOpen(false)}>✕</button>
        </div>

        <div className="modal-body">
          <div className="card">
            <div><strong>Country:</strong> {selectedHex.countryId ? COUNTRY_CONFIGS[selectedHex.countryId].name : "Unclaimed (testing)"}</div>
            <div><strong>Terrain:</strong> {selectedHex.terrain}</div>
            {selectedHex.resource && <div><strong>Resource:</strong> {selectedHex.resource.replace("_", " ")}</div>}
            {tags.length > 0 && <div><strong>Tags:</strong> {tags.join(", ")}</div>}
            <div style={{ marginTop: 4, color: "rgba(255,255,255,0.5)" }}>
              Budget: {Math.round(region.money)} money
            </div>
          </div>

          {existing && existingDef && (
            <>
              <div className="card" style={{ borderColor: "rgba(34,197,94,0.5)" }}>
                <div style={{ fontWeight: 600 }}>{existingDef.name} — Tier {existing.tier}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                  {existingDef.description}
                </div>
              </div>

              <div className="section-title">Actions</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <button
                  className={`overlay-btn ${manageAction === "upgrade" ? "active" : ""}`}
                  style={{ flex: 1, minWidth: 80 }}
                  disabled={!canUpgradeTier(existing.tier) && !canPostTier3Upgrade(existing.type, existing.tier)}
                  onClick={() => setManageAction(manageAction === "upgrade" ? null : "upgrade")}
                >
                  {canUpgradeTier(existing.tier) || canPostTier3Upgrade(existing.type, existing.tier) ? "Upgrade" : "Max Tier"}
                </button>
                {isTransport && (
                  <button
                    className={`overlay-btn ${manageAction === "routes" ? "active" : ""}`}
                    style={{ flex: 1, minWidth: 80 }}
                    onClick={() => {
                      if (manageAction === "routes") {
                        clearHighlightedRoutes();
                        setManageAction(null);
                      } else {
                        highlightFacilityRoutes(facilityCountry);
                        setManageAction("routes");
                      }
                    }}
                  >
                    Routes ({dependentRouteCount})
                  </button>
                )}
                <button
                  className={`overlay-btn danger ${manageAction === "demolish" ? "active" : ""}`}
                  style={{ flex: 1, minWidth: 80 }}
                  onClick={() => setManageAction(manageAction === "demolish" ? null : "demolish")}
                >
                  Demolish
                </button>
              </div>

              {isTransport && existing && (
                <div className="card" style={{ fontSize: 11 }}>
                  Routes: {dependentRouteCount}/{facilityCapacity} capacity
                  {extraLevel > 0 && <span> · Extra level {extraLevel}</span>}
                </div>
              )}

              {manageAction === "routes" && isTransport && (
                <div className="card">
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Active routes from this facility</div>
                  {dependentRouteCount === 0 ? (
                    <div style={{ color: "rgba(255,255,255,0.5)" }}>No active routes yet.</div>
                  ) : (
                    gameState.transportRoutes
                      .filter((r) =>
                        r.status !== "disrupted" &&
                        (r.fromFacilityId === existing.id || r.toFacilityId === existing.id)
                      )
                      .map((r) => (
                        <div key={r.id} style={{ fontSize: 11, marginBottom: 4 }}>
                          {formatRoutePath(r.path)} — {r.status}
                          {r.path.length > 2 && (
                            <span style={{ color: "#eab308" }}> (crosses {r.path.length - 2} region(s))</span>
                          )}
                        </div>
                      ))
                  )}
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                    Routes highlighted on map. Solid=land, dashed=air, dotted=sea.
                  </div>
                </div>
              )}

              {manageAction === "upgrade" && nextTier && upgradeCost !== null && (
                <>
                  <div className="card">
                    <div><strong>Upgrade cost:</strong>{" "}
                      <span style={{ color: canUpgrade ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                        {upgradeCost} money
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                      Tier {existing.tier} → Tier {nextTier} ·{" "}
                      {Math.round((existingDef.upgradeCostRatio ?? 0.75) * 100)}% of tier-delta cost
                    </div>
                    {isTransport && (
                      <div style={{ fontSize: 11, marginTop: 4, color: "#22c55e" }}>
                        Capacity: {INFRA_CAPACITY[existing.tier]} → {nextTier ? INFRA_CAPACITY[nextTier] : "—"} routes
                      </div>
                    )}
                  </div>
                  <ConsequenceTree
                    buildType={existing.type}
                    tier={existing.tier}
                    mode="upgrade"
                    nextTier={nextTier}
                  />
                  <button
                    className="overlay-btn primary"
                    style={{ width: "100%", marginTop: 8 }}
                    disabled={!canUpgrade}
                    onClick={() => {
                      upgradeBuild();
                      setManageAction(null);
                    }}
                  >
                    Confirm Upgrade
                  </button>
                </>
              )}

              {manageAction === "upgrade" && !nextTier && canPostTier3Upgrade(existing.type, existing.tier) && postTier3Cost !== null && (
                <>
                  <div className="card">
                    <div><strong>Post-Tier-3 upgrade (level {extraLevel + 1}):</strong>{" "}
                      <span style={{ color: region.money >= postTier3Cost ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                        {postTier3Cost} money
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                      Reduces transport emissions by ~8% per level. Zero emissions require breakthrough research.
                    </div>
                  </div>
                  <button
                    className="overlay-btn primary"
                    style={{ width: "100%", marginTop: 8 }}
                    disabled={region.money < postTier3Cost}
                    onClick={() => {
                      postTier3Upgrade();
                      setManageAction(null);
                    }}
                  >
                    Confirm Emission Upgrade
                  </button>
                </>
              )}

              {manageAction === "demolish" && demolishBreakdown && (
                <>
                  {isTransport && dependentRouteCount > 0 && (
                    <div className="card" style={{ borderColor: "rgba(239,68,68,0.5)" }}>
                      <strong>Warning:</strong> {dependentRouteCount} active route(s) depend on this facility.
                      Demolishing will disrupt them immediately.
                    </div>
                  )}
                  <div className="card">
                    <div><strong>Demolition fee:</strong>{" "}
                      <span style={{ color: canDemolish ? "#ef4444" : "#ef4444", fontWeight: 700 }}>
                        −{demolishBreakdown.demolitionFee} money
                      </span>
                    </div>
                    <div><strong>Salvage refund:</strong>{" "}
                      <span style={{ color: "#22c55e", fontWeight: 700 }}>
                        +{demolishBreakdown.salvageRefund} money
                      </span>
                    </div>
                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                      <strong>Net change:</strong>{" "}
                      <span style={{
                        color: demolishBreakdown.netMoneyChange >= 0 ? "#22c55e" : "#ef4444",
                        fontWeight: 700,
                      }}>
                        {demolishBreakdown.netMoneyChange >= 0 ? "+" : ""}
                        {demolishBreakdown.netMoneyChange} money
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                      Fee {Math.round((existingDef.demolishCostRatio ?? 0.25) * 100)}% · Refund{" "}
                      {Math.round((existingDef.demolishRefundRatio ?? 0.35) * 100)}% of placed cost ({demolishBreakdown.placedCost})
                    </div>
                  </div>
                  <ConsequenceTree
                    buildType={existing.type}
                    tier={existing.tier}
                    mode="demolish"
                  />
                  <button
                    className="overlay-btn danger"
                    style={{ width: "100%", marginTop: 8 }}
                    disabled={!canDemolish}
                    onClick={() => {
                      demolishBuild();
                      setManageAction(null);
                    }}
                  >
                    Confirm Demolish
                  </button>
                </>
              )}
            </>
          )}

          {!existing && (
            <>
              <div className="section-title">Available Builds ({available.length})</div>
              {available.length === 0 && (
                <div className="card">No builds available on this tile.</div>
              )}
              {available.map(({ build, tier, availability }) => {
                const cost = getBuildCost(build, tier);
                const canAfford = region.money >= cost;
                const isSelected = selectedBuild?.type === build.id && selectedBuild?.tier === tier;
                return (
                  <div
                    key={`${build.id}-${tier}`}
                    className={`build-item ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedBuild({ type: build.id, tier })}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{build.name} — Tier {tier}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{build.description}</div>
                      {availability.reason && (
                        <div style={{ fontSize: 10, color: "#eab308", marginTop: 2 }}>{availability.reason}</div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: canAfford ? "#22c55e" : "#ef4444" }}>{cost}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>money</div>
                    </div>
                  </div>
                );
              })}

              {selectedBuild && (
                <>
                  <ConsequenceTree buildType={selectedBuild.type} tier={selectedBuild.tier} />
                  <button
                    className="overlay-btn primary"
                    style={{ width: "100%", marginTop: 8 }}
                    onClick={() => {
                      placeBuild(selectedBuild.type, selectedBuild.tier);
                      setSelectedBuild(null);
                    }}
                    disabled={region.money < getBuildCost(
                      available.find((a) => a.build.id === selectedBuild.type && a.tier === selectedBuild.tier)!.build,
                      selectedBuild.tier
                    )}
                  >
                    Place Build
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
