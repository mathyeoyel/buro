import axios from "axios";

import { API_BASE_URL } from "../config/env";

// Token auth only — withCredentials stays OFF (no cookie sessions).
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Token ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export default api;
