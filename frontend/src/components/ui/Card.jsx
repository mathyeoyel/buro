import "./Card.css";

/**
 * Rounded surface container.
 * variant: elevated | flat | cream
 */
export default function Card({
  children,
  variant = "elevated",
  as: Tag = "div",
  className = "",
  ...rest
}) {
  const classes = ["buro-card", `buro-card--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
