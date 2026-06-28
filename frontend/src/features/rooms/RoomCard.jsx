import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Button,
  Card,
  LiveBadge,
  OpenMicBadge,
} from "../../components";
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
        <span className="room-card__count">
          {room.participant_count} in the room
        </span>
      </div>

      <h3 className="room-card__title">{room.title}</h3>
      <p className="room-card__category">{room.category}</p>
      <p className="room-card__host">Hosted by {room.host?.display_name}</p>

      <div className="room-card__footer">
        <Avatar name={room.host?.display_name} src={room.host?.avatar_url || null} size="sm" />
        <Button size="sm" variant="secondary" onClick={handleJoin}>
          Join room
        </Button>
      </div>
    </Card>
  );
}
