from django.contrib import admin

from .models import Room, RoomParticipant


class RoomParticipantInline(admin.TabularInline):
    model = RoomParticipant
    extra = 0
    readonly_fields = ("joined_at", "left_at")


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("title", "host", "status", "category", "started_at")
    list_filter = ("status", "category")
    search_fields = ("title", "host__email", "host__profile__display_name")
    inlines = [RoomParticipantInline]


@admin.register(RoomParticipant)
class RoomParticipantAdmin(admin.ModelAdmin):
    list_display = ("room", "user", "role", "is_muted", "joined_at", "left_at")
    list_filter = ("role", "is_muted")
