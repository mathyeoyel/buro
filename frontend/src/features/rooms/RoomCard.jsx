import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Button,
  Card,
  Icon,
  LiveBadge,
  OpenMicBadge,
} from "../../components";
import HomeAvatarStack from "./HomeAvatarStack";
import "./rooms.css";

export default function RoomCard({ room, onJoin }) {
  const navigate = useNavigate();

  const handleJoin = () => {
    if (onJoin) {
      onJoin(room.id);
    } else {
      navigate(`/rooms/${room.id}`);
    }
  };

  return (
    <Card variant="elevated" className="room-card">
      <div className="room-card__top">
        <div className="room-card__badges">
          <LiveBadge />
          <OpenMicBadge />
        </div>
      </div>

      <div className="room-card__head">
        <Avatar name={room.host?.display_name} profile={room.host} size="md" />
        <div className="room-card__heading">
          <h3 className="room-card__title">{room.title}</h3>
          <p className="room-card__category">{room.category}</p>
        </div>
      </div>

      <p className="room-card__host">Hosted by {room.host?.display_name}</p>

      <div className="room-card__footer">
        <HomeAvatarStack host={room.host} count={room.participant_count} />
        <Button
          size="sm"
          leadingIcon={<Icon name="rooms" size={16} />}
          onClick={handleJoin}
        >
          Join Room
        </Button>
      </div>
    </Card>
  );
}
