import { CountryId, COUNTRY_CONFIGS } from "../../types/hex";
import { HexData } from "../../types/hex";
import { hexToPixel } from "../../lib/hexUtils";

interface CountryLabelProps {
  countryId: CountryId;
  hexes: HexData[];
}

export function CountryLabel({ countryId, hexes }: CountryLabelProps) {
  const config = COUNTRY_CONFIGS[countryId];
  const countryHexes = hexes.filter((h) => h.countryId === countryId);

  if (countryHexes.length === 0) return null;

  // Compute centroid
  let sumX = 0;
  let sumY = 0;
  for (const hex of countryHexes) {
    const { x, y } = hexToPixel(hex.q, hex.r);
    sumX += x;
    sumY += y;
  }
  const cx = sumX / countryHexes.length;
  const cy = sumY / countryHexes.length;

  return (
    <g pointerEvents="none">
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={700}
        fill="#fff"
        stroke="rgba(0,0,0,0.6)"
        strokeWidth={2.5}
        paintOrder="stroke"
        letterSpacing={0.5}
      >
        {config.name}
      </text>
      <text
        x={cx}
        y={cy + 7}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={8}
        fill="#fff"
        stroke="rgba(0,0,0,0.5)"
        strokeWidth={2}
        paintOrder="stroke"
      >
        {countryHexes.length} hexes
      </text>
    </g>
  );
}
