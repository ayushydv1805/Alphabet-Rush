import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AVATARS,
  TITLES,
  getAvatar,
  getLevelProgress,
  getProfile,
  isAvatarUnlocked,
  isTitleUnlocked,
  saveProfile,
} from "../services/profile";

function Profile() {
  const [profile, setProfile] = useState(getProfile);

  const avatar = getAvatar(profile.avatarId);
  const title = TITLES.find((item) => item.id === profile.titleId) || TITLES[0];
  const progress = getLevelProgress(profile.xp);
  const winRate = profile.totalGames
    ? Math.round((profile.wins / profile.totalGames) * 100)
    : 0;

  const milestones = useMemo(
    () => [
      {
        icon: "🎯",
        label: "Perfect Rounds",
        value: profile.perfectRounds,
      },
      {
        icon: "🔥",
        label: "Best Streak",
        value: profile.bestStreak,
      },
      {
        icon: "⚡",
        label: "Total Points",
        value: profile.totalPoints,
      },
      {
        icon: "🏆",
        label: "Win Rate",
        value: winRate + "%",
      },
    ],
    [profile, winRate]
  );

  const saveName = (event) => {
    event.preventDefault();
    const name = profile.name.trim();

    setProfile(
      saveProfile({
        ...profile,
        name,
      })
    );
  };

  return (
    <main className="room-container profile-page">
      <section className="waiting-card profile-card">
        <div className="profile-topbar">
          <Link className="profile-back" to="/">← HOME</Link>
          <span className="profile-top-label">PLAYER PROFILE</span>
        </div>

        <section className="profile-hero">
          <div className="profile-avatar-large" aria-hidden="true">
            {avatar.icon}
          </div>

          <div className="profile-identity">
            <p className="home-eyebrow">{title.name}</p>
            <h1>{profile.name || "Your Rush Profile"}</h1>
            <p className="room-subtitle">
              Level {profile.level} · {profile.xp} XP
            </p>

            <div
              className="xp-track"
              aria-label={profile.xp + " experience points"}
            >
              <span style={{ width: progress + "%" }} />
            </div>
            <small className="xp-copy">
              {progress}/100 XP to Level {profile.level + 1}
            </small>
          </div>
        </section>

        <form className="profile-name-form" onSubmit={saveName}>
          <label htmlFor="profile-name">DISPLAY NAME</label>
          <div className="profile-name-row">
            <input
              id="profile-name"
              value={profile.name}
              maxLength={20}
              placeholder="Enter your player name"
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
            <button className="profile-save-btn" type="submit">SAVE</button>
          </div>
        </form>

        <section className="profile-section">
          <div className="section-title">
            <h2>Choose your avatar</h2>
            <span>Unlocks by level</span>
          </div>

          <div className="avatar-picker">
            {AVATARS.map((item) => {
              const unlocked = isAvatarUnlocked(item, profile.level);
              const selected = item.id === profile.avatarId;

              return (
                <button
                  type="button"
                  className={
                    selected
                      ? "avatar-option selected"
                      : unlocked
                        ? "avatar-option"
                        : "avatar-option locked"
                  }
                  key={item.id}
                  disabled={!unlocked}
                  onClick={() =>
                    setProfile(
                      saveProfile({
                        ...profile,
                        avatarId: item.id,
                      })
                    )
                  }
                  title={
                    unlocked
                      ? item.name
                      : "Unlocks at level " + item.unlockLevel
                  }
                >
                  <span>{unlocked ? item.icon : "🔒"}</span>
                  <small>{item.name}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="profile-section">
          <div className="section-title">
            <h2>Choose your title</h2>
            <span>Unlocks by level</span>
          </div>

          <div className="title-picker">
            {TITLES.map((item) => {
              const unlocked = isTitleUnlocked(item, profile.level);
              const selected = item.id === profile.titleId;

              return (
                <button
                  type="button"
                  className={
                    selected
                      ? "title-option selected"
                      : unlocked
                        ? "title-option"
                        : "title-option locked"
                  }
                  key={item.id}
                  disabled={!unlocked}
                  onClick={() =>
                    setProfile(
                      saveProfile({
                        ...profile,
                        titleId: item.id,
                      })
                    )
                  }
                >
                  <strong>{unlocked ? "✦" : "🔒"}</strong>
                  <span>{item.name}</span>
                  <small>
                    {unlocked ? "Unlocked" : "Level " + item.unlockLevel}
                  </small>
                </button>
              );
            })}
          </div>
        </section>

        <section className="profile-section">
          <div className="section-title">
            <h2>Your stats</h2>
            <span>Lifetime on this browser</span>
          </div>

          <div className="profile-stats-grid">
            {milestones.map((stat) => (
              <article className="profile-stat-card" key={stat.label}>
                <span aria-hidden="true">{stat.icon}</span>
                <strong>{stat.value}</strong>
                <small>{stat.label}</small>
              </article>
            ))}
          </div>

          <div className="profile-stat-line">
            <span>Games played</span>
            <strong>{profile.totalGames}</strong>
          </div>
          <div className="profile-stat-line">
            <span>Total rounds</span>
            <strong>{profile.totalRounds}</strong>
          </div>
        </section>

        <Link className="profile-play-btn" to="/">PLAY A GAME →</Link>
      </section>
    </main>
  );
}

export default Profile;
