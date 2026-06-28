import "./MicIconButton.css";

/**
 * Placeholder mute/unmute control. Visual-only for Phase 1 —
 * real audio wiring lands in the audio provider phase.
 * muted: boolean visual state.
 */
export default function MicIconButton({ muted = true, onClick, size = "lg" }) {
  const label = muted ? "Unmute" : "Mute";
  return (
    <button
      type="button"
      className={[
        "buro-mic",
        `buro-mic--${size}`,
        muted ? "buro-mic--muted" : "buro-mic--live",
      ].join(" ")}
      onClick={onClick}
      aria-pressed={!muted}
      aria-label={label}
      title={label}
    >
      <span className="buro-mic__glyph" aria-hidden="true">
        {muted ? "🔇" : "🎤"}
      </span>
      <span className="buro-mic__text">{label}</span>
    </button>
  );
}
