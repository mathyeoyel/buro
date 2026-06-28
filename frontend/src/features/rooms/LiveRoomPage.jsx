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
  Modal,
  OpenMicBadge,
} from "../../components";
import { useAuth } from "../../context/AuthContext";
import { audioStatusLabel, canUseMicToggle, useAudioRoom } from "../../hooks/useAudioRoom";
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
import {
  REPORT_REASONS,
  blockUser,
  createReport,
  extractModerationError,
  removeUser,
} from "../../services/moderation";
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

    case "participant.left":
    case "participant.removed":
    case "participant.blocked": {
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
    case "moderation.room_ended":
      return {
        ...prev,
        ...(payload.room ?? {}),
        status: "ended",
        ended_at: payload.ended_at ?? payload.room?.ended_at,
        participants: payload.room?.participants ?? prev.participants,
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
  const leavingRef = useRef(false);

  const [moderationOutcome, setModerationOutcome] = useState(null);
  const [hostMenuUser, setHostMenuUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSending, setReportSending] = useState(false);

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

  const isHost = room?.current_user_role === "host";
  const isParticipant = room?.current_user_is_participant;
  const isEnded = room?.status === "ended";
  const isLive = room?.status === "live";

  const currentParticipant = room?.participants?.find((p) => p.id === user?.id);
  const isMuted = currentParticipant?.is_muted ?? true;
  const socialDisabled = !isParticipant || isEnded || Boolean(moderationOutcome);

  const {
    status: audioStatus,
    provider: audioProvider,
    disconnect: disconnectAudio,
    retryMic,
  } = useAudioRoom(roomId, {
    enabled: Boolean(room && isParticipant && isLive && !moderationOutcome),
    isMuted,
  });

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
      if (
        (event.type === "participant.removed" || event.type === "participant.blocked") &&
        event.payload.user_id === user?.id
      ) {
        setModerationOutcome(event.type === "participant.blocked" ? "blocked" : "removed");
        disconnectAudio();
      }
      if (event.type === "moderation.room_ended") {
        disconnectAudio();
      }
      setRoom((prev) => applyRoomEvent(prev, event));
    },
    [addFloatingReaction, disconnectAudio, user?.id]
  );

  useRoomSocket(roomId, {
    enabled: Boolean(room && isParticipant && isLive && !moderationOutcome),
    onEvent: handleSocketEvent,
  });

  const audioLabel = audioStatusLabel(audioStatus, audioProvider);
  const micEnabled = canUseMicToggle({
    isParticipant,
    isEnded: isEnded || Boolean(moderationOutcome),
    provider: audioProvider,
    status: audioStatus,
  });

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

  const handleLeave = async () => {
    if (leavingRef.current || actionLoading) return;
    leavingRef.current = true;
    setActionLoading(true);
    setError("");
    try {
      await disconnectAudio();
      await leaveRoom(roomId);
      navigate("/rooms");
    } catch (err) {
      setError(extractRoomError(err));
      leavingRef.current = false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnd = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setError("");
    try {
      await disconnectAudio();
      await endRoom(roomId);
    } catch (err) {
      setError(extractRoomError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleMute = async () => {
    if (!micEnabled || muteLoading) return;
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

  const runModerationAction = async (action, targetUserId) => {
    setActionLoading(true);
    setError("");
    try {
      if (action === "remove") await removeUser(roomId, targetUserId);
      if (action === "block") await blockUser(roomId, targetUserId);
      setConfirmAction(null);
      setHostMenuUser(null);
    } catch (err) {
      setError(extractModerationError(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setReportSending(true);
    setError("");
    try {
      await createReport({
        room: Number(roomId),
        reason: reportReason,
        details: reportDetails.trim(),
        ...(reportTarget ? { reported_user: reportTarget.id } : {}),
      });
      setShowReport(false);
      setReportDetails("");
    } catch (err) {
      setError(extractModerationError(err));
    } finally {
      setReportSending(false);
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

  if (moderationOutcome) {
    return (
      <div className="live-room">
        <div className="live-room__ended">
          {moderationOutcome === "blocked"
            ? "You cannot rejoin this room."
            : "You were removed from this room."}
        </div>
        <Button variant="secondary" fullWidth onClick={() => navigate("/rooms")}>
          Back to rooms
        </Button>
      </div>
    );
  }

  const actionsDisabled = isEnded || actionLoading || Boolean(moderationOutcome);

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
              {isHost && p.role !== "host" && isLive && (
                <button
                  type="button"
                  className="live-room__participant-menu"
                  aria-label={`Manage ${p.display_name}`}
                  onClick={() => setHostMenuUser(p)}
                >
                  ···
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      {isParticipant && isLive && (
        <div className="live-room__audio-placeholder">
          <MicIconButton
            muted={isMuted}
            size="lg"
            disabled={!micEnabled || muteLoading}
            onClick={handleToggleMute}
            statusText={isMuted ? "Tap to talk" : "You're live"}
          />
          <p className="live-room__audio-status">{audioLabel}</p>
          {audioStatus === "permission_denied" && (
            <button type="button" className="live-room__audio-retry" onClick={retryMic}>
              Retry mic
            </button>
          )}
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

      {isParticipant && isLive && (
        <div className="live-room__report-row">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setReportTarget(null);
              setShowReport(true);
            }}
          >
            Report room
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

      <BottomSheet
        open={Boolean(hostMenuUser)}
        onClose={() => setHostMenuUser(null)}
        title={hostMenuUser?.display_name}
      >
        <div className="live-room__host-actions">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setReportTarget(hostMenuUser);
              setShowReport(true);
              setHostMenuUser(null);
            }}
          >
            Report user
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setConfirmAction({ type: "remove", user: hostMenuUser });
              setHostMenuUser(null);
            }}
          >
            Remove
          </Button>
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              setConfirmAction({ type: "block", user: hostMenuUser });
              setHostMenuUser(null);
            }}
          >
            Block
          </Button>
        </div>
      </BottomSheet>

      <Modal
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.type === "block" ? "Block user?" : "Remove user?"}
        footer={
          <div className="live-room__modal-actions">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={actionLoading}
              onClick={() =>
                runModerationAction(confirmAction.type, confirmAction.user.id)
              }
            >
              {confirmAction?.type === "block" ? "Block" : "Remove"}
            </Button>
          </div>
        }
      />

      <Modal open={showReport} onClose={() => setShowReport(false)} title="Report">
        <form className="live-room__report-form" onSubmit={handleSubmitReport}>
          <label className="live-room__report-label">
            Reason
            <select
              className="live-room__report-select"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            >
              {REPORT_REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Details"
            name="details"
            value={reportDetails}
            onChange={(e) => setReportDetails(e.target.value)}
            hint="Optional."
          />
          <div className="live-room__modal-actions">
            <Button type="button" variant="secondary" onClick={() => setShowReport(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={reportSending}>
              Submit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
