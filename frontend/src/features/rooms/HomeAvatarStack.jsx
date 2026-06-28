import { Avatar } from "../../components";
import "./rooms.css";

/**
 * Overlapping avatar stack showing "people are inside" energy on Home.
 *
 * The live rooms list endpoint does not expose the full participant list yet,
 * so we render the host avatar plus lightweight placeholder bubbles derived
 * from the participant count. This is intentionally easy to replace later with
 * real Buro avatars once participant data is available on the list.
 *
 * props:
 * - host: { display_name, avatar_url }
 * - count: total people in the room (includes host)
 * - max: how many bubbles to show before collapsing into "+N"
 */
export default function HomeAvatarStack({ host, count = 0, max = 4 }) {
  const total = Math.max(count, host ? 1 : 0);
  const placeholders = Math.max(total - 1, 0);
  const visiblePlaceholders = Math.min(placeholders, max - 1);
  const overflow = placeholders - visiblePlaceholders;

  return (
    <div className="home-stack" aria-label={`${total} inside`}>
      <div className="home-stack__avatars">
        <Avatar
          className="home-stack__avatar"
          name={host?.display_name}
          src={host?.avatar_url || null}
          size="sm"
        />
        {Array.from({ length: visiblePlaceholders }).map((_, index) => (
          <span
            key={index}
            className="home-stack__bubble"
            aria-hidden="true"
          />
        ))}
        {overflow > 0 && (
          <span className="home-stack__more" aria-hidden="true">
            +{overflow}
          </span>
        )}
      </div>
      <span className="home-stack__label">
        {total} {total === 1 ? "person" : "people"} inside
      </span>
    </div>
  );
}
