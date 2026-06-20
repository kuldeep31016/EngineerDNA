"use client";

import { useEffect, useRef, useState } from "react";

export type FaceEvent = "noFace" | "multipleFace";

export interface FaceMonitorState {
  supported: boolean; // model loaded and running
  faceCount: number | null; // latest reading (null until first detection)
}

// Pin the CDN wasm to the installed package version so they never drift.
const TASKS_VISION_VERSION = "0.10.35";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

const CHECK_INTERVAL_MS = 1500; // run detection ~ every 1.5s (cheap, not per-frame)
const CONSECUTIVE_TO_FLAG = 2; // require 2 readings in a row before flagging (debounce)

/**
 * In-browser face monitoring for the proctored interview using MediaPipe Tasks
 * Vision (FaceDetector). 100% client-side and free — no frames leave the device.
 *
 * It reports two events to `onEvent`, each debounced over CONSECUTIVE_TO_FLAG
 * readings to avoid false positives from a single blurry frame:
 *  - "noFace"       → camera sees nobody (candidate left or covered the camera)
 *  - "multipleFace" → more than one person is visible
 *
 * Fully graceful: if the model/wasm can't load (offline, unsupported), the hook
 * silently stays `supported:false` and the rest of proctoring is unaffected.
 */
export function useFaceMonitor(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active: boolean,
  onEvent: (e: FaceEvent) => void,
): FaceMonitorState {
  const [supported, setSupported] = useState(false);
  const [faceCount, setFaceCount] = useState<number | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let detector: any = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let noFaceStreak = 0;
    let multiFaceStreak = 0;

    (async () => {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
        detector = await vision.FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
        });
        if (cancelled) {
          detector?.close?.();
          return;
        }
        setSupported(true);

        timer = setInterval(() => {
          const video = videoRef.current;
          if (!video || video.readyState < 2 || video.videoWidth === 0) return;
          let count = 0;
          try {
            const res = detector.detectForVideo(video, performance.now());
            count = res?.detections?.length ?? 0;
          } catch {
            return; // transient frame error — skip this tick
          }
          setFaceCount(count);

          // Debounced "no face"
          if (count === 0) {
            noFaceStreak += 1;
            if (noFaceStreak === CONSECUTIVE_TO_FLAG) onEventRef.current("noFace");
          } else {
            noFaceStreak = 0;
          }

          // Debounced "multiple faces"
          if (count > 1) {
            multiFaceStreak += 1;
            if (multiFaceStreak === CONSECUTIVE_TO_FLAG) onEventRef.current("multipleFace");
          } else {
            multiFaceStreak = 0;
          }
        }, CHECK_INTERVAL_MS);
      } catch {
        // Model/wasm failed to load — monitoring stays off, interview continues.
        if (!cancelled) setSupported(false);
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      detector?.close?.();
    };
  }, [active, videoRef]);

  return { supported, faceCount };
}
