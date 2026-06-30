from datetime import timedelta
from unittest.mock import patch

from django.core.management import call_command
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from rooms.models import Room


@override_settings(INTERNAL_CLEANUP_TOKEN="test-cleanup-token")
class InternalCleanupRoomsEndpointTests(APITestCase):
    def setUp(self):
        self.url = reverse("internal-cleanup-rooms")
        self.signup_url = reverse("auth-signup")
        self.start_url = reverse("rooms-start")

        signup = self.client.post(
            self.signup_url,
            {
                "email": "cleanup-endpoint@example.com",
                "password": "securepass123",
                "display_name": "Cleanup Host",
                "gender": "male",
            },
            format="json",
        )
        self.host_token = signup.data["token"]

    def _auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    def test_missing_token_returns_403(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_wrong_token_returns_403(self):
        response = self.client.post(
            self.url,
            HTTP_X_BURO_CLEANUP_TOKEN="wrong-token",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_correct_header_token_runs_cleanup_and_returns_200(self):
        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        room_id = start.data["room"]["id"]
        Room.objects.filter(pk=room_id).update(
            started_at=timezone.now() - timedelta(minutes=61)
        )

        response = self.client.post(
            self.url,
            HTTP_X_BURO_CLEANUP_TOKEN="test-cleanup-token",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"status": "ok", "ended_rooms": 1})
        self.assertEqual(Room.objects.get(pk=room_id).status, Room.Status.ENDED)

    def test_correct_query_token_runs_cleanup_and_returns_200(self):
        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        room_id = start.data["room"]["id"]
        Room.objects.filter(pk=room_id).update(
            started_at=timezone.now() - timedelta(minutes=61)
        )

        response = self.client.get(f"{self.url}?token=test-cleanup-token")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ok")
        self.assertEqual(response.data["ended_rooms"], 1)

    def test_no_rooms_to_clean_returns_200_with_zero(self):
        response = self.client.post(
            self.url,
            HTTP_X_BURO_CLEANUP_TOKEN="test-cleanup-token",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"status": "ok", "ended_rooms": 0})

    @patch("common.views.cleanup_live_rooms", side_effect=RuntimeError("boom"))
    def test_cleanup_failure_returns_500(self, _mock_cleanup):
        response = self.client.post(
            self.url,
            HTTP_X_BURO_CLEANUP_TOKEN="test-cleanup-token",
        )
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data["detail"], "Cleanup failed.")

    @override_settings(INTERNAL_CLEANUP_TOKEN="")
    def test_unconfigured_token_returns_503(self):
        response = self.client.post(
            self.url,
            HTTP_X_BURO_CLEANUP_TOKEN="any-token",
        )
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

    @override_settings(INTERNAL_CLEANUP_TOKEN="test-cleanup-token", ROOM_MAX_DURATION_MINUTES=60)
    def test_management_command_still_works(self):
        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        room_id = start.data["room"]["id"]
        Room.objects.filter(pk=room_id).update(
            started_at=timezone.now() - timedelta(minutes=90)
        )

        call_command("cleanup_rooms")
        self.assertEqual(Room.objects.get(pk=room_id).status, Room.Status.ENDED)
