from rest_framework import serializers

from accounts.serializers import ProfileBasicSerializer

from .models import RoomReaction

ALLOWED_REACTION_TYPES = {choice.value for choice in RoomReaction.ReactionType}


class RoomReactionSerializer(serializers.ModelSerializer):
    user = ProfileBasicSerializer(source="user.profile", read_only=True)

    class Meta:
        model = RoomReaction
        fields = ("id", "reaction_type", "user", "created_at")


class SendReactionSerializer(serializers.Serializer):
    reaction_type = serializers.ChoiceField(choices=RoomReaction.ReactionType.choices)
