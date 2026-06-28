from rest_framework import serializers

from .models import Report


class ModerationActionSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    reason = serializers.CharField(required=False, allow_blank=True, max_length=280)


class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ("room", "reported_user", "reason", "details")

    def validate(self, attrs):
        if not attrs.get("room") and not attrs.get("reported_user"):
            raise serializers.ValidationError(
                "Report must include a room or a reported user."
            )
        return attrs


class ReportSerializer(serializers.ModelSerializer):
    reporter_email = serializers.EmailField(source="reporter.email", read_only=True)
    reported_user_email = serializers.EmailField(
        source="reported_user.email", read_only=True, allow_null=True
    )
    room_title = serializers.CharField(source="room.title", read_only=True, allow_null=True)

    class Meta:
        model = Report
        fields = (
            "id",
            "reporter",
            "reporter_email",
            "reported_user",
            "reported_user_email",
            "room",
            "room_title",
            "reason",
            "details",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class ReportUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ("status",)


class SuspendUserSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, max_length=280)
