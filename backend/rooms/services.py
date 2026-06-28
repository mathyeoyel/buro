from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Room, RoomParticipant

DEFAULT_CATEGORY = "Random Jazz"
ROOM_FULL_MESSAGE = "Room is full."


def default_room_title(display_name: str) -> str:
    return f"{display_name}'s Jazz Room"


def active_participants(room):
    return room.participants.filter(left_at__isnull=True, is_removed=False)


def participant_count(room):
    return active_participants(room).count()


def get_active_participant(user, room):
    return RoomParticipant.objects.filter(
        room=room,
        user=user,
        left_at__isnull=True,
        is_removed=False,
    ).first()


def assert_can_interact_in_room(user, room):
    """User must be an active participant and the room must be live."""
    if not room.is_live:
        raise ValidationError({"detail": "This room has ended."})
    participant = get_active_participant(user, room)
    if not participant:
        raise PermissionDenied("You must be in the room.")
    return participant


def user_daily_room_count(user):
    today = timezone.now().date()
    return Room.objects.filter(host=user, created_at__date=today).count()


def user_has_live_hosted_room(user):
    return Room.objects.filter(host=user, status=Room.Status.LIVE).exists()


def assert_can_start_room(user):
    if not getattr(settings, "ROOM_CREATION_ENABLED", True):
        raise PermissionDenied("Room creation is currently disabled.")

    if user_has_live_hosted_room(user):
        raise ValidationError({"detail": "You already have a live room. End it before starting another."})

    limit = getattr(settings, "ROOM_MAX_PER_USER_PER_DAY", 5)
    if user_daily_room_count(user) >= limit:
        raise ValidationError({"detail": f"You can only start {limit} rooms per day."})


def start_room(user, title=None, category=None):
    assert_can_start_room(user)
    profile = user.profile
    room = Room.objects.create(
        host=user,
        title=(title or "").strip() or default_room_title(profile.display_name),
        category=(category or "").strip() or DEFAULT_CATEGORY,
        mode=Room.Mode.OPEN_MIC,
        status=Room.Status.LIVE,
        max_participants=getattr(settings, "ROOM_MAX_PARTICIPANTS", 30),
    )
    RoomParticipant.objects.create(
        room=room,
        user=user,
        role=RoomParticipant.Role.HOST,
        is_muted=True,
    )
    return room


def assert_can_join_room(user, room):
    if not room.is_live:
        raise ValidationError({"detail": "This room has ended."})

    if room.is_locked:
        raise PermissionDenied("This room is locked.")

    if participant_count(room) >= room.max_participants:
        raise ValidationError({"detail": ROOM_FULL_MESSAGE})

    existing = RoomParticipant.objects.filter(room=room, user=user).first()
    if existing and existing.is_removed:
        raise PermissionDenied("You were removed from this room.")

    if existing and existing.is_active:
        return existing  # idempotent join


def join_room(user, room):
    existing = RoomParticipant.objects.filter(room=room, user=user).first()

    if existing and existing.is_active:
        return existing, False

    assert_can_join_room(user, room)

    if existing:
        existing.left_at = None
        existing.is_removed = False
        existing.is_muted = True
        existing.role = RoomParticipant.Role.LISTENER
        existing.joined_at = timezone.now()
        existing.save(
            update_fields=["left_at", "is_removed", "is_muted", "role", "joined_at"]
        )
        return existing, True

    if participant_count(room) >= room.max_participants:
        raise ValidationError({"detail": ROOM_FULL_MESSAGE})

    participant = RoomParticipant.objects.create(
        room=room,
        user=user,
        role=RoomParticipant.Role.LISTENER,
        is_muted=True,
    )
    return participant, True


def set_participant_muted(user, room, muted: bool):
    participant = RoomParticipant.objects.filter(
        room=room, user=user, left_at__isnull=True, is_removed=False
    ).select_related("user__profile").first()
    if not participant:
        raise ValidationError({"detail": "You are not in this room."})
    if not room.is_live:
        raise ValidationError({"detail": "This room has ended."})

    participant.is_muted = muted
    participant.save(update_fields=["is_muted"])
    return participant


def finalize_room_end(room) -> bool:
    """Mark a live room as ended. Returns False if already ended."""
    room.refresh_from_db()
    if not room.is_live:
        return False

    room.status = Room.Status.ENDED
    room.ended_at = timezone.now()
    room.save(update_fields=["status", "ended_at", "updated_at"])
    active_participants(room).update(left_at=timezone.now())
    return True


def leave_room(user, room):
    participant = RoomParticipant.objects.filter(
        room=room, user=user, left_at__isnull=True, is_removed=False
    ).first()
    if not participant:
        raise ValidationError({"detail": "You are not in this room."})

    if participant.role == RoomParticipant.Role.HOST:
        end_room(user, room)
        return True

    participant.left_at = timezone.now()
    participant.save(update_fields=["left_at"])
    return False


def end_room(user, room):
    if room.host_id != user.id:
        raise PermissionDenied("Only the host can end this room.")

    if not room.is_live:
        raise ValidationError({"detail": "This room has already ended."})

    finalize_room_end(room)
    return room
