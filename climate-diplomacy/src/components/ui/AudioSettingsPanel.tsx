import { useState } from "react";
import { AudioManager, playSound } from "../../audio/AudioManager";
import type { AudioConfig } from "../../audio/soundRegistry";
import "./overlay.css";

function VolumeSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="audio-slider-row">
      <span className="audio-slider-label">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="audio-slider"
      />
      <span className="audio-slider-value">{Math.round(value * 100)}%</span>
    </label>
  );
}

export function AudioSettingsPanel() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<AudioConfig>(() => AudioManager.getInstance().getConfig());
  const audio = AudioManager.getInstance();

  const sync = () => setConfig(audio.getConfig());

  const handleMaster = (v: number) => {
    audio.setVolume("master", v);
    sync();
  };

  const handleMusic = (v: number) => {
    audio.setVolume("music", v);
    sync();
  };

  const handleSfx = (v: number) => {
    audio.setVolume("sfx", v);
    sync();
  };

  const handleMuteToggle = () => {
    audio.unlockFromGesture("audio-settings");
    audio.toggleMute();
    playSound("toggle");
    sync();
  };

  return (
    <div className="audio-settings">
      <button
        type="button"
        className={`overlay-btn audio-settings-toggle ${open ? "active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Audio settings"
        aria-label="Audio settings"
      >
        {config.muted ? "🔇" : "🔊"}
      </button>

      {open && (
        <div className="audio-settings-panel overlay-panel">
          <div className="audio-settings-header">
            <span style={{ fontWeight: 700, fontSize: 13 }}>Audio</span>
            <button
              type="button"
              className="overlay-btn"
              style={{ padding: "4px 10px", fontSize: 11 }}
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>

          <label className="audio-mute-row">
            <input type="checkbox" checked={config.muted} onChange={handleMuteToggle} />
            <span>Mute all</span>
          </label>

          <VolumeSlider label="Master" value={config.masterVolume} onChange={handleMaster} />
          <VolumeSlider label="Music" value={config.musicVolume} onChange={handleMusic} />
          <VolumeSlider label="SFX" value={config.sfxVolume} onChange={handleSfx} />
        </div>
      )}
    </div>
  );
}
