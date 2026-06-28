import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  BottomSheet,
  Button,
  FloatingReaction,
  Input,
  LiveBadge,
  LoadingState,
  MicIconButton,
  OpenMicBadge,
} from "../../components";
import { useAuth } from "../../context/AuthContext";
import { audioStatusLabel, useAudioRoom } from "../../hooks/useAudioRoom";
import { useRoomSocket } from "../../hooks/useRoomSocket";
import {
  endRoom,
  extractRoomError,
  getRoom,
  getRoomMessages,
  joinRoom,
  leaveRoom,
  sendRoomMessage,
  sendRoomReaction,
  setMuted,
  updateRoom,
} from "../../services/rooms";
import RoomChatSheet from "./RoomChatSheet";
import "./rooms.css";

const MAX_MESSAGES = 50;
const REACTION_OPTIONS = [
  { type: "laugh", label: "Laugh", emoji: "😂" },
  { type: "clap", label: "Clap", emoji: "👏" },
  { type: "fire", label: "Fire", emoji: "🔥" },
  { type: "love", label: "Love", emoji: "❤️" },
  { type: "shock", label: "Shock", emoji: "😮" },
];

const REACTION_EMOJI = Object.fromEntries(
  REACTION_OPTIONS.map((option) => [option.type, option.emoji])
);

function upsertParticipant(participants, participant) {
  const list = participants ?? [];
  const idx = list.findIndex((p) => p.id === participant.id);
  if (idx === -1) return [...list, participant];
  const next = [...list];
  next[idx] = { ...next[idx], ...participant };
  return next;
}

function appendMessage(messages, message, max = MAX_MESSAGES) {
  if (messages.some((item) => item.id === message.id)) return messages;
  const next = [...messages, message];
  return next.length > max ? next.slice(-max) : next;
}

function applyRoomEvent(prev, event) {
  if (!prev) return prev;

  const { type, payload } = event;

  switch (type) {
    case "room.snapshot":
      return {
        ...prev,
        ...payload.room,
        participants: payload.participants,
        participant_count: payload.participant_count,
      };

    case "participant.joined": {
      const participants = upsertParticipant(prev.participants, payload.participant);
      return {
        ...prev,
        participants,
        participant_count: participants.length,
      };
    }

    case "participant.left": {
      const participants = (prev.participants ?? []).filter(
        (p) => p.id !== payload.user_id
      );
      return {
        ...prev,
        participants,
        participant_count: payload.participant_count ?? participants.length,
      };
    }

    case "participant.muted":
    case "participant.unmuted": {
      const participants = upsertParticipant(prev.participants, payload.participant);
      return { ...prev, participants };
    }

    case "room.updated":
      return {
        ...prev,
        ...payload.room,
        participants: payload.room.participants ?? prev.participants,
      };

    case "room.ended":
      return {
        ...prev,
        ...payload.room,
        status: "ended",
        ended_at: payload.ended_at ?? payload.room?.ended_at,
        participants: payload.room.participants ?? prev.participants,
      };

    default:
      return prev;
  }
}

export default function LiveRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [muteLoading, setMuteLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", category: "" });

  const [showChat, setShowChat] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [messages, setMessages] = useState([]);

  const [showReactions, setShowReactions] = useState(false);
  const [reactionSending, setReactionSending] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const seenReactionsRef = useRef(new Set());

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

  const addFloatingReaction = useCallback((reaction) => {
    const reactionId = reaction?.id;
    if (reactionId != null) {
      if (seenReactionsRef.current.has(reactionId)) return;
      seenReactionsRef.current.add(reactionId);
    }
    const key = reactionId ?? `local-${Date.now()}-${Math.random()}`;
    const emoji = REACTION_EMOJI[reaction.reaction_type] ?? "✨";
    const left = 20 + Math.random() * 60;
    setFloatingReactions((prev) => [...prev, { key, emoji, left }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((item) => item.key !== key));
      if (reactionId != null) seenReactionsRef.current.delete(reactionId);
    }, 2500);
  }, []);

  const handleSocketEvent = useCallback(
    (event) => {
      if (event.type === "chat.message") {
        setMessages((prev) => appendMessage(prev, event.payload.message));
        return;
      }
      if (event.type === "reaction.sent") {
        addFloatingReaction(event.payload.reaction);
        return;
      }
      setRoom((prev) => applyRoomEvent(prev, event));
    },
    [addFloatingReaction]
  );

  const isHost = room?.current_user_role === "host";
  const isParticipant = room?.current_user_is_participant;
  const isEnded = room?.status === "ended";
  const isLive = room?.status === "live";

  const currentParticipant = room?.participants?.find((p) => p.id === user?.id);
  const isMuted = currentParticipant?.is_muted ?? true;
  const socialDisabled = !isParticipant || isEnded;

  useRoomSocket(roomId, {
    enabled: Boolean(room && isParticipant && isLive),
    onEvent: handleSocketEvent,
  });

  const { status: audioStatus, provider: audioProvider } = useAudioRoom(roomId, {
    enabled: Boolean(room && isParticipant && isLive),
  });

  const audioLabel = audioStatusLabel(audioStatus, audioProvider);

  const loadChat = useCallback(async () => {
    setChatLoading(true);
    try {
      const data = await getRoomMessages(roomId);
      setMessages(data);
    } catch (err) {
      setError(extractRoomError(err));
    } finally {
      setChatLoading(false);
    }
  }, [roomId]);

  const handleOpenChat = () => {
    setShowChat(true);
    loadChat();
  };

  const handleSendMessage = async (body) => {
    setChatSending(true);
    setError("");
    try {
      const message = await sendRoomMessage(roomId, body);
      setMessages((prev) => appendMessage(prev, message));
    } catch (err) {
      setError(extractRoomError(err));
    } finally {
      setChatSending(false);
    }
  };

  const handleSendReaction = async (reactionType) => {
    if (socialDisabled || reactionSending) return;
    setReactionSending(true);
    setError("");
    try {
      const reaction = await sendRoomReaction(roomId, reactionType);
      addFloatingReaction(reaction);
      setShowReactions(false);
    } catch (err) {
      setError(extractRoomError(err));
    } finally {
      setReactionSending(false);
    }
  };

  const runAction = async (action) => {
    setActionLoading(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(extractRoomError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = () =>
    runAction(async () => {
      const data = await joinRoom(roomId);
      setRoom(data);
    });

  const handleLeave = () =>
    runAction(async () => {
      await leaveRoom(roomId);
      navigate("/rooms");
    });

  const handleEnd = () => runAction(() => endRoom(roomId));

  const handleToggleMute = async () => {
    if (!isParticipant || isEnded || muteLoading) return;
    setMuteLoading(true);
    setError("");
    try {
      await setMuted(roomId, !isMuted);
    } catch (err) {
      setError(extractRoomError(err));
    } finally {
      setMuteLoading(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await updateRoom(roomId, editForm);
      setShowEdit(false);
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

  const actionsDisabled = isEnded || actionLoading;

  return (
    <div className="live-room live-room--with-reactions">
      <div className="live-room__reactions-layer" aria-hidden="true">
        {floatingReactions.map((reaction) => (
          <FloatingReaction
            key={reaction.key}
            emoji={reaction.emoji}
            style={{ left: `${reaction.left}%` }}
          />
        ))}
      </div>

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

      {isParticipant && isLive && (
        <div className="live-room__audio-placeholder">
          <MicIconButton
            muted={isMuted}
            size="lg"
            disabled={muteLoading}
            onClick={handleToggleMute}
            statusText={isMuted ? "Tap to talk" : "You're live"}
          />
          <p className="live-room__audio-status">{audioLabel}</p>
          <p>{isMuted ? "Muted — tap the mic when you're ready." : "You're on mic (UI only for now)."}</p>
        </div>
      )}

      {isParticipant && (
        <div className="live-room__social">
          <Button
            variant="secondary"
            fullWidth
            disabled={socialDisabled}
            onClick={handleOpenChat}
          >
            Chat
          </Button>
          <Button
            variant="secondary"
            fullWidth
            disabled={socialDisabled}
            onClick={() => setShowReactions((open) => !open)}
          >
            React
          </Button>
        </div>
      )}

      {showReactions && isParticipant && !isEnded && (
        <div className="live-room__reaction-picker">
          {REACTION_OPTIONS.map((option) => (
            <button
              key={option.type}
              type="button"
              className="live-room__reaction-btn"
              disabled={reactionSending}
              aria-label={option.label}
              onClick={() => handleSendReaction(option.type)}
            >
              <span aria-hidden="true">{option.emoji}</span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="rooms-page__error">{error}</p>}

      <div className="live-room__actions">
        {isLive && !isParticipant && (
          <Button size="lg" fullWidth disabled={actionsDisabled} onClick={handleJoin}>
            Join room
          </Button>
        )}
        {isLive && isParticipant && !isHost && (
          <Button
            variant="secondary"
            fullWidth
            disabled={actionsDisabled}
            onClick={handleLeave}
          >
            Leave room
          </Button>
        )}
        {isLive && isHost && (
          <>
            <Button
              variant="secondary"
              fullWidth
              disabled={actionsDisabled}
              onClick={() => setShowEdit(true)}
            >
              Edit title & category
            </Button>
            <Button
              variant="danger"
              fullWidth
              disabled={actionsDisabled}
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

      <BottomSheet open={showChat} onClose={() => setShowChat(false)} title="Room chat">
        <RoomChatSheet
          messages={messages}
          loading={chatLoading}
          sending={chatSending}
          disabled={socialDisabled}
          onSend={handleSendMessage}
        />
      </BottomSheet>

      <BottomSheet
        open={showEdit && isLive}
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
