import re

from django.contrib.auth import get_user_model

User = get_user_model()


def slugify_username(value: str) -> str:
    """Turn display_name into a URL-safe username base."""
    base = value.strip().lower()
    base = re.sub(r"[^a-z0-9]+", "_", base)
    base = base.strip("_")
    return base[:40] or "jazzer"


def generate_unique_username(display_name: str, preferred: str | None = None) -> str:
    """Return a unique username, auto-suffixing when needed."""
    base = slugify_username(preferred or display_name)
    candidate = base
    suffix = 1

    while User.objects.filter(username=candidate).exists():
        suffix += 1
        candidate = f"{base}_{suffix}"

    return candidate
