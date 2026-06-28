from django.contrib.auth import get_user_model
from django.core.exceptions import ImproperlyConfigured
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from audio.providers.agora import AgoraAudioProvider, agora_uid_for_user
from audio.providers.mock import MockAudioProvider, mock_room_name
from audio.services import get_audio_provider, issue_audio_token
from rooms.models import Room

User = get_user_model()


class AudioProviderTests(APITestCase):
    def setUp(self):
        self.signup_url = reverse("auth-signup")
        self.start_url = reverse("rooms-start")

        host_signup = self.client.post(
            self.signup_url,
            {
                "email": "audiohost@example.com",
                "password": "securepass123",
                "display_name": "Audio Host",
            },
            format="json",
        )
        self.host_token = host_signup.data["token"]
        self.host_user = User.objects.get(email="audiohost@example.com")

        guest_signup = self.client.post(
            self.signup_url,
            {
                "email": "audioguest@example.com",
                "password": "securepass123",
                "display_name": "Audio Guest",
            },
            format="json",
        )
        self.guest_token = guest_signup.data["token"]
        self.guest_user = User.objects.get(email="audioguest@example.com")

        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        self.room_id = start.data["room"]["id"]
        self.room = Room.objects.get(pk=self.room_id)
        self.audio_token_url = reverse("rooms-audio-token", args=[self.room_id])

        self._auth(self.guest_token)
        self.client.post(reverse("rooms-join", args=[self.room_id]))

    def _auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    def test_active_participant_can_request_mock_audio_token(self):
        self._auth(self.guest_token)
        response = self.client.post(self.audio_token_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        audio = response.data["audio"]
        self.assertEqual(audio["provider"], "mock")
        self.assertEqual(audio["room_name"], mock_room_name(self.room_id))
        self.assertTrue(audio["token"].startswith(f"mock-token-{self.room_id}-"))
        self.assertIsNone(audio["ws_url"])
        self.assertEqual(audio["expires_in"], 3600)
        self.assertTrue(audio["muted_by_default"])

    def test_non_participant_cannot_request_audio_token(self):
        outsider_signup = self.client.post(
            self.signup_url,
            {
                "email": "audiooutsider@example.com",
                "password": "securepass123",
                "display_name": "Audio Outsider",
            },
            format="json",
        )
        self._auth(outsider_signup.data["token"])
        response = self.client.post(self.audio_token_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_ended_room_rejects_audio_token(self):
        self._auth(self.host_token)
        self.client.post(reverse("rooms-end", args=[self.room_id]))

        self._auth(self.guest_token)
        response = self.client.post(self.audio_token_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_left_participant_cannot_request_audio_token(self):
        self._auth(self.guest_token)
        self.client.post(reverse("rooms-leave", args=[self.room_id]))
        response = self.client.post(self.audio_token_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @override_settings(AUDIO_PROVIDER="not-a-provider")
    def test_invalid_provider_setting_fails_clearly(self):
        with self.assertRaises(ImproperlyConfigured) as ctx:
            get_audio_provider()
        self.assertIn("not-a-provider", str(ctx.exception))
        self.assertIn("Supported values", str(ctx.exception))

    def test_mock_provider_returns_expected_payload_shape(self):
        provider = MockAudioProvider()
        self.assertEqual(provider.get_provider_name(), "mock")

        provider_room = provider.create_room(self.room)
        self.assertEqual(provider_room.room_name, mock_room_name(self.room_id))

        token = provider.create_token(self.room, self.guest_user)
        self.assertEqual(token.provider, "mock")
        self.assertEqual(token.room_name, mock_room_name(self.room_id))
        self.assertTrue(token.token.startswith(f"mock-token-{self.room_id}-"))
        self.assertIsNone(token.ws_url)
        self.assertIsNone(token.connection_url)
        self.assertEqual(token.expires_in, 3600)

        provider.end_room(self.room)

    @override_settings(
        AUDIO_PROVIDER="agora",
        AGORA_APP_ID="0123456789abcdef0123456789abcdef",
        AGORA_APP_CERTIFICATE="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    )
    def test_agora_provider_returns_expected_response_shape_when_configured(self):
        self._auth(self.guest_token)
        response = self.client.post(self.audio_token_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        audio = response.data["audio"]
        self.assertEqual(audio["provider"], "agora")
        self.assertEqual(audio["app_id"], "0123456789abcdef0123456789abcdef")
        self.assertEqual(audio["room_name"], mock_room_name(self.room_id))
        self.assertEqual(audio["uid"], agora_uid_for_user(self.guest_user))
        self.assertTrue(len(audio["token"]) > 20)
        self.assertIsNone(audio["ws_url"])
        self.assertEqual(audio["expires_in"], 3600)
        self.assertTrue(audio["muted_by_default"])

    @override_settings(AUDIO_PROVIDER="agora", AGORA_APP_ID="", AGORA_APP_CERTIFICATE="")
    def test_missing_agora_config_fails_clearly(self):
        self._auth(self.guest_token)
        response = self.client.post(self.audio_token_url)
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertIn("AGORA_APP_ID", response.data["detail"])

    def test_agora_uid_is_stable_from_user_id(self):
        self.assertEqual(agora_uid_for_user(self.guest_user), self.guest_user.id)

    @override_settings(
        AUDIO_PROVIDER="agora",
        AGORA_APP_ID="0123456789abcdef0123456789abcdef",
        AGORA_APP_CERTIFICATE="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    )
    def test_agora_token_uid_matches_user_id(self):
        provider = AgoraAudioProvider()
        token = provider.create_token(self.room, self.guest_user)
        self.assertEqual(token.uid, self.guest_user.id)
