import { useMemo } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AppShell, MobileShell, BottomNavigation } from "../components";
import ProtectedRoute, { GuestRoute } from "../components/auth/ProtectedRoute";
import PlaceholderPage from "./PlaceholderPage";
import SignupPage from "../features/auth/SignupPage";
import LoginPage from "../features/auth/LoginPage";
import ProfilePage from "../features/profile/ProfilePage";
import EditProfilePage from "../features/profile/EditProfilePage";

function getNavItems(pathname) {
  return [
    { id: "rooms", label: "Rooms", icon: "🎷", active: pathname === "/" },
    { id: "start", label: "Start", icon: "➕", active: false },
    { id: "profile", label: "You", icon: "🙂", active: pathname.startsWith("/profile") },
  ];
}

function AuthenticatedLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = useMemo(() => getNavItems(location.pathname), [location.pathname]);

  const handleNavSelect = (id) => {
    if (id === "rooms") navigate("/");
    if (id === "profile") navigate("/profile");
  };

  const showBottomNav = !location.pathname.startsWith("/profile/edit");

  return (
    <MobileShell
      header={<AppShell />}
      bottomNav={
        showBottomNav ? (
          <BottomNavigation items={navItems} onSelect={handleNavSelect} />
        ) : null
      }
    >
      {children}
    </MobileShell>
  );
}

function AuthLayout({ children }) {
  return (
    <MobileShell>
      {children}
    </MobileShell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <AuthLayout>
              <SignupPage />
            </AuthLayout>
          </GuestRoute>
        }
      />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </GuestRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <PlaceholderPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <ProfilePage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <EditProfilePage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
