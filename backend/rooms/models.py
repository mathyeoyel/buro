from django.conf import settings
from django.db import models
from django.utils import timezone


class Room(models.Model):
    class Status(models.TextChoices):
        LIVE = "live", "Live"
        ENDED = "ended", "Ended"

    class Mode(models.TextChoices):
        OPEN_MIC = "open_mic", "Open Mic"

    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hosted_rooms",
    )
    title = models.CharField(max_length=120)
    category = models.CharField(max_length=60)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.LIVE,
    )
    mode = models.CharField(
        max_length=20,
        choices=Mode.choices,
        default=Mode.OPEN_MIC,
    )
    started_at = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(null=True, blank=True)
    max_participants = models.PositiveIntegerField(
        default=getattr(settings, "ROOM_MAX_PARTICIPANTS", 30)
    )
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-started_at"]

    def __str__(self):
        return self.title

    @property
    def is_live(self):
        return self.status == self.Status.LIVE


class RoomParticipant(models.Model):
    class Role(models.TextChoices):
        HOST = "host", "Host"
        LISTENER = "listener", "Listener"

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="participants")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="room_participations",
    )
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.LISTENER)
    is_muted = models.BooleanField(default=True)
    is_removed = models.BooleanField(default=False)
    joined_at = models.DateTimeField(default=timezone.now)
    left_at = models.DateTimeField(null=True, blank=True)
    last_seen_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["joined_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["room", "user"],
                name="unique_room_user_participant",
            )
        ]

    def __str__(self):
        return f"{self.user_id} in {self.room_id}"

    @property
    def is_active(self):
        return self.left_at is None and not self.is_removed
