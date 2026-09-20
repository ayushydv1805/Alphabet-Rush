import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-container">
      <div className="game-card">

        <div className="logo">
          🔤
        </div>

        <h1>ALPHABET RUSH</h1>

        <p className="tagline">
          Think Fast. Type Faster.
        </p>

        <div className="buttons">

          <Link to="/create-room" className="create-btn">
            CREATE ROOM
          </Link>

          <Link to="/join-room" className="join-btn">
            JOIN ROOM
          </Link>

        </div>

        <div className="features">

          <div className="feature">
            <span>👥</span>
            <div>
              <strong>10 Players</strong>
              <small>Play with friends</small>
            </div>
          </div>

          <div className="feature">
            <span>⏱️</span>
            <div>
              <strong>60 Seconds</strong>
              <small>Think and type fast</small>
            </div>
          </div>

          <div className="feature">
            <span>🏆</span>
            <div>
              <strong>Fastest Wins</strong>
              <small>Be quick & correct</small>
            </div>
          </div>

        </div>

        <p className="version">
          Multiplayer Word Challenge
        </p>

      </div>
    </div>
  );
}

export default Home;