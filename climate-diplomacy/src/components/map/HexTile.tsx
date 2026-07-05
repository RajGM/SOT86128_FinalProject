import { memo } from "react";
import { HexData, TERRAIN_COLORS, COUNTRY_CONFIGS, RESOURCE_ICONS } from "../../types/hex";
import { hexToPixel, hexCorners } from "../../lib/hexUtils";
import { HEX_SIZE } from "../../config/constants";
import type { PlacedBuilding } from "../../types/game";

interface HexTileProps {
  hex: HexData;
  selected?: boolean;
  building?: PlacedBuilding | null;
  onClick?: (hex: HexData) => void;
}

const BUILD_ICONS: Record<string, string> = {
  fossil_plant: "🏭",
  green_plant: "🌿",
  nuclear_plant: "☢",
  industrial_complex: "🏗",
  manufacturing: "⚙",
  village: "🏘",
  city: "🏙",
  farm: "🌾",
  airport: "✈",
  dock: "⚓",
  transport_center: "🚛",
  extractor: "⛏",
};

function HexTileInner({ hex, selected, building, onClick }: HexTileProps) {
  const { x, y } = hexToPixel(hex.q, hex.r);
  const points = hexCorners(x, y);

  const country = hex.countryId ? COUNTRY_CONFIGS[hex.countryId] : null;
  const isCountryHex = !!country;

  let fillColor: string;
  let strokeColor: string;
  let strokeWidth: number;

  if (isCountryHex) {
    fillColor = country!.color;
    strokeColor = "none";
    strokeWidth = 0;
  } else {
    fillColor = TERRAIN_COLORS[hex.terrain];
    strokeColor = hex.terrain === "ocean" ? "#1a365d"
      : hex.terrain === "arctic" ? "#94a3b8"
      : "#374151";
    strokeWidth = 0.3;
  }

  if (selected) {
    strokeColor = "#fff";
    strokeWidth = 2.5;
  }

  if (building) {
    fillColor = isCountryHex
      ? country!.color
      : fillColor;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(hex);
  };

  return (
    <g
      onClick={handleClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={building ? 0.85 : 1}
      />
      {building ? (
        <text
          x={x}
          y={y + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={HEX_SIZE * 0.85}
          pointerEvents="none"
        >
          {BUILD_ICONS[building.type] || "🏗"}
        </text>
      ) : hex.resource ? (
        <text
          x={x}
          y={y + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={HEX_SIZE * 0.7}
          fill="rgba(0,0,0,0.6)"
          pointerEvents="none"
        >
          {RESOURCE_ICONS[hex.resource] || "?"}
        </text>
      ) : null}
      {building && (
        <text
          x={x}
          y={y + HEX_SIZE * 0.55}
          textAnchor="middle"
          fontSize={HEX_SIZE * 0.35}
          fill="#fff"
          pointerEvents="none"
        >
          T{building.tier}
        </text>
      )}
    </g>
  );
}

export const HexTile = memo(HexTileInner);
