"use client";

import { useEffect, useRef, useState } from "react";
import type { VisionEvent } from "./useProctoring";

export interface FaceMonitorState {
  supported: boolean; // model loaded and running
  faceCount: number | null; // latest reading (null until first detection)
}

// Pin the CDN wasm to the installed package version so they never drift.
const TASKS_VISION_VERSION = "0.10.35";
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const CHECK_INTERVAL_MS = 1500; // run detection ~ every 1.5s (cheap, not per-frame)
const FACE_STREAK = 2; // consecutive readings before flagging no/multiple face
const GAZE_STREAK = 3; // consecutive readings before flagging looking-away (~4.5s)
const YAW_THRESHOLD = 0.13; // |nose offset / face width| beyond this = head turned

// MediaPipe Face Mesh canonical landmark indices.
const NOSE_TIP = 1;
const FACE_LEFT = 234;
const FACE_RIGHT = 454;

/**
 * In-browser face + gaze monitoring using MediaPipe FaceLandmarker. One model
 * gives BOTH the face count and the head landmarks we use to estimate whether
 * the candidate is looking away. 100% client-side and free — frames never leave
 * the device.
 *
 * Emits (each debounced to avoid single-frame false positives):
 *  - "noFace"       → nobody visible
 *  - "multipleFace" → more than one person visible
 *  - "lookAway"     → head turned away from the screen (sideways)
 *
 * Fully graceful: if the model can't load, stays `supported:false` and the rest
 * of proctoring is unaffected.
 */
export function useFaceMonitor(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active: boolean,
  onEvent: (e: VisionEvent) => void,
): FaceMonitorState {
  const [supported, setSupported] = useState(false);
  const [faceCount, setFaceCount] = useState<number | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let landmarker: any = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let noFaceStreak = 0;
    let multiFaceStreak = 0;
    let gazeStreak = 0;

    (async () => {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
        landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          numFaces: 3, // enough to tell "1" from "more than one"
        });
        if (cancelled) {
          landmarker?.close?.();
          return;
        }
        setSupported(true);

        timer = setInterval(() => {
          const video = videoRef.current;
          if (!video || video.readyState < 2 || video.videoWidth === 0) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let faces: any[] = [];
          try {
            const res = landmarker.detectForVideo(video, performance.now());
            faces = res?.faceLandmarks ?? [];
          } catch {
            return; // transient frame error — skip this tick
          }
          const count = faces.length;
          setFaceCount(count);

          // Debounced "no face"
          if (count === 0) {
            noFaceStreak += 1;
            if (noFaceStreak === FACE_STREAK) onEventRef.current("noFace");
          } else {
            noFaceStreak = 0;
          }

          // Debounced "multiple faces"
          if (count > 1) {
            multiFaceStreak += 1;
            if (multiFaceStreak === FACE_STREAK) onEventRef.current("multipleFace");
          } else {
            multiFaceStreak = 0;
          }

          // Gaze: only when exactly one face is present.
          if (count === 1) {
            const lm = faces[0];
            const nose = lm[NOSE_TIP];
            const left = lm[FACE_LEFT];
            const right = lm[FACE_RIGHT];
            if (nose && left && right) {
              const width = Math.abs(right.x - left.x) || 1;
              const center = (left.x + right.x) / 2;
              const yaw = (nose.x - center) / width; // ~0 facing camera
              if (Math.abs(yaw) > YAW_THRESHOLD) {
                gazeStreak += 1;
                if (gazeStreak === GAZE_STREAK) onEventRef.current("lookAway");
              } else {
                gazeStreak = 0;
              }
            }
          } else {
            gazeStreak = 0;
          }
        }, CHECK_INTERVAL_MS);
      } catch {
        if (!cancelled) setSupported(false);
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      landmarker?.close?.();
    };
  }, [active, videoRef]);

  return { supported, faceCount };
}
