from rest_framework import serializers


class AudioTokenSerializer(serializers.Serializer):
    provider = serializers.CharField()
    room_name = serializers.CharField()
    token = serializers.CharField()
    ws_url = serializers.CharField(allow_null=True, required=False)
    connection_url = serializers.CharField(allow_null=True, required=False)
    expires_in = serializers.IntegerField()
    muted_by_default = serializers.BooleanField(default=True)

    @classmethod
    def from_provider_token(cls, token):
        return cls(
            {
                "provider": token.provider,
                "room_name": token.room_name,
                "token": token.token,
                "ws_url": token.ws_url,
                "connection_url": token.connection_url,
                "expires_in": token.expires_in,
                "muted_by_default": True,
            }
        )
