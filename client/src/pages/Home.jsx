import { Link } from "react-router-dom";
import { getAvatar, getProfile, getTitle, getLevelProgress } from "../services/profile";

function Home() {
  const profile = getProfile();
  const avatar = getAvatar(profile.avatarId);
  const title = getTitle(profile.titleId);
  const progress = getLevelProgress(profile.xp);

  return (
    <main className="home-container">
      <section className="game-card home-premium-card">
        <div className="home-topbar">
          <div className="home-profile-mini">
            <span className="home-profile-avatar">{avatar.icon}</span>
            <div>
              <strong>{profile.name || "Player"}</strong>
              <small>Lv. {profile.level} · {title.name}</small>
            </div>
          </div>
          <Link className="profile-mini-link" to="/profile">PROFILE →</Link>
        </div>

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
          <div className="feature">
            <span aria-hidden="true">👥</span>
            <div><strong>Up to 10 Players</strong><small>Invite friends to your room</small></div>
          </div>
          <div className="feature">
            <span aria-hidden="true">⏱️</span>
            <div><strong>60-Second Rounds</strong><small>Fast decisions, faster typing</small></div>
          </div>
          <div className="feature">
            <span aria-hidden="true">🏆</span>
            <div><strong>Score to Win</strong><small>Correct answers earn the points</small></div>
          </div>
        </div>

        <div className="home-level-card">
          <div>
            <span>YOUR PROGRESS</span>
            <strong>Level {profile.level}</strong>
          </div>
          <div className="home-xp-track" aria-hidden="true">
            <span style={{ width: progress + "%" }} />
          </div>
          <small>{progress}/100 XP · {profile.bestStreak} best streak</small>
        </div>

        <p className="home-note">
          Private rooms · Quick to join · Built for friendly competition
        </p>
      </section>
    </main>
  );
}

export default Home;
