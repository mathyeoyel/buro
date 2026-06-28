from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Room, RoomParticipant

DEFAULT_CATEGORY = "Random Jazz"


def default_room_title(display_name: str) -> str:
    return f"{display_name}'s Jazz Room"


def active_participants(room):
    return room.participants.filter(left_at__isnull=True, is_removed=False)


def participant_count(room):
    return active_participants(room).count()


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
        raise ValidationError({"detail": "This room is full."})

    existing = RoomParticipant.objects.filter(room=room, user=user).first()
    if existing and existing.is_removed:
        raise PermissionDenied("You were removed from this room.")

    if existing and existing.is_active:
        return existing  # idempotent join


def join_room(user, room):
    existing = RoomParticipant.objects.filter(room=room, user=user).first()

    if existing and existing.is_active:
        return existing

    assert_can_join_room(user, room)

    if existing:
        # Rejoin: reactivate prior participant row (documented choice).
        existing.left_at = None
        existing.is_removed = False
        existing.is_muted = True
        existing.role = RoomParticipant.Role.LISTENER
        existing.joined_at = timezone.now()
        existing.save(
            update_fields=["left_at", "is_removed", "is_muted", "role", "joined_at"]
        )
        return existing

    if participant_count(room) >= room.max_participants:
        raise ValidationError({"detail": "This room is full."})

    return RoomParticipant.objects.create(
        room=room,
        user=user,
        role=RoomParticipant.Role.LISTENER,
        is_muted=True,
    )


def leave_room(user, room):
    participant = RoomParticipant.objects.filter(
        room=room, user=user, left_at__isnull=True, is_removed=False
    ).first()
    if not participant:
        raise ValidationError({"detail": "You are not in this room."})

    if participant.role == RoomParticipant.Role.HOST:
        raise ValidationError({"detail": "Host cannot leave. End the room instead."})

    participant.left_at = timezone.now()
    participant.save(update_fields=["left_at"])
    return participant


def end_room(user, room):
    if room.host_id != user.id:
        raise PermissionDenied("Only the host can end this room.")

    if not room.is_live:
        raise ValidationError({"detail": "This room has already ended."})

    room.status = Room.Status.ENDED
    room.ended_at = timezone.now()
    room.save(update_fields=["status", "ended_at", "updated_at"])

    active_participants(room).update(left_at=timezone.now())
    return room
