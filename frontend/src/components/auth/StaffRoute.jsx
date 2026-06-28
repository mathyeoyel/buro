import { Navigate } from "react-router-dom";
import LoadingState from "../ui/LoadingState";
import { useAuth } from "../../context/AuthContext";

export default function StaffRoute({ children }) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <LoadingState label="Loading…" />;
  }

  if (!user?.is_staff) {
    return <Navigate to="/rooms" replace />;
  }

  return children;
}
