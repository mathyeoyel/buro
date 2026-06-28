from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile
from .serializers import (
    LoginSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    SignupSerializer,
    UserSerializer,
)

User = get_user_model()


def auth_payload(user, token_key):
    profile = user.profile
    return {
        "token": token_key,
        "user": UserSerializer(user).data,
        "profile": ProfileSerializer(profile).data,
    }


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, _profile = serializer.save()
        token, _created = Token.objects.get_or_create(user=user)
        return Response(auth_payload(user, token.key), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _created = Token.objects.get_or_create(user=user)
        return Response(auth_payload(user, token.key))


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "user": UserSerializer(request.user).data,
                "profile": ProfileSerializer(request.user.profile).data,
            }
        )


class ProfileMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"profile": ProfileSerializer(request.user.profile).data})

    def patch(self, request):
        profile = request.user.profile
        serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"profile": ProfileSerializer(profile).data})
