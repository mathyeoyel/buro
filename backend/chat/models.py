from django.conf import settings
from django.db import models


class RoomMessage(models.Model):
    room = models.ForeignKey(
        "rooms.Room",
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="room_messages",
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message {self.pk} in room {self.room_id}"
