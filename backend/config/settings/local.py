"""Environment-based Django settings for Buro."""

from .base import *  # noqa: F403

DEBUG = True

ALLOWED_HOSTS = os.environ.get(  # noqa: F405
    "DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1"
).split(",")

CORS_ALLOWED_ORIGINS = os.environ.get(  # noqa: F405
    "DJANGO_CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

if os.environ.get("DATABASE_URL"):  # noqa: F405
    DATABASES["default"] = dj_database_url.config(  # noqa: F405
        default=os.environ["DATABASE_URL"],  # noqa: F405
        conn_max_age=600,
    )

if os.environ.get("REDIS_URL"):  # noqa: F405
    CHANNEL_LAYERS = {  # noqa: F405
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {"hosts": [os.environ["REDIS_URL"]]},  # noqa: F405
        }
    }
