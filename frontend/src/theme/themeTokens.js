/** @typedef {'dark' | 'light'} ThemeName */

export const THEME_STORAGE_KEY = "buro_theme";
export const DEFAULT_THEME = "dark";

/** @type {ThemeName[]} */
export const THEMES = ["dark", "light"];

/**
 * Read persisted theme from localStorage. Falls back to dark.
 * @returns {ThemeName}
 */
export function readStoredTheme() {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : DEFAULT_THEME;
}

/**
 * Apply theme to the document root before React paints (avoids flash).
 * @param {ThemeName} theme
 */
export function applyThemeToDocument(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

// Set initial theme synchronously on module load.
applyThemeToDocument(readStoredTheme());
