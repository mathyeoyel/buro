"""Production settings — use only on deployed environments."""

from .base import *  # noqa: F403

DEBUG = False

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",")  # noqa: F405
CORS_ALLOWED_ORIGINS = os.environ.get("DJANGO_CORS_ALLOWED_ORIGINS", "").split(",")  # noqa: F405

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
