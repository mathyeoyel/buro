"""Stable Buro fallback avatar assignment by gender and user id."""

MALE_AVATAR_KEYS = tuple(f"male_{i:02d}" for i in range(1, 7))
FEMALE_AVATAR_KEYS = tuple(f"female_{i:02d}" for i in range(1, 7))

GENDER_POOLS = {
    "male": MALE_AVATAR_KEYS,
    "female": FEMALE_AVATAR_KEYS,
}


def assign_avatar_key(gender: str, user_id: int) -> str:
    """Return a stable avatar_key from the gender pool based on user id."""
    pool = GENDER_POOLS.get(gender)
    if not pool:
        return ""
    return pool[user_id % len(pool)]
