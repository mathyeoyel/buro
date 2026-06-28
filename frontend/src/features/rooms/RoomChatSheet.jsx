import { useEffect, useRef, useState } from "react";
import { Avatar, Button, EmptyState, LoadingState } from "../../components";
import "./rooms.css";

export default function RoomChatSheet({
  messages,
  loading,
  sending,
  disabled,
  onSend,
}) {
  const [body, setBody] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || disabled || sending) return;
    await onSend(trimmed);
    setBody("");
  };

  return (
    <div className="room-chat">
      <div className="room-chat__list" ref={listRef}>
        {loading ? (
          <LoadingState label="Loading chat…" />
        ) : messages.length === 0 ? (
          <EmptyState title="No messages yet." description="" />
        ) : (
          messages.map((message) => (
            <div key={message.id} className="room-chat__message">
              <Avatar
                name={message.sender?.display_name}
                src={message.sender?.avatar_url || null}
                size="sm"
              />
              <div className="room-chat__bubble">
                <span className="room-chat__sender">{message.sender?.display_name}</span>
                <p className="room-chat__body">{message.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form className="room-chat__composer" onSubmit={handleSubmit}>
        <input
          type="text"
          className="room-chat__input"
          placeholder="Say something..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={disabled || sending}
          maxLength={280}
        />
        <Button type="submit" size="sm" disabled={disabled || sending || !body.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
