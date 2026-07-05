import { useGame } from "../../context/GameContext";

export function RelationAlerts() {
  const { gameState, viewCountry, dismissRelationAlerts } = useGame();
  const alerts = gameState.relationAlerts.filter((a) => a.viewer === viewCountry);

  if (alerts.length === 0) return null;

  return (
    <div className="relation-alerts">
      {alerts.map((alert) => (
        <div key={alert.id} className="relation-alert-card">
          <span>{alert.message}</span>
        </div>
      ))}
      <button type="button" className="overlay-btn" style={{ fontSize: 11 }} onClick={dismissRelationAlerts}>
        Dismiss
      </button>
    </div>
  );
}
