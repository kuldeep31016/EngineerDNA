import type { PortfolioData, PortfolioTheme } from "@engineerdna/shared";
import { PORTFOLIO_TEMPLATES } from "./themes";

/**
 * Renders portfolio JSON into a full, standalone HTML document using the chosen
 * theme's fonts + CSS. The body markup is shared across themes (themes differ
 * only in CSS), and every value is escaped — the LLM never generates HTML.
 */

const ICON = {
  github:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 .1.8 1.7 2.6 1.2.1-.7.4-1.2.7-1.5-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17 4.6 18 4.9 18 4.9c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="4" width="20" height="16" rx="1"/><path d="m22 7-10 6L2 7"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
};

function esc(s: unknown): string {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

/** Only allow http(s)/mailto links; bare domains get https://; everything else is dropped. */
function safeUrl(u: string): string {
  const s = String(u ?? "").trim();
  if (!s) return "";
  if (/^(https?:|mailto:)/i.test(s)) return esc(s);
  if (/^[\w.-]+@[\w.-]+\.\w+$/.test(s)) return `mailto:${esc(s)}`;
  if (!s.includes(":")) return `https://${esc(s)}`;
  return "";
}

const chips = (items: string[], cls: string) =>
  items
    .filter(Boolean)
    .map((i) => `<span class="${cls}">${esc(i)}</span>`)
    .join("");

function socialLinks(p: PortfolioData["personal"], extra: PortfolioData["socialLinks"]): string {
  const links: string[] = [];
  if (p.github) links.push(`<a class="soc-l" href="${safeUrl(p.github)}" target="_blank" rel="noreferrer" aria-label="GitHub">${ICON.github}</a>`);
  if (p.linkedin) links.push(`<a class="soc-l" href="${safeUrl(p.linkedin)}" target="_blank" rel="noreferrer" aria-label="LinkedIn">${ICON.linkedin}</a>`);
  if (p.email) links.push(`<a class="soc-l" href="${safeUrl(p.email)}" aria-label="Email">${ICON.mail}</a>`);
  for (const s of extra) {
    if (s.url) links.push(`<a class="soc-l" href="${safeUrl(s.url)}" target="_blank" rel="noreferrer" aria-label="${esc(s.label)}">${esc(s.label || "Link")}</a>`);
  }
  return links.join("");
}

function buildBody(d: PortfolioData): string {
  const p = d.personal;
  const initials = (p.name || "Portfolio").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const navItems = [
    d.summary && ["#about", "About"],
    Object.values(d.skills).some((a) => a.length) && ["#skills", "Skills"],
    d.projects.length && ["#projects", "Projects"],
    d.experience.length && ["#experience", "Experience"],
    d.education.length && ["#education", "Education"],
    ["#contact", "Contact"],
  ].filter(Boolean) as [string, string][];
  const navLinks = navItems.map(([h, t]) => `<a href="${h}">${t}</a>`).join("");

  const skillGroups = ([
    ["Languages", d.skills.languages],
    ["Frameworks", d.skills.frameworks],
    ["Databases", d.skills.databases],
    ["Tools", d.skills.tools],
    ["Cloud", d.skills.cloud],
  ] as const)
    .filter(([, items]) => items.length)
    .map(([label, items]) => `<div class="sk-grp"><h3>${label}</h3><div class="chips">${chips(items, "chip")}</div></div>`)
    .join("");

  const projects = d.projects
    .map((pr) => {
      const links = [
        pr.github && `<a href="${safeUrl(pr.github)}" target="_blank" rel="noreferrer">Code ↗</a>`,
        pr.live && `<a href="${safeUrl(pr.live)}" target="_blank" rel="noreferrer">Live ↗</a>`,
      ]
        .filter(Boolean)
        .join("");
      const hls = pr.highlights.filter(Boolean).map((h) => `<li>${esc(h)}</li>`).join("");
      return `<article class="proj-card">
        ${pr.duration ? `<span class="proj-dur">${esc(pr.duration)}</span>` : ""}
        <h3>${esc(pr.title)}</h3>
        ${pr.description ? `<p class="desc">${esc(pr.description)}</p>` : ""}
        ${pr.techStack.length ? `<div class="proj-chips">${chips(pr.techStack, "pchip")}</div>` : ""}
        ${hls ? `<ul class="hls">${hls}</ul>` : ""}
        ${links ? `<div class="proj-lnks">${links}</div>` : ""}
      </article>`;
    })
    .join("");

  const experience = d.experience
    .map((e) => {
      const dates = [e.start, e.end].filter(Boolean).join(" – ");
      const buls = e.highlights.filter(Boolean).map((h) => `<li>${esc(h)}</li>`).join("");
      return `<div class="tl-item reveal">
        <div class="tl-l"><p class="dates">${esc(dates)}</p><p class="co">${esc(e.company)}</p>${e.location ? `<p class="loc">${esc(e.location)}</p>` : ""}</div>
        <div class="tl-r"><h3>${esc(e.role)}</h3>${buls ? `<ul class="buls">${buls}</ul>` : ""}</div>
      </div>`;
    })
    .join("");

  const education = d.education
    .map(
      (e) =>
        `<div class="panel-b edu"><h4>${esc(e.school)}</h4><p class="deg">${esc([e.degree, e.field].filter(Boolean).join(" · "))}</p><p class="dates">${esc([e.start, e.end].filter(Boolean).join(" – "))}</p></div>`,
    )
    .join("");

  const certs = d.certifications
    .map((c) => `<li class="cert"><p class="cn">${esc(c.name)}</p><p class="cm">${esc([c.issuer, c.date].filter(Boolean).join(" · "))}</p></li>`)
    .join("");

  const achievements = d.achievements
    .filter(Boolean)
    .map((a, i) => `<li class="ach"><span class="ach-n">${String(i + 1).padStart(2, "0")}</span>${esc(a)}</li>`)
    .join("");

  const contactLines = [
    p.email && `<div class="cline">${ICON.mail}<a href="${safeUrl(p.email)}">${esc(p.email)}</a></div>`,
    p.github && `<div class="cline">${ICON.github}<a href="${safeUrl(p.github)}" target="_blank" rel="noreferrer">${esc(p.github)}</a></div>`,
    p.location && `<div class="cline">${ICON.pin}<span>${esc(p.location)}</span></div>`,
  ]
    .filter(Boolean)
    .join("");

  const section = (id: string, kicker: string, title: string, inner: string, bg = false) =>
    inner
      ? `<section id="${id}"${bg ? ' style="background:var(--bg2)"' : ""}><div class="wrap"><span class="sec-l reveal">${kicker}</span><h2 class="sec-t reveal">${title}</h2><div class="sec-rule reveal"></div>${inner}</div></section>`
      : "";

  const eduCerts =
    education || certs
      ? `${education ? `<div class="panel"><div class="panel-h">Education</div>${education}</div>` : ""}${certs ? `<div class="panel"><div class="panel-h">Certifications</div><div class="panel-b"><ul class="certs">${certs}</ul></div></div>` : ""}`
      : "";

  return `<header class="nav"><div class="wrap nav-i">
    <a href="#top" class="logo">${esc(initials)}</a>
    <nav class="nav-links">${navLinks}</nav>
    <div class="nav-r">
      <button class="tog" id="themeToggle" aria-label="Toggle theme"><svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></button>
      <button class="tog mob" id="menuToggle" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
    </div>
  </div><div class="wrap"><div class="mm" id="mm">${navLinks}</div></div></header>

  <main id="top">
  <section class="hero"><div class="wrap">
    ${p.title ? `<span class="hero-label reveal">${esc(p.title)}</span>` : ""}
    <h1 class="reveal">${esc(p.name || "Your Name")}</h1>
    ${d.summary ? `<p class="hero-sub reveal">${esc(d.summary)}</p>` : ""}
    ${p.location ? `<p class="hero-loc reveal">${ICON.pin}${esc(p.location)}</p>` : ""}
    <div class="hero-btns reveal">${d.projects.length ? '<a class="btn-p" href="#projects">View Projects</a>' : ""}<a class="btn-o" href="#contact">Contact</a></div>
    <div class="hero-soc reveal">${socialLinks(p, d.socialLinks)}</div>
  </div></section>

  ${section("about", "About", "About", d.summary ? `<div class="about-grid"><div class="about-txt reveal"><p>${esc(d.summary)}</p></div><div class="about-side reveal">${[["Location", p.location], ["Email", p.email], ["GitHub", p.github], ["LinkedIn", p.linkedin]].filter(([, v]) => v).map(([l, v]) => `<div class="arow"><span class="lbl">${l}</span><span class="val">${esc(v)}</span></div>`).join("")}</div></div>` : "")}

  ${skillGroups ? `<section id="skills" class="skills-bg"><div class="wrap"><span class="sec-l reveal">Skills</span><h2 class="sec-t reveal">Technical toolkit</h2><div class="sec-rule reveal"></div><div class="sk-grid reveal">${skillGroups}</div></div></section>` : ""}

  ${projects ? `<div class="proj-band" id="projects"><div class="wrap"><span class="sec-l">Projects</span><h2 class="sec-t">Selected work</h2><div class="sec-rule"></div><div class="proj-grid reveal">${projects}</div></div></div>` : ""}

  ${section("experience", "Experience", "Where I've worked", experience)}

  ${eduCerts ? `<section id="education" style="background:var(--bg2)"><div class="wrap"><span class="sec-l reveal">Credentials</span><h2 class="sec-t reveal">Education &amp; Certifications</h2><div class="sec-rule reveal"></div><div class="two reveal">${eduCerts}</div></div></section>` : ""}

  ${section("achievements", "Achievements", "Highlights", achievements ? `<ul class="ach-grid reveal">${achievements}</ul>` : "")}

  <section id="contact"><div class="wrap"><div class="contact-box reveal"><div class="contact-inner">
    <span class="sec-l">Contact</span><h2>Let's work together.</h2><p>I'm open to new opportunities and quick to reply.</p>
    ${contactLines ? `<div class="contact-lines">${contactLines}</div>` : ""}
    ${p.email ? `<a class="btn-p" href="${safeUrl(p.email)}">Send a message →</a>` : ""}
    <div class="csoc" style="margin-top:20px">${socialLinks(p, d.socialLinks)}</div>
  </div></div></div></section>
  </main>

  <footer class="footer"><div class="wrap foot-i">
    <div><p class="foot-logo">${esc(p.name || "Portfolio")}</p>${p.title ? `<p class="foot-tag">${esc(p.title)}</p>` : ""}</div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:10px"><div class="foot-soc">${socialLinks(p, d.socialLinks)}</div><p class="foot-copy">© ${new Date().getFullYear()} ${esc(p.name || "")}</p></div>
  </div></footer>`;
}

const SCRIPT = `(function(){var r=document.documentElement,b=document.getElementById('themeToggle');b&&b.addEventListener('click',function(){r.className=r.classList.contains('dark')?'light':'dark';});})();
(function(){var b=document.getElementById('menuToggle'),m=document.getElementById('mm');b&&m&&b.addEventListener('click',function(){m.classList.toggle('open');});m&&m.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){m.classList.remove('open');});});})();
(function(){var els=document.querySelectorAll('.reveal');function all(){els.forEach(function(e){e.classList.add('in');});}if(!('IntersectionObserver' in window)){all();return;}var io=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.1,rootMargin:'0px 0px -20px 0px'});els.forEach(function(e){io.observe(e);});setTimeout(all,800);})();`;

/** A full standalone HTML document for the chosen theme + data. */
export function renderPortfolioHtml(theme: PortfolioTheme, data: PortfolioData): string {
  const tpl = PORTFOLIO_TEMPLATES[theme] ?? PORTFOLIO_TEMPLATES.modern;
  const title = data.personal.name ? `${data.personal.name}${data.personal.title ? " — " + data.personal.title : ""}` : "Portfolio";
  return `<!DOCTYPE html><html lang="en" class="light"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(data.summary || data.personal.title)}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
${tpl.fonts ? `<link href="${esc(tpl.fonts)}" rel="stylesheet"/>` : ""}
<style>${tpl.css}</style></head>
<body>${buildBody(data)}<script>${SCRIPT}</script></body></html>`;
}
