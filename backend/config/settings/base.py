"""Shared Django settings for Buro."""

import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
REPO_ROOT = BASE_DIR.parent

load_dotenv(REPO_ROOT / ".env")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-only-change-me")
DEBUG = os.environ.get("DJANGO_DEBUG", "False") == "True"

ALLOWED_HOSTS: list[str] = []
CORS_ALLOWED_ORIGINS: list[str] = []

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "channels",
    "accounts",
    "rooms",
    "chat",
    "reactions",
    "safety",
    "audio",
    "common",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
ASGI_APPLICATION = "config.asgi.application"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
}

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    }
}

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

# Room limits — see docs/COST_CONTROLS.md
ROOM_MAX_PARTICIPANTS = int(os.environ.get("ROOM_MAX_PARTICIPANTS", "30"))
ROOM_MAX_DURATION_MINUTES = int(os.environ.get("ROOM_MAX_DURATION_MINUTES", "60"))
ROOM_MAX_PER_USER_PER_DAY = int(os.environ.get("ROOM_MAX_PER_USER_PER_DAY", "5"))
ROOM_AUTO_END_EMPTY_AFTER_MINUTES = int(os.environ.get("ROOM_AUTO_END_EMPTY_AFTER_MINUTES", "5"))
ROOM_CREATION_ENABLED = os.environ.get("ROOM_CREATION_ENABLED", "True") == "True"

# Audio provider — see docs/AUDIO_PROVIDER.md
AUDIO_PROVIDER = os.environ.get("AUDIO_PROVIDER", "mock")
AGORA_APP_ID = os.environ.get("AGORA_APP_ID", "")
AGORA_APP_CERTIFICATE = os.environ.get("AGORA_APP_CERTIFICATE", "")
AGORA_TOKEN_EXPIRES_IN = int(os.environ.get("AGORA_TOKEN_EXPIRES_IN", "3600"))
