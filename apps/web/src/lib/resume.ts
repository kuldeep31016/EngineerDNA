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

/** Extract plain text from a DOCX file in the browser using mammoth (free). */
export async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value.trim();
}

/** Parse a resume file (PDF or DOCX) to plain text, client-side and free. */
export async function extractResumeFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return extractPdfText(file);
  if (name.endsWith(".docx") || file.type.includes("word")) return extractDocxText(file);
  throw new Error("Unsupported file — upload a PDF or DOCX.");
}
