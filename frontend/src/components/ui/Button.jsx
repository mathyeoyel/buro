import "./Button.css";

/**
 * Buro primary action button.
 * variants: primary | secondary | ghost | danger
 * sizes: sm | md | lg
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  fullWidth = false,
  disabled = false,
  leadingIcon = null,
  className = "",
  ...rest
}) {
  const classes = [
    "buro-btn",
    `buro-btn--${variant}`,
    `buro-btn--${size}`,
    fullWidth ? "buro-btn--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} disabled={disabled} {...rest}>
      {leadingIcon && <span className="buro-btn__icon">{leadingIcon}</span>}
      <span>{children}</span>
    </button>
  );
}
