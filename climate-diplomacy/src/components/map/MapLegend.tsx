import { COUNTRY_CONFIGS, CountryId, RESOURCE_DEPOSITS, RESOURCE_LABELS, RESOURCE_ICONS } from "../../types/hex";

interface MapLegendProps {
  countryCounts: Record<string, number>;
}

export function MapLegend({ countryCounts }: MapLegendProps) {
  return (
    <div className="map-legend-fixed overlay-panel" style={{
      padding: "12px 16px",
      fontSize: 11,
      lineHeight: 1.8,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 12 }}>Countries</div>
      {(Object.keys(COUNTRY_CONFIGS) as CountryId[]).map((id) => (
        <div key={id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 10, height: 10, borderRadius: 2,
            backgroundColor: COUNTRY_CONFIGS[id].color,
            display: "inline-block", flexShrink: 0,
          }} />
          <span>{COUNTRY_CONFIGS[id].name}</span>
          <span style={{ color: "#999", marginLeft: "auto" }}>{countryCounts[id] || 0}</span>
        </div>
      ))}

      <div style={{ fontWeight: 700, marginTop: 10, marginBottom: 6, fontSize: 12 }}>Resources</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px" }}>
        {RESOURCE_DEPOSITS.map((dep) => (
          <div key={dep} style={{ display: "flex", gap: 4 }}>
            <span>{RESOURCE_ICONS[dep]}</span><span>{RESOURCE_LABELS[dep]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
