import api, { setAuthToken } from "./api";

const TOKEN_KEY = "buro_token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
  }
}

export async function signup({ email, password, display_name }) {
  const response = await api.post("/auth/signup/", { email, password, display_name });
  return response.data;
}

export async function login({ email, password }) {
  const response = await api.post("/auth/login/", { email, password });
  return response.data;
}

export async function logout() {
  try {
    await api.post("/auth/logout/");
  } catch {
    // Token may already be invalid — still clear locally.
  } finally {
    storeToken(null);
  }
}

export async function getMe() {
  const response = await api.get("/auth/me/");
  return response.data;
}

export async function updateProfile(payload) {
  const response = await api.patch("/profile/me/", payload);
  return response.data.profile;
}

export function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return "Something went wrong. Try again.";
  if (typeof data.detail === "string") return data.detail;
  if (data.email?.[0]) return data.email[0];
  if (data.password?.[0]) return data.password[0];
  if (data.display_name?.[0]) return data.display_name[0];
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0];
  return "Something went wrong. Try again.";
}
