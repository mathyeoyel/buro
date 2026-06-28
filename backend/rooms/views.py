from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .broadcasts import (
    broadcast_participant_blocked,
    broadcast_participant_joined,
    broadcast_participant_left,
    broadcast_participant_muted,
    broadcast_participant_removed,
    broadcast_participant_unmuted,
    broadcast_room_ended,
    broadcast_room_updated,
)
from .models import Room
from .serializers import ParticipantSerializer, RoomSerializer, StartRoomSerializer, UpdateRoomSerializer
from safety.serializers import ModerationActionSerializer
from safety.services import block_user_from_room, remove_user_from_room
from .services import end_room, join_room, leave_room, participant_count, set_participant_muted, start_room


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
        room.refresh_from_db()
        broadcast_room_updated(room.id, room, request=request)
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
        participant, should_broadcast = join_room(request.user, room)
        if should_broadcast:
            participant = (
                room.participants.select_related("user__profile")
                .filter(pk=participant.pk)
                .first()
            )
            broadcast_participant_joined(room.id, participant)
        serializer = RoomSerializer(
            room, context={"request": request, "include_participants": True}
        )
        return Response({"room": serializer.data})


class LeaveRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        room_ended = leave_room(request.user, room)

        if room_ended:
            from audio.services import end_audio_for_room

            end_audio_for_room(room)
            room.refresh_from_db()
            broadcast_room_ended(room.id, room, request=request)
            serializer = RoomSerializer(room, context={"request": request})
            return Response({"room": serializer.data})

        broadcast_participant_left(room.id, request.user.id, participant_count(room))
        return Response(status=status.HTTP_204_NO_CONTENT)


class MuteRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        muted = request.data.get("muted")
        if muted is None:
            current = room.participants.filter(
                user=request.user, left_at__isnull=True, is_removed=False
            ).first()
            if not current:
                return Response({"detail": "You are not in this room."}, status=status.HTTP_400_BAD_REQUEST)
            muted = not current.is_muted
        else:
            muted = bool(muted)

        participant = set_participant_muted(request.user, room, muted)
        participant = (
            room.participants.select_related("user__profile")
            .filter(pk=participant.pk)
            .first()
        )
        if muted:
            broadcast_participant_muted(room.id, participant)
        else:
            broadcast_participant_unmuted(room.id, participant)

        return Response({"participant": ParticipantSerializer(participant).data})


class RemoveUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        payload = ModerationActionSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        reason = payload.validated_data.get("reason", "")
        remove_user_from_room(
            request.user, room, payload.validated_data["user_id"], reason=reason
        )
        broadcast_participant_removed(
            room.id,
            payload.validated_data["user_id"],
            participant_count(room),
            reason=reason or None,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class BlockUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        payload = ModerationActionSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        reason = payload.validated_data.get("reason", "")
        block_user_from_room(
            request.user, room, payload.validated_data["user_id"], reason=reason
        )
        broadcast_participant_blocked(
            room.id,
            payload.validated_data["user_id"],
            participant_count(room),
            reason=reason or None,
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class EndRoomView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        room, ended_now = end_room(request.user, room)

        if ended_now:
            from audio.services import end_audio_for_room

            end_audio_for_room(room)
            broadcast_room_ended(room.id, room, request=request)

        serializer = RoomSerializer(room, context={"request": request})
        return Response({"room": serializer.data})
