from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("internal/cleanup-rooms/", views.internal_cleanup_rooms, name="internal-cleanup-rooms"),
]
