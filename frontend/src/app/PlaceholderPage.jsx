import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Avatar,
  Button,
  Card,
  LiveBadge,
  OpenMicBadge,
  BuroLogo,
} from "../components";
import "./PlaceholderPage.css";

function MockRoomCard() {
  return (
    <Card variant="elevated" className="mock-room">
      <div className="mock-room__top">
        <div className="mock-room__badges">
          <LiveBadge />
          <OpenMicBadge />
        </div>
        <span className="mock-room__count">12 in the room</span>
      </div>

      <h3 className="mock-room__title">Amina's Jazz Room</h3>
      <p className="mock-room__category">Random Jazz</p>

      <div className="mock-room__footer">
        <div className="mock-room__people">
          <Avatar name="Amina K" size="sm" speaking />
          <Avatar name="Deng M" size="sm" />
          <Avatar name="Joy O" size="sm" />
          <span className="mock-room__host">Hosted by Amina</span>
        </div>
        <Button size="sm" variant="secondary">
          Join room
        </Button>
      </div>
    </Card>
  );
}

export default function PlaceholderPage() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get("/health/")
      .then((response) => setHealth(response.data))
      .catch(() => setError(true));
  }, []);

  return (
    <div className="home">
      <section className="home__hero">
        <BuroLogo size="lg" showTagline />
        <p className="home__lead">
          Live rooms for jokes, stories, laughter, and everyday conversation.
        </p>
        <Button size="lg" fullWidth leadingIcon={<span aria-hidden="true">🎷</span>}>
          Start Jazzing
        </Button>
      </section>

      <section className="home__preview">
        <p className="home__preview-label">A taste of the room</p>
        <MockRoomCard />
      </section>

      <p className="home__health">
        {health && (
          <>
            <span className="home__health-dot home__health-dot--ok" /> API {health.status}
          </>
        )}
        {error && (
          <>
            <span className="home__health-dot home__health-dot--down" /> API offline
          </>
        )}
        {!health && !error && <>Checking API…</>}
      </p>
    </div>
  );
}
