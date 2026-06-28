import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, LoadingState } from "../../components";
import {
  adminEndRoom,
  adminSuspendUser,
  adminUnsuspendUser,
  getAdminLiveRooms,
} from "../../services/admin";
import "./admin.css";

export default function AdminLiveRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userIdInput, setUserIdInput] = useState("");

  const load = async () => {
    setError("");
    try {
      setRooms(await getAdminLiveRooms());
    } catch {
      setError("Could not load live rooms.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleEnd = async (roomId) => {
    try {
      await adminEndRoom(roomId);
      await load();
    } catch {
      setError("Could not end room.");
    }
  };

  const handleSuspend = async () => {
    if (!userIdInput) return;
    try {
      await adminSuspendUser(Number(userIdInput));
      setUserIdInput("");
    } catch {
      setError("Suspend failed.");
    }
  };

  const handleUnsuspend = async () => {
    if (!userIdInput) return;
    try {
      await adminUnsuspendUser(Number(userIdInput));
      setUserIdInput("");
    } catch {
      setError("Unsuspend failed.");
    }
  };

  if (loading) return <LoadingState label="Loading live rooms…" />;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Live rooms</h1>
        <Link to="/admin/reports" className="admin-page__link">
          Reports
        </Link>
      </div>

      {error && <p className="rooms-page__error">{error}</p>}

      <section className="admin-card">
        <h2 className="admin-card__subtitle">User moderation</h2>
        <input
          className="admin-page__input"
          placeholder="User ID"
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
        />
        <div className="admin-card__actions">
          <Button size="sm" variant="danger" onClick={handleSuspend}>
            Suspend
          </Button>
          <Button size="sm" variant="secondary" onClick={handleUnsuspend}>
            Unsuspend
          </Button>
        </div>
      </section>

      {rooms.length === 0 ? (
        <p className="admin-page__empty">No live rooms.</p>
      ) : (
        <div className="admin-page__list">
          {rooms.map((room) => (
            <div key={room.id} className="admin-card">
              <strong>{room.title}</strong>
              <p className="admin-card__meta">
                Host: {room.host?.display_name} · {room.participant_count} in room
              </p>
              <Button size="sm" variant="danger" onClick={() => handleEnd(room.id)}>
                End room
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
