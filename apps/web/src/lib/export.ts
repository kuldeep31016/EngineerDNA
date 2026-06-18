/**
 * Portfolio export helpers — all 100% client-side and free (no API/LLM calls).
 * The portfolio HTML is already generated in the browser, so exporting it as a
 * file, PDF, PNG, or JSON is just packaging what's already there.
 */

export function safeFileName(s: string): string {
  return (
    String(s ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "portfolio"
  );
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Download the standalone portfolio HTML ("the code"). */
export function downloadHtml(name: string, html: string): void {
  triggerDownload(new Blob([html], { type: "text/html;charset=utf-8" }), `${name}.html`);
}

/** Download the portfolio data as JSON (backup / re-import). */
export function downloadJson(name: string, data: unknown): void {
  triggerDownload(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `${name}.json`);
}

/** Open the rendered portfolio and trigger the browser print dialog (Save as PDF). */
export function printToPdf(html: string): boolean {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  // Give fonts/layout a moment before printing.
  setTimeout(() => {
    try {
      w.focus();
      w.print();
    } catch {
      /* user can print manually */
    }
  }, 700);
  return true;
}

/** Render the portfolio offscreen and snapshot it to a PNG (html2canvas, in-browser). */
export async function downloadPng(name: string, html: string): Promise<void> {
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "1200px",
    height: "900px",
    border: "0",
  });
  document.body.appendChild(iframe);

  try {
    await new Promise<void>((resolve) => {
      iframe.onload = () => resolve();
      iframe.srcdoc = html;
    });
    // Let web fonts + reveal animations settle.
    await new Promise((r) => setTimeout(r, 800));

    const doc = iframe.contentDocument!;
    const body = doc.body;
    const height = Math.max(body.scrollHeight, doc.documentElement.scrollHeight);
    iframe.style.height = `${height}px`;
    await new Promise((r) => setTimeout(r, 200));

    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(body, {
      width: 1200,
      height,
      windowWidth: 1200,
      windowHeight: height,
      scale: 1.5,
      useCORS: true,
      backgroundColor: null,
    });
    await new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) triggerDownload(blob, `${name}.png`);
        resolve();
      }, "image/png");
    });
  } finally {
    iframe.remove();
  }
}
