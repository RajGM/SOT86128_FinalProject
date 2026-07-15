import { useState } from "react";
import type { PresetId, RoomSettings } from "../../types/multiplayer";
import { getRoomPreset, presetDescription, formatPresetLabel } from "../../lib/roomPresets";
import "../../styles/lobby.css";

interface HostSettingsModalProps {
  onClose: () => void;
  onCreate: (settings: RoomSettings) => void;
  busy?: boolean;
}

const PRESET_OPTIONS: PresetId[] = ["easy", "medium", "hard"];

export function HostSettingsModal({ onClose, onCreate, busy }: HostSettingsModalProps) {
  const [selected, setSelected] = useState<PresetId>("medium");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel overlay-panel host-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Host Game — Choose Difficulty</div>

        <p className="host-settings-intro">
          Pick a mode before creating the lobby. Unassigned countries are played by bots.
        </p>

        <div className="preset-grid">
          {PRESET_OPTIONS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`preset-card ${selected === preset ? "selected" : ""}`}
              onClick={() => setSelected(preset)}
              disabled={busy}
            >
              <div className="preset-card-title">{formatPresetLabel(preset)}</div>
              <div className="preset-card-desc">{presetDescription(preset)}</div>
            </button>
          ))}
        </div>

        <div className="modal-actions">
          <button type="button" className="overlay-btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="overlay-btn primary"
            disabled={busy}
            onClick={() => onCreate(getRoomPreset(selected))}
          >
            {busy ? "Creating…" : `Create ${formatPresetLabel(selected)} Game`}
          </button>
        </div>
      </div>
    </div>
  );
}
