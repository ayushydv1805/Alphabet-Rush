import { Link } from "react-router-dom";

function Home() {
  return (
    <main className="home-container">
      <section className="game-card">
        <div className="logo" aria-hidden="true">🔤</div>
        <p className="home-eyebrow">REAL-TIME MULTIPLAYER</p>
        <h1>ALPHABET RUSH</h1>
        <p className="tagline">
          Think fast, find the right words, and beat your friends before the clock runs out.
        </p>

        <div className="buttons" aria-label="Game actions">
          <Link to="/create-room" className="create-btn">CREATE ROOM</Link>
          <Link to="/join-room" className="join-btn">JOIN ROOM</Link>
        </div>

        <div className="features" aria-label="Game highlights">
          <div className="feature"><span aria-hidden="true">👥</span><div><strong>Up to 10 Players</strong><small>Invite friends to your room</small></div></div>
          <div className="feature"><span aria-hidden="true">⏱️</span><div><strong>60-Second Rounds</strong><small>Fast decisions, faster typing</small></div></div>
          <div className="feature"><span aria-hidden="true">🏆</span><div><strong>Score to Win</strong><small>Correct answers earn the points</small></div></div>
        </div>

        <p className="home-note">
          Private rooms · Quick to join · Built for friendly competition
        </p>
      </section>
    </main>
  );
}

export default Home;
