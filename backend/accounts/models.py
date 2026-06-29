from django.conf import settings
from django.db import models


class Profile(models.Model):
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    display_name = models.CharField(max_length=100)
    username = models.CharField(max_length=50, unique=True)
    gender = models.CharField(
        max_length=10,
        choices=Gender.choices,
        blank=True,
        default="",
    )
    avatar_key = models.CharField(max_length=20, blank=True, default="")
    avatar_url = models.URLField(blank=True, default="")
    bio = models.CharField(max_length=280, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.display_name
