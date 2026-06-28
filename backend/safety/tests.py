from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from safety.models import Report, RoomBlock, UserModeration
from safety.services import SUSPENSION_MESSAGE, suspend_user

User = get_user_model()


class SafetyModerationTests(APITestCase):
    def setUp(self):
        self.signup_url = reverse("auth-signup")
        self.start_url = reverse("rooms-start")

        def signup(email, name):
            response = self.client.post(
                self.signup_url,
                {"email": email, "password": "securepass123", "display_name": name},
                format="json",
            )
            return response.data["token"], User.objects.get(email=email)

        self.host_token, self.host_user = signup("modhost@example.com", "Mod Host")
        self.guest_token, self.guest_user = signup("modguest@example.com", "Mod Guest")
        self.other_token, self.other_user = signup("modother@example.com", "Mod Other")

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.host_token}")
        start = self.client.post(self.start_url, {}, format="json")
        self.room_id = start.data["room"]["id"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.guest_token}")
        self.client.post(reverse("rooms-join", args=[self.room_id]))

        self.admin_user = User.objects.create_superuser(
            username="adminmod",
            email="adminmod@example.com",
            password="securepass123",
        )
        from rest_framework.authtoken.models import Token

        self.admin_token = Token.objects.create(user=self.admin_user).key

    def _auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    def test_host_can_remove_user(self):
        self._auth(self.host_token)
        response = self.client.post(
            reverse("rooms-remove-user", args=[self.room_id]),
            {"user_id": self.guest_user.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_non_host_cannot_remove_user(self):
        self._auth(self.guest_token)
        response = self.client.post(
            reverse("rooms-remove-user", args=[self.room_id]),
            {"user_id": self.other_user.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_host_can_block_user(self):
        self._auth(self.host_token)
        response = self.client.post(
            reverse("rooms-block-user", args=[self.room_id]),
            {"user_id": self.guest_user.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(
            RoomBlock.objects.filter(
                room_id=self.room_id, blocked_user=self.guest_user
            ).exists()
        )

    def test_blocked_user_cannot_rejoin(self):
        self._auth(self.host_token)
        self.client.post(
            reverse("rooms-block-user", args=[self.room_id]),
            {"user_id": self.guest_user.id},
            format="json",
        )

        self._auth(self.guest_token)
        response = self.client.post(reverse("rooms-join", args=[self.room_id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_host_cannot_block_themselves(self):
        self._auth(self.host_token)
        response = self.client.post(
            reverse("rooms-block-user", args=[self.room_id]),
            {"user_id": self.host_user.id},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_removed_user_cannot_send_chat(self):
        self._auth(self.host_token)
        self.client.post(
            reverse("rooms-remove-user", args=[self.room_id]),
            {"user_id": self.guest_user.id},
            format="json",
        )

        self._auth(self.guest_token)
        response = self.client.post(
            reverse("rooms-messages", args=[self.room_id]),
            {"body": "hello"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_removed_user_cannot_react(self):
        self._auth(self.host_token)
        self.client.post(
            reverse("rooms-remove-user", args=[self.room_id]),
            {"user_id": self.guest_user.id},
            format="json",
        )

        self._auth(self.guest_token)
        response = self.client.post(
            reverse("rooms-reactions", args=[self.room_id]),
            {"reaction_type": "laugh"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_removed_user_cannot_request_audio_token(self):
        self._auth(self.host_token)
        self.client.post(
            reverse("rooms-remove-user", args=[self.room_id]),
            {"user_id": self.guest_user.id},
            format="json",
        )

        self._auth(self.guest_token)
        response = self.client.post(reverse("rooms-audio-token", args=[self.room_id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_suspended_user_cannot_start_room(self):
        suspend_user(self.guest_user, "test")
        self._auth(self.guest_token)
        response = self.client.post(self.start_url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["detail"], SUSPENSION_MESSAGE)

    def test_suspended_user_cannot_join_room(self):
        suspend_user(self.other_user, "test")
        self._auth(self.other_token)
        response = self.client.post(reverse("rooms-join", args=[self.room_id]))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_suspended_user_cannot_chat_or_react(self):
        suspend_user(self.guest_user, "test")
        self._auth(self.guest_token)
        chat = self.client.post(
            reverse("rooms-messages", args=[self.room_id]),
            {"body": "nope"},
            format="json",
        )
        self.assertEqual(chat.status_code, status.HTTP_403_FORBIDDEN)

        react = self.client.post(
            reverse("rooms-reactions", args=[self.room_id]),
            {"reaction_type": "clap"},
            format="json",
        )
        self.assertEqual(react.status_code, status.HTTP_403_FORBIDDEN)

    def test_report_room_works(self):
        self._auth(self.guest_token)
        response = self.client.post(
            reverse("reports-create"),
            {"room": self.room_id, "reason": "spam", "details": "too much"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Report.objects.count(), 1)

    def test_report_user_works(self):
        self._auth(self.guest_token)
        response = self.client.post(
            reverse("reports-create"),
            {
                "room": self.room_id,
                "reported_user": self.host_user.id,
                "reason": "insults_or_harassment",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_admin_can_list_reports(self):
        self._auth(self.guest_token)
        self.client.post(
            reverse("reports-create"),
            {"room": self.room_id, "reason": "other"},
            format="json",
        )

        self._auth(self.admin_token)
        response = self.client.get(reverse("admin-reports"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data["reports"]), 1)

    def test_non_admin_cannot_list_reports(self):
        self._auth(self.guest_token)
        response = self.client.get(reverse("admin-reports"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_end_room(self):
        self._auth(self.admin_token)
        response = self.client.post(reverse("admin-room-end", args=[self.room_id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["room"]["status"], "ended")

    def test_admin_can_suspend_and_unsuspend_user(self):
        self._auth(self.admin_token)
        suspend = self.client.post(
            reverse("admin-user-suspend", args=[self.guest_user.id]),
            {"reason": "abuse"},
            format="json",
        )
        self.assertEqual(suspend.status_code, status.HTTP_200_OK)
        self.assertTrue(
            UserModeration.objects.get(user=self.guest_user).is_suspended
        )

        unsuspend = self.client.post(
            reverse("admin-user-unsuspend", args=[self.guest_user.id])
        )
        self.assertEqual(unsuspend.status_code, status.HTTP_200_OK)
        self.assertFalse(
            UserModeration.objects.get(user=self.guest_user).is_suspended
        )
