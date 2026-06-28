from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rooms.models import Room

from .exceptions import AudioProviderConfigurationError
from .serializers import AudioTokenSerializer
from .services import issue_audio_token


class RoomAudioTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        try:
            token = issue_audio_token(request.user, room)
        except AudioProviderConfigurationError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        serializer = AudioTokenSerializer.from_provider_token(token)
        return Response({"audio": serializer.data}, status=status.HTTP_200_OK)
