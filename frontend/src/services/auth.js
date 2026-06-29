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

export async function signup({ email, password, display_name, gender }) {
  const response = await api.post("/auth/signup/", {
    email,
    password,
    display_name,
    gender,
  });
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

const FIELD_LABELS = {
  email: "Email",
  password: "Password",
  display_name: "Display name",
  gender: "Gender",
  non_field_errors: "",
};

function firstFieldError(data, key) {
  const value = data[key];
  const message = Array.isArray(value) ? value[0] : value;
  if (typeof message !== "string") return null;
  const label = FIELD_LABELS[key] ?? key;
  return label ? `${label}: ${message}` : message;
}

export function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return "Something went wrong. Try again.";
  if (typeof data.detail === "string") return data.detail;

  const priority = ["gender", "email", "password", "display_name", "non_field_errors"];
  for (const key of priority) {
    if (data[key]) {
      const message = firstFieldError(data, key);
      if (message) return message;
    }
  }

  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const message = firstFieldError(data, firstKey);
    if (message) return message;
  }
  return "Something went wrong. Try again.";
}
