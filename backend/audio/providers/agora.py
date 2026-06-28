import time

from django.conf import settings

from agora_token_builder import RtcTokenBuilder

from audio.exceptions import AudioProviderConfigurationError

from .base import AudioProvider, ProviderRoom, ProviderToken
from .mock import mock_room_name

# Agora RTC role: publisher can send and receive audio.
_AGORA_ROLE_PUBLISHER = 1


def agora_uid_for_user(user) -> int:
    """
    Stable numeric Agora UID derived from Django user.id.

    Same Buro user always maps to the same Agora UID across rejoins and sessions.
    user.id is safe for MVP scale and fits Agora's uint32 UID range.
    """
    return int(user.id)


def _get_agora_settings():
    app_id = (getattr(settings, "AGORA_APP_ID", "") or "").strip()
    app_certificate = (getattr(settings, "AGORA_APP_CERTIFICATE", "") or "").strip()
    if not app_id or not app_certificate:
        raise AudioProviderConfigurationError(
            "Agora is not configured. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE."
        )
    expires_in = int(getattr(settings, "AGORA_TOKEN_EXPIRES_IN", 3600))
    return app_id, app_certificate, expires_in


class AgoraAudioProvider(AudioProvider):
    def get_provider_name(self) -> str:
        return "agora"

    def create_room(self, room) -> ProviderRoom:
        # Agora channels are created implicitly when the first client joins.
        return ProviderRoom(room_name=mock_room_name(room.id))

    def create_token(self, room, user) -> ProviderToken:
        app_id, app_certificate, expires_in = _get_agora_settings()
        channel_name = mock_room_name(room.id)
        uid = agora_uid_for_user(user)
        privilege_expires_at = int(time.time()) + expires_in

        token = RtcTokenBuilder.buildTokenWithUid(
            app_id,
            app_certificate,
            channel_name,
            uid,
            _AGORA_ROLE_PUBLISHER,
            privilege_expires_at,
        )

        return ProviderToken(
            provider="agora",
            app_id=app_id,
            room_name=channel_name,
            token=token,
            uid=uid,
            ws_url=None,
            connection_url=None,
            expires_in=expires_in,
        )

    def end_room(self, room) -> None:
        # MVP: no Agora REST teardown — clients leave when Buro room ends.
        return None
