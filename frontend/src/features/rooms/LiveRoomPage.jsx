import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Badge,
  BottomSheet,
  Button,
  FloatingReaction,
  Icon,
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

function isAlreadyEndedError(error) {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;
  return (
    status === 400 &&
    typeof detail === "string" &&
    detail.toLowerCase().includes("already ended")
  );
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
  const [isEndingRoom, setIsEndingRoom] = useState(false);
  const [muteLoading, setMuteLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", category: "" });

  const [showChat, setShowChat] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [messages, setMessages] = useState([]);

  const [reactionSending, setReactionSending] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const seenReactionsRef = useRef(new Set());
  const [floatingMessages, setFloatingMessages] = useState([]);
  const seenChatRef = useRef(new Set());
  const chatTimersRef = useRef([]);
  const showChatRef = useRef(false);
  const previewsBlockedRef = useRef(false);
  const leavingRef = useRef(false);

  const [moderationOutcome, setModerationOutcome] = useState(null);
  const [hostMenuUser, setHostMenuUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [showRoomMenu, setShowRoomMenu] = useState(false);
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

  const addFloatingMessage = useCallback((message) => {
    if (!message) return;
    // Suppress while the chat sheet is open (avoids duplicate display) and in
    // ended/removed/blocked states.
    if (showChatRef.current || previewsBlockedRef.current) return;

    const messageId = message.id;
    if (messageId != null) {
      if (seenChatRef.current.has(messageId)) return;
      seenChatRef.current.add(messageId);
    }
    const key = messageId ?? `local-${Date.now()}-${Math.random()}`;
    const name = message.sender?.display_name ?? "Someone";
    const body = message.body ?? "";
    const left = 22 + Math.random() * 50;
    const drift = Math.round(Math.random() * 28 - 14);
    setFloatingMessages((prev) => {
      const next = [...prev, { key, name, body, left, drift }];
      return next.length > 3 ? next.slice(-3) : next;
    });
    const timer = setTimeout(() => {
      setFloatingMessages((prev) => prev.filter((item) => item.key !== key));
      if (messageId != null) seenChatRef.current.delete(messageId);
    }, 3600);
    chatTimersRef.current.push(timer);
  }, []);

  const isHost = room?.current_user_role === "host";
  const isParticipant = room?.current_user_is_participant;
  const isEnded = room?.status === "ended";
  const isLive = room?.status === "live";

  const currentParticipant = room?.participants?.find((p) => p.id === user?.id);
  const isMuted = currentParticipant?.is_muted ?? true;
  const socialDisabled = !isParticipant || isEnded || Boolean(moderationOutcome);

  showChatRef.current = showChat;
  previewsBlockedRef.current = isEnded || Boolean(moderationOutcome);

  useEffect(() => {
    if (isEnded || moderationOutcome) {
      chatTimersRef.current.forEach(clearTimeout);
      chatTimersRef.current = [];
      seenChatRef.current.clear();
      setFloatingMessages([]);
    }
  }, [isEnded, moderationOutcome]);

  useEffect(
    () => () => {
      chatTimersRef.current.forEach(clearTimeout);
      chatTimersRef.current = [];
    },
    []
  );

  const {
    status: audioStatus,
    provider: audioProvider,
    disconnect: disconnectAudio,
    retryMic,
    remotePlaybackBlocked,
    enableAudio,
  } = useAudioRoom(roomId, {
    enabled: Boolean(room && isParticipant && isLive && !moderationOutcome),
    isMuted,
  });

  const handleSocketEvent = useCallback(
    (event) => {
      if (event.type === "chat.message") {
        setMessages((prev) => appendMessage(prev, event.payload.message));
        addFloatingMessage(event.payload.message);
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
      if (event.type === "room.ended" || event.type === "moderation.room_ended") {
        // Room is over: drop audio. The socket stops reconnecting once the
        // room state flips to "ended" below (enabled becomes false).
        disconnectAudio();
      }
      setRoom((prev) => applyRoomEvent(prev, event));
    },
    [addFloatingReaction, addFloatingMessage, disconnectAudio, user?.id]
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

  const markRoomEnded = useCallback((endedRoom) => {
    setRoom((prev) => {
      if (!prev) return endedRoom ?? prev;
      return { ...prev, ...(endedRoom ?? {}), status: "ended" };
    });
  }, []);

  const handleEnd = async () => {
    if (isEndingRoom || leavingRef.current) return;
    setIsEndingRoom(true);
    leavingRef.current = true;
    setError("");
    try {
      await disconnectAudio();
      const endedRoom = await endRoom(roomId);
      markRoomEnded(endedRoom);
    } catch (err) {
      // Backend is idempotent, but treat a stale "already ended" response as
      // success rather than a scary error banner.
      if (isAlreadyEndedError(err)) {
        markRoomEnded(null);
      } else {
        setError(extractRoomError(err));
        leavingRef.current = false;
      }
    } finally {
      setIsEndingRoom(false);
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
        <div className="live-room__state">
          <span className="live-room__state-icon live-room__state-icon--danger">
            <Icon name="block" size={26} />
          </span>
          <p className="live-room__state-text">{error}</p>
          <Button
            variant="secondary"
            leadingIcon={<Icon name="back" size={18} />}
            onClick={() => navigate("/rooms")}
          >
            Back to rooms
          </Button>
        </div>
      </div>
    );
  }

  if (moderationOutcome) {
    return (
      <div className="live-room">
        <div className="live-room__state">
          <span className="live-room__state-icon live-room__state-icon--danger">
            <Icon name={moderationOutcome === "blocked" ? "block" : "leave"} size={26} />
          </span>
          <p className="live-room__state-text">
            {moderationOutcome === "blocked"
              ? "You cannot rejoin this room."
              : "You were removed from this room."}
          </p>
          <Button
            variant="secondary"
            fullWidth
            leadingIcon={<Icon name="back" size={18} />}
            onClick={() => navigate("/rooms")}
          >
            Back to rooms
          </Button>
        </div>
      </div>
    );
  }

  const actionsDisabled =
    isEnded || actionLoading || isEndingRoom || Boolean(moderationOutcome);

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

      <div className="live-room__actionbar">
        <button
          type="button"
          className="live-room__icon-btn"
          aria-label="Back to rooms"
          onClick={() => navigate("/rooms")}
        >
          <Icon name="back" size={20} />
        </button>
        <div className="live-room__actionbar-right">
          {isLive && isParticipant && !isHost && (
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<Icon name="leave" size={16} />}
              disabled={actionsDisabled}
              onClick={handleLeave}
            >
              Leave
            </Button>
          )}
          {isLive && isHost && (
            <Button
              variant="danger"
              size="sm"
              leadingIcon={<Icon name="end" size={16} />}
              disabled={actionsDisabled}
              onClick={handleEnd}
            >
              {isEndingRoom ? "Ending…" : "End"}
            </Button>
          )}
          {isParticipant && isLive && (
            <button
              type="button"
              className="live-room__icon-btn"
              aria-label="Room options"
              onClick={() => setShowRoomMenu(true)}
            >
              <Icon name="more" size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="live-room__header">
        <div className="live-room__title-row">
          <h1 className="live-room__title">{room.title}</h1>
          {isHost && isLive && (
            <button
              type="button"
              className="live-room__title-edit"
              aria-label="Edit title & category"
              disabled={actionsDisabled}
              onClick={() => setShowEdit(true)}
            >
              <Icon name="edit" size={18} />
            </button>
          )}
        </div>
        <div className="live-room__meta">
          {isLive && <LiveBadge />}
          <OpenMicBadge />
          <span className="live-room__chip">{room.category}</span>
          <span className="live-room__chip">
            {room.participant_count} {room.participant_count === 1 ? "person" : "people"}
          </span>
        </div>
      </div>

      {isEnded && (
        <div className="live-room__ended">
          <span className="live-room__state-icon">
            <Icon name="end" size={20} />
          </span>
          This room has ended.
        </div>
      )}

      <div className="live-room__host">
        <Avatar
          name={room.host?.display_name}
          profile={room.host}
          size="md"
        />
        <div className="live-room__host-info">
          <strong>{room.host?.display_name}</strong>
          <span className="live-room__host-sub">Started this Buro</span>
        </div>
        <Badge tone="orange">Host</Badge>
      </div>

      {room.participants && room.participants.length > 0 && (
        <section className="live-room__participants">
          <h2 className="rooms-page__section-title">In the room</h2>
          <div className="live-room__people">
            {room.participants.map((p) => {
              const canManage = isHost && p.role !== "host" && isLive;
              return (
                <div key={p.id} className="live-room__person">
                  <div className="live-room__person-avatar">
                    <Avatar name={p.display_name} profile={p} size="md" />
                    <span
                      className={`live-room__person-status live-room__person-status--${
                        p.is_muted ? "muted" : "live"
                      }`}
                      aria-hidden="true"
                    >
                      <Icon name={p.is_muted ? "micOff" : "mic"} size={12} strokeWidth={2.4} />
                    </span>
                    {canManage && (
                      <button
                        type="button"
                        className="live-room__person-menu"
                        aria-label={`Manage ${p.display_name}`}
                        onClick={() => setHostMenuUser(p)}
                      >
                        <Icon name="more" size={14} />
                      </button>
                    )}
                  </div>
                  <span className="live-room__person-name">{p.display_name}</span>
                  {p.role === "host" && (
                    <span className="live-room__person-host">Host</span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {floatingMessages.length > 0 && (
        <div className="live-room__chat-layer" aria-hidden="true">
          {floatingMessages.map((message) => (
            <div
              key={message.key}
              className="live-room__chat-preview"
              style={{ left: `${message.left}%`, "--chat-drift": `${message.drift}px` }}
            >
              <strong className="live-room__chat-preview-name">{message.name}</strong>
              <span className="live-room__chat-preview-body">{message.body}</span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="rooms-page__error">{error}</p>}

      {isLive && !isParticipant && (
        <div className="live-room__actions">
          <Button size="lg" fullWidth disabled={actionsDisabled} onClick={handleJoin}>
            Join room
          </Button>
        </div>
      )}

      {isParticipant && isLive && (
        <div className="live-room__dock">
          <button
            type="button"
            className="live-room__dock-action"
            disabled={socialDisabled}
            onClick={handleOpenChat}
          >
            <span className="live-room__dock-icon">
              <Icon name="chat" size={22} />
            </span>
            <span className="live-room__dock-label">Chat</span>
          </button>

          <div className="live-room__dock-mic">
            <MicIconButton
              muted={isMuted}
              size="lg"
              disabled={!micEnabled || muteLoading}
              onClick={handleToggleMute}
              statusText={isMuted ? "Tap to talk" : "You're live"}
            />
            <span className="live-room__dock-status">{audioLabel}</span>
            {audioStatus === "permission_denied" && (
              <button type="button" className="live-room__audio-retry" onClick={retryMic}>
                Allow mic
              </button>
            )}
            {remotePlaybackBlocked && (
              <button type="button" className="live-room__audio-retry" onClick={enableAudio}>
                Tap to enable audio
              </button>
            )}
          </div>

          <div
            className="live-room__dock-reactions"
            role="group"
            aria-label="Send a reaction"
          >
            {REACTION_OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                className="live-room__dock-reaction"
                disabled={socialDisabled || reactionSending}
                aria-label={option.label}
                onClick={() => handleSendReaction(option.type)}
              >
                <span aria-hidden="true">{option.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <BottomSheet
        open={showRoomMenu}
        onClose={() => setShowRoomMenu(false)}
        title="Room options"
      >
        <div className="live-room__host-actions">
          <Button
            variant="secondary"
            fullWidth
            leadingIcon={<Icon name="report" size={18} />}
            onClick={() => {
              setReportTarget(null);
              setShowReport(true);
              setShowRoomMenu(false);
            }}
          >
            Report room
          </Button>
        </div>
      </BottomSheet>

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
            leadingIcon={<Icon name="report" size={18} />}
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
            leadingIcon={<Icon name="remove" size={18} />}
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
            leadingIcon={<Icon name="block" size={18} />}
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
