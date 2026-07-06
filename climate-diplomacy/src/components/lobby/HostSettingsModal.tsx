import { useEffect, useState } from "react";
import type { PresetId, RoomSettings } from "../../types/multiplayer";
import {
  DEFAULT_ROOM_SETTINGS,
  getPresetSettings,
  settingsMatchPreset,
  formatPresetLabel,
} from "../../lib/roomPresets";
import "../../styles/lobby.css";

interface HostSettingsModalProps {
  onClose: () => void;
  onCreate: (settings: RoomSettings) => void;
  busy?: boolean;
}

export function HostSettingsModal({ onClose, onCreate, busy }: HostSettingsModalProps) {
  const [settings, setSettings] = useState<RoomSettings>(() => structuredClone(DEFAULT_ROOM_SETTINGS));
  const [activePreset, setActivePreset] = useState<PresetId>("normal");

  useEffect(() => {
    setActivePreset(settingsMatchPreset(settings));
  }, [settings]);

  const applyPreset = (preset: Exclude<PresetId, "custom">) => {
    const next = getPresetSettings(preset);
    setSettings(next);
    setActivePreset(preset);
  };

  const update = <K extends keyof RoomSettings>(key: K, value: RoomSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value, preset: "custom" }));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Game Settings</div>

        <div style={{ marginBottom: 8, fontSize: 13 }}>
          Preset: <strong>{formatPresetLabel(activePreset)}</strong>
        </div>
        <div className="preset-row">
          {(["easy", "normal", "hard"] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`overlay-btn preset-btn ${activePreset === p ? "active" : ""}`}
              onClick={() => applyPreset(p)}
            >
              {formatPresetLabel(p)}
            </button>
          ))}
        </div>

        <div className="settings-section-title">Starting Resources</div>
        <SliderRow
          label="Money"
          min={0.5}
          max={2}
          step={0.05}
          value={settings.moneyMultiplier}
          format={(v) => `${v.toFixed(2)}x`}
          onChange={(v) => update("moneyMultiplier", v)}
        />
        <SliderRow
          label="Energy"
          min={0.5}
          max={2}
          step={0.05}
          value={settings.energyMultiplier}
          format={(v) => `${v.toFixed(2)}x`}
          onChange={(v) => update("energyMultiplier", v)}
        />
        <SliderRow
          label="Food"
          min={0.5}
          max={2}
          step={0.05}
          value={settings.foodMultiplier}
          format={(v) => `${v.toFixed(2)}x`}
          onChange={(v) => update("foodMultiplier", v)}
        />
        <SliderRow
          label="Tech"
          min={0.5}
          max={2}
          step={0.05}
          value={settings.techMultiplier}
          format={(v) => `${v.toFixed(2)}x`}
          onChange={(v) => update("techMultiplier", v)}
        />

        <div className="settings-section-title">World Settings</div>
        <SliderRow
          label="Start temp"
          min={0.8}
          max={1.5}
          step={0.05}
          value={settings.startingTemperature}
          format={(v) => `${v.toFixed(1)}°C`}
          onChange={(v) => update("startingTemperature", v)}
        />
        <SliderRow
          label="Cycle timer"
          min={3}
          max={10}
          step={1}
          value={settings.cycleTimerMinutes}
          format={(v) => `${v} min`}
          onChange={(v) => update("cycleTimerMinutes", v)}
        />
        <SliderRow
          label="Max players"
          min={2}
          max={8}
          step={1}
          value={settings.maxPlayers}
          format={(v) => String(v)}
          onChange={(v) => update("maxPlayers", v)}
        />

        <div className="settings-section-title">Starting Infrastructure</div>
        <Checkbox
          label="Give each country 1 Fossil Plant"
          checked={settings.startingInfra.fossilPlant}
          onChange={(v) =>
            update("startingInfra", { ...settings.startingInfra, fossilPlant: v })
          }
        />
        <Checkbox
          label="Give each country 1 Farm"
          checked={settings.startingInfra.farm}
          onChange={(v) => update("startingInfra", { ...settings.startingInfra, farm: v })}
        />
        <Checkbox
          label="Give each country 1 Extractor"
          checked={settings.startingInfra.extractor}
          onChange={(v) =>
            update("startingInfra", { ...settings.startingInfra, extractor: v })
          }
        />
        <Checkbox
          label="Give each country 1 Transport Hub"
          checked={settings.startingInfra.transportHub}
          onChange={(v) =>
            update("startingInfra", { ...settings.startingInfra, transportHub: v })
          }
        />
        <Checkbox
          label="Give each country 1 Manufacturing"
          checked={settings.startingInfra.manufacturing}
          onChange={(v) =>
            update("startingInfra", { ...settings.startingInfra, manufacturing: v })
          }
        />

        <div className="settings-section-title">Rules</div>
        <Checkbox
          label="Enable carbon tax"
          checked={settings.rules.carbonTax}
          onChange={(v) => update("rules", { ...settings.rules, carbonTax: v })}
        />
        <Checkbox
          label="Enable summit resolutions"
          checked={settings.rules.summitResolutions}
          onChange={(v) => update("rules", { ...settings.rules, summitResolutions: v })}
        />
        <Checkbox
          label="Enable factions"
          checked={settings.rules.factions}
          onChange={(v) => update("rules", { ...settings.rules, factions: v })}
        />
        <Checkbox
          label="Peaceful mode (no transit disrupt)"
          checked={settings.rules.peacefulMode}
          onChange={(v) => update("rules", { ...settings.rules, peacefulMode: v })}
        />

        <div className="modal-actions">
          <button type="button" className="overlay-btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="overlay-btn primary"
            disabled={busy}
            onClick={() => onCreate({ ...settings, preset: settingsMatchPreset(settings) })}
          >
            {busy ? "Creating…" : "Create Game"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  min,
  max,
  step,
  value,
  format,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="settings-slider-row">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span style={{ textAlign: "right", fontSize: 12 }}>{format(value)}</span>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="settings-checkbox-row">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
