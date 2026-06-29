import getAvatarSrc from "../../utils/getAvatarSrc";
import "./Avatar.css";

function initialsFrom(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Round avatar with image fallback to Buro custom avatar, then initials.
 * sizes: sm | md | lg
 */
export default function Avatar({
  name = "",
  src = null,
  profile = null,
  size = "md",
  speaking = false,
  className = "",
  ...rest
}) {
  const resolvedSrc = src ?? getAvatarSrc(profile);

  const classes = [
    "buro-avatar",
    `buro-avatar--${size}`,
    speaking ? "buro-avatar--speaking" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...rest}>
      {resolvedSrc ? (
        <img className="buro-avatar__img" src={resolvedSrc} alt={name} />
      ) : (
        <span className="buro-avatar__initials" aria-hidden="true">
          {initialsFrom(name)}
        </span>
      )}
    </span>
  );
}
