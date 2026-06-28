from django.conf import settings
from django.db import models


class RoomBlock(models.Model):
    room = models.ForeignKey(
        "rooms.Room",
        on_delete=models.CASCADE,
        related_name="blocks",
    )
    blocked_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="room_blocks_received",
    )
    blocked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="room_blocks_created",
    )
    reason = models.CharField(max_length=280, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["room", "blocked_user"],
                name="unique_room_block",
            )
        ]

    def __str__(self):
        return f"Block {self.blocked_user_id} from room {self.room_id}"


class Report(models.Model):
    class Reason(models.TextChoices):
        INSULTS_OR_HARASSMENT = "insults_or_harassment", "Insults or harassment"
        HATE_SPEECH = "hate_speech", "Hate speech"
        THREATS = "threats", "Threats"
        EXPOSING_PRIVATE_INFORMATION = "exposing_private_information", "Exposing private information"
        SEXUAL_CONTENT = "sexual_content", "Sexual content"
        SPAM = "spam", "Spam"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        REVIEWED = "reviewed", "Reviewed"
        DISMISSED = "dismissed", "Dismissed"
        ACTION_TAKEN = "action_taken", "Action taken"

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports_filed",
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports_received",
        null=True,
        blank=True,
    )
    room = models.ForeignKey(
        "rooms.Room",
        on_delete=models.SET_NULL,
        related_name="reports",
        null=True,
        blank=True,
    )
    reason = models.CharField(max_length=40, choices=Reason.choices)
    details = models.CharField(max_length=500, blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report {self.pk} ({self.reason})"


class UserModeration(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="moderation",
    )
    is_suspended = models.BooleanField(default=False)
    suspended_at = models.DateTimeField(null=True, blank=True)
    suspension_reason = models.CharField(max_length=280, blank=True, default="")

    def __str__(self):
        return f"Moderation for user {self.user_id}"
