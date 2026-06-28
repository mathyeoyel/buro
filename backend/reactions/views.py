from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rooms.broadcasts import broadcast_reaction_sent
from rooms.models import Room

from .models import RoomReaction
from .serializers import RoomReactionSerializer, SendReactionSerializer
from .services import create_room_reaction


class RoomReactionsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        payload = SendReactionSerializer(data=request.data)
        payload.is_valid(raise_exception=True)

        reaction = create_room_reaction(
            request.user, room, payload.validated_data["reaction_type"]
        )
        reaction = RoomReaction.objects.select_related("user__profile").get(pk=reaction.pk)
        data = RoomReactionSerializer(reaction).data
        broadcast_reaction_sent(room.id, data)
        return Response({"reaction": data}, status=status.HTTP_201_CREATED)
