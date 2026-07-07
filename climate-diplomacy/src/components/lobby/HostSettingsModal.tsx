import type { RoomSettings } from "../../types/multiplayer";
import { DEFAULT_ROOM_SETTINGS } from "../../lib/roomPresets";
import "../../styles/lobby.css";

interface HostSettingsModalProps {
  onClose: () => void;
  onCreate: (settings: RoomSettings) => void;
  busy?: boolean;
}

/** Minimal host confirmation — games use the rich test-scenario default world. */
export function HostSettingsModal({ onClose, onCreate, busy }: HostSettingsModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Host Game</div>

        <p style={{ fontSize: 14, lineHeight: 1.5, margin: "0 0 16px", color: "rgba(255,255,255,0.75)" }}>
          Starts in a rich mid-game world: existing buildings, trade routes, diplomatic
          relations, and active summit resolutions. Unassigned countries are played by bots.
        </p>

        <ul style={{ fontSize: 13, margin: "0 0 20px", paddingLeft: 20, color: "rgba(255,255,255,0.6)" }}>
          <li>5-minute cycles</li>
          <li>Up to 8 players</li>
          <li>Random country assignment at start</li>
        </ul>

        <div className="modal-actions">
          <button type="button" className="overlay-btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="overlay-btn primary"
            disabled={busy}
            onClick={() => onCreate(structuredClone(DEFAULT_ROOM_SETTINGS))}
          >
            {busy ? "Creating…" : "Create Game"}
          </button>
        </div>
      </div>
    </div>
  );
}
