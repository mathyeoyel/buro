from .base import AudioProvider, ProviderRoom, ProviderToken

_NOT_IMPLEMENTED = "Agora audio provider is not implemented yet."


class AgoraAudioProvider(AudioProvider):
    def get_provider_name(self) -> str:
        return "agora"

    def create_room(self, room) -> ProviderRoom:
        raise NotImplementedError(_NOT_IMPLEMENTED)

    def create_token(self, room, user) -> ProviderToken:
        raise NotImplementedError(_NOT_IMPLEMENTED)

    def end_room(self, room) -> None:
        raise NotImplementedError(_NOT_IMPLEMENTED)
