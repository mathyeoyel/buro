import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BuroLogo, Button, Icon, LoadingState } from "../../components";
import { extractRoomError, getLiveRooms } from "../../services/rooms";
import RoomCard from "./RoomCard";
import StartRoomSheet from "./StartRoomSheet";
import "./rooms.css";

export default function LiveRoomsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState("");

  const loadRooms = useCallback(async () => {
    setError("");
    try {
      const data = await getLiveRooms();
      setRooms(data);
    } catch (err) {
      setError(extractRoomError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (searchParams.get("start") === "1") {
      setSheetOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("start");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openStartSheet = () => setSheetOpen(true);

  const handleRoomCreated = (room) => {
    navigate(`/rooms/${room.id}`);
  };

  const handleJoin = (roomId) => {
    navigate(`/rooms/${roomId}`);
  };

  if (loading) {
    return <LoadingState label="Finding live rooms…" />;
  }

  return (
    <div className="rooms-page">
      <div className="rooms-page__topbar">
        <BuroLogo size="md" />
      </div>

      <section className="home-hero">
        <div className="home-hero__copy">
          <h1 className="home-hero__heading">
            Who is <span className="home-hero__accent">jazzing</span> now?
          </h1>
          <p className="home-hero__subtitle">Jump in, listen, laugh and connect.</p>
          <Button
            size="lg"
            fullWidth
            leadingIcon={<Icon name="start" />}
            onClick={openStartSheet}
          >
            Start Jazzing
          </Button>
        </div>

        <div className="home-hero__visual" aria-hidden="true">
          <span className="home-hero__bubble home-hero__bubble--a" />
          <span className="home-hero__bubble home-hero__bubble--b" />
          <span className="home-hero__bubble home-hero__bubble--c" />
          <span className="home-hero__wave">
            <Icon name="mic" size={20} />
          </span>
          <span className="home-hero__chat home-hero__chat--a">
            <Icon name="chat" size={16} />
          </span>
          <span className="home-hero__chat home-hero__chat--b">
            <Icon name="react" size={16} />
          </span>
          <span className="home-hero__dot home-hero__dot--a" />
          <span className="home-hero__dot home-hero__dot--b" />
        </div>
      </section>

      {error && <p className="rooms-page__error">{error}</p>}

      <section>
        <h2 className="rooms-page__section-title">Live Rooms</h2>
        {rooms.length === 0 ? (
          <div className="home-empty">
            <div className="home-empty__art" aria-hidden="true">
              <span className="home-empty__bubble home-empty__bubble--a" />
              <span className="home-empty__bubble home-empty__bubble--b" />
              <span className="home-empty__icon">
                <Icon name="mic" size={26} />
              </span>
            </div>
            <h3 className="home-empty__title">No one is jazzing yet.</h3>
            <p className="home-empty__text">Start the first room and bring people in.</p>
            <Button
              leadingIcon={<Icon name="start" />}
              onClick={openStartSheet}
            >
              Start Jazzing
            </Button>
          </div>
        ) : (
          <div className="rooms-page__list">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} onJoin={handleJoin} />
            ))}
          </div>
        )}
      </section>

      <StartRoomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={handleRoomCreated}
      />
    </div>
  );
}
