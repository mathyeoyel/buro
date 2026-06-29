from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from accounts.avatar import assign_avatar_key
from accounts.models import Profile

User = get_user_model()


def signup_payload(email, display_name, gender="male", password="securepass123"):
    return {
        "email": email,
        "password": password,
        "display_name": display_name,
        "gender": gender,
    }


class AuthAPITests(APITestCase):
    def setUp(self):
        self.signup_url = reverse("auth-signup")
        self.login_url = reverse("auth-login")
        self.logout_url = reverse("auth-logout")
        self.me_url = reverse("auth-me")
        self.profile_url = reverse("profile-me")

    def test_signup_creates_user_profile_and_token(self):
        payload = signup_payload("amina@example.com", "Amina K", "female")
        response = self.client.post(self.signup_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["email"], "amina@example.com")
        self.assertEqual(response.data["profile"]["display_name"], "Amina K")
        self.assertEqual(response.data["profile"]["gender"], "female")
        self.assertTrue(response.data["profile"]["avatar_key"].startswith("female_"))
        self.assertTrue(User.objects.filter(email="amina@example.com").exists())
        user = User.objects.get(email="amina@example.com")
        self.assertTrue(hasattr(user, "profile"))
        self.assertTrue(Token.objects.filter(user=user).exists())

    def test_signup_requires_gender(self):
        response = self.client.post(
            self.signup_url,
            {
                "email": "nogender@example.com",
                "password": "securepass123",
                "display_name": "No Gender",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("gender", response.data)

    def test_signup_rejects_invalid_gender(self):
        response = self.client.post(
            self.signup_url,
            {
                "email": "badgender@example.com",
                "password": "securepass123",
                "display_name": "Bad Gender",
                "gender": "other",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("gender", response.data)

    def test_male_signup_gets_male_avatar_key(self):
        response = self.client.post(
            self.signup_url,
            signup_payload("maleuser@example.com", "Male User", "male"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        avatar_key = response.data["profile"]["avatar_key"]
        self.assertTrue(avatar_key.startswith("male_"))
        user = User.objects.get(email="maleuser@example.com")
        self.assertEqual(avatar_key, assign_avatar_key("male", user.id))

    def test_female_signup_gets_female_avatar_key(self):
        response = self.client.post(
            self.signup_url,
            signup_payload("femaleuser@example.com", "Female User", "female"),
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        avatar_key = response.data["profile"]["avatar_key"]
        self.assertTrue(avatar_key.startswith("female_"))
        user = User.objects.get(email="femaleuser@example.com")
        self.assertEqual(avatar_key, assign_avatar_key("female", user.id))

    def test_login_returns_token(self):
        signup = signup_payload("deng@example.com", "Deng M", "male")
        self.client.post(self.signup_url, signup, format="json")

        response = self.client.post(
            self.login_url,
            {"email": "deng@example.com", "password": "securepass123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["profile"]["display_name"], "Deng M")
        self.assertIn("gender", response.data["profile"])
        self.assertIn("avatar_key", response.data["profile"])

    def test_me_requires_auth(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_user_and_profile_when_authenticated(self):
        signup = self.client.post(
            self.signup_url,
            signup_payload("joy@example.com", "Joy O", "female"),
            format="json",
        )
        token = signup.data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["email"], "joy@example.com")
        self.assertEqual(response.data["profile"]["display_name"], "Joy O")
        self.assertEqual(response.data["profile"]["gender"], "female")

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
            signup_payload("edit@example.com", "Edit Me", "male"),
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

    def test_profile_gender_update_changes_avatar_key_when_no_avatar_url(self):
        signup = self.client.post(
            self.signup_url,
            signup_payload("switch@example.com", "Switch User", "male"),
            format="json",
        )
        token = signup.data["token"]
        user = User.objects.get(email="switch@example.com")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

        response = self.client.patch(
            self.profile_url,
            {"gender": "female"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["profile"]["gender"], "female")
        self.assertTrue(response.data["profile"]["avatar_key"].startswith("female_"))
        self.assertEqual(
            response.data["profile"]["avatar_key"],
            assign_avatar_key("female", user.id),
        )

    def test_logout_deletes_token(self):
        signup = self.client.post(
            self.signup_url,
            signup_payload("logout@example.com", "Logout Test", "male"),
            format="json",
        )
        token = signup.data["token"]
        user = User.objects.get(email="logout@example.com")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Token.objects.filter(user=user).exists())

    def test_existing_profile_without_gender_does_not_crash(self):
        user = User.objects.create_user(
            username="legacyuser",
            email="legacy@example.com",
            password="securepass123",
        )
        Profile.objects.create(
            user=user,
            display_name="Legacy User",
            username="legacyuser",
        )
        token, _created = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["profile"]["gender"], "")
        self.assertEqual(response.data["profile"]["avatar_key"], "")

    def test_legacy_profile_can_set_gender_male(self):
        user = User.objects.create_user(
            username="legacymale",
            email="legacymale@example.com",
            password="securepass123",
        )
        Profile.objects.create(
            user=user,
            display_name="Legacy Male",
            username="legacymale",
        )
        token, _created = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.patch(
            self.profile_url,
            {"gender": "male"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["profile"]["gender"], "male")
        self.assertTrue(response.data["profile"]["avatar_key"].startswith("male_"))
        self.assertEqual(
            response.data["profile"]["avatar_key"],
            assign_avatar_key("male", user.id),
        )

    def test_legacy_profile_can_set_gender_female(self):
        user = User.objects.create_user(
            username="legacyfemale",
            email="legacyfemale@example.com",
            password="securepass123",
        )
        Profile.objects.create(
            user=user,
            display_name="Legacy Female",
            username="legacyfemale",
        )
        token, _created = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.patch(
            self.profile_url,
            {"gender": "female"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["profile"]["gender"], "female")
        self.assertTrue(response.data["profile"]["avatar_key"].startswith("female_"))
        self.assertEqual(
            response.data["profile"]["avatar_key"],
            assign_avatar_key("female", user.id),
        )
