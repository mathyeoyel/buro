import logging
import secrets

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from rooms.cleanup import cleanup_live_rooms

logger = logging.getLogger(__name__)


def _cleanup_token_from_request(request):
    header_token = request.headers.get("X-Buro-Cleanup-Token")
    if header_token:
        return header_token
    return request.query_params.get("token")


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def internal_cleanup_rooms(request):
    configured_token = getattr(settings, "INTERNAL_CLEANUP_TOKEN", "")
    if not configured_token:
        return Response(
            {"detail": "Cleanup endpoint is not configured."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    provided_token = _cleanup_token_from_request(request)
    if not provided_token or not secrets.compare_digest(provided_token, configured_token):
        return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

    try:
        ended_rooms = cleanup_live_rooms()
    except Exception:
        logger.exception("Internal cleanup endpoint failed")
        return Response(
            {"detail": "Cleanup failed."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response({"status": "ok", "ended_rooms": ended_rooms})


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    return Response({"status": "ok", "service": "buro-api"})
