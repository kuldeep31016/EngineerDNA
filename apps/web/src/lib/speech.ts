/**
 * Text-to-speech via the browser-native Web Speech API (free, on-device — no
 * third-party service). Used so the AI interviewer can speak each question out
 * loud. Degrades silently to a no-op when the browser has no speech synthesis.
 */

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Pick a natural English voice when one is available. */
function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  return (
    voices.find((v) => /en[-_]?(US|GB)/i.test(v.lang)) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("en")) ??
    voices[0] ??
    null
  );
}

/** Speak `text` aloud. Cancels anything currently speaking first. */
export function speak(text: string, opts?: { onStart?: () => void; onEnd?: () => void }): void {
  if (!isSpeechSynthesisSupported()) {
    opts?.onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  const voice = pickVoice();
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
