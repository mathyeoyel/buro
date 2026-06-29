/**
 * Resolve the display src for a Buro avatar.
 * Priority: avatar_url → gender fallback (avatar_key) → null (initials).
 */
export default function getAvatarSrc(profileOrUser) {
  if (!profileOrUser) return null;

  const avatarUrl = profileOrUser.avatar_url;
  if (avatarUrl) return avatarUrl;

  const avatarKey = profileOrUser.avatar_key;
  if (!avatarKey) return null;

  if (avatarKey.startsWith("male_")) {
    return `/avatars/male/${avatarKey}.svg`;
  }
  if (avatarKey.startsWith("female_")) {
    return `/avatars/female/${avatarKey}.svg`;
  }

  return null;
}
