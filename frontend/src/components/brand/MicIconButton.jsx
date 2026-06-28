import Icon from "../ui/Icon";
import "./MicIconButton.css";

/**
 * Placeholder mute/unmute control. Visual-only for Phase 1 —
 * real audio wiring lands in the audio provider phase.
 * muted: boolean visual state.
 */
export default function MicIconButton({
  muted = true,
  onClick,
  size = "lg",
  statusText,
  disabled = false,
}) {
  const label = muted ? "Unmute" : "Mute";
  const displayText = statusText ?? label;

  return (
    <button
      type="button"
      className={[
        "buro-mic",
        `buro-mic--${size}`,
        muted ? "buro-mic--muted" : "buro-mic--live",
      ].join(" ")}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={!muted}
      aria-label={label}
      title={label}
    >
      <span className="buro-mic__glyph" aria-hidden="true">
        <Icon name={muted ? "micOff" : "mic"} size={size === "lg" ? 30 : 24} />
      </span>
      <span className="buro-mic__text">{displayText}</span>
    </button>
  );
}
