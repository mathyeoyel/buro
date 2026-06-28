from django.conf import settings
from django.db import models


class RoomReaction(models.Model):
    class ReactionType(models.TextChoices):
        LAUGH = "laugh", "Laugh"
        CLAP = "clap", "Clap"
        FIRE = "fire", "Fire"
        LOVE = "love", "Love"
        SHOCK = "shock", "Shock"

    room = models.ForeignKey(
        "rooms.Room",
        on_delete=models.CASCADE,
        related_name="reactions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="room_reactions",
    )
    reaction_type = models.CharField(max_length=20, choices=ReactionType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reaction_type} in room {self.room_id}"
