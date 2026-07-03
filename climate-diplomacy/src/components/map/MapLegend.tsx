import { TERRAIN_COLORS, COUNTRY_CONFIGS, CountryId } from "../../types/hex";

interface MapLegendProps {
  countryCounts: Record<string, number>;
}

export function MapLegend({ countryCounts }: MapLegendProps) {
  return (
    <div style={{
      position: "absolute",
      bottom: 16,
      left: 16,
      background: "rgba(0,0,0,0.85)",
      color: "#fff",
      borderRadius: 8,
      padding: "12px 16px",
      fontSize: 11,
      lineHeight: 1.8,
      backdropFilter: "blur(8px)",
      maxWidth: 200,
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

      <div style={{ fontWeight: 700, marginTop: 10, marginBottom: 6, fontSize: 12 }}>Terrain</div>
      {(["ocean", "land", "forest", "desert", "mountain", "agricultural", "coastal", "arctic"] as const).map((t) => (
        <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 10, height: 10, borderRadius: 2,
            backgroundColor: TERRAIN_COLORS[t],
            display: "inline-block", flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.2)",
          }} />
          <span style={{ textTransform: "capitalize" }}>{t}</span>
        </div>
      ))}

      <div style={{ fontWeight: 700, marginTop: 10, marginBottom: 6, fontSize: 12 }}>Resources</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px" }}>
        {[
          ["●", "Oil"], ["◆", "Coal"], ["◈", "Gas"], ["★", "Rare Earth"],
          ["☢", "Uranium"], ["☀", "Solar"], ["⌁", "Wind"], ["⚘", "Arable"],
        ].map(([icon, name]) => (
          <div key={name} style={{ display: "flex", gap: 4 }}>
            <span>{icon}</span><span>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
