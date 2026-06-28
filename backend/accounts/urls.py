from django.urls import path

from . import views

urlpatterns = [
    path("auth/signup/", views.SignupView.as_view(), name="auth-signup"),
    path("auth/login/", views.LoginView.as_view(), name="auth-login"),
    path("auth/logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", views.MeView.as_view(), name="auth-me"),
    path("profile/me/", views.ProfileMeView.as_view(), name="profile-me"),
]
