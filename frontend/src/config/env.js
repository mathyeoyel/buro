// Single source of truth for environment-driven URLs.
//
// These are Vite build-time variables: they are baked into the bundle when
// `npm run build` runs. Changing them on the host (e.g. Cloudflare Pages)
// requires a fresh build/redeploy to take effect.
//
// localhost values are ONLY fallbacks for local development.

function stripTrailingSlashes(value) {
  return value.replace(/\/+$/, "");
}

export const API_BASE_URL = stripTrailingSlashes(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
);

export const WS_BASE_URL = stripTrailingSlashes(
  import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000"
);

if (import.meta.env.DEV) {
  // Dev-only sanity check. Never logs tokens.
  console.debug("Buro env", { API_BASE_URL, WS_BASE_URL });
}

// TEMPORARY (remove after staging WS is verified): one-time startup log so we can
// confirm the deployed bundle uses the real backend URLs, not localhost.
// Safe — these are public endpoints, never auth tokens.
console.info("Buro runtime env", {
  apiBaseUrl: API_BASE_URL,
  wsBaseUrl: WS_BASE_URL,
});
