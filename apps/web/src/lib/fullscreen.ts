/**
 * Cross-browser fullscreen helpers. Must be called from a user gesture (click).
 * Uses the standard API with a WebKit (Safari) fallback.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEl = any;

export async function requestFullscreen(): Promise<void> {
  const el: AnyEl = document.documentElement;
  try {
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" });
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
  } catch {
    // Browser refused (no gesture / unsupported) — caller keeps a windowed fallback.
  }
}

export async function exitFullscreen(): Promise<void> {
  const d: AnyEl = document;
  try {
    if (d.fullscreenElement && d.exitFullscreen) await d.exitFullscreen();
    else if (d.webkitFullscreenElement && d.webkitExitFullscreen) await d.webkitExitFullscreen();
  } catch {
    // ignore
  }
}

export function isFullscreen(): boolean {
  const d: AnyEl = document;
  return Boolean(d.fullscreenElement || d.webkitFullscreenElement);
}
