import "./BottomNavigation.css";

/**
 * Minimal mobile bottom navigation.
 * items: [{ id, label, icon, active }]
 * Presentation-only for Phase 1 — wiring comes with routing in later phases.
 */
export default function BottomNavigation({ items = [], onSelect }) {
  return (
    <nav className="buro-bottomnav" aria-label="Primary">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={["buro-bottomnav__item", item.active ? "is-active" : ""]
            .filter(Boolean)
            .join(" ")}
          aria-current={item.active ? "page" : undefined}
          onClick={() => onSelect?.(item.id)}
        >
          <span className="buro-bottomnav__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="buro-bottomnav__label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
