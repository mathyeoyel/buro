from django.urls import path

from . import views

urlpatterns = [
    path("reports/", views.ReportCreateView.as_view(), name="reports-create"),
    path("admin/reports/", views.AdminReportListView.as_view(), name="admin-reports"),
    path(
        "admin/reports/<int:report_id>/",
        views.AdminReportDetailView.as_view(),
        name="admin-report-detail",
    ),
    path("admin/live-rooms/", views.AdminLiveRoomsView.as_view(), name="admin-live-rooms"),
    path(
        "admin/rooms/<int:room_id>/end/",
        views.AdminEndRoomView.as_view(),
        name="admin-room-end",
    ),
    path(
        "admin/users/<int:user_id>/suspend/",
        views.AdminSuspendUserView.as_view(),
        name="admin-user-suspend",
    ),
    path(
        "admin/users/<int:user_id>/unsuspend/",
        views.AdminUnsuspendUserView.as_view(),
        name="admin-user-unsuspend",
    ),
]
