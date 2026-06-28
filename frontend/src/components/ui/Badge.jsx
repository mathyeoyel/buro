import "./Badge.css";

/**
 * Small status / category pill.
 * tone: neutral | orange | green | brown | danger
 */
export default function Badge({
  children,
  tone = "neutral",
  dot = false,
  className = "",
  ...rest
}) {
  const classes = ["buro-badge", `buro-badge--${tone}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...rest}>
      {dot && <span className="buro-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
