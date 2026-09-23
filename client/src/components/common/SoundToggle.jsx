import { useState } from "react";
import {
  getSoundEnabled,
  playGameSound,
  setSoundEnabled,
} from "../../services/sound";

function SoundToggle() {
  const [enabled, setEnabled] = useState(getSoundEnabled);

  const toggleSound = () => {
    const next = !enabled;
    setSoundEnabled(next);
    setEnabled(next);

    if (next) {
      playGameSound("ui");
    }
  };

  return (
    <button
      type="button"
      className="global-sound-toggle"
      onClick={toggleSound}
      aria-label={enabled ? "Mute game sounds" : "Enable game sounds"}
      title={enabled ? "Mute game sounds" : "Enable game sounds"}
    >
      <span className="global-sound-icon" aria-hidden="true">
        {enabled ? "🔊" : "🔇"}
      </span>
      <span className="global-sound-text">{enabled ? "Sound" : "Muted"}</span>
    </button>
  );
}

export default SoundToggle;
