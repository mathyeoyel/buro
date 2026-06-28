from rest_framework import serializers


class AudioTokenSerializer(serializers.Serializer):
    provider = serializers.CharField()
    room_name = serializers.CharField()
    token = serializers.CharField()
    app_id = serializers.CharField(required=False, allow_null=True)
    uid = serializers.IntegerField(required=False, allow_null=True)
    ws_url = serializers.CharField(allow_null=True, required=False)
    connection_url = serializers.CharField(allow_null=True, required=False)
    expires_in = serializers.IntegerField()
    muted_by_default = serializers.BooleanField(default=True)

    @classmethod
    def from_provider_token(cls, token):
        payload = {
            "provider": token.provider,
            "room_name": token.room_name,
            "token": token.token,
            "ws_url": token.ws_url,
            "connection_url": token.connection_url,
            "expires_in": token.expires_in,
            "muted_by_default": True,
        }
        if token.app_id is not None:
            payload["app_id"] = token.app_id
        if token.uid is not None:
            payload["uid"] = token.uid
        return cls(payload)
