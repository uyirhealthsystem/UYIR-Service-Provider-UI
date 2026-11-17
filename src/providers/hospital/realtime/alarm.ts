/**
 * Emergency alarm: looping siren + vibration until stopAlarm() is called.
 *
 * Sound uses `expo-audio` (or `expo-av` on older SDKs) if installed:
 *     npx expo install expo-audio        # or: npx expo install expo-av
 * If neither is installed the alarm still vibrates, and nothing crashes.
 */
import { Platform, Vibration } from "react-native";

const ALARM_SOURCE = require("../assets/emergency-alarm.wav");

let playing = false;
let release: (() => void) | null = null;

function tryRequire(name: string): any {
  try {
    // Optional dependency: resolved lazily so the app still bundles when it isn't installed.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    if (name === "expo-audio") return require("expo-audio");
    if (name === "expo-av") return require("expo-av");
  } catch { /* not installed */ }
  return null;
}

async function startSound() {
  const audio = tryRequire("expo-audio");
  if (audio?.createAudioPlayer) {
    try {
      await audio.setAudioModeAsync?.({ playsInSilentMode: true, shouldPlayInBackground: false });
      const player = audio.createAudioPlayer(ALARM_SOURCE);
      player.loop = true;
      player.volume = 1;
      player.play();
      release = () => { try { player.pause(); player.remove?.(); } catch { /* ignore */ } };
      return;
    } catch { /* fall through to expo-av */ }
  }
  const av = tryRequire("expo-av")?.Audio;
  if (av?.Sound) {
    try {
      await av.setAudioModeAsync?.({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      const { sound } = await av.Sound.createAsync(ALARM_SOURCE, { isLooping: true, shouldPlay: true, volume: 1 });
      release = () => { sound.stopAsync?.().catch(() => {}); sound.unloadAsync?.().catch(() => {}); };
    } catch { /* vibration only */ }
  }
}

export function startAlarm() {
  if (playing) return;
  playing = true;
  Vibration.vibrate(Platform.OS === "android" ? [0, 900, 500] : [0, 900, 500, 900], true);
  startSound().then(() => { if (!playing) { release?.(); release = null; } });
}

export function stopAlarm() {
  if (!playing) return;
  playing = false;
  Vibration.cancel();
  release?.();
  release = null;
}
