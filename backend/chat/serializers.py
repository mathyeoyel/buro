from rest_framework import serializers

from accounts.serializers import ProfileBasicSerializer

from .models import RoomMessage

MAX_MESSAGE_LENGTH = 280


class RoomMessageSerializer(serializers.ModelSerializer):
    sender = ProfileBasicSerializer(source="sender.profile", read_only=True)

    class Meta:
        model = RoomMessage
        fields = ("id", "body", "sender", "created_at")


class SendMessageSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=MAX_MESSAGE_LENGTH)
