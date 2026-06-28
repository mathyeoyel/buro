import axios from "axios";

// NOTE: `withCredentials` is intentionally OFF for now.
// The MVP has no authenticated/cookie-based endpoints yet, and enabling it
// breaks simple CORS reads unless the backend also sends
// `Access-Control-Allow-Credentials: true` (django-cors-headers default is off).
// Re-enable this together with `CORS_ALLOW_CREDENTIALS = True` when session auth lands.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
