import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BuroLogo, Button, Input } from "../../components";
import { useAuth } from "../../context/AuthContext";
import "./AuthForm.css";

export default function LoginPage() {
  const { login, extractErrorMessage } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
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
      await login(form);
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
        <h1 className="auth-page__title">Welcome back</h1>
        <p className="auth-page__subtitle">Sign in and jump back into the jazz.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="auth-form__error">{error}</p>}

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
          placeholder="Your password"
          required
          autoComplete="current-password"
        />

        <Button type="submit" size="lg" fullWidth disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </form>

      <p className="auth-form__footer">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </div>
  );
}
