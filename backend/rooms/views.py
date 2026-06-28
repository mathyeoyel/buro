from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Room
from .serializers import RoomSerializer, StartRoomSerializer, UpdateRoomSerializer
from .services import end_room, join_room, leave_room, start_room


class LiveRoomsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rooms = (
            Room.objects.filter(status=Room.Status.LIVE)
            .select_related("host__profile")
            .prefetch_related("participants")
        )
        serializer = RoomSerializer(rooms, many=True, context={"request": request})
        return Response({"rooms": serializer.data})


class StartRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payload = StartRoomSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        room = start_room(
            request.user,
            title=payload.validated_data.get("title"),
            category=payload.validated_data.get("category"),
        )
        serializer = RoomSerializer(room, context={"request": request, "include_participants": True})
        return Response({"room": serializer.data}, status=status.HTTP_201_CREATED)


class RoomDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        room = self._get_room(room_id)
        serializer = RoomSerializer(
            room, context={"request": request, "include_participants": True}
        )
        return Response({"room": serializer.data})

    def patch(self, request, room_id):
        room = self._get_room(room_id)
        if room.host_id != request.user.id:
            return Response(
                {"detail": "Only the host can update this room."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not room.is_live:
            return Response({"detail": "Cannot update an ended room."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UpdateRoomSerializer(room, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        out = RoomSerializer(
            room, context={"request": request, "include_participants": True}
        )
        return Response({"room": out.data})

    def _get_room(self, room_id):
        return get_object_or_404(
            Room.objects.select_related("host__profile").prefetch_related(
                "participants__user__profile"
            ),
            pk=room_id,
        )


class JoinRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        room = get_object_or_404(
            Room.objects.select_related("host__profile"), pk=room_id
        )
        join_room(request.user, room)
        serializer = RoomSerializer(
            room, context={"request": request, "include_participants": True}
        )
        return Response({"room": serializer.data})


class LeaveRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        leave_room(request.user, room)
        return Response(status=status.HTTP_204_NO_CONTENT)


class EndRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        end_room(request.user, room)
        serializer = RoomSerializer(room, context={"request": request})
        return Response({"room": serializer.data})
