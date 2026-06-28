"""Broadcast room events to WebSocket groups."""

import uuid
from datetime import datetime, timezone

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .serializers import ParticipantSerializer, RoomSerializer


def room_group_name(room_id: int) -> str:
    return f"room_{room_id}"


def _envelope(room_id: int, event_type: str, payload: dict) -> dict:
    return {
        "type": event_type,
        "event_id": f"evt_{uuid.uuid4().hex[:12]}",
        "room_id": room_id,
        "sent_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "payload": payload,
    }


def broadcast_room_event(room_id: int, event_type: str, payload: dict) -> None:
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(
        room_group_name(room_id),
        {
            "type": "room.event",
            "message": _envelope(room_id, event_type, payload),
        },
    )


def participant_payload(participant) -> dict:
    return ParticipantSerializer(participant).data


def room_payload(room, request=None) -> dict:
    context = {"include_participants": True}
    if request:
        context["request"] = request
    return RoomSerializer(room, context=context).data


def broadcast_participant_joined(room_id, participant):
    broadcast_room_event(
        room_id,
        "participant.joined",
        {"participant": participant_payload(participant)},
    )


def broadcast_participant_left(room_id, user_id, participant_count):
    broadcast_room_event(
        room_id,
        "participant.left",
        {"user_id": user_id, "participant_count": participant_count},
    )


def broadcast_participant_muted(room_id, participant):
    broadcast_room_event(
        room_id,
        "participant.muted",
        {"participant": participant_payload(participant)},
    )


def broadcast_participant_unmuted(room_id, participant):
    broadcast_room_event(
        room_id,
        "participant.unmuted",
        {"participant": participant_payload(participant)},
    )


def broadcast_room_updated(room_id, room, request=None):
    broadcast_room_event(
        room_id,
        "room.updated",
        {"room": room_payload(room, request=request)},
    )


def broadcast_room_ended(room_id, room, request=None):
    broadcast_room_event(
        room_id,
        "room.ended",
        {
            "room": room_payload(room, request=request),
            "ended_at": room.ended_at.isoformat().replace("+00:00", "Z") if room.ended_at else None,
        },
    )


def broadcast_chat_message(room_id, message_data):
    broadcast_room_event(room_id, "chat.message", {"message": message_data})


def broadcast_reaction_sent(room_id, reaction_data):
    broadcast_room_event(room_id, "reaction.sent", {"reaction": reaction_data})
