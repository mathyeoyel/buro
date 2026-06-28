import { useEffect, useRef, useState } from "react";
import { Avatar, BottomSheet, Button } from "../../components";
import { useAuth } from "../../context/AuthContext";
import { extractRoomError, startRoom } from "../../services/rooms";
import "./rooms.css";

/**
 * Pre-start sheet — compact social-style layout.
 * Blank fields use backend defaults: "{display_name}'s Jazz Room" and "Random Jazz".
 */
const DEFAULT_CATEGORY = "Random Jazz";

export default function StartRoomSheet({ open, onClose, onCreated }) {
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [titleOpen, setTitleOpen] = useState(false);
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const titleRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setTitleOpen(false);
      setCategory(DEFAULT_CATEGORY);
      setCategoryOpen(false);
      setError("");
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (titleOpen && titleRef.current) {
      titleRef.current.focus();
    }
  }, [titleOpen]);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    try {
      const payload = {};
      const trimmedTitle = title.trim();
      const trimmedCategory = category.trim();
      if (trimmedTitle) payload.title = trimmedTitle;
      if (categoryOpen && trimmedCategory) payload.category = trimmedCategory;

      const room = await startRoom(payload);
      onCreated(room);
      onClose();
    } catch (err) {
      setError(extractRoomError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={handleClose} title="Start a Buro">
      <form className="start-room-sheet__form" onSubmit={handleSubmit}>
        {error && <p className="rooms-page__error">{error}</p>}

        <div className="start-room-sheet__row">
          <Avatar
            name={profile?.display_name}
            src={profile?.avatar_url || null}
            size="md"
          />

          <div className="start-room-sheet__center">
            {titleOpen ? (
              <input
                ref={titleRef}
                className="start-room-sheet__title-input"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are we jazzing about?"
                disabled={loading}
                aria-label="Room title"
              />
            ) : (
              <button
                type="button"
                className="start-room-sheet__title-prompt"
                onClick={() => setTitleOpen(true)}
                disabled={loading}
              >
                {title || "Add a title"}
              </button>
            )}
          </div>

          {!categoryOpen && (
            <button
              type="button"
              className="start-room-sheet__category-add-btn"
              onClick={() => setCategoryOpen(true)}
              disabled={loading}
            >
              <span>Category</span>
              <span className="start-room-sheet__plus" aria-hidden="true">
                +
              </span>
            </button>
          )}
        </div>

        {categoryOpen && (
          <input
            className="start-room-sheet__category-input"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={DEFAULT_CATEGORY}
            disabled={loading}
            aria-label="Category"
          />
        )}

        <div className="start-room-sheet__actions">
          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? "Starting Buro…" : "Start a Buro"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            disabled={loading}
            onClick={handleClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
