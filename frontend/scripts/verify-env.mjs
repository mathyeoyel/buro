#!/usr/bin/env node
// Build-time guard for Buro frontend deploys.
//
// Vite env vars are baked in at build time, so a deploy that builds without
// VITE_API_BASE_URL / VITE_WS_BASE_URL (or with localhost values) silently
// ships a broken bundle. Run this before `vite build` on CI / Cloudflare Pages
// so those builds fail loudly instead.
//
// Never logs tokens or secrets — only public API/WS base URLs.

const API_BASE_URL = process.env.VITE_API_BASE_URL;
const WS_BASE_URL = process.env.VITE_WS_BASE_URL;

const errors = [];

if (!API_BASE_URL) {
  errors.push("VITE_API_BASE_URL is missing. Set it to your backend API base, e.g. https://<backend-host>/api");
}
if (!WS_BASE_URL) {
  errors.push("VITE_WS_BASE_URL is missing. Set it to your backend WS base, e.g. wss://<backend-host>");
}

if (API_BASE_URL && API_BASE_URL.includes("localhost")) {
  errors.push(`VITE_API_BASE_URL must not point to localhost for a deployed build (got "${API_BASE_URL}").`);
}
if (WS_BASE_URL && WS_BASE_URL.includes("localhost")) {
  errors.push(`VITE_WS_BASE_URL must not point to localhost for a deployed build (got "${WS_BASE_URL}").`);
}

if (API_BASE_URL && !API_BASE_URL.includes("localhost") && !API_BASE_URL.startsWith("https://")) {
  errors.push(`VITE_API_BASE_URL must start with "https://" for staging/production (got "${API_BASE_URL}").`);
}
if (WS_BASE_URL && !WS_BASE_URL.includes("localhost") && !WS_BASE_URL.startsWith("wss://")) {
  errors.push(`VITE_WS_BASE_URL must start with "wss://" for staging/production (got "${WS_BASE_URL}").`);
}

if (errors.length > 0) {
  console.error("\nBuro frontend env verification FAILED:\n");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  console.error(
    "\nThese are Vite build-time variables. On Cloudflare Pages, set them under the" +
      "\nProduction environment and redeploy so the bundle is rebuilt with the values.\n"
  );
  process.exit(1);
}

console.info("Buro frontend env verified", {
  apiBaseUrl: API_BASE_URL,
  wsBaseUrl: WS_BASE_URL,
});
