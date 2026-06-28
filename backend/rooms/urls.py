from django.urls import path

from audio.views import RoomAudioTokenView
from chat.views import RoomMessagesView
from reactions.views import RoomReactionsView

from . import views

urlpatterns = [
    path("rooms/live/", views.LiveRoomsView.as_view(), name="rooms-live"),
    path("rooms/start/", views.StartRoomView.as_view(), name="rooms-start"),
    path("rooms/<int:room_id>/", views.RoomDetailView.as_view(), name="rooms-detail"),
    path("rooms/<int:room_id>/join/", views.JoinRoomView.as_view(), name="rooms-join"),
    path("rooms/<int:room_id>/leave/", views.LeaveRoomView.as_view(), name="rooms-leave"),
    path("rooms/<int:room_id>/mute/", views.MuteRoomView.as_view(), name="rooms-mute"),
    path("rooms/<int:room_id>/end/", views.EndRoomView.as_view(), name="rooms-end"),
    path("rooms/<int:room_id>/messages/", RoomMessagesView.as_view(), name="rooms-messages"),
    path("rooms/<int:room_id>/reactions/", RoomReactionsView.as_view(), name="rooms-reactions"),
    path("rooms/<int:room_id>/audio-token/", RoomAudioTokenView.as_view(), name="rooms-audio-token"),
    path("rooms/<int:room_id>/remove-user/", views.RemoveUserView.as_view(), name="rooms-remove-user"),
    path("rooms/<int:room_id>/block-user/", views.BlockUserView.as_view(), name="rooms-block-user"),
]
