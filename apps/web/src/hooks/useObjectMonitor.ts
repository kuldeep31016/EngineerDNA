"use client";

import { useEffect, useRef, useState } from "react";
import type { VisionEvent } from "./useProctoring";

const CHECK_INTERVAL_MS = 3000; // heavier model → run every 3s
const PHONE_STREAK = 2; // consecutive detections before flagging
const MIN_SCORE = 0.5; // confidence threshold

/**
 * In-browser object monitoring for phone detection using TensorFlow.js +
 * coco-ssd (the model includes a "cell phone" class). Runs fully client-side
 * and free; loaded lazily and at a low cadence because the model is heavier than
 * the face detector.
 *
 * Emits "phone" (debounced) when a phone is visible. Fully graceful — if the
 * model can't load, stays `supported:false` and proctoring is unaffected.
 */
export function useObjectMonitor(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active: boolean,
  onEvent: (e: VisionEvent) => void,
): { supported: boolean } {
  const [supported, setSupported] = useState(false);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let model: any = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let phoneStreak = 0;
    let running = false;

    (async () => {
      try {
        await import("@tensorflow/tfjs");
        const cocoSsd = await import("@tensorflow-models/coco-ssd");
        model = await cocoSsd.load({ base: "lite_mobilenet_v2" }); // smallest variant
        if (cancelled) return;
        setSupported(true);

        timer = setInterval(async () => {
          const video = videoRef.current;
          if (!video || video.readyState < 2 || video.videoWidth === 0 || running) return;
          running = true;
          try {
            const predictions: { class: string; score: number }[] = await model.detect(video);
            const phone = predictions.some((p) => p.class === "cell phone" && p.score >= MIN_SCORE);
            if (phone) {
              phoneStreak += 1;
              if (phoneStreak === PHONE_STREAK) onEventRef.current("phone");
            } else {
              phoneStreak = 0;
            }
          } catch {
            // transient — ignore this tick
          } finally {
            running = false;
          }
        }, CHECK_INTERVAL_MS);
      } catch {
        if (!cancelled) setSupported(false);
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      model?.dispose?.();
    };
  }, [active, videoRef]);

  return { supported };
}
