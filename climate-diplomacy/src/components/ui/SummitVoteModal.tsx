import { useEffect, useState, useRef } from "react";
import { useGame } from "../../context/GameContext";
import { playSound } from "../../audio/AudioManager";
import { COUNTRY_CONFIGS, type CountryId } from "../../types/hex";
import type { SummitVoteChoice } from "../../types/game";

const ALL_COUNTRIES = Object.keys(COUNTRY_CONFIGS) as CountryId[];

function voteLabel(choice?: SummitVoteChoice): string {
  if (choice === "yes") return "YES";
  if (choice === "no") return "NO";
  if (choice === "abstain") return "ABSTAIN";
  return "—";
}

function voteColor(choice?: SummitVoteChoice): string {
  if (choice === "yes") return "#22c55e";
  if (choice === "no") return "#ef4444";
  if (choice === "abstain") return "#eab308";
  return "rgba(255,255,255,0.35)";
}

export function SummitVoteModal() {
  const {
    gameState,
    viewCountry,
    multiplayer,
    castSummitVote,
    autoVoteSummitBots,
    finalizeSummitVote,
  } = useGame();
  const pending = gameState.pendingSummitVote;
  const isHost = multiplayer?.isHost ?? true;
  const playerCountry = multiplayer?.assignedCountry ?? viewCountry;
  const [secondsLeft, setSecondsLeft] = useState(30);
  const prevSecondsRef = useRef(secondsLeft);

  useEffect(() => {
    if (!pending) return;
    if (secondsLeft <= 10 && secondsLeft < prevSecondsRef.current) {
      playSound("cycle-tick");
    }
    prevSecondsRef.current = secondsLeft;
  }, [secondsLeft, pending]);

  useEffect(() => {
    if (!pending) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((pending.deadlineAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0 && isHost) {
        autoVoteSummitBots();
        finalizeSummitVote();
      }
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [pending, isHost, autoVoteSummitBots, finalizeSummitVote]);

  if (!pending) return null;

  const votedCount = ALL_COUNTRIES.filter((id) => pending.votes[id]).length;
  const allVoted = votedCount >= ALL_COUNTRIES.length;

  return (
    <div className="modal-backdrop" style={{ zIndex: 2000 }}>
      <div
        className="modal-content"
        style={{ maxWidth: 560 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span style={{ fontWeight: 700, fontSize: 16 }}>
            Summit Resolution — Cycle {pending.cycle}
          </span>
          <span style={{ fontSize: 12, color: secondsLeft <= 10 ? "#ef4444" : "#eab308" }}>
            {secondsLeft}s
          </span>
        </div>

        <div className="modal-body">
          <div
            className="card"
            style={{
              marginBottom: 12,
              borderLeft: "3px solid #3b82f6",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
              Boundary: {pending.boundaryType.replace(/_/g, " ")}
            </div>
            {pending.resolutionText}
          </div>

          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 10 }}>
            Majority rule: more YES than NO, with YES ≥ floor(n/2)+1. Abstentions excluded from
            denominator. Vote for each country ({votedCount}/8).
            {multiplayer && (
              <span> Cast your vote for {COUNTRY_CONFIGS[playerCountry].name} below.</span>
            )}
          </p>

          <div style={{ display: "grid", gap: 6, maxHeight: 280, overflowY: "auto" }}>
            {ALL_COUNTRIES.map((id) => {
              const vote = pending.votes[id];
              const isView = id === playerCountry;
              const canVote = !multiplayer || id === playerCountry;
              return (
                <div
                  key={id}
                  className="card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    border: isView ? "1px solid rgba(59,130,246,0.5)" : undefined,
                  }}
                >
                  <span style={{ minWidth: 52, fontWeight: 600, fontSize: 12 }}>
                    {COUNTRY_CONFIGS[id].name}
                  </span>
                  <span style={{ fontSize: 11, color: voteColor(vote), minWidth: 64 }}>
                    {voteLabel(vote)}
                  </span>
                  {canVote ? (
                    <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                      {(["yes", "no", "abstain"] as const).map((choice) => (
                        <button
                          key={choice}
                          className={`overlay-btn ${vote === choice ? "primary" : ""}`}
                          style={{ fontSize: 10, padding: "2px 8px" }}
                          onClick={() => castSummitVote(id, choice)}
                        >
                          {choice.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 10,
                        color: "rgba(255,255,255,0.35)",
                      }}
                    >
                      {vote ? "Voted" : "Waiting…"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {isHost && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="overlay-btn" onClick={autoVoteSummitBots}>
                Auto-vote bots
              </button>
              <button
                className="overlay-btn primary"
                onClick={finalizeSummitVote}
                disabled={!allVoted && secondsLeft > 0}
              >
                {allVoted ? "Finalize vote" : `Waiting (${secondsLeft}s)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
