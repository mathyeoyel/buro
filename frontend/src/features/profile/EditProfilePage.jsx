import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "../../components";
import { useAuth } from "../../context/AuthContext";
import "../auth/AuthForm.css";

export default function EditProfilePage() {
  const { profile, updateProfile, extractErrorMessage } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    display_name: profile?.display_name || "",
    bio: profile?.bio || "",
    avatar_url: profile?.avatar_url || "",
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

  return (
    <div className="auth-page">
      <div className="auth-page__header">
        <h1 className="auth-page__title">Edit profile</h1>
        <p className="auth-page__subtitle">Keep it simple. Just the basics.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="auth-form__error">{error}</p>}

        <Input
          label="Display name"
          name="display_name"
          value={form.display_name}
          onChange={handleChange}
          required
        />
        <Input
          label="Bio"
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Say something about yourself"
          hint="Optional — keep it short."
        />
        <Input
          label="Avatar URL"
          name="avatar_url"
          type="url"
          value={form.avatar_url}
          onChange={handleChange}
          placeholder="https://…"
          hint="Optional — paste an image link."
        />

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
