from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

User = get_user_model()


class AuthAPITests(APITestCase):
    def setUp(self):
        self.signup_url = reverse("auth-signup")
        self.login_url = reverse("auth-login")
        self.logout_url = reverse("auth-logout")
        self.me_url = reverse("auth-me")
        self.profile_url = reverse("profile-me")

    def test_signup_creates_user_profile_and_token(self):
        payload = {
            "email": "amina@example.com",
            "password": "securepass123",
            "display_name": "Amina K",
        }
        response = self.client.post(self.signup_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["email"], "amina@example.com")
        self.assertEqual(response.data["profile"]["display_name"], "Amina K")
        self.assertTrue(User.objects.filter(email="amina@example.com").exists())
        user = User.objects.get(email="amina@example.com")
        self.assertTrue(hasattr(user, "profile"))
        self.assertTrue(Token.objects.filter(user=user).exists())

    def test_login_returns_token(self):
        signup = {
            "email": "deng@example.com",
            "password": "securepass123",
            "display_name": "Deng M",
        }
        self.client.post(self.signup_url, signup, format="json")

        response = self.client.post(
            self.login_url,
            {"email": "deng@example.com", "password": "securepass123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["profile"]["display_name"], "Deng M")

    def test_me_requires_auth(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_user_and_profile_when_authenticated(self):
        signup = self.client.post(
            self.signup_url,
            {
                "email": "joy@example.com",
                "password": "securepass123",
                "display_name": "Joy O",
            },
            format="json",
        )
        token = signup.data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["email"], "joy@example.com")
        self.assertEqual(response.data["profile"]["display_name"], "Joy O")

    def test_profile_update_requires_auth(self):
        response = self.client.patch(
            self.profile_url,
            {"display_name": "New Name"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_update_changes_own_profile(self):
        signup = self.client.post(
            self.signup_url,
            {
                "email": "edit@example.com",
                "password": "securepass123",
                "display_name": "Edit Me",
            },
            format="json",
        )
        token = signup.data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

        response = self.client.patch(
            self.profile_url,
            {"display_name": "Updated Name", "bio": "Just jazzing."},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["profile"]["display_name"], "Updated Name")
        self.assertEqual(response.data["profile"]["bio"], "Just jazzing.")

    def test_logout_deletes_token(self):
        signup = self.client.post(
            self.signup_url,
            {
                "email": "logout@example.com",
                "password": "securepass123",
                "display_name": "Logout Test",
            },
            format="json",
        )
        token = signup.data["token"]
        user = User.objects.get(email="logout@example.com")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Token.objects.filter(user=user).exists())
