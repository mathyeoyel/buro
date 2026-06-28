import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  BottomSheet,
  Button,
  Input,
  LiveBadge,
  LoadingState,
  MicIconButton,
  OpenMicBadge,
} from "../../components";
import {
  endRoom,
  extractRoomError,
  getRoom,
  joinRoom,
  leaveRoom,
  updateRoom,
} from "../../services/rooms";
import "./rooms.css";

export default function LiveRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", category: "" });

  const loadRoom = useCallback(async () => {
    setError("");
    try {
      const data = await getRoom(roomId);
      setRoom(data);
      setEditForm({ title: data.title, category: data.category });
    } catch (err) {
      setError(extractRoomError(err));
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  const isHost = room?.current_user_role === "host";
  const isParticipant = room?.current_user_is_participant;
  const isEnded = room?.status === "ended";
  const isLive = room?.status === "live";

  const runAction = async (action) => {
    setActionLoading(true);
    setError("");
    try {
      await action();
      await loadRoom();
    } catch (err) {
      setError(extractRoomError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = () => runAction(() => joinRoom(roomId));
  const handleLeave = () =>
    runAction(async () => {
      await leaveRoom(roomId);
      navigate("/rooms");
    });
  const handleEnd = () =>
    runAction(async () => {
      await endRoom(roomId);
    });

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await updateRoom(roomId, editForm);
      setShowEdit(false);
      await loadRoom();
    } catch (err) {
      setError(extractRoomError(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingState label="Tuning into the room…" />;
  }

  if (!room && error) {
    return (
      <div className="live-room">
        <p className="rooms-page__error">{error}</p>
        <Button variant="secondary" onClick={() => navigate("/rooms")}>
          Back to rooms
        </Button>
      </div>
    );
  }

  return (
    <div className="live-room">
      <div className="live-room__header">
        <h1 className="live-room__title">{room.title}</h1>
        <div className="live-room__meta">
          {isLive && <LiveBadge />}
          <OpenMicBadge />
          <span>{room.category}</span>
          <span>{room.participant_count} in the room</span>
        </div>
      </div>

      {isEnded && (
        <div className="live-room__ended">
          This room has ended. Thanks for jazzing.
        </div>
      )}

      <div className="live-room__host">
        <Avatar
          name={room.host?.display_name}
          src={room.host?.avatar_url || null}
          size="md"
        />
        <div>
          <strong>{room.host?.display_name}</strong>
          <p className="live-room__meta">Host</p>
        </div>
      </div>

      {room.participants && room.participants.length > 0 && (
        <section className="live-room__participants">
          <h2 className="rooms-page__section-title">In the room</h2>
          {room.participants.map((p) => (
            <div key={p.id} className="live-room__participant">
              <Avatar name={p.display_name} src={p.avatar_url || null} size="sm" />
              <span className="live-room__participant-name">{p.display_name}</span>
              <span className="live-room__participant-role">
                {p.role === "host" ? "Host" : p.is_muted ? "Muted" : "Live"}
              </span>
            </div>
          ))}
        </section>
      )}

      <div className="live-room__audio-placeholder">
        <MicIconButton muted size="lg" />
        <p>Audio comes next. For now, enjoy the room vibe.</p>
      </div>

      {error && <p className="rooms-page__error">{error}</p>}

      <div className="live-room__actions">
        {isLive && !isParticipant && (
          <Button size="lg" fullWidth disabled={actionLoading} onClick={handleJoin}>
            Join room
          </Button>
        )}
        {isLive && isParticipant && !isHost && (
          <Button
            variant="secondary"
            fullWidth
            disabled={actionLoading}
            onClick={handleLeave}
          >
            Leave room
          </Button>
        )}
        {isLive && isHost && (
          <>
            <Button variant="secondary" fullWidth onClick={() => setShowEdit(true)}>
              Edit title & category
            </Button>
            <Button
              variant="danger"
              fullWidth
              disabled={actionLoading}
              onClick={handleEnd}
            >
              End room
            </Button>
          </>
        )}
        <Button variant="ghost" fullWidth onClick={() => navigate("/rooms")}>
          Back to rooms
        </Button>
      </div>

      <BottomSheet
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit room"
      >
        <form className="live-room__edit-form" onSubmit={handleSaveEdit}>
          <Input
            label="Title"
            name="title"
            value={editForm.title}
            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
            hint="Optional — your defaults work fine."
          />
          <Input
            label="Category"
            name="category"
            value={editForm.category}
            onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
            hint="Optional — Random Jazz is the default."
          />
          <Button type="submit" fullWidth disabled={actionLoading}>
            Save
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
}
