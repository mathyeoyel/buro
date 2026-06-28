from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from chat.models import RoomMessage
from reactions.models import RoomReaction

User = get_user_model()


class ChatReactionAPITests(APITestCase):
    def setUp(self):
        self.signup_url = reverse("auth-signup")
        self.start_url = reverse("rooms-start")

        host_signup = self.client.post(
            self.signup_url,
            {
                "email": "chathost@example.com",
                "password": "securepass123",
                "display_name": "Chat Host",
            },
            format="json",
        )
        self.host_token = host_signup.data["token"]
        self.host_user = User.objects.get(email="chathost@example.com")

        guest_signup = self.client.post(
            self.signup_url,
            {
                "email": "chatguest@example.com",
                "password": "securepass123",
                "display_name": "Chat Guest",
            },
            format="json",
        )
        self.guest_token = guest_signup.data["token"]
        self.guest_user = User.objects.get(email="chatguest@example.com")

        self._auth(self.host_token)
        start = self.client.post(self.start_url, {}, format="json")
        self.room_id = start.data["room"]["id"]
        self.messages_url = reverse("rooms-messages", args=[self.room_id])
        self.reactions_url = reverse("rooms-reactions", args=[self.room_id])

        self._auth(self.guest_token)
        self.client.post(reverse("rooms-join", args=[self.room_id]))

    def _auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    def test_messages_route_exists(self):
        self._auth(self.guest_token)
        response = self.client.get(self.messages_url)
        self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_reactions_route_exists(self):
        self._auth(self.guest_token)
        response = self.client.post(
            self.reactions_url, {"reaction_type": "laugh"}, format="json"
        )
        self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_request_rejected(self):
        self.client.credentials()
        messages = self.client.get(self.messages_url)
        reactions = self.client.post(
            self.reactions_url, {"reaction_type": "laugh"}, format="json"
        )
        self.assertIn(
            messages.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )
        self.assertIn(
            reactions.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_participant_can_list_latest_messages(self):
        self._auth(self.host_token)
        self.client.post(self.messages_url, {"body": "Hello room"}, format="json")

        self._auth(self.guest_token)
        response = self.client.get(self.messages_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["messages"]), 1)
        self.assertEqual(response.data["messages"][0]["body"], "Hello room")

    @patch("chat.views.broadcast_chat_message")
    def test_participant_can_send_message(self, mock_broadcast):
        self._auth(self.guest_token)
        response = self.client.post(self.messages_url, {"body": "That joke landed"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["message"]["body"], "That joke landed")
        self.assertEqual(response.data["message"]["sender"]["display_name"], "Chat Guest")
        self.assertEqual(RoomMessage.objects.count(), 1)
        mock_broadcast.assert_called_once()

    def test_non_participant_cannot_send_message(self):
        outsider_signup = self.client.post(
            self.signup_url,
            {
                "email": "outsider@example.com",
                "password": "securepass123",
                "display_name": "Outsider",
            },
            format="json",
        )
        self._auth(outsider_signup.data["token"])
        response = self.client.post(self.messages_url, {"body": "Nope"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_empty_message_rejected(self):
        self._auth(self.guest_token)
        response = self.client.post(self.messages_url, {"body": "   "}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_too_long_message_rejected(self):
        self._auth(self.guest_token)
        response = self.client.post(
            self.messages_url, {"body": "x" * 281}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_ended_room_rejects_message(self):
        self._auth(self.host_token)
        self.client.post(reverse("rooms-end", args=[self.room_id]))

        self._auth(self.guest_token)
        response = self.client.post(self.messages_url, {"body": "Too late"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("chat.views.broadcast_chat_message")
    def test_sending_message_broadcasts_chat_message(self, mock_broadcast):
        self._auth(self.guest_token)
        response = self.client.post(self.messages_url, {"body": "Broadcast me"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mock_broadcast.assert_called_once_with(self.room_id, response.data["message"])

    @patch("reactions.views.broadcast_reaction_sent")
    def test_participant_can_send_valid_reaction(self, mock_broadcast):
        self._auth(self.guest_token)
        response = self.client.post(
            self.reactions_url, {"reaction_type": "laugh"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["reaction"]["reaction_type"], "laugh")
        self.assertEqual(RoomReaction.objects.count(), 1)
        mock_broadcast.assert_called_once()

    def test_invalid_reaction_rejected(self):
        self._auth(self.guest_token)
        response = self.client.post(
            self.reactions_url, {"reaction_type": "party"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_participant_cannot_react(self):
        outsider_signup = self.client.post(
            self.signup_url,
            {
                "email": "reactoutsider@example.com",
                "password": "securepass123",
                "display_name": "React Outsider",
            },
            format="json",
        )
        self._auth(outsider_signup.data["token"])
        response = self.client.post(
            self.reactions_url, {"reaction_type": "clap"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_ended_room_rejects_reaction(self):
        self._auth(self.host_token)
        self.client.post(reverse("rooms-end", args=[self.room_id]))

        self._auth(self.guest_token)
        response = self.client.post(
            self.reactions_url, {"reaction_type": "fire"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("reactions.views.broadcast_reaction_sent")
    def test_sending_reaction_broadcasts_reaction_sent(self, mock_broadcast):
        self._auth(self.guest_token)
        response = self.client.post(
            self.reactions_url, {"reaction_type": "love"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mock_broadcast.assert_called_once_with(self.room_id, response.data["reaction"])
