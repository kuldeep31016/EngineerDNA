"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProctoringReport } from "@engineerdna/shared";
import { isFullscreen as isDocFullscreen, requestFullscreen } from "@/lib/fullscreen";

export interface ProctoringState {
  violations: ProctoringReport;
  totalViolations: number;
  // latest warning to surface as a toast. `strike` = counts toward the 3-strike
  // auto-terminate (fullscreen/tab/focus); face events are warnings only.
  warning: { message: string; count: number; strike: boolean } | null;
  isFullscreen: boolean;
  terminated: boolean;
  enterFullscreen: () => Promise<void>;
  dismissWarning: () => void;
  registerVisionEvent: (kind: VisionEvent) => void;
}

export type VisionEvent = "noFace" | "multipleFace" | "lookAway" | "phone";

const MAX_VIOLATIONS = 3;

/**
 * Anti-cheat monitoring for a proctored interview — built entirely on native
 * browser APIs (no library, no cost). Browsers can't truly lock a tab, so the
 * strategy is the industry-standard one: DETECT suspicious actions, WARN the
 * candidate, COUNT violations, and auto-terminate after MAX_VIOLATIONS.
 *
 * APIs used:
 *  - Fullscreen API  → requestFullscreen() + `fullscreenchange`  (detect exit)
 *  - Page Visibility → `visibilitychange` / document.visibilityState (tab switch)
 *  - Focus           → window `blur` (minimize / focus another app)
 *  - Clipboard       → block `copy` / `cut` / `paste` / `contextmenu`
 *  - Keyboard        → block Ctrl/Cmd + C/V/X/A/S/P
 *
 * @param active   start monitoring only once the interview is live
 * @param onTerminate called when violations reach MAX_VIOLATIONS
 */
export function useProctoring(active: boolean, onTerminate: () => void): ProctoringState {
  const [violations, setViolations] = useState<ProctoringReport>({
    fullscreenExits: 0,
    tabSwitches: 0,
    focusLost: 0,
    noFaceEvents: 0,
    multipleFaceEvents: 0,
    lookAwayEvents: 0,
    phoneEvents: 0,
    terminated: false,
  });
  const [warning, setWarning] = useState<{ message: string; count: number; strike: boolean } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [terminated, setTerminated] = useState(false);

  // A ref mirror so event listeners always read the latest totals without
  // re-subscribing on every count change.
  const totalRef = useRef(0);
  const terminatedRef = useRef(false);
  const onTerminateRef = useRef(onTerminate);
  onTerminateRef.current = onTerminate;

  /** Request browser fullscreen — MUST be called from a user gesture (a click). */
  const enterFullscreen = useCallback(async () => {
    await requestFullscreen();
  }, []);

  const dismissWarning = useCallback(() => setWarning(null), []);

  // Register a single violation: bump its counter, warn, and terminate at the cap.
  const registerViolation = useCallback(
    (kind: "fullscreenExits" | "tabSwitches" | "focusLost", label: string) => {
      if (terminatedRef.current) return;
      totalRef.current += 1;
      const count = totalRef.current;

      setViolations((v) => ({ ...v, [kind]: v[kind] + 1 }));

      if (count >= MAX_VIOLATIONS) {
        terminatedRef.current = true;
        setTerminated(true);
        setViolations((v) => ({ ...v, terminated: true }));
        setWarning({ message: "Interview ended due to repeated violations.", count, strike: true });
        onTerminateRef.current();
      } else {
        setWarning({
          message: `${label} After ${MAX_VIOLATIONS} violations your interview ends automatically.`,
          count,
          strike: true,
        });
      }
    },
    [],
  );

  // Camera-vision events. Logged + warned, but deliberately NOT counted toward
  // auto-termination — vision can have false positives, so a human reviews them.
  const registerVisionEvent = useCallback((kind: VisionEvent) => {
    if (terminatedRef.current) return;
    const map: Record<VisionEvent, { field: keyof ProctoringReport; message: string }> = {
      noFace: { field: "noFaceEvents", message: "No face detected — stay visible to the camera." },
      multipleFace: { field: "multipleFaceEvents", message: "Multiple people detected — only you should be visible." },
      lookAway: { field: "lookAwayEvents", message: "Looking away detected — keep your eyes on the screen." },
      phone: { field: "phoneEvents", message: "Phone detected — put it away to continue." },
    };
    const { field, message } = map[kind];
    setViolations((v) => ({ ...v, [field]: (v[field] as number) + 1 }));
    setWarning({ message, count: 0, strike: false });
  }, []);

  useEffect(() => {
    if (!active) return;

    setIsFullscreen(isDocFullscreen());

    const onFullscreenChange = () => {
      const fs = isDocFullscreen();
      setIsFullscreen(fs);
      if (!fs) registerViolation("fullscreenExits", "You exited fullscreen. Return to fullscreen to continue.");
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        registerViolation("tabSwitches", "Tab switch detected. Stay on this tab.");
      }
    };

    const onBlur = () => registerViolation("focusLost", "You left the interview window.");

    // Clipboard + context menu are simply blocked (not counted as violations).
    const block = (e: Event) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && ["c", "v", "x", "a", "s", "p"].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", block);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [active, registerViolation]);

  // NOTE: we deliberately do NOT exit fullscreen on unmount. React StrictMode
  // (dev) mounts→unmounts→remounts once, and a cleanup here would cancel the
  // fullscreen entered on "Begin". The caller exits fullscreen explicitly when
  // the interview actually finishes.

  return {
    violations,
    totalViolations: violations.fullscreenExits + violations.tabSwitches + violations.focusLost,
    warning,
    isFullscreen,
    terminated,
    enterFullscreen,
    dismissWarning,
    registerVisionEvent,
  };
}
