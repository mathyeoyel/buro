import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BuroLogo, Button, Input } from "../../components";
import { useAuth } from "../../context/AuthContext";
import "./AuthForm.css";

export default function SignupPage() {
  const { signup, extractErrorMessage } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    display_name: "",
    gender: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.gender) {
      setError("Please choose Male or Female for your Buro avatar.");
      return;
    }
    setLoading(true);
    try {
      await signup(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__header">
        <BuroLogo size="lg" showTagline />
        <h1 className="auth-page__title">Create your account</h1>
        <p className="auth-page__subtitle">Sign up and start jazzing in seconds.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="auth-form__error">{error}</p>}

        <Input
          label="Display name"
          name="display_name"
          value={form.display_name}
          onChange={handleChange}
          placeholder="What should we call you?"
          required
          autoComplete="name"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="At least 8 characters"
          required
          minLength={8}
          autoComplete="new-password"
        />

        <fieldset className="auth-form__gender">
          <legend className="auth-form__gender-label">Gender</legend>
          <p className="auth-form__gender-hint">Used for your Buro avatar.</p>
          <div className="auth-form__gender-options">
            <label className="auth-form__gender-option">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={form.gender === "male"}
                onChange={handleChange}
              />
              <span>Male</span>
            </label>
            <label className="auth-form__gender-option">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={form.gender === "female"}
                onChange={handleChange}
              />
              <span>Female</span>
            </label>
          </div>
        </fieldset>

        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? "Creating account…" : "Start Jazzing"}
        </Button>
      </form>

      <p className="auth-form__footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
