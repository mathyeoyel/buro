from rest_framework.exceptions import ValidationError

from rooms.services import assert_can_interact_in_room

from .models import RoomMessage
from .serializers import MAX_MESSAGE_LENGTH

MESSAGE_LIST_LIMIT = 50


def list_room_messages(user, room):
    assert_can_interact_in_room(user, room)
    return (
        RoomMessage.objects.filter(room=room, is_deleted=False)
        .select_related("sender__profile")
        .order_by("-created_at")[:MESSAGE_LIST_LIMIT][::-1]
    )


def create_room_message(user, room, body: str):
    assert_can_interact_in_room(user, room)
    body = (body or "").strip()
    if not body:
        raise ValidationError({"body": "Message cannot be empty."})
    if len(body) > MAX_MESSAGE_LENGTH:
        raise ValidationError(
            {"body": f"Message cannot exceed {MAX_MESSAGE_LENGTH} characters."}
        )
    return RoomMessage.objects.create(room=room, sender=user, body=body)
