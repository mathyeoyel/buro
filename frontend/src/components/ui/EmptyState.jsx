import "./EmptyState.css";

/**
 * Friendly empty state. Default copy follows Buro voice.
 */
export default function EmptyState({
  icon = "🎷",
  title = "No rooms live right now.",
  description = "Start jazzing and bring people in.",
  action = null,
}) {
  return (
    <div className="buro-empty">
      <div className="buro-empty__icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="buro-empty__title">{title}</h3>
      {description && <p className="buro-empty__desc">{description}</p>}
      {action && <div className="buro-empty__action">{action}</div>}
    </div>
  );
}
