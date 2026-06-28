import { useMemo } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { AppShell, MobileShell, BottomNavigation } from "../components";
import ProtectedRoute, { GuestRoute } from "../components/auth/ProtectedRoute";
import StaffRoute from "../components/auth/StaffRoute";
import SignupPage from "../features/auth/SignupPage";
import LoginPage from "../features/auth/LoginPage";
import ProfilePage from "../features/profile/ProfilePage";
import EditProfilePage from "../features/profile/EditProfilePage";
import LiveRoomsPage from "../features/rooms/LiveRoomsPage";
import LiveRoomPage from "../features/rooms/LiveRoomPage";
import AdminReportsPage from "../features/admin/AdminReportsPage";
import AdminLiveRoomsPage from "../features/admin/AdminLiveRoomsPage";

function getNavItems(pathname) {
  return [
    { id: "rooms", label: "Rooms", icon: "🎷", active: pathname === "/rooms" },
    { id: "start", label: "Start", icon: "➕", active: false },
    { id: "profile", label: "You", icon: "🙂", active: pathname.startsWith("/profile") },
  ];
}

function AuthenticatedLayout({ children, showBottomNav = true }) {
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = useMemo(() => getNavItems(location.pathname), [location.pathname]);

  const handleNavSelect = (id) => {
    if (id === "rooms") {
      navigate("/rooms");
      return;
    }
    if (id === "profile") {
      navigate("/profile");
      return;
    }
    if (id === "start") {
      navigate("/rooms?start=1");
    }
  };

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
  return <MobileShell>{children}</MobileShell>;
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

      <Route path="/" element={<Navigate to="/rooms" replace />} />

      <Route
        path="/rooms"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <LiveRoomsPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms/:roomId"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout showBottomNav={false}>
              <LiveRoomPage />
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
            <AuthenticatedLayout showBottomNav={false}>
              <EditProfilePage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute>
            <StaffRoute>
              <AuthenticatedLayout showBottomNav={false}>
                <AdminReportsPage />
              </AuthenticatedLayout>
            </StaffRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/live-rooms"
        element={
          <ProtectedRoute>
            <StaffRoute>
              <AuthenticatedLayout showBottomNav={false}>
                <AdminLiveRoomsPage />
              </AuthenticatedLayout>
            </StaffRoute>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
