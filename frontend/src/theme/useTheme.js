import { useContext } from "react";
import { ThemeContext } from "./ThemeProvider";

/**
 * @returns {{
 *   theme: 'dark' | 'light',
 *   setTheme: (theme: 'dark' | 'light') => void,
 *   toggleTheme: () => void,
 *   isDark: boolean,
 * }}
 */
export default function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
