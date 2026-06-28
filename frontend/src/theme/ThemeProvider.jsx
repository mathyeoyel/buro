import { createContext, useCallback, useMemo, useState } from "react";
import {
  applyThemeToDocument,
  DEFAULT_THEME,
  readStoredTheme,
  THEME_STORAGE_KEY,
} from "./themeTokens";

export const ThemeContext = createContext(null);

export default function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);

  const setTheme = useCallback((next) => {
    const value = next === "light" ? "light" : "dark";
    setThemeState(value);
    applyThemeToDocument(value);
    localStorage.setItem(THEME_STORAGE_KEY, value);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      isDark: theme === "dark",
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { DEFAULT_THEME };
