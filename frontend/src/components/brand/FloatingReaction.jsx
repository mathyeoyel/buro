import "./FloatingReaction.css";

/**
 * Placeholder floating reaction that drifts upward and fades.
 * Visual-only for Phase 1 — real reaction events arrive in a later phase.
 */
export default function FloatingReaction({ emoji = "😂", style }) {
  return (
    <span className="buro-floating-reaction" style={style} aria-hidden="true">
      {emoji}
    </span>
  );
}
