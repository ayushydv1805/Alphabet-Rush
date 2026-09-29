import { Link } from "react-router-dom";
import {
  getAvatar,
  getProfile,
  getTitle,
  getLevelProgress,
} from "../services/profile";
import { GAME_MODES } from "../constants/game";

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
          <div className="home-top-links">
            <Link className="home-ranking-link" to="/rankings">🏆 RANKINGS</Link>
            <Link className="profile-mini-link" to="/profile">PROFILE →</Link>
          </div>
        </div>

        <div className="home-layout">
          <div className="home-main-copy">
            <div className="logo" aria-hidden="true">🔤</div>
            <p className="home-eyebrow">REAL-TIME WORD ARENA</p>
            <h1>ALPHABET <span>RUSH</span></h1>
            <p className="tagline">
              Think fast. Type faster. Prove you can find the right word before your rivals.
            </p>

            <div className="buttons" aria-label="Game actions">
              <Link to="/create-room" className="create-btn">CREATE ROOM</Link>
              <Link to="/join-room" className="join-btn">JOIN ROOM</Link>
            </div>

            <div className="home-mode-strip" aria-label="Game modes">
              {GAME_MODES.map((mode) => (
                <span key={mode.id} className="home-mode-chip">
                  {mode.icon} {mode.name}
                </span>
              ))}
            </div>
          </div>

          <aside className="home-showcase" aria-label="Game preview">
            <div className="showcase-topline">
              <span>LIVE ROUND PREVIEW</span>
              <span className="showcase-live-dot">● LIVE</span>
            </div>

            <div className="showcase-letter-wrap">
              <small>LETTER</small>
              <strong>R</strong>
              <span>60s</span>
            </div>

            <div className="showcase-fields">
              {[
                ["Name", "Rahul", "✓"],
                ["Place", "Rewari", "✓"],
                ["Thing", "Rocket", "✓"],
                ["Animal", "Rabbit", "✓"],
                ["Food", "Rice", "✓"],
              ].map(([label, value, icon]) => (
                <div className="showcase-field" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                  <em>{icon}</em>
                </div>
              ))}
            </div>

            <div className="showcase-footer">
              <div>
                <span>YOUR SCORE</span>
                <strong>5 / 5</strong>
              </div>
              <div className="showcase-streak">🔥 4 STREAK</div>
            </div>
          </aside>
        </div>

        <div className="features" aria-label="Game highlights">
          <div className="feature">
            <span aria-hidden="true">👥</span>
            <div>
              <strong>Up to 10 Players</strong>
              <small>Invite friends to your room</small>
            </div>
          </div>
          <div className="feature">
            <span aria-hidden="true">⚡</span>
            <div>
              <strong>Multiple Game Modes</strong>
              <small>Classic, Blitz, Double & Hard</small>
            </div>
          </div>
          <div className="feature">
            <span aria-hidden="true">🤖</span>
            <div>
              <strong>AI Answer Judge</strong>
              <small>Category-aware validation</small>
            </div>
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
          Private rooms · Live multiplayer · Built for fast competition
        </p>
      </section>
    </main>
  );
}

export default Home;