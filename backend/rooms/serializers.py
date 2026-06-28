from rest_framework import serializers

from accounts.models import Profile
from .models import Room, RoomParticipant
from .services import participant_count


class ProfileBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("id", "display_name", "username", "avatar_url")

    id = serializers.IntegerField(source="user_id", read_only=True)


class ParticipantSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="user_id", read_only=True)
    display_name = serializers.CharField(source="user.profile.display_name", read_only=True)
    username = serializers.CharField(source="user.profile.username", read_only=True)
    avatar_url = serializers.CharField(source="user.profile.avatar_url", read_only=True)

    class Meta:
        model = RoomParticipant
        fields = ("id", "display_name", "username", "avatar_url", "role", "is_muted")


class RoomSerializer(serializers.ModelSerializer):
    host = ProfileBasicSerializer(source="host.profile", read_only=True)
    mode = serializers.CharField(source="get_mode_display", read_only=True)
    participant_count = serializers.SerializerMethodField()
    current_user_role = serializers.SerializerMethodField()
    current_user_is_participant = serializers.SerializerMethodField()
    participants = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = (
            "id",
            "title",
            "category",
            "status",
            "mode",
            "host",
            "participant_count",
            "current_user_role",
            "current_user_is_participant",
            "started_at",
            "ended_at",
            "participants",
        )

    def get_participant_count(self, obj):
        return participant_count(obj)

    def _current_participant(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        return obj.participants.filter(
            user=request.user, left_at__isnull=True, is_removed=False
        ).first()

    def get_current_user_role(self, obj):
        participant = self._current_participant(obj)
        return participant.role if participant else None

    def get_current_user_is_participant(self, obj):
        return self._current_participant(obj) is not None

    def get_participants(self, obj):
        if not self.context.get("include_participants"):
            return None
        active = obj.participants.filter(left_at__isnull=True, is_removed=False).select_related(
            "user__profile"
        )
        return ParticipantSerializer(active, many=True).data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not self.context.get("include_participants"):
            data.pop("participants", None)
        return data


class StartRoomSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=120, required=False, allow_blank=True)
    category = serializers.CharField(max_length=60, required=False, allow_blank=True)


class UpdateRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ("title", "category")
