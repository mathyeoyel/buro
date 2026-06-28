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

const STATUS = { CHECKING: "checking", ONLINE: "online", OFFLINE: "offline" };

export default function PlaceholderPage() {
  const [apiStatus, setApiStatus] = useState(STATUS.CHECKING);

  useEffect(() => {
    let active = true;

    api
      .get("/health/")
      .then((response) => {
        // Axios: use response.status + response.data (never response.ok).
        const isOk = response.status === 200 && response.data?.status === "ok";
        if (active) setApiStatus(isOk ? STATUS.ONLINE : STATUS.OFFLINE);
      })
      .catch(() => {
        if (active) setApiStatus(STATUS.OFFLINE);
      });

    return () => {
      active = false;
    };
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
        {apiStatus === STATUS.ONLINE && (
          <>
            <span className="home__health-dot home__health-dot--ok" /> API online
          </>
        )}
        {apiStatus === STATUS.OFFLINE && (
          <>
            <span className="home__health-dot home__health-dot--down" /> API offline
          </>
        )}
        {apiStatus === STATUS.CHECKING && <>Checking API…</>}
      </p>
    </div>
  );
}
