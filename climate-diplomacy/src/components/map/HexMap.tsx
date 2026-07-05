import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { HexData, CountryId, COUNTRY_CONFIGS } from "../../types/hex";
import { getMapDimensions } from "../../lib/hexUtils";
import { computeCountryBorders } from "../../lib/countryBorders";
import { MAP_COLS, MAP_ROWS } from "../../config/constants";
import { HexTile } from "./HexTile";
import { CountryLabel } from "./CountryLabel";
import { MapLegend } from "./MapLegend";
import { countByCountry } from "../../lib/mapGenerator";
import { useGame } from "../../context/GameContext";
import { tileKey } from "../../types/game";
import { ResourcesBar } from "../ui/ResourcesBar";
import { ActionPanel } from "../ui/ActionPanel";
import { DashboardModal } from "../ui/DashboardModal";
import { ComparisonDashboard } from "../ui/ComparisonDashboard";
import { BuildPanel } from "../ui/BuildPanel";
import { RelationAlerts } from "../ui/RelationAlerts";
import { RouteLines } from "./RouteLines";
import { hexToTileTags } from "../../types/game";

interface HexMapProps {
  hexes: HexData[];
}

export function HexMap({ hexes }: HexMapProps) {
  const {
    gameState,
    selectedHex,
    setSelectedHex,
    comparisonOpen,
    setComparisonOpen,
  } = useGame();

  const containerRef = useRef<HTMLDivElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const mapDims = useMemo(() => getMapDimensions(MAP_COLS, MAP_ROWS), []);
  const countryCounts = useMemo(() => countByCountry(hexes), [hexes]);
  const countryBorders = useMemo(() => computeCountryBorders(hexes), [hexes]);

  useEffect(() => {
    setViewBox({
      x: -20,
      y: -20,
      w: mapDims.width + 40,
      h: mapDims.height + 40,
    });
  }, [mapDims]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;

      setViewBox((prev) => {
        const newW = prev.w * scaleFactor;
        const newH = prev.h * scaleFactor;
        const dx = (prev.w - newW) / 2;
        const dy = (prev.h - newH) / 2;
        return {
          x: prev.x + dx,
          y: prev.y + dy,
          w: Math.max(100, Math.min(newW, mapDims.width * 2)),
          h: Math.max(60, Math.min(newH, mapDims.height * 2)),
        };
      });
    },
    [mapDims]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as SVGElement;
    if (target.tagName === "polygon" || target.tagName === "text") return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = viewBox.w / rect.width;
      const scaleY = viewBox.h / rect.height;
      const dx = (e.clientX - panStart.x) * scaleX;
      const dy = (e.clientY - panStart.y) * scaleY;

      setViewBox((prev) => ({
        ...prev,
        x: prev.x - dx,
        y: prev.y - dy,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    },
    [isPanning, panStart, viewBox]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleHexClick = useCallback((hex: HexData) => {
    setSelectedHex(
      selectedHex?.q === hex.q && selectedHex?.r === hex.r ? null : hex
    );
  }, [selectedHex, setSelectedHex]);

  const countryIds = Object.keys(COUNTRY_CONFIGS) as CountryId[];

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100vh",
        background: "#1a1a2e",
        position: "relative",
        overflow: "hidden",
        cursor: isPanning ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onWheel={handleWheel}
        style={{ display: "block" }}
      >
        {hexes.map((hex) => (
          <HexTile
            key={`${hex.q}-${hex.r}`}
            hex={hex}
            selected={selectedHex?.q === hex.q && selectedHex?.r === hex.r}
            building={gameState.tileBuildings[tileKey(hex.q, hex.r)] ?? null}
            onClick={handleHexClick}
          />
        ))}

        {countryBorders.map(({ countryId, paths }) =>
          paths.map((d, i) => (
            <path
              key={`${countryId}-${i}`}
              d={d}
              fill="none"
              stroke="#111"
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              pointerEvents="none"
            />
          ))
        )}

        {countryIds.map((id) => (
          <CountryLabel key={id} countryId={id} hexes={hexes} />
        ))}

        <RouteLines
          routes={gameState.transportRoutes}
          highlightedIds={gameState.highlightedRoutes}
        />
      </svg>

      <ResourcesBar />

      <MapLegend countryCounts={countryCounts} />

      <ActionPanel />
      <RelationAlerts />
      <DashboardModal />
      <ComparisonDashboard />
      <BuildPanel />

      <div className="comparison-fab">
        <button
          className={`overlay-btn ${comparisonOpen ? "active" : ""}`}
          onClick={() => setComparisonOpen(!comparisonOpen)}
        >
          Comparison Dashboard
        </button>
      </div>

      {selectedHex && (
        <div
          style={{
            position: "absolute",
            top: 100,
            right: 16,
            background: "rgba(0,0,0,0.85)",
            color: "#fff",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 12,
            lineHeight: 1.6,
            backdropFilter: "blur(8px)",
            minWidth: 180,
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
            Hex ({selectedHex.q}, {selectedHex.r})
          </div>
          <div>
            <span style={{ color: "#999" }}>Terrain: </span>
            <span style={{ textTransform: "capitalize" }}>{selectedHex.terrain}</span>
          </div>
          <div>
            <span style={{ color: "#999" }}>Country: </span>
            {selectedHex.countryId
              ? COUNTRY_CONFIGS[selectedHex.countryId].name
              : "None (testing OK)"}
          </div>
          {selectedHex.resource && (
            <div>
              <span style={{ color: "#999" }}>Resource: </span>
              <span style={{ textTransform: "capitalize" }}>
                {selectedHex.resource.replace("_", " ")}
              </span>
            </div>
          )}
          {hexToTileTags(selectedHex).length > 0 && (
            <div>
              <span style={{ color: "#999" }}>Tags: </span>
              {hexToTileTags(selectedHex).join(", ")}
            </div>
          )}
          {gameState.tileBuildings[tileKey(selectedHex.q, selectedHex.r)] && (
            <div style={{ marginTop: 6, color: "#22c55e" }}>
              Built: {gameState.tileBuildings[tileKey(selectedHex.q, selectedHex.r)].type.replace("_", " ")}
            </div>
          )}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 56,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          borderRadius: 8,
          padding: "6px 16px",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 1,
          backdropFilter: "blur(8px)",
          zIndex: 5,
        }}
      >
        Climate Diplomacy — Testing Mode
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 56,
          right: 16,
          color: "rgba(255,255,255,0.4)",
          fontSize: 10,
          zIndex: 5,
        }}
      >
        Scroll to zoom · Drag to pan · Click hex to build
      </div>
    </div>
  );
}
