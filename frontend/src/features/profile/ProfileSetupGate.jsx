import { useState } from "react";
import { BuroLogo, Button } from "../../components";
import { useAuth } from "../../context/AuthContext";
import "../auth/AuthForm.css";
import "./ProfileSetupGate.css";

const PREVIEW_SRC = {
  male: "/avatars/male/male_01.svg",
  female: "/avatars/female/female_01.svg",
};

export function needsProfileSetup(profile) {
  return Boolean(profile) && !profile.gender;
}

export default function ProfileSetupGate({ children }) {
  const { profile, updateProfile, extractErrorMessage } = useAuth();
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!needsProfileSetup(profile)) {
    return children;
  }

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!gender || loading) return;
    setError("");
    setLoading(true);
    try {
      await updateProfile({ gender });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup">
      <div className="profile-setup__header">
        <BuroLogo size="lg" showTagline />
        <h1 className="profile-setup__title">Choose your Buro avatar</h1>
        <p className="profile-setup__subtitle">Pick one to set your default Buro avatar.</p>
      </div>

      <form className="profile-setup__form" onSubmit={handleContinue}>
        {error && <p className="auth-form__error">{error}</p>}

        <div className="profile-setup__preview" aria-hidden="true">
          <img
            className="profile-setup__preview-img"
            src={gender ? PREVIEW_SRC[gender] : PREVIEW_SRC.male}
            alt=""
          />
        </div>

        <fieldset className="auth-form__gender">
          <legend className="auth-form__gender-label">Gender</legend>
          <div className="auth-form__gender-options">
            <label className="auth-form__gender-option">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={gender === "male"}
                onChange={(e) => setGender(e.target.value)}
              />
              <span>Male</span>
            </label>
            <label className="auth-form__gender-option">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={gender === "female"}
                onChange={(e) => setGender(e.target.value)}
              />
              <span>Female</span>
            </label>
          </div>
        </fieldset>

        <Button type="submit" size="lg" fullWidth disabled={!gender || loading}>
          {loading ? "Saving…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
