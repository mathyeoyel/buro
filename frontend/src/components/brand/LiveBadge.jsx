import Badge from "../ui/Badge";
import "./LiveBadge.css";

/**
 * Animated "Live" indicator for active rooms.
 */
export default function LiveBadge({ label = "Live" }) {
  return (
    <span className="buro-live-badge">
      <Badge tone="green">
        <span className="buro-live-badge__dot" aria-hidden="true" />
        {label}
      </Badge>
    </span>
  );
}
