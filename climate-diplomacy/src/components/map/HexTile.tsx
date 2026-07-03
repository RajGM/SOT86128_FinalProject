import { memo } from "react";
import { HexData, TERRAIN_COLORS, COUNTRY_CONFIGS } from "../../types/hex";
import { hexToPixel, hexCorners } from "../../lib/hexUtils";
import { HEX_SIZE } from "../../config/constants";

interface HexTileProps {
  hex: HexData;
  selected?: boolean;
  onClick?: (hex: HexData) => void;
}

const RESOURCE_ICONS: Record<string, string> = {
  oil: "●",
  coal: "◆",
  natural_gas: "◈",
  rare_earth: "★",
  uranium: "☢",
  solar_potential: "☀",
  wind_potential: "⌁",
  arable: "⚘",
};

function HexTileInner({ hex, selected, onClick }: HexTileProps) {
  const { x, y } = hexToPixel(hex.q, hex.r);
  const points = hexCorners(x, y);

  const country = hex.countryId ? COUNTRY_CONFIGS[hex.countryId] : null;
  const isCountryHex = !!country;

  // Country hexes: solid country color. Non-country: terrain color.
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

  return (
    <g
      onClick={() => onClick?.(hex)}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      {/* Single solid fill — country color or terrain color, never both */}
      <polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Resource icon */}
      {hex.resource && (
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
      )}
    </g>
  );
}

export const HexTile = memo(HexTileInner);
