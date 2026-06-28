from datetime import timedelta

from django.conf import settings
from django.db.models import Max
from django.utils import timezone

from .models import Room
from .services import active_participants, finalize_room_end, participant_count

ROOM_FULL_MESSAGE = "Room is full."


def get_expired_live_rooms():
    minutes = getattr(settings, "ROOM_MAX_DURATION_MINUTES", 60)
    cutoff = timezone.now() - timedelta(minutes=minutes)
    return Room.objects.filter(status=Room.Status.LIVE, started_at__lte=cutoff)


def get_empty_live_rooms():
    minutes = getattr(settings, "ROOM_AUTO_END_EMPTY_AFTER_MINUTES", 5)
    cutoff = timezone.now() - timedelta(minutes=minutes)
    candidates = []

    for room in Room.objects.filter(status=Room.Status.LIVE):
        if participant_count(room) > 0:
            continue

        last_left = room.participants.aggregate(latest=Max("left_at"))["latest"]
        empty_since = last_left or room.started_at
        if empty_since <= cutoff:
            candidates.append(room)

    return candidates


def cleanup_live_rooms():
    """
    End expired or empty live rooms. Safe to run repeatedly (idempotent).
    Returns count of rooms ended in this run.
    """
    from audio.services import end_audio_for_room

    seen_ids = set()
    ended_count = 0

    for room in list(get_expired_live_rooms()) + list(get_empty_live_rooms()):
        if room.id in seen_ids:
            continue
        seen_ids.add(room.id)

        if finalize_room_end(room):
            end_audio_for_room(room)
            ended_count += 1

    return ended_count
