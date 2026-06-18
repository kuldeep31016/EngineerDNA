/**
 * Text-to-speech via the browser-native Web Speech API (free, on-device — no
 * third-party service). Used so the AI interviewer can speak each question out
 * loud. Degrades silently to a no-op when the browser has no speech synthesis.
 */

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** English voices currently available (loads asynchronously in some browsers). */
export function listEnglishVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
}

// Natural-sounding voices, in order of preference. The local default (e.g.
// macOS "Samantha") sounds robotic, so we prefer Google/Microsoft cloud voices
// and the higher-quality named voices first.
const PREFERRED_NAMES = [
  "Google US English",
  "Google UK English Female",
  "Google UK English Male",
  "Microsoft Aria",
  "Microsoft Jenny",
  "Microsoft Guy",
  "Ava",
  "Allison",
  "Samantha",
  "Karen",
  "Daniel",
  "Alex",
];

/** Choose the best-sounding available English voice. */
export function pickPreferredVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  for (const name of PREFERRED_NAMES) {
    const match = voices.find((v) => v.name.includes(name));
    if (match) return match;
  }
  // Cloud voices (localService === false) generally sound better than local ones.
  return voices.find((v) => !v.localService) ?? voices[0] ?? null;
}

/** Speak `text` aloud. Cancels anything currently speaking first. */
export function speak(
  text: string,
  opts?: { voice?: SpeechSynthesisVoice | null; onStart?: () => void; onEnd?: () => void },
): void {
  if (!isSpeechSynthesisSupported()) {
    opts?.onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.98;
  utterance.pitch = 1;
  const voice = opts?.voice ?? pickPreferredVoice(listEnglishVoices());
  if (voice) utterance.voice = voice;
  if (opts?.onStart) utterance.onstart = opts.onStart;
  utterance.onend = () => opts?.onEnd?.();
  utterance.onerror = () => opts?.onEnd?.();

  window.speechSynthesis.speak(utterance);
}

/** Stop any in-progress speech. */
export function cancelSpeech(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}
