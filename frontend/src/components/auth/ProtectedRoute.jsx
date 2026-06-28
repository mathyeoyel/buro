import { Navigate, useLocation } from "react-router-dom";
import LoadingState from "../ui/LoadingState";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <LoadingState label="Tuning in…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return <LoadingState label="Tuning in…" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
