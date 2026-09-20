import { useTheme } from "../../hooks/useTheme";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="global-theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="global-theme-icon" aria-hidden="true">
        {isDark ? "☀️" : "🌙"}
      </span>
      <span className="global-theme-text">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}

export default ThemeToggle;
