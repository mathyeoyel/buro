from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from .providers.agora import AgoraAudioProvider
from .providers.base import ProviderToken
from .providers.hundred_ms import HundredMsAudioProvider
from .providers.livekit import LiveKitAudioProvider
from .providers.mock import MockAudioProvider

SUPPORTED_AUDIO_PROVIDERS = frozenset({"mock", "agora", "livekit", "hundred_ms"})

_PROVIDER_CLASSES = {
    "mock": MockAudioProvider,
    "agora": AgoraAudioProvider,
    "livekit": LiveKitAudioProvider,
    "hundred_ms": HundredMsAudioProvider,
}


def get_audio_provider():
    name = getattr(settings, "AUDIO_PROVIDER", "mock")
    if name not in SUPPORTED_AUDIO_PROVIDERS:
        supported = ", ".join(sorted(SUPPORTED_AUDIO_PROVIDERS))
        raise ImproperlyConfigured(
            f"AUDIO_PROVIDER '{name}' is invalid. Supported values: {supported}."
        )
    return _PROVIDER_CLASSES[name]()


def issue_audio_token(user, room) -> ProviderToken:
    from rooms.services import assert_can_interact_in_room

    assert_can_interact_in_room(user, room)
    provider = get_audio_provider()
    provider.create_room(room)
    return provider.create_token(room, user)


def end_audio_for_room(room) -> None:
    try:
        get_audio_provider().end_room(room)
    except NotImplementedError:
        pass
