from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ProviderRoom:
    room_name: str


@dataclass
class ProviderToken:
    provider: str
    room_name: str
    token: str
    ws_url: str | None
    connection_url: str | None
    expires_in: int


class AudioProvider(ABC):
    @abstractmethod
    def get_provider_name(self) -> str:
        pass

    @abstractmethod
    def create_room(self, room) -> ProviderRoom:
        pass

    @abstractmethod
    def create_token(self, room, user) -> ProviderToken:
        pass

    @abstractmethod
    def end_room(self, room) -> None:
        pass
