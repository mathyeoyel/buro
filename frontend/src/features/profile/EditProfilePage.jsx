import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Avatar } from "../../components";
import { useAuth } from "../../context/AuthContext";
import "../auth/AuthForm.css";

export default function EditProfilePage() {
  const { profile, updateProfile, extractErrorMessage } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    display_name: profile?.display_name || "",
    bio: profile?.bio || "",
    avatar_url: profile?.avatar_url || "",
    gender: profile?.gender || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await updateProfile(form);
      navigate("/profile", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const previewProfile = { ...profile, ...form };

  return (
    <div className="auth-page">
      <div className="auth-page__header">
        <h1 className="auth-page__title">Edit profile</h1>
        <p className="auth-page__subtitle">Shape your Buro identity.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="auth-form__error">{error}</p>}

        <div className="auth-form__avatar-preview">
          <Avatar
            name={form.display_name}
            profile={previewProfile}
            size="lg"
            className="auth-form__avatar-preview-img"
          />
        </div>

        <Input
          label="Display name"
          name="display_name"
          value={form.display_name}
          onChange={handleChange}
          required
        />

        <fieldset className="auth-form__gender">
          <legend className="auth-form__gender-label">Gender</legend>
          <div className="auth-form__avatar-cards">
            <button
              type="button"
              className={[
                "auth-form__avatar-card",
                form.gender === "male" ? "is-selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={form.gender === "male"}
              onClick={() => setForm((prev) => ({ ...prev, gender: "male" }))}
            >
              <img
                className="auth-form__avatar-card-img"
                src="/avatars/male/male_01.svg"
                alt=""
                aria-hidden="true"
              />
              <span className="auth-form__avatar-card-label">Male</span>
            </button>
            <button
              type="button"
              className={[
                "auth-form__avatar-card",
                form.gender === "female" ? "is-selected" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-pressed={form.gender === "female"}
              onClick={() => setForm((prev) => ({ ...prev, gender: "female" }))}
            >
              <img
                className="auth-form__avatar-card-img"
                src="/avatars/female/female_01.svg"
                alt=""
                aria-hidden="true"
              />
              <span className="auth-form__avatar-card-label">Female</span>
            </button>
          </div>
        </fieldset>

        <Input
          label="Bio"
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Say something about yourself"
        />

        <div className="auth-form__optional">
          <Input
            label="Avatar URL"
            name="avatar_url"
            type="url"
            value={form.avatar_url}
            onChange={handleChange}
            placeholder="https://…"
          />
        </div>

        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="ghost" fullWidth onClick={() => navigate("/profile")}>
          Cancel
        </Button>
      </form>
    </div>
  );
}
