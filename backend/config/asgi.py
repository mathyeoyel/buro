"""ASGI config for Buro — HTTP via Django, WebSockets via Channels."""

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")

from django.core.asgi import get_asgi_application

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter

from common.middleware import TokenAuthMiddlewareStack
import rooms.routing

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": TokenAuthMiddlewareStack(
            URLRouter(rooms.routing.websocket_urlpatterns)
        ),
    }
)
