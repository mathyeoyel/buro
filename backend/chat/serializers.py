from rest_framework import serializers

from accounts.models import Profile

from .models import RoomMessage

MAX_MESSAGE_LENGTH = 280


class ProfileBasicSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="user_id", read_only=True)

    class Meta:
        model = Profile
        fields = ("id", "display_name", "username", "avatar_url")


class RoomMessageSerializer(serializers.ModelSerializer):
    sender = ProfileBasicSerializer(source="sender.profile", read_only=True)

    class Meta:
        model = RoomMessage
        fields = ("id", "body", "sender", "created_at")


class SendMessageSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=MAX_MESSAGE_LENGTH)
