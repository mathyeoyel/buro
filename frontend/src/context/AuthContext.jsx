import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  extractErrorMessage,
  getMe,
  getStoredToken,
  login as loginRequest,
  logout as logoutRequest,
  signup as signupRequest,
  storeToken,
  updateProfile as updateProfileRequest,
} from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const applySession = useCallback((data) => {
    setUser(data.user);
    setProfile(data.profile);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setProfile(null);
  }, []);

  const refreshMe = useCallback(async () => {
    const data = await getMe();
    applySession(data);
    return data;
  }, [applySession]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setInitializing(false);
      return;
    }

    storeToken(token);
    refreshMe()
      .catch(() => {
        storeToken(null);
        clearSession();
      })
      .finally(() => setInitializing(false));
  }, [refreshMe, clearSession]);

  const signup = useCallback(
    async (payload) => {
      const data = await signupRequest(payload);
      storeToken(data.token);
      applySession(data);
      return data;
    },
    [applySession]
  );

  const login = useCallback(
    async (payload) => {
      const data = await loginRequest(payload);
      storeToken(data.token);
      applySession(data);
      return data;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    clearSession();
  }, [clearSession]);

  const updateProfile = useCallback(
    async (payload) => {
      const updated = await updateProfileRequest(payload);
      setProfile(updated);
      return updated;
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      isAuthenticated: Boolean(user),
      initializing,
      signup,
      login,
      logout,
      refreshMe,
      updateProfile,
      extractErrorMessage,
    }),
    [user, profile, initializing, signup, login, logout, refreshMe, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
