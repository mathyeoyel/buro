from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from django.contrib.auth import get_user_model

from .models import Room, RoomParticipant

User = get_user_model()


class RoomAPITests(APITestCase):
    def setUp(self):
        self.signup_url = reverse("auth-signup")
        self.live_url = reverse("rooms-live")
        self.start_url = reverse("rooms-start")

        host_signup = self.client.post(
            self.signup_url,
            {
                "email": "host@example.com",
                "password": "securepass123",
                "display_name": "Amina K",
            },
            format="json",
        )
        self.host_token = host_signup.data["token"]
        self.host_user = User.objects.get(email="host@example.com")

        guest_signup = self.client.post(
            self.signup_url,
            {
                "email": "guest@example.com",
                "password": "securepass123",
                "display_name": "Deng M",
            },
            format="json",
        )
        self.guest_token = guest_signup.data["token"]
        self.guest_user = User.objects.get(email="guest@example.com")

    def _auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    def test_authenticated_user_can_start_room(self):
        self._auth(self.host_token)
        response = self.client.post(self.start_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Room.objects.count(), 1)
        self.assertTrue(response.data["room"]["current_user_is_participant"])

    def test_title_and_category_defaults(self):
        self._auth(self.host_token)
        response = self.client.post(self.start_url, {}, format="json")
        room = response.data["room"]
        self.assertEqual(room["title"], "Amina K's Jazz Room")
        self.assertEqual(room["category"], "Random Jazz")
        self.assertEqual(room["mode"], "Open Mic")

    def test_room_appears_in_live_list(self):
        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        room_id = start.data["room"]["id"]

        response = self.client.get(self.live_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [r["id"] for r in response.data["rooms"]]
        self.assertIn(room_id, ids)

    def test_user_can_join_room(self):
        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        room_id = start.data["room"]["id"]

        self._auth(self.guest_token)
        join_url = reverse("rooms-join", args=[room_id])
        response = self.client.post(join_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["room"]["current_user_is_participant"])
        self.assertEqual(response.data["room"]["participant_count"], 2)

    def test_user_can_leave_room(self):
        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        room_id = start.data["room"]["id"]

        self._auth(self.guest_token)
        self.client.post(reverse("rooms-join", args=[room_id]))
        response = self.client.post(reverse("rooms-leave", args=[room_id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        participant = RoomParticipant.objects.get(room_id=room_id, user=self.guest_user)
        self.assertIsNotNone(participant.left_at)

    def test_host_can_end_room(self):
        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        room_id = start.data["room"]["id"]

        response = self.client.post(reverse("rooms-end", args=[room_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["room"]["status"], "ended")

        room = Room.objects.get(pk=room_id)
        self.assertIsNotNone(room.ended_at)

    def test_non_host_cannot_end_room(self):
        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        room_id = start.data["room"]["id"]

        self._auth(self.guest_token)
        self.client.post(reverse("rooms-join", args=[room_id]))
        response = self.client.post(reverse("rooms-end", args=[room_id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_ended_room_cannot_be_joined(self):
        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        room_id = start.data["room"]["id"]
        self.client.post(reverse("rooms-end", args=[room_id]))

        self._auth(self.guest_token)
        response = self.client.post(reverse("rooms-join", args=[room_id]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @override_settings(ROOM_CREATION_ENABLED=False)
    def test_room_creation_disabled_prevents_start(self):
        self._auth(self.host_token)
        response = self.client.post(self.start_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @override_settings(ROOM_MAX_PER_USER_PER_DAY=1)
    def test_daily_room_limit_prevents_too_many_rooms(self):
        self._auth(self.host_token)
        first = self.client.post(self.start_url, {}, format="json")
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.client.post(reverse("rooms-end", args=[first.data["room"]["id"]]))

        second = self.client.post(self.start_url, {}, format="json")
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
