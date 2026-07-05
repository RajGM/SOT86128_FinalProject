import { useState, useMemo, useEffect } from "react";
import { useGame } from "../../context/GameContext";
import {
  getAvailableBuildsForTile,
  getBuildCost,
  getBuildTechCost,
  getBuildDefinition,
  getDemolishCost,
  getUpgradeCost,
  getUpgradeTechCost,
  canUpgradeTier,
  canPostTier3Upgrade,
  getPostTier3UpgradeCost,
  EXTRACTOR_DEPOSIT_PLACEMENT_MESSAGE,
  FARM_AGRICULTURAL_PLACEMENT_MESSAGE,
  TRANSPORT_HUB_T2_COASTAL_MESSAGE,
  TRANSPORT_HUB_LAND_MESSAGE,
} from "../../lib/buildRules";
import { createHexLookup } from "../../lib/hexUtils";
import { formatRoutePath } from "../../lib/routeDetection";
import { getHubCapacity } from "../../lib/transportHub";
import { hexToTileTags } from "../../types/game";
import { COUNTRY_CONFIGS, RESOURCE_LABELS } from "../../types/hex";
import type { BuildType } from "../../types/game";
import { compareBuildsByDisplayOrder } from "../../config/builds";
import { ConsequenceTree } from "./ConsequenceTree";
import {
  getHappinessCascade,
  HAPPINESS_CASCADE_LABELS,
  isConstructionBlocked,
} from "../../lib/populationMechanics";
import "./overlay.css";

type ManageAction = "upgrade" | "demolish" | "routes" | null;

export function BuildPanel() {
  const {
    hexes,
    selectedHex,
    buildPanelOpen,
    setBuildPanelOpen,
    gameState,
    viewCountry,
    placeBuild,
    demolishBuild,
    upgradeBuild,
    postTier3Upgrade,
    highlightFacilityRoutes,
    clearHighlightedRoutes,
  } = useGame();

  const [selectedBuildType, setSelectedBuildType] = useState<BuildType | null>(null);
  const [selectedTier, setSelectedTier] = useState<1 | 2 | 3 | null>(null);
  const [manageAction, setManageAction] = useState<ManageAction>(null);
  const [previewExpanded, setPreviewExpanded] = useState(true);

  const hexLookup = useMemo(() => createHexLookup(hexes), [hexes]);

  const available = useMemo(() => {
    if (!selectedHex) return [];
    const regionId = selectedHex.countryId ?? (gameState.testingMode ? viewCountry : "usa");
    const regionTech = gameState.regions[regionId].technology;
    return getAvailableBuildsForTile(
      selectedHex,
      gameState.tileBuildings,
      gameState.testingMode,
      hexLookup,
      regionTech
    );
  }, [selectedHex, gameState.tileBuildings, gameState.testingMode, gameState.regions, viewCountry, hexLookup]);

  const buildsByType = useMemo(() => {
    const map = new Map<
      BuildType,
      { build: ReturnType<typeof getBuildDefinition>; tiers: { tier: 1 | 2 | 3; reason?: string }[] }
    >();
    for (const item of available) {
      if (!map.has(item.build.id)) {
        map.set(item.build.id, { build: item.build, tiers: [] });
      }
      map.get(item.build.id)!.tiers.push({
        tier: item.tier,
        reason: item.availability.reason,
      });
    }
    return Array.from(map.values()).sort((a, b) =>
      compareBuildsByDisplayOrder(a.build.id, b.build.id)
    );
  }, [available]);

  useEffect(() => {
    setSelectedBuildType(null);
    setSelectedTier(null);
    setManageAction(null);
    clearHighlightedRoutes();
  }, [selectedHex?.q, selectedHex?.r, clearHighlightedRoutes]);

  const closePanel = () => {
    clearHighlightedRoutes();
    setBuildPanelOpen(false);
  };

  if (!buildPanelOpen || !selectedHex) return null;

  const tags = hexToTileTags(selectedHex);
  const existing = gameState.tileBuildings[`${selectedHex.q},${selectedHex.r}`];
  const regionId = selectedHex.countryId ?? (gameState.testingMode ? viewCountry : "usa");
  const region = gameState.regions[regionId];

  const existingDef = existing ? getBuildDefinition(existing.type) : null;
  const demolishBreakdown = existingDef
    ? getDemolishCost(existingDef, existing!.tier)
    : null;
  const upgradeCost = existingDef && existing && canUpgradeTier(existing.tier)
    ? getUpgradeCost(existingDef, existing.tier)
    : null;
  const upgradeTechCost = existingDef && existing && canUpgradeTier(existing.tier)
    ? getUpgradeTechCost(existingDef, existing.tier)
    : 0;
  const canUpgrade = upgradeCost !== null && region.money >= upgradeCost && region.technology >= upgradeTechCost;
  const canDemolish = demolishBreakdown !== null && region.money >= demolishBreakdown.demolitionFee;
  const nextTier = existing && canUpgradeTier(existing.tier) ? ((existing.tier + 1) as 2 | 3) : null;

  const isTransport = existing?.type === "transport_hub";
  const extraLevel = existing?.extraLevel ?? 0;
  const postTier3Cost = existingDef && existing && canPostTier3Upgrade(existing.type, existing.tier)
    ? getPostTier3UpgradeCost(existingDef, extraLevel)
    : null;

  const facilityCountry = existing?.countryId ?? regionId;
  const dependentRouteCount = isTransport && existing
    ? gameState.transportRoutes.filter(
        (r) => r.status !== "disrupted" && r.fromHubId === existing.id
      ).length
    : 0;
  const hubCapacity = existing ? getHubCapacity(existing) : 0;

  const panelTitle = existing ? "Manage Build" : "Build on";

  const selectedTypeEntry = selectedBuildType
    ? buildsByType.find((b) => b.build.id === selectedBuildType)
    : null;

  const handleSelectBuildType = (type: BuildType) => {
    const entry = buildsByType.find((b) => b.build.id === type);
    if (!entry) return;
    setSelectedBuildType(type);
    setSelectedTier(entry.tiers[0]?.tier ?? null);
  };

  const placeCost =
    selectedBuildType && selectedTier
      ? getBuildCost(getBuildDefinition(selectedBuildType), selectedTier)
      : 0;
  const placeTechCost =
    selectedBuildType && selectedTier
      ? getBuildTechCost(getBuildDefinition(selectedBuildType), selectedTier)
      : 0;
  const selectedPlacement = selectedBuildType && selectedTier
    ? available.find((item) => item.build.id === selectedBuildType && item.tier === selectedTier)?.availability
    : null;
  const placementBlocked =
    selectedPlacement !== null &&
    selectedPlacement !== undefined &&
    !selectedPlacement.available &&
    (selectedBuildType === "transport_hub" ||
      selectedBuildType === "extractor" ||
      selectedBuildType === "farm" ||
      selectedBuildType === "green_plant");
  const happinessCascade = getHappinessCascade(region.happiness);
  const constructionBlocked = isConstructionBlocked(region.happiness);
  const canPlaceBuild =
    selectedBuildType !== null &&
    selectedTier !== null &&
    region.money >= placeCost &&
    region.technology >= placeTechCost &&
    (selectedPlacement?.available ?? false) &&
    !constructionBlocked;

  const showBuildPreview = !existing && selectedBuildType && selectedTier;
  const showManagePreview =
    existing &&
    ((manageAction === "upgrade" && nextTier) || manageAction === "demolish");

  return (
    <div
      className="modal-backdrop build-panel-backdrop"
      onClick={closePanel}
    >
      <div
        className="modal-content build-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span style={{ fontWeight: 700 }}>
            {panelTitle} ({selectedHex.q}, {selectedHex.r})
          </span>
          <button className="overlay-btn" type="button" onClick={closePanel}>✕</button>
        </div>

        <div className="build-panel-main">
          <div className="tile-info-compact">
            <span>{selectedHex.countryId ? COUNTRY_CONFIGS[selectedHex.countryId].name : "Unclaimed"}</span>
            <span className="tile-info-sep">·</span>
            <span>{selectedHex.terrain}</span>
            {selectedHex.resource && (
              <>
                <span className="tile-info-sep">·</span>
                <span>{RESOURCE_LABELS[selectedHex.resource]}</span>
              </>
            )}
            {tags.length > 0 && (
              <>
                <span className="tile-info-sep">·</span>
                <span>{tags.join(", ")}</span>
              </>
            )}
            <div className="tile-info-budget">
              Budget: {Math.round(region.money)} money · Happiness: {Math.round(region.happiness)}% ({HAPPINESS_CASCADE_LABELS[happinessCascade]})
            </div>
            {constructionBlocked && (
              <div style={{ marginTop: 6, fontSize: 11, color: "#ef4444" }}>
                Collapse: new construction blocked until happiness recovers above 15%.
              </div>
            )}
          </div>

          {existing && existingDef && (
            <>
              <div className="card build-existing-summary">
                <div style={{ fontWeight: 600 }}>{existingDef.name} — Tier {existing.tier}</div>
                <div className="build-existing-desc">{existingDef.description}</div>
                <div className="build-existing-note">
                  Workforce: {existingDef.workforce} · Effects apply each cycle when staffed
                </div>
                {existing.type === "extractor" && selectedHex.resource && (
                  <div className="build-existing-note">
                    Extracts {RESOURCE_LABELS[selectedHex.resource]}:{" "}
                    {existing.tier === 1 ? 2 : existing.tier === 2 ? 4 : 7} units/cycle
                  </div>
                )}
              </div>

              <div className="manage-action-row">
                <button
                  type="button"
                  className={`overlay-btn ${manageAction === "upgrade" ? "active" : ""}`}
                  disabled={!canUpgradeTier(existing.tier) && !canPostTier3Upgrade(existing.type, existing.tier)}
                  onClick={() => setManageAction(manageAction === "upgrade" ? null : "upgrade")}
                >
                  {canUpgradeTier(existing.tier) || canPostTier3Upgrade(existing.type, existing.tier) ? "Upgrade" : "Max Tier"}
                </button>
                {isTransport && (
                  <button
                    type="button"
                    className={`overlay-btn ${manageAction === "routes" ? "active" : ""}`}
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
                  type="button"
                  className={`overlay-btn danger ${manageAction === "demolish" ? "active" : ""}`}
                  onClick={() => setManageAction(manageAction === "demolish" ? null : "demolish")}
                >
                  Demolish
                </button>
              </div>

              <div className="build-panel-scroll">
                {isTransport && (
                  <div className="card" style={{ fontSize: 11 }}>
                    Capacity: {hubCapacity} units/cycle
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
                          r.fromHubId === existing.id
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
                  <div className="card">
                    <div><strong>Upgrade cost:</strong>{" "}
                      <span style={{ color: canUpgrade ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                        {upgradeCost} money
                        {upgradeTechCost > 0 && `, ${upgradeTechCost} tech`}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                      Tier {existing.tier} → Tier {nextTier} ·{" "}
                      {Math.round((existingDef.upgradeCostRatio ?? 0.75) * 100)}% of tier-delta cost
                    </div>
                    {isTransport && (
                      <div style={{ fontSize: 11, marginTop: 4, color: "#22c55e" }}>
                        Capacity: {hubCapacity} → {getHubCapacity({ ...existing, tier: nextTier })} units/cycle
                      </div>
                    )}
                  </div>
                )}

                {manageAction === "upgrade" && !nextTier && canPostTier3Upgrade(existing.type, existing.tier) && postTier3Cost !== null && (
                  <div className="card">
                    <div><strong>Post-Tier-3 upgrade (level {extraLevel + 1}):</strong>{" "}
                      <span style={{ color: region.money >= postTier3Cost ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                        {postTier3Cost} money
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                      +20 units/cycle capacity per level
                    </div>
                  </div>
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
                        <span style={{ color: "#ef4444", fontWeight: 700 }}>
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
                  </>
                )}
              </div>
            </>
          )}

          {!existing && (
            <>
              <div className="section-title build-list-title">
                Building Types ({buildsByType.length})
              </div>
              {buildsByType.length === 0 ? (
                <div className="card">No builds available on this tile.</div>
              ) : (
                <div className="build-panel-columns">
                  <div className="build-type-column">
                    {buildsByType.map(({ build, tiers }) => {
                      const minCost = Math.min(...tiers.map((t) => getBuildCost(build, t.tier)));
                      const minTech = Math.min(...tiers.map((t) => getBuildTechCost(build, t.tier)));
                      const isSelected = selectedBuildType === build.id;
                      return (
                        <button
                          key={build.id}
                          type="button"
                          className={`build-type-row ${isSelected ? "selected" : ""}`}
                          onClick={() => handleSelectBuildType(build.id)}
                        >
                          <div className="build-type-name">{build.name}</div>
                          <div className="build-type-meta">
                            <span className="from-cost">
                              from {minCost}
                              {minTech > 0 && ` + ${minTech} tech`}
                            </span>
                            <span className="from-cost"> · {build.workforce} workers</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedTypeEntry && (
                    <div className="tier-column">
                      <div className="tier-column-label">Tier</div>
                      {selectedTypeEntry.tiers.map(({ tier, reason }) => {
                        const cost = getBuildCost(selectedTypeEntry.build, tier);
                        const techCost = getBuildTechCost(selectedTypeEntry.build, tier);
                        const canAfford = region.money >= cost && region.technology >= techCost;
                        const isTierSelected = selectedTier === tier;
                        return (
                          <button
                            key={tier}
                            type="button"
                            className={`tier-option ${isTierSelected ? "selected" : ""}`}
                            onClick={() => setSelectedTier(tier)}
                            title={reason}
                          >
                            <span className="tier-option-num">{tier}</span>
                            <span
                              className="tier-option-cost"
                              style={{ color: canAfford ? "#22c55e" : "#ef4444" }}
                            >
                              {cost}
                              {techCost > 0 && `+${techCost}T`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {selectedTypeEntry && selectedTier && (
                <div className="build-selection-summary">
                  <strong>{selectedTypeEntry.build.name}</strong>
                  <span> · Tier {selectedTier}</span>
                  <span style={{ color: canPlaceBuild ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                    {" "}· {placeCost} money
                    {placeTechCost > 0 && `, ${placeTechCost} tech`}
                  </span>
                  {placementBlocked && selectedTypeEntry.tiers.find((t) => t.tier === selectedTier)?.reason && (
                    <div className="build-selection-note build-selection-error">
                      {selectedTypeEntry.tiers.find((t) => t.tier === selectedTier)!.reason}
                    </div>
                  )}
                  {placementBlocked && !selectedTypeEntry.tiers.find((t) => t.tier === selectedTier)?.reason && (
                    <div className="build-selection-note build-selection-error">
                      {selectedBuildType === "extractor" && EXTRACTOR_DEPOSIT_PLACEMENT_MESSAGE}
                      {selectedBuildType === "farm" && FARM_AGRICULTURAL_PLACEMENT_MESSAGE}
                      {selectedBuildType === "transport_hub" && selectedTier && selectedTier >= 2 && TRANSPORT_HUB_T2_COASTAL_MESSAGE}
                      {selectedBuildType === "transport_hub" && selectedTier === 1 && TRANSPORT_HUB_LAND_MESSAGE}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {(showBuildPreview || showManagePreview) && (
          <div className={`build-panel-preview ${previewExpanded ? "expanded" : "collapsed"}`}>
            <button
              type="button"
              className="preview-toggle"
              onClick={() => setPreviewExpanded(!previewExpanded)}
            >
              Consequence Preview {previewExpanded ? "▾" : "▸"}
            </button>
            {previewExpanded && (
              <div className="preview-content">
                {showBuildPreview && (
                  <ConsequenceTree buildType={selectedBuildType!} tier={selectedTier!} />
                )}
                {showManagePreview && existing && manageAction === "upgrade" && nextTier && (
                  <ConsequenceTree
                    buildType={existing.type}
                    tier={existing.tier}
                    mode="upgrade"
                    nextTier={nextTier}
                  />
                )}
                {showManagePreview && existing && manageAction === "demolish" && (
                  <ConsequenceTree
                    buildType={existing.type}
                    tier={existing.tier}
                    mode="demolish"
                  />
                )}
              </div>
            )}
          </div>
        )}

        <div className="build-panel-footer">
          <button type="button" className="overlay-btn" onClick={closePanel}>
            Cancel
          </button>

          {!existing && (
            <button
              type="button"
              className="overlay-btn primary"
              disabled={!canPlaceBuild}
              onClick={() => {
                if (selectedBuildType && selectedTier) {
                  placeBuild(selectedBuildType, selectedTier);
                  setSelectedBuildType(null);
                  setSelectedTier(null);
                }
              }}
            >
              Place Build
            </button>
          )}

          {existing && manageAction === "upgrade" && nextTier && upgradeCost !== null && (
            <button
              type="button"
              className="overlay-btn primary"
              disabled={!canUpgrade}
              onClick={() => {
                upgradeBuild();
                setManageAction(null);
              }}
            >
              Confirm Upgrade
            </button>
          )}

          {existing && manageAction === "upgrade" && !nextTier && canPostTier3Upgrade(existing.type, existing.tier) && postTier3Cost !== null && (
            <button
              type="button"
              className="overlay-btn primary"
              disabled={region.money < postTier3Cost}
              onClick={() => {
                postTier3Upgrade();
                setManageAction(null);
              }}
            >
              Confirm Capacity Upgrade
            </button>
          )}

          {existing && manageAction === "demolish" && demolishBreakdown && (
            <button
              type="button"
              className="overlay-btn danger"
              disabled={!canDemolish}
              onClick={() => {
                demolishBuild();
                setManageAction(null);
              }}
            >
              Confirm Demolish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
