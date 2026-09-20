import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const THEME_KEY = "alphabet-rush-theme";

function NotFound() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    return window.localStorage.getItem(THEME_KEY) || "dark";
  });

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <main className="not-found-page" data-theme={theme}>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Light mode" : "Dark mode"}
      >
        <span className="theme-toggle-icon" aria-hidden="true">
          {isDark ? "☀️" : "🌙"}
        </span>
        <span className="theme-toggle-label">
          {isDark ? "Light" : "Dark"}
        </span>
      </button>

      <div className="not-found-orb orb-one" />
      <div className="not-found-orb orb-two" />

      <div className="not-found-card">
        <div className="not-found-badge">
          <span>🔤</span>
          <span>ALPHABET RUSH</span>
        </div>

        <div className="not-found-visual" aria-hidden="true">
          <span className="not-found-letter letter-a">A</span>
          <span className="not-found-number">4</span>
          <span className="not-found-number">0</span>
          <span className="not-found-number">4</span>
          <span className="not-found-letter letter-z">Z</span>
        </div>

        <p className="not-found-eyebrow">WRONG TURN</p>

        <h1>Page not found</h1>

        <p className="not-found-copy">
          Looks like you typed a letter that does not belong here. Let&apos;s
          get you back into the game.
        </p>

        <Link to="/" className="not-found-home-btn">
          <span>←</span>
          <span>BACK TO HOME</span>
        </Link>

        <p className="not-found-hint">
          Error code <strong>404</strong> · The requested page could not be
          found.
        </p>
      </div>
    </main>
  );
}

export default NotFound;
