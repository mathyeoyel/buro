import Badge from "../ui/Badge";

/**
 * Badge for the default "Open Mic" room mode.
 */
export default function OpenMicBadge({ label = "Open Mic" }) {
  return (
    <Badge tone="orange">
      <span aria-hidden="true">🎙️</span>
      {label}
    </Badge>
  );
}
