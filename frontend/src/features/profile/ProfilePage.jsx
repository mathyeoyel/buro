import { useNavigate } from "react-router-dom";
import { Avatar, Button, Icon } from "../../components";
import { useAuth } from "../../context/AuthContext";
import useTheme from "../../theme/useTheme";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="profile-page">
      <div className="profile-page__hero">
        <Avatar name={profile?.display_name} profile={profile} size="lg" />
        <h1 className="profile-page__name">{profile?.display_name}</h1>
        <p className="profile-page__username">@{profile?.username}</p>
        {profile?.bio && <p className="profile-page__bio">{profile.bio}</p>}
        <p className="profile-page__email">{user?.email}</p>
      </div>

      <div className="profile-page__actions">
        <div className="profile-page__theme">
          <span className="profile-page__theme-label">Theme</span>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            {isDark ? "Switch to Light" : "Switch to Dark"}
          </Button>
        </div>
        <Button variant="secondary" fullWidth onClick={() => navigate("/profile/edit")}>
          Edit profile
        </Button>
        {user?.is_staff && (
          <>
            <Button
              variant="secondary"
              fullWidth
              leadingIcon={<Icon name="report" size={18} />}
              onClick={() => navigate("/admin/reports")}
            >
              Admin reports
            </Button>
            <Button
              variant="secondary"
              fullWidth
              leadingIcon={<Icon name="admin" size={18} />}
              onClick={() => navigate("/admin/live-rooms")}
            >
              Admin live rooms
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          fullWidth
          leadingIcon={<Icon name="leave" size={18} />}
          onClick={handleLogout}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
