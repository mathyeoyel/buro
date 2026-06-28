import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BuroLogo,
  Button,
  EmptyState,
  LoadingState,
} from "../../components";
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
      <div className="rooms-page__header">
        <BuroLogo size="md" showTagline />
        <h1 className="rooms-page__heading">Who is jazzing now?</h1>
        <p className="rooms-page__subtitle">Start or join a live room.</p>
        <Button
          size="lg"
          fullWidth
          leadingIcon={<span aria-hidden="true">🎷</span>}
          onClick={openStartSheet}
        >
          Start Jazzing
        </Button>
      </div>

      {error && <p className="rooms-page__error">{error}</p>}

      <section>
        <h2 className="rooms-page__section-title">Live now</h2>
        {rooms.length === 0 ? (
          <EmptyState
            icon="🎷"
            title="No one is jazzing yet."
            description=""
            action={<Button onClick={openStartSheet}>Start Jazzing</Button>}
          />
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
