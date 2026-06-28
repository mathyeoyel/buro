from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from rooms.models import RoomParticipant

from .models import RoomBlock, UserModeration

SUSPENSION_MESSAGE = "Your account cannot use this action right now."
REMOVED_MESSAGE = "You were removed from this room."
BLOCKED_MESSAGE = "You cannot rejoin this room."


def is_user_suspended(user) -> bool:
    moderation = UserModeration.objects.filter(user=user).first()
    return bool(moderation and moderation.is_suspended)


def assert_not_suspended(user) -> None:
    if is_user_suspended(user):
        raise PermissionDenied(SUSPENSION_MESSAGE)


def is_user_blocked_from_room(user, room) -> bool:
    return RoomBlock.objects.filter(room=room, blocked_user=user).exists()


def assert_not_blocked_from_room(user, room) -> None:
    if is_user_blocked_from_room(user, room):
        raise PermissionDenied(BLOCKED_MESSAGE)


def assert_host_can_moderate(host, room, target_user_id: int) -> None:
    if room.host_id != host.id:
        raise PermissionDenied("Only the host can do this.")
    if target_user_id == host.id:
        raise ValidationError({"detail": "Host cannot moderate themselves."})


def _mark_participant_removed(room, target_user_id):
    participant = RoomParticipant.objects.filter(
        room=room,
        user_id=target_user_id,
        left_at__isnull=True,
        is_removed=False,
    ).first()
    if not participant:
        return None

    participant.is_removed = True
    participant.left_at = timezone.now()
    participant.save(update_fields=["is_removed", "left_at"])
    return participant


def remove_user_from_room(host, room, target_user_id: int, reason: str = ""):
    assert_host_can_moderate(host, room, target_user_id)
    participant = _mark_participant_removed(room, target_user_id)
    if not participant:
        raise ValidationError({"detail": "User is not in this room."})
    return participant


def block_user_from_room(host, room, target_user_id: int, reason: str = ""):
    assert_host_can_moderate(host, room, target_user_id)
    RoomBlock.objects.update_or_create(
        room=room,
        blocked_user_id=target_user_id,
        defaults={"blocked_by": host, "reason": (reason or "").strip()},
    )
    participant = _mark_participant_removed(room, target_user_id)
    return participant


def suspend_user(target_user, reason: str = ""):
    moderation, _created = UserModeration.objects.get_or_create(user=target_user)
    moderation.is_suspended = True
    moderation.suspended_at = timezone.now()
    moderation.suspension_reason = (reason or "").strip()
    moderation.save(
        update_fields=["is_suspended", "suspended_at", "suspension_reason"]
    )
    return moderation


def unsuspend_user(target_user):
    moderation, _created = UserModeration.objects.get_or_create(user=target_user)
    moderation.is_suspended = False
    moderation.suspended_at = None
    moderation.suspension_reason = ""
    moderation.save(
        update_fields=["is_suspended", "suspended_at", "suspension_reason"]
    )
    return moderation
