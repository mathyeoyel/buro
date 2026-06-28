from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rooms.broadcasts import broadcast_moderation_room_ended
from rooms.models import Room
from rooms.serializers import RoomSerializer
from rooms.services import finalize_room_end, participant_count

from .models import Report
from .serializers import ReportCreateSerializer, ReportSerializer, ReportUpdateSerializer, SuspendUserSerializer
from .services import assert_not_suspended, suspend_user, unsuspend_user

User = get_user_model()


class ReportCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        assert_not_suspended(request.user)
        serializer = ReportCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report = Report.objects.create(
            reporter=request.user,
            reported_user=serializer.validated_data.get("reported_user"),
            room=serializer.validated_data.get("room"),
            reason=serializer.validated_data["reason"],
            details=serializer.validated_data.get("details", ""),
        )
        return Response(
            {"report": ReportSerializer(report).data},
            status=status.HTTP_201_CREATED,
        )


class AdminReportListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        reports = Report.objects.select_related(
            "reporter", "reported_user", "room"
        ).all()[:100]
        return Response({"reports": ReportSerializer(reports, many=True).data})


class AdminReportDetailView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, report_id):
        report = get_object_or_404(Report, pk=report_id)
        serializer = ReportUpdateSerializer(report, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"report": ReportSerializer(report).data})


class AdminLiveRoomsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        rooms = (
            Room.objects.filter(status=Room.Status.LIVE)
            .select_related("host__profile")
            .prefetch_related("participants")
        )
        serializer = RoomSerializer(rooms, many=True, context={"request": request})
        return Response({"rooms": serializer.data})


class AdminEndRoomView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, room_id):
        room = get_object_or_404(Room, pk=room_id)
        if finalize_room_end(room):
            from audio.services import end_audio_for_room

            end_audio_for_room(room)
            room.refresh_from_db()
            broadcast_moderation_room_ended(room.id, reason="admin_ended")

        serializer = RoomSerializer(room, context={"request": request})
        return Response({"room": serializer.data})


class AdminSuspendUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        target = get_object_or_404(User, pk=user_id)
        payload = SuspendUserSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        moderation = suspend_user(target, payload.validated_data.get("reason", ""))
        return Response(
            {
                "user_id": target.id,
                "is_suspended": moderation.is_suspended,
                "suspended_at": moderation.suspended_at,
            }
        )


class AdminUnsuspendUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        target = get_object_or_404(User, pk=user_id)
        moderation = unsuspend_user(target)
        return Response(
            {
                "user_id": target.id,
                "is_suspended": moderation.is_suspended,
            }
        )
