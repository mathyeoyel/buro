import { useNavigate } from "react-router-dom";
import { Avatar, Button } from "../../components";
import { useAuth } from "../../context/AuthContext";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="profile-page">
      <div className="profile-page__hero">
        <Avatar
          name={profile?.display_name}
          src={profile?.avatar_url || null}
          size="lg"
        />
        <h1 className="profile-page__name">{profile?.display_name}</h1>
        <p className="profile-page__username">@{profile?.username}</p>
        {profile?.bio && <p className="profile-page__bio">{profile.bio}</p>}
        <p className="profile-page__email">{user?.email}</p>
      </div>

      <div className="profile-page__actions">
        <Button variant="secondary" fullWidth onClick={() => navigate("/profile/edit")}>
          Edit profile
        </Button>
        <Button variant="ghost" fullWidth onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
