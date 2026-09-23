const SOUND_KEY = "alphabet-rush-sound";
let audioContext = null;

export function getSoundEnabled() {
  if (typeof window === "undefined") return true;

  const stored = window.localStorage.getItem(SOUND_KEY);
  return stored !== "0";
}

export function setSoundEnabled(enabled) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_KEY, enabled ? "1" : "0");
}

function getAudioContext() {
  if (typeof window === "undefined") return null;

  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

function tone(context, frequency, start, duration, volume, type = "sine") {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    start + Math.max(duration, 0.04)
  );

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function sequence(context, notes, spacing = 0.08) {
  const start = context.currentTime + 0.01;

  notes.forEach((note, index) => {
    tone(
      context,
      note.frequency,
      start + index * spacing,
      note.duration,
      note.volume,
      note.type
    );
  });
}

export function playGameSound(soundName) {
  if (!getSoundEnabled()) return;

  const context = getAudioContext();
  if (!context) return;

  const play = () => {
    switch (soundName) {
      case "ui":
        sequence(context, [
          { frequency: 520, duration: 0.07, volume: 0.025 },
          { frequency: 700, duration: 0.09, volume: 0.03 },
        ], 0.06);
        break;
      case "submit":
        sequence(context, [
          { frequency: 660, duration: 0.08, volume: 0.035 },
          { frequency: 880, duration: 0.11, volume: 0.045 },
        ], 0.07);
        break;
      case "tick":
        sequence(context, [
          { frequency: 560, duration: 0.055, volume: 0.018 },
        ]);
        break;
      case "urgent":
        sequence(context, [
          { frequency: 820, duration: 0.055, volume: 0.024, type: "square" },
        ]);
        break;
      case "timeup":
        sequence(context, [
          { frequency: 440, duration: 0.11, volume: 0.035 },
          { frequency: 330, duration: 0.12, volume: 0.035 },
          { frequency: 220, duration: 0.18, volume: 0.04 },
        ], 0.09);
        break;
      case "roundEnd":
        sequence(context, [
          { frequency: 660, duration: 0.09, volume: 0.035 },
          { frequency: 830, duration: 0.11, volume: 0.045 },
        ], 0.08);
        break;
      case "winner":
        sequence(context, [
          { frequency: 523.25, duration: 0.09, volume: 0.04 },
          { frequency: 659.25, duration: 0.09, volume: 0.04 },
          { frequency: 783.99, duration: 0.1, volume: 0.045 },
          { frequency: 1046.5, duration: 0.18, volume: 0.05 },
        ], 0.085);
        break;
      case "nextRound":
        sequence(context, [
          { frequency: 392, duration: 0.08, volume: 0.03 },
          { frequency: 523.25, duration: 0.11, volume: 0.04 },
        ], 0.07);
        break;
      default:
        break;
    }
  };

  if (context.state === "suspended") {
    context.resume().then(play).catch(() => {});
  } else {
    play();
  }
}
