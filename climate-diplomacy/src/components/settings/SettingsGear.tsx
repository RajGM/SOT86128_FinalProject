import { useState } from "react";
import { AudioManager } from "../../audio/AudioManager";
import type { AudioConfig } from "../../audio/soundRegistry";
import { getDisplayName, isMusicEnabled, setDisplayName, setMusicEnabled } from "../../lib/playerIdentity";
import { updatePlayerNameInRoom } from "../../services/roomService";
import "../ui/overlay.css";
import "../../styles/lobby.css";

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
    <label className="settings-slider-row">
      <span>{label}</span>
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

interface SettingsGearProps {
  roomId?: string;
  playerId?: string;
  onDisplayNameChange?: (name: string) => void;
}

export function SettingsGear({ roomId, playerId, onDisplayNameChange }: SettingsGearProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<AudioConfig>(() => AudioManager.getInstance().getConfig());
  const [musicOn, setMusicOn] = useState(isMusicEnabled);
  const [name, setName] = useState(getDisplayName);
  const [sfxOn, setSfxOn] = useState(() => !AudioManager.getInstance().getConfig().muted);
  const audio = AudioManager.getInstance();

  const sync = () => setConfig(audio.getConfig());

  const handleSaveName = async () => {
    const trimmed = name.trim();
    setDisplayName(trimmed);
    onDisplayNameChange?.(trimmed);
    if (roomId && playerId && trimmed) {
      await updatePlayerNameInRoom(roomId, playerId, trimmed);
    }
  };

  return (
    <div className="settings-gear-wrap">
      {open && (
        <div className="settings-gear-panel overlay-panel">
          <div className="settings-gear-title">⚙ Settings</div>

          <div className="settings-toggle-row">
            <span>🔊 Music</span>
            <button
              type="button"
              className={`overlay-btn ${musicOn ? "active" : ""}`}
              style={{ padding: "4px 12px", fontSize: 11 }}
              onClick={() => {
                const next = !musicOn;
                setMusicOn(next);
                setMusicEnabled(next);
                if (next) audio.playMusic("ambient-main");
                else audio.stopMusic();
              }}
            >
              {musicOn ? "ON" : "OFF"}
            </button>
          </div>

          <div className="settings-toggle-row">
            <span>🔈 SFX</span>
            <button
              type="button"
              className={`overlay-btn ${sfxOn ? "active" : ""}`}
              style={{ padding: "4px 12px", fontSize: 11 }}
              onClick={() => {
                const next = !sfxOn;
                setSfxOn(next);
                if (!next) audio.setVolume("master", config.masterVolume);
                audio.toggleMute();
                sync();
                setSfxOn(!audio.getConfig().muted);
              }}
            >
              {sfxOn ? "ON" : "OFF"}
            </button>
          </div>

          <VolumeSlider
            label="🔉 Volume"
            value={config.masterVolume}
            onChange={(v) => {
              audio.setVolume("master", v);
              sync();
            }}
          />

          <label style={{ display: "block", fontSize: 12, marginTop: 12, marginBottom: 6 }}>
            Display Name
          </label>
          <input
            className="landing-input"
            style={{ marginBottom: 10 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <button type="button" className="overlay-btn primary" style={{ width: "100%" }} onClick={handleSaveName}>
            Save
          </button>
        </div>
      )}

      <button
        type="button"
        className={`overlay-btn ${open ? "active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Settings"
        aria-label="Settings"
      >
        ⚙
      </button>
    </div>
  );
}

export function MusicToggle() {
  const [musicOn, setMusicOn] = useState(isMusicEnabled);

  return (
    <button
      type="button"
      className="overlay-btn music-toggle-fixed"
      onClick={() => {
        const next = !musicOn;
        setMusicOn(next);
        setMusicEnabled(next);
        const audio = AudioManager.getInstance();
        if (next) audio.playMusic("ambient-main");
        else audio.stopMusic();
      }}
      title="Toggle music"
    >
      {musicOn ? "🔊" : "🔇"}
    </button>
  );
}
