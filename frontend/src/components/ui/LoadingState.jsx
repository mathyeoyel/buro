import "./LoadingState.css";

/**
 * Audio-flavored loading indicator (animated equalizer bars).
 */
export default function LoadingState({ label = "Tuning in…", inline = false }) {
  return (
    <div className={["buro-loading", inline ? "buro-loading--inline" : ""].filter(Boolean).join(" ")} role="status">
      <span className="buro-loading__bars" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
      {label && <span className="buro-loading__label">{label}</span>}
    </div>
  );
}
