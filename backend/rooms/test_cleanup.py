from datetime import timedelta
from unittest.mock import patch

from django.core.management import call_command
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from rooms.cleanup import cleanup_live_rooms
from rooms.models import Room
from rooms.services import ROOM_FULL_MESSAGE, active_participants


class RoomCostControlTests(APITestCase):
    def setUp(self):
        self.signup_url = reverse("auth-signup")
        self.start_url = reverse("rooms-start")

        host_signup = self.client.post(
            self.signup_url,
            {
                "email": "costhost@example.com",
                "password": "securepass123",
                "display_name": "Cost Host",
            },
            format="json",
        )
        self.host_token = host_signup.data["token"]

        self.guest_tokens = []
        for index in range(3):
            guest_signup = self.client.post(
                self.signup_url,
                {
                    "email": f"guest{index}@example.com",
                    "password": "securepass123",
                    "display_name": f"Guest {index}",
                },
                format="json",
            )
            self.guest_tokens.append(guest_signup.data["token"])

    def _auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    @override_settings(ROOM_MAX_PARTICIPANTS=2)
    def test_max_participants_prevents_joining(self):
        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        room_id = start.data["room"]["id"]

        self._auth(self.guest_tokens[0])
        join = self.client.post(reverse("rooms-join", args=[room_id]))
        self.assertEqual(join.status_code, status.HTTP_200_OK)

        self._auth(self.guest_tokens[1])
        full = self.client.post(reverse("rooms-join", args=[room_id]))
        self.assertEqual(full.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(full.data["detail"], ROOM_FULL_MESSAGE)

    @override_settings(ROOM_MAX_DURATION_MINUTES=60)
    def test_cleanup_command_ends_expired_rooms(self):
        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        room_id = start.data["room"]["id"]

        Room.objects.filter(pk=room_id).update(
            started_at=timezone.now() - timedelta(minutes=61)
        )

        ended = cleanup_live_rooms()
        self.assertEqual(ended, 1)

        room = Room.objects.get(pk=room_id)
        self.assertEqual(room.status, Room.Status.ENDED)
        self.assertIsNotNone(room.ended_at)

    @override_settings(ROOM_AUTO_END_EMPTY_AFTER_MINUTES=5)
    def test_cleanup_command_ends_empty_rooms(self):
        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        room_id = start.data["room"]["id"]

        past = timezone.now() - timedelta(minutes=10)
        active_participants(Room.objects.get(pk=room_id)).update(left_at=past)

        ended = cleanup_live_rooms()
        self.assertEqual(ended, 1)
        self.assertEqual(Room.objects.get(pk=room_id).status, Room.Status.ENDED)

    @override_settings(ROOM_MAX_DURATION_MINUTES=60)
    def test_cleanup_command_is_idempotent(self):
        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        room_id = start.data["room"]["id"]
        Room.objects.filter(pk=room_id).update(
            started_at=timezone.now() - timedelta(minutes=90)
        )

        self.assertEqual(cleanup_live_rooms(), 1)
        self.assertEqual(cleanup_live_rooms(), 0)
        call_command("cleanup_rooms")

    @patch("audio.services.get_audio_provider")
    def test_room_end_succeeds_if_audio_provider_cleanup_fails(self, mock_provider):
        mock_provider.return_value.end_room.side_effect = RuntimeError("provider down")

        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        room_id = start.data["room"]["id"]

        response = self.client.post(reverse("rooms-end", args=[room_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["room"]["status"], "ended")

    def test_host_leaving_ends_room(self):
        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        room_id = start.data["room"]["id"]

        response = self.client.post(reverse("rooms-leave", args=[room_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["room"]["status"], "ended")

        room = Room.objects.get(pk=room_id)
        self.assertEqual(room.status, Room.Status.ENDED)
