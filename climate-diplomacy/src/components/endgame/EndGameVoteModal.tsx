import { useEffect, useMemo, useState } from "react";
import type { EndGameVoteState, Room } from "../../types/multiplayer";
import { castEndVote, setEndVote } from "../../services/roomService";
import { VOTE_DURATION_MS, votesNeededToPass } from "../../lib/scoring";
import "../../styles/lobby.css";

interface EndGameVoteModalProps {
  roomId: string;
  playerId: string;
  vote: EndGameVoteState;
  humanPlayerIds: string[];
  onVoteComplete: (passed: boolean) => void;
  onCancelled: () => void;
}

export function EndGameVoteModal({
  roomId,
  playerId,
  vote,
  humanPlayerIds,
  onVoteComplete,
  onCancelled,
}: EndGameVoteModalProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const remainingHumans = useMemo(() => {
    return humanPlayerIds;
  }, [humanPlayerIds]);

  const yesCount = Object.values(vote.votes).filter((v) => v === "yes").length;
  const noCount = Object.values(vote.votes).filter((v) => v === "no").length;
  const needed = votesNeededToPass(remainingHumans.length);
  const timeLeft = Math.max(0, Math.ceil((vote.expiresAt - now) / 1000));

  useEffect(() => {
    if (!vote.active) return;
    if (now >= vote.expiresAt) {
      onVoteComplete(yesCount >= needed);
      return;
    }
    if (yesCount >= needed) {
      onVoteComplete(true);
    }
  }, [vote.active, now, vote.expiresAt, yesCount, needed, onVoteComplete]);

  useEffect(() => {
    if (!remainingHumans.includes(vote.callerId)) {
      onCancelled();
    }
  }, [remainingHumans, vote.callerId, onCancelled]);

  const myVote = vote.votes[playerId];

  return (
    <div className="modal-backdrop">
      <div className="modal-panel overlay-panel" style={{ maxWidth: 400 }}>
        <div className="modal-title">Vote: End the Game?</div>
        <p style={{ fontSize: 13, marginBottom: 12, textAlign: "center" }}>
          Called by: <strong>{vote.callerName}</strong>
        </p>
        <p style={{ fontSize: 13, marginBottom: 16, textAlign: "center", color: "rgba(255,255,255,0.7)" }}>
          Shall we end the game now?
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
          <button
            type="button"
            className={`overlay-btn primary ${myVote === "yes" ? "active" : ""}`}
            disabled={Boolean(myVote)}
            onClick={() => void castEndVote(roomId, playerId, "yes")}
          >
            YES
          </button>
          <button
            type="button"
            className={`overlay-btn danger ${myVote === "no" ? "active" : ""}`}
            disabled={Boolean(myVote)}
            onClick={() => void castEndVote(roomId, playerId, "no")}
          >
            NO
          </button>
        </div>

        <p style={{ fontSize: 12, textAlign: "center", color: "rgba(255,255,255,0.55)" }}>
          Votes: {yesCount}/{needed} YES, {noCount} NO
          <br />
          Time remaining: {timeLeft}s
        </p>
      </div>
    </div>
  );
}

export function useEndGameVote(room: Room | null, playerId: string) {
  const [lastVoteCallTime, setLastVoteCallTime] = useState<number | null>(null);

  const canCallVote = (): boolean => {
    if (!lastVoteCallTime) return true;
    return Date.now() - lastVoteCallTime > 7 * 60 * 1000;
  };

  const startVote = async (roomId: string, callerName: string): Promise<EndGameVoteState> => {
    const now = Date.now();
    const vote: EndGameVoteState = {
      active: true,
      callerId: playerId,
      callerName,
      votes: { [playerId]: "yes" },
      startedAt: now,
      expiresAt: now + VOTE_DURATION_MS,
    };
    setLastVoteCallTime(now);
    await setEndVote(roomId, vote);
    return vote;
  };

  return { vote: room?.endVote ?? null, canCallVote, startVote, setLastVoteCallTime };
}
