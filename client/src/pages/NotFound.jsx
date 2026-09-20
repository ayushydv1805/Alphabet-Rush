import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="home-container">
      <div className="game-card">
        <div className="logo">🔤</div>
        <h1>404</h1>
        <p className="tagline">Oops! This page does not exist.</p>

        <div className="buttons">
          <Link to="/" className="create-btn">
            BACK TO HOME
          </Link>
        </div>

        <p className="version">
          The page you are looking for may have moved or no longer exists.
        </p>
      </div>
    </div>
  );
}

export default NotFound;
