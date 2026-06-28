import "./BuroLogo.css";

/**
 * Single source for rendering the Buro logo using the approved brand assets.
 *
 * - variant "onDark" (default) uses /brand/logo-dark.svg (cream wordmark) for
 *   Buro's charcoal surfaces.
 * - variant "onLight" uses /brand/logo.svg (charcoal wordmark) for cream/light
 *   surfaces.
 * - mark renders the compact /brand/icon.svg square mark for tight spaces.
 *
 * sizes: sm | md | lg  (controls wordmark height)
 * showTagline: render "Start jazzing." beneath the wordmark.
 */
const HEIGHTS = { sm: 20, md: 28, lg: 40 };
const MARK_SIZES = { sm: 24, md: 32, lg: 44 };

export default function BuroLogo({
  size = "md",
  variant = "onDark",
  mark = false,
  showTagline = false,
  className = "",
}) {
  if (mark) {
    const dimension = MARK_SIZES[size] ?? MARK_SIZES.md;
    return (
      <img
        className={["buro-logo__mark", className].filter(Boolean).join(" ")}
        src="/brand/icon.svg"
        alt="Buro"
        width={dimension}
        height={dimension}
        style={{ width: dimension, height: dimension }}
      />
    );
  }

  const height = HEIGHTS[size] ?? HEIGHTS.md;
  const src = variant === "onLight" ? "/brand/logo.svg" : "/brand/logo-dark.svg";

  return (
    <span className={["buro-logo", `buro-logo--${size}`, className].filter(Boolean).join(" ")}>
      <img className="buro-logo__img" src={src} alt="Buro" style={{ height }} />
      {showTagline && <span className="buro-logo__tagline">Start jazzing.</span>}
    </span>
  );
}
