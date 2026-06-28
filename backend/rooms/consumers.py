import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser

from .models import Room, RoomParticipant
from .broadcasts import room_group_name
from .serializers import ParticipantSerializer, RoomSerializer
from .services import participant_count


class RoomConsumer(AsyncWebsocketConsumer):
    room_id = None
    group_name = None

    async def connect(self):
        self.room_id = int(self.scope["url_route"]["kwargs"]["room_id"])
        self.group_name = room_group_name(self.room_id)
        user = self.scope.get("user")

        if not user or isinstance(user, AnonymousUser) or not user.is_authenticated:
            await self.close(code=4401)
            return

        room = await self._get_room(self.room_id)
        if room is None:
            await self.close(code=4404)
            return

        if room.status != Room.Status.LIVE:
            await self.close(code=4403)
            return

        participant = await self._get_active_participant(self.room_id, user.id)
        if participant is None:
            await self.close(code=4403)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        snapshot = await self._build_snapshot(room, user)
        await self.send(text_data=json.dumps(snapshot))

    async def disconnect(self, close_code):
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def room_event(self, event):
        await self.send(text_data=json.dumps(event["message"]))

    @database_sync_to_async
    def _get_room(self, room_id):
        try:
            return Room.objects.select_related("host__profile").get(pk=room_id)
        except Room.DoesNotExist:
            return None

    @database_sync_to_async
    def _get_active_participant(self, room_id, user_id):
        return RoomParticipant.objects.filter(
            room_id=room_id,
            user_id=user_id,
            left_at__isnull=True,
            is_removed=False,
        ).first()

    @database_sync_to_async
    def _build_snapshot(self, room, user):
        from django.contrib.auth import get_user_model

        class SnapshotRequest:
            def __init__(self, snapshot_user):
                self.user = snapshot_user

        User = get_user_model()
        snapshot_user = User.objects.select_related("profile").get(pk=user.id)
        room = (
            Room.objects.select_related("host__profile")
            .prefetch_related("participants__user__profile")
            .get(pk=room.id)
        )
        active = room.participants.filter(left_at__isnull=True, is_removed=False).select_related(
            "user__profile"
        )
        return {
            "type": "room.snapshot",
            "room_id": room.id,
            "payload": {
                "room": RoomSerializer(
                    room,
                    context={
                        "request": SnapshotRequest(snapshot_user),
                        "include_participants": True,
                    },
                ).data,
                "participants": ParticipantSerializer(active, many=True).data,
                "participant_count": participant_count(room),
            },
        }
