"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Speech-to-text via the browser-native Web Speech API (free; works in Chrome
 * and Edge). Transcribes the candidate's spoken answer live. When unsupported
 * (e.g. Firefox), `supported` is false and the UI falls back to typing.
 */

interface RecognitionAlternative {
  transcript: string;
}
interface RecognitionResult {
  0: RecognitionAlternative;
  isFinal: boolean;
}
interface RecognitionEvent {
  resultIndex: number;
  results: { length: number; [index: number]: RecognitionResult };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useSpeechRecognition() {
  const [supported] = useState(getRecognitionCtor);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const baseRef = useRef("");

  const start = useCallback((initialText = "") => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    baseRef.current = initialText ? `${initialText.trim()} ` : "";
    setTranscript(initialText);

    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        const text = result[0].transcript;
        if (result.isFinal) baseRef.current += `${text} `;
        else interim += text;
      }
      setTranscript((baseRef.current + interim).trim());
    };
    rec.onerror = () => {};
    rec.onend = () => setListening(false);

    recRef.current = rec;
    setListening(true);
    rec.start();
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  useEffect(
    () => () => {
      try {
        recRef.current?.abort();
      } catch {
        // ignore teardown errors
      }
    },
    [],
  );

  return { supported: supported !== null, listening, transcript, setTranscript, start, stop };
}
