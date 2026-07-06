import { useState } from "react";
import "../../styles/lobby.css";

interface JoinModalProps {
  onClose: () => void;
  onJoin: (roomId: string) => void;
  busy?: boolean;
  error?: string | null;
}

export function JoinModal({ onClose, onJoin, busy, error }: JoinModalProps) {
  const [roomId, setRoomId] = useState("");

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Join Game</div>

        <label style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Room ID</label>
        <input
          className="landing-input"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
          placeholder="K7X2MF"
          maxLength={6}
          autoFocus
        />

        {error && <div className="error-text">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="overlay-btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="overlay-btn primary"
            disabled={busy || roomId.length < 6}
            onClick={() => onJoin(roomId)}
          >
            {busy ? "Joining…" : "Join"}
          </button>
        </div>
      </div>
    </div>
  );
}
