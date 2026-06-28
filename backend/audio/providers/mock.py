import secrets

from .base import AudioProvider, ProviderRoom, ProviderToken

MOCK_EXPIRES_IN = 3600


def mock_room_name(room_id: int) -> str:
    return f"buro-room-{room_id}"


class MockAudioProvider(AudioProvider):
    def get_provider_name(self) -> str:
        return "mock"

    def create_room(self, room) -> ProviderRoom:
        return ProviderRoom(room_name=mock_room_name(room.id))

    def create_token(self, room, user) -> ProviderToken:
        return ProviderToken(
            provider="mock",
            room_name=mock_room_name(room.id),
            token=f"mock-token-{room.id}-{user.id}-{secrets.token_hex(8)}",
            ws_url=None,
            connection_url=None,
            expires_in=MOCK_EXPIRES_IN,
        )

    def end_room(self, room) -> None:
        # Mock provider has no external session to tear down.
        return None
