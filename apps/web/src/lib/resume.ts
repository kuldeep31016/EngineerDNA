/**
 * Extract plain text from a resume PDF entirely in the browser using pdf.js
 * (free, open-source). The worker is loaded from a CDN so no bundler worker
 * configuration is needed. The extracted text is sent to the API only as
 * context for question generation — the file itself never leaves the browser.
 */
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;

  let text = "";
  for (let page = 1; page <= pdf.numPages; page++) {
    const content = await (await pdf.getPage(page)).getTextContent();
    text +=
      content.items
        .map((item) => (item as { str?: string }).str ?? "")
        .join(" ") + "\n";
  }
  return text.trim();
}
