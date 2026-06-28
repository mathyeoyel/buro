from django.contrib import admin

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("display_name", "username", "user", "created_at")
    search_fields = ("display_name", "username", "user__email")
    readonly_fields = ("created_at", "updated_at")
