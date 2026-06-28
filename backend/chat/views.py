from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rooms.broadcasts import broadcast_chat_message
from rooms.models import Room

from .models import RoomMessage
from .serializers import RoomMessageSerializer, SendMessageSerializer
from .services import create_room_message, list_room_messages


class RoomMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        messages = list_room_messages(request.user, room)
        serializer = RoomMessageSerializer(messages, many=True)
        return Response({"messages": serializer.data})

    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        payload = SendMessageSerializer(data=request.data)
        payload.is_valid(raise_exception=True)

        message = create_room_message(request.user, room, payload.validated_data["body"])
        message = RoomMessage.objects.select_related("sender__profile").get(pk=message.pk)
        data = RoomMessageSerializer(message).data
        broadcast_chat_message(room.id, data)
        return Response({"message": data}, status=status.HTTP_201_CREATED)
