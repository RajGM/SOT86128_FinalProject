import { useGame } from "../../context/GameContext";
import { ResearchPanel } from "./ResearchPanel";
import { DiplomacyPanel } from "./DiplomacyPanel";
import { TradePanel } from "./TradePanel";
import { RoutesPanel } from "./RoutesPanel";
import "./overlay.css";

export function DashboardModal() {
  const { dashboardOpen, setDashboardOpen, dashboardTab, setDashboardTab } = useGame();

  if (!dashboardOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => setDashboardOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span style={{ fontWeight: 700, fontSize: 16 }}>Actions Dashboard</span>
          <button className="overlay-btn" onClick={() => setDashboardOpen(false)}>✕</button>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {(["research", "diplomacy", "trade", "routes"] as const).map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${dashboardTab === tab ? "active" : ""}`}
              onClick={() => setDashboardTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {dashboardTab === "research" && <ResearchPanel />}
          {dashboardTab === "diplomacy" && <DiplomacyPanel />}
          {dashboardTab === "trade" && <TradePanel />}
          {dashboardTab === "routes" && <RoutesPanel />}
        </div>
      </div>
    </div>
  );
}
