/* Extracts fonts <link> + <style> CSS from the 5 provided portfolio HTML files
   into a theme registry. Run once to (re)generate src/components/portfolio/themes.ts. */
const fs = require("fs");
const path = require("path");

const SRC = "/Users/kuldeepraj/Downloads/# Developer Portfolio Website";
const MAP = {
  modern: "portfolio.html",
  minimal: "portfolio-minimal.html",
  dark: "portfolio-dark.html",
  creative: "portfolio-creative.html",
  corporate: "portfolio-corporate.html",
};

const out = {};
for (const [theme, file] of Object.entries(MAP)) {
  const html = fs.readFileSync(path.join(SRC, file), "utf8");
  const fontHrefs = [...html.matchAll(/<link[^>]+href="(https:\/\/fonts\.googleapis\.com[^"]+)"/g)].map((m) => m[1]);
  const fonts = fontHrefs.find((h) => h.includes("css2")) ?? fontHrefs[0] ?? "";
  const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [, ""])[1].trim();
  out[theme] = { fonts, css };
}

const body = `// AUTO-GENERATED from the provided portfolio HTML templates. Do not edit by hand.
// Each theme supplies its own Google Fonts link + full CSS; the shared renderer
// produces the body markup. Regenerate with scripts/extract-themes.cjs.
import type { PortfolioTheme } from "@engineerdna/shared";

export interface PortfolioTemplate {
  fonts: string;
  css: string;
}

export const PORTFOLIO_TEMPLATES: Record<PortfolioTheme, PortfolioTemplate> = ${JSON.stringify(out, null, 2)};
`;

const dest = path.join(__dirname, "..", "src", "components", "portfolio", "themes.ts");
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, body);
console.log("Wrote", dest, "themes:", Object.keys(out).join(", "));
for (const [t, v] of Object.entries(out)) console.log(`  ${t}: fonts=${v.fonts ? "yes" : "NO"} css=${v.css.length}b`);
