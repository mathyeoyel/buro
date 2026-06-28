from .base import AudioProvider, ProviderRoom, ProviderToken

_NOT_IMPLEMENTED = "100ms audio provider is not implemented yet."


class HundredMsAudioProvider(AudioProvider):
    def get_provider_name(self) -> str:
        return "hundred_ms"

    def create_room(self, room) -> ProviderRoom:
        raise NotImplementedError(_NOT_IMPLEMENTED)

    def create_token(self, room, user) -> ProviderToken:
        raise NotImplementedError(_NOT_IMPLEMENTED)

    def end_room(self, room) -> None:
        raise NotImplementedError(_NOT_IMPLEMENTED)
