import "./BuroLogo.css";

/**
 * Buro wordmark with a small pulse motif for live audio.
 * sizes: sm | md | lg
 * showTagline: render "Start jazzing." beneath the wordmark.
 */
export default function BuroLogo({ size = "md", showTagline = false }) {
  return (
    <span className={`buro-logo buro-logo--${size}`}>
      <span className="buro-logo__row">
        <span className="buro-logo__pulse" aria-hidden="true" />
        <span className="buro-logo__word">Buro</span>
      </span>
      {showTagline && <span className="buro-logo__tagline">Start jazzing.</span>}
    </span>
  );
}
