"""Production settings — use only on deployed environments (staging + future prod)."""

from .base import *  # noqa: F403


def _split_env(name):
    """Parse a comma-separated env var into a clean list (no empty entries)."""
    return [item.strip() for item in os.environ.get(name, "").split(",") if item.strip()]  # noqa: F405


DEBUG = False

ALLOWED_HOSTS = _split_env("DJANGO_ALLOWED_HOSTS")
CORS_ALLOWED_ORIGINS = _split_env("DJANGO_CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS = _split_env("DJANGO_CSRF_TRUSTED_ORIGINS")

# Behind a TLS-terminating proxy (Render/Koyeb), trust the forwarded scheme so
# Django admin login + CSRF work over HTTPS.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# Secure cookies for the admin session/CSRF (staging is served over HTTPS).
# HSTS and SSL redirect are intentionally left off for staging to avoid
# redirect loops and irreversible HSTS while on temporary host URLs.
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Serve admin/static assets with WhiteNoise (compressed + hashed manifest).
STORAGES = {  # noqa: F405
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"
    },
}

if not os.environ.get("DATABASE_URL"):  # noqa: F405
    raise ValueError("DATABASE_URL is required in production settings.")

DATABASES["default"] = dj_database_url.config(  # noqa: F405
    default=os.environ["DATABASE_URL"],  # noqa: F405
    conn_max_age=600,
)

if not os.environ.get("REDIS_URL"):  # noqa: F405
    raise ValueError("REDIS_URL is required in production settings.")

CHANNEL_LAYERS = {  # noqa: F405
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [os.environ["REDIS_URL"]]},  # noqa: F405
    }
}
