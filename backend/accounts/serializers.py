from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Profile
from .utils import generate_unique_username

User = get_user_model()


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = (
            "display_name",
            "username",
            "avatar_url",
            "bio",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("username", "created_at", "updated_at")


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ("display_name", "avatar_url", "bio")


class UserSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(source="date_joined", read_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "created_at")
        read_only_fields = fields


class SignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    display_name = serializers.CharField(max_length=100)
    username = serializers.CharField(max_length=50, required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        email = validated_data["email"]
        password = validated_data["password"]
        display_name = validated_data["display_name"].strip()
        preferred_username = validated_data.get("username", "").strip() or None
        username = generate_unique_username(display_name, preferred_username)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
        profile = Profile.objects.create(
            user=user,
            display_name=display_name,
            username=username,
        )
        return user, profile


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"].lower()
        password = attrs["password"]

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"detail": "Invalid email or password."})

        authenticated = authenticate(username=user.username, password=password)
        if not authenticated:
            raise serializers.ValidationError({"detail": "Invalid email or password."})

        attrs["user"] = authenticated
        return attrs
