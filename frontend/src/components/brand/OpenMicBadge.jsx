import Badge from "../ui/Badge";
import Icon from "../ui/Icon";

/**
 * Badge for the default "Open Mic" room mode.
 */
export default function OpenMicBadge({ label = "Open Mic" }) {
  return (
    <Badge tone="orange">
      <Icon name="mic" size={14} strokeWidth={2.2} />
      {label}
    </Badge>
  );
}
