import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { HexData, CountryId, COUNTRY_CONFIGS } from "../../types/hex";
import { hexToPixel, getMapDimensions } from "../../lib/hexUtils";
import { MAP_COLS, MAP_ROWS, HEX_SIZE } from "../../config/constants";
import { HexTile } from "./HexTile";
import { CountryLabel } from "./CountryLabel";
import { MapLegend } from "./MapLegend";
import { countByCountry } from "../../lib/mapGenerator";

interface HexMapProps {
  hexes: HexData[];
}

export function HexMap({ hexes }: HexMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedHex, setSelectedHex] = useState<HexData | null>(null);

  const mapDims = useMemo(() => getMapDimensions(MAP_COLS, MAP_ROWS), []);
  const countryCounts = useMemo(() => countByCountry(hexes), [hexes]);

  // Compute country border segments: thick dark lines between hexes of different countries
  const borderSegments = useMemo(() => {
    const lookup = new Map<string, string | null>();
    for (const h of hexes) {
      lookup.set(`${h.q},${h.r}`, h.countryId);
    }

    const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];

    for (const h of hexes) {
      if (!h.countryId) continue;
      const { x, y } = hexToPixel(h.q, h.r);

      // 6 neighbor offsets for offset coordinates (even-r / odd-r)
      const neighbors = h.r % 2 === 0
        ? [[h.q-1,h.r],[h.q+1,h.r],[h.q-1,h.r-1],[h.q,h.r-1],[h.q-1,h.r+1],[h.q,h.r+1]]
        : [[h.q-1,h.r],[h.q+1,h.r],[h.q,h.r-1],[h.q+1,h.r-1],[h.q,h.r+1],[h.q+1,h.r+1]];

      for (let i = 0; i < 6; i++) {
        const [nq, nr] = neighbors[i];
        const nCountry = lookup.get(`${nq},${nr}`) ?? null;
        if (nCountry !== h.countryId) {
          // Edge i of the hex: corner i to corner i+1
          const a1 = (Math.PI / 180) * (60 * i - 30);
          const a2 = (Math.PI / 180) * (60 * (i + 1) - 30);
          segments.push({
            x1: x + HEX_SIZE * Math.cos(a1),
            y1: y + HEX_SIZE * Math.sin(a1),
            x2: x + HEX_SIZE * Math.cos(a2),
            y2: y + HEX_SIZE * Math.sin(a2),
          });
        }
      }
    }
    return segments;
  }, [hexes]);

  // Initial viewbox
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
        // Zoom toward center
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
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
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
    setSelectedHex((prev) => (prev?.q === hex.q && prev?.r === hex.r ? null : hex));
  }, []);

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
        {/* Render all hex tiles */}
        {hexes.map((hex) => (
          <HexTile
            key={`${hex.q}-${hex.r}`}
            hex={hex}
            selected={selectedHex?.q === hex.q && selectedHex?.r === hex.r}
            onClick={handleHexClick}
          />
        ))}

        {/* Country border lines — thick dark edges between different countries */}
        {borderSegments.map((seg, i) => (
          <line
            key={`b${i}`}
            x1={seg.x1} y1={seg.y1}
            x2={seg.x2} y2={seg.y2}
            stroke="#111"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        ))}

        {/* Country labels */}
        {countryIds.map((id) => (
          <CountryLabel key={id} countryId={id} hexes={hexes} />
        ))}
      </svg>

      {/* Legend overlay */}
      <MapLegend countryCounts={countryCounts} />

      {/* Selected hex info */}
      {selectedHex && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(0,0,0,0.85)",
            color: "#fff",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 12,
            lineHeight: 1.6,
            backdropFilter: "blur(8px)",
            minWidth: 160,
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
              : "None"}
          </div>
          {selectedHex.resource && (
            <div>
              <span style={{ color: "#999" }}>Resource: </span>
              <span style={{ textTransform: "capitalize" }}>
                {selectedHex.resource.replace("_", " ")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          borderRadius: 8,
          padding: "8px 20px",
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: 1,
          backdropFilter: "blur(8px)",
        }}
      >
        Climate Diplomacy — World Map
      </div>

      {/* Controls hint */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          color: "rgba(255,255,255,0.4)",
          fontSize: 10,
        }}
      >
        Scroll to zoom · Drag to pan · Click hex for info
      </div>
    </div>
  );
}
