import useTheme from "../../theme/useTheme";
import "./BuroLogo.css";

/**
 * Single source for rendering the Buro logo using the approved brand assets.
 *
 * - variant "onDark" uses /brand/logo-dark.svg (cream wordmark) for dark surfaces.
 * - variant "onLight" uses /brand/logo.svg (charcoal wordmark) for light surfaces.
 * - When variant is omitted, it follows the active theme automatically.
 * - mark renders the compact /brand/icon.svg square mark for tight spaces.
 */
const HEIGHTS = { sm: 20, md: 28, lg: 40 };
const MARK_SIZES = { sm: 24, md: 32, lg: 44 };

export default function BuroLogo({
  size = "md",
  variant,
  mark = false,
  showTagline = false,
  className = "",
}) {
  const { isDark } = useTheme();
  const resolvedVariant = variant ?? (isDark ? "onDark" : "onLight");

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
  const src = resolvedVariant === "onLight" ? "/brand/logo.svg" : "/brand/logo-dark.svg";

  return (
    <span className={["buro-logo", `buro-logo--${size}`, className].filter(Boolean).join(" ")}>
      <img className="buro-logo__img" src={src} alt="Buro" style={{ height }} />
      {showTagline && <span className="buro-logo__tagline">Start jazzing.</span>}
    </span>
  );
}
