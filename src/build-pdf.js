#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { marked } = require("marked");
const puppeteer = require("puppeteer-core");
const { renderCanvasFile } = require("./canvas");

const ROOT = path.resolve(__dirname, "..");
const MERMAID_URL = "https://cdn.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.min.js";

function parseArgs(argv) {
  const out = { positional: [], flags: {} };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-cover") {
      out.flags.noCover = true;
    } else if (a === "--cover") {
      out.flags.cover = true;
    } else if (a === "--keep-html") {
      out.flags.keepHtml = true;
    } else if (a.startsWith("--") && i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      out[a.slice(2)] = argv[++i];
    } else if (!a.startsWith("--")) {
      out.positional.push(a);
    }
  }
  if (out.config) {
    const configPath = path.resolve(ROOT, out.config);
    const preset = JSON.parse(fs.readFileSync(configPath, "utf8"));
    for (const [key, value] of Object.entries(preset)) {
      if (out[key] == null) out[key] = value;
    }
    if (out.src && !path.isAbsolute(out.src)) {
      out.src = path.resolve(path.dirname(configPath), out.src);
    }
    if (out.out && !path.isAbsolute(out.out)) {
      out.out = path.resolve(path.dirname(configPath), out.out);
    }
  }
  return out;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fileId(filename) {
  return "ch-" + filename.replace(/\.canvas\.tsx$/i, "").replace(/\.md$/i, "");
}

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const home = process.env.LOCALAPPDATA || "";
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(home, "Google\\Chrome\\Application\\chrome.exe"),
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  return candidates.find((p) => fs.existsSync(p));
}

function isMd(name) {
  return name.toLowerCase().endsWith(".md");
}

function isCanvas(name) {
  return name.toLowerCase().endsWith(".canvas.tsx");
}

function sortPageNames(files) {
  const readme = files.filter((f) => f.toLowerCase() === "readme.md");
  const numbered = files
    .filter((f) => /^\d+/.test(f) && f.toLowerCase() !== "readme.md")
    .sort((a, b) => a.localeCompare(b, "ru", { numeric: true }));
  const rest = files
    .filter((f) => f.toLowerCase() !== "readme.md" && !/^\d+/.test(f))
    .sort((a, b) => a.localeCompare(b, "ru"));
  return [...readme, ...numbered, ...rest];
}

function listPages(src) {
  const stat = fs.statSync(src);
  if (stat.isFile()) {
    const name = path.basename(src);
    if (!isMd(name) && !isCanvas(name)) {
      throw new Error(`Ожидался .md или .canvas.tsx: ${src}`);
    }
    return [{ dir: path.dirname(src), file: name }];
  }
  const files = fs
    .readdirSync(src)
    .filter((f) => {
      const full = path.join(src, f);
      return fs.statSync(full).isFile() && (isMd(f) || isCanvas(f));
    });
  return sortPageNames(files).map((file) => ({ dir: src, file }));
}

function firstHeading(markdown) {
  const m = markdown.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "";
}

function ruDate(d = new Date()) {
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

async function ensureMermaid() {
  const dest = path.join(ROOT, "vendor", "mermaid.min.js");
  if (fs.existsSync(dest) && fs.statSync(dest).size > 100000) return dest;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const res = await fetch(MERMAID_URL);
  if (!res.ok) {
    throw new Error(`Не удалось скачать mermaid (${res.status}). Положите mermaid.min.js в vendor/ вручную.`);
  }
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return dest;
}

function mdToHtml(raw, filename) {
  const renderer = {
    code({ text, lang } = {}) {
      const code = typeof text === "string" ? text : arguments[0];
      const language = typeof lang === "string" ? lang : arguments[1] || "";
      if (String(language).trim() === "mermaid") {
        return `<div class="mermaid">${escapeHtml(code)}</div>\n`;
      }
      const cls = language ? ` class="language-${escapeHtml(String(language))}"` : "";
      return `<pre><code${cls}>${escapeHtml(code)}</code></pre>\n`;
    },
  };
  marked.use({ gfm: true, breaks: false, renderer });
  let html = marked.parse(raw);
  html = html.replace(
    /href="(?:\.\/)?([^"#]+\.md)(#[^"]*)?"/g,
    (_, file) => `href="#${fileId(path.basename(file))}"`
  );
  return html;
}

function buildHtml({ title, kicker, lead, dateLabel, chapters, mermaidPath, withCover, theme }) {
  const tocItems = chapters
    .map(
      (ch, i) =>
        `<li><a href="#${fileId(ch.file)}"><span class="toc-num">${String(i).padStart(2, "0")}</span>${escapeHtml(ch.title)}</a></li>`
    )
    .join("\n");

  const body = chapters
    .map((ch) => {
      const inner = ch.kind === "canvas" ? `<div class="canvas-root">${ch.html}</div>` : ch.html;
      return `<section class="chapter" id="${fileId(ch.file)}">${inner}</section>`;
    })
    .join("\n");

  const mermaidUrl = pathToFileURL(mermaidPath).href;
  const kickerHtml = kicker ? `<div class="cover-kicker">${escapeHtml(kicker)}</div>` : "";
  const leadHtml = lead ? `<p class="lead">${escapeHtml(lead)}</p>` : "";
  const cover = withCover
    ? `<section class="cover">
    ${kickerHtml}
    <h1>${escapeHtml(title)}</h1>
    ${leadHtml}
    <p class="meta">Сводка по материалам каталога · ${escapeHtml(dateLabel)}</p>
    <nav class="toc">
      <h2>Содержание</h2>
      <ol>
        ${tocItems}
      </ol>
    </nav>
  </section>`
    : "";

  const dark = theme === "dark";
  const canvasVars = dark
    ? `--canvas-bg:#181818; --canvas-fg:#F0F0F0;`
    : `--canvas-bg:#ffffff; --canvas-fg:#141414;`;
  const darkOverrides = dark
    ? `
    :root {
      --ink: #F0F0F0;
      --muted: #A0A0A0;
      --line: #3a3a3a;
      --bg-soft: #232323;
      --accent: #7DB4FF;
    }
    html, body { background: var(--canvas-bg); }
    h2 { color: #cfe3ff; }
    h3 { color: #b9d4f5; }
    th { background: #232323; }
    blockquote { background: #202632; color: #dfe6f0; }
    .cover .lead { color: #cbd5e1; }
    .toc a { color: var(--ink); }`
    : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <script src="${mermaidUrl}"></script>
  <style>
    :root {
      --ink: #1f2328;
      --muted: #57606a;
      --line: #d0d7de;
      --bg-soft: #f6f8fa;
      --accent: #0b4f8a;
      ${canvasVars}
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      color: var(--ink);
      font-family: "Segoe UI", "Calibri", Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    a { color: var(--accent); text-decoration: none; }
    h1 { font-size: 22pt; line-height: 1.2; color: var(--accent); margin: 0 0 14px; }
    h2 { font-size: 15pt; color: #16324f; margin: 22px 0 10px; page-break-after: avoid; }
    h3 { font-size: 12.5pt; color: #1f3b57; margin: 18px 0 8px; page-break-after: avoid; }
    p { margin: 0 0 10px; }
    ul, ol { margin: 0 0 12px; padding-left: 1.3em; }
    li { margin: 0 0 4px; }
    blockquote {
      margin: 12px 0;
      padding: 8px 14px;
      border-left: 4px solid var(--accent);
      background: #f3f7fb;
      color: #243447;
    }
    code {
      font-family: Consolas, "Cascadia Mono", "Courier New", monospace;
      font-size: 0.86em;
      background: var(--bg-soft);
      padding: 0.08em 0.32em;
      border-radius: 3px;
    }
    pre {
      background: var(--bg-soft);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 10px 12px;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
      font-size: 8.8pt;
      line-height: 1.4;
      page-break-inside: avoid;
    }
    pre code { background: none; padding: 0; font-size: inherit; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 14px;
      font-size: 9.4pt;
    }
    th, td {
      border: 1px solid var(--line);
      padding: 6px 8px;
      vertical-align: top;
      text-align: left;
    }
    th { background: #eef3f8; font-weight: 600; }
    tr { page-break-inside: avoid; }
    hr { border: none; border-top: 1px solid var(--line); margin: 18px 0; }
    .cover {
      min-height: 240mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 12mm 8mm 0;
    }
    .cover-kicker {
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: 9.5pt;
      color: var(--muted);
      margin-bottom: 10px;
    }
    .cover h1 { font-size: 28pt; margin-bottom: 10px; }
    .cover .lead { font-size: 13pt; color: #334155; max-width: 160mm; }
    .cover .meta { margin-top: 28px; color: var(--muted); font-size: 10.5pt; }
    .toc { margin-top: 28px; }
    .toc h2 { margin-top: 0; }
    .toc ol { list-style: none; padding: 0; }
    .toc li { margin: 0; border-bottom: 1px dotted var(--line); }
    .toc a {
      display: flex;
      gap: 10px;
      padding: 7px 0;
      color: var(--ink);
    }
    .toc-num {
      color: var(--accent);
      font-variant-numeric: tabular-nums;
      font-weight: 650;
      min-width: 1.8em;
    }
    .chapter { break-before: page; }
    .chapter:first-child { break-before: ${withCover ? "page" : "auto"}; }
    .mermaid {
      text-align: center;
      margin: 14px 0 18px;
      page-break-inside: avoid;
    }
    .mermaid svg {
      max-width: 100% !important;
      height: auto !important;
    }
    strong { font-weight: 650; }
    .canvas-root {
      font-family: "Segoe UI", "Calibri", Arial, sans-serif;
      color: var(--canvas-fg);
      background: var(--canvas-bg);
      font-size: 14px;
      line-height: 1.4;
    }
    .canvas-root h1, .canvas-root h2, .canvas-root h3 { color: inherit; }
    .canvas-root p { margin: 0; }
    .canvas-root table { margin: 0; font-size: 12px; }
    .canvas-root th, .canvas-root td { border: none; padding: 6px 8px; }
    .canvas-root svg { max-width: 100%; height: auto; }
    .canvas-card { page-break-inside: avoid; }
    button { font-family: inherit; }
    ${darkOverrides}
  </style>
</head>
<body>
  ${cover}
  ${body}
  <script>
    mermaid.initialize({
      startOnLoad: false,
      theme: "${dark ? "dark" : "neutral"}",
      securityLevel: "loose",
      fontFamily: "Segoe UI, Calibri, Arial, sans-serif",
      flowchart: { useMaxWidth: true, htmlLabels: true },
      sequence: { useMaxWidth: true },
      themeVariables: {
        fontFamily: "Segoe UI, Calibri, Arial, sans-serif",
        fontSize: "14px"
      }
    });
  </script>
</body>
</html>`;
}

async function main() {
  const args = parseArgs(process.argv);
  const src = path.resolve(args.src || args.positional[0] || process.cwd());
  if (!fs.existsSync(src)) {
    throw new Error(`Нет источника: ${src}`);
  }

  const pages = listPages(src);
  if (!pages.length) {
    throw new Error(`В ${src} нет .md или .canvas.tsx`);
  }

  const theme = args.theme === "dark" ? "dark" : "light";
  const tmpDir = path.join(ROOT, ".tmp");
  const chapters = [];
  for (const page of pages) {
    const full = path.join(page.dir, page.file);
    if (isCanvas(page.file)) {
      const rendered = await renderCanvasFile(full, { theme, tmpDir });
      chapters.push({ ...rendered, kind: "canvas" });
    } else {
      const raw = fs.readFileSync(full, "utf8");
      chapters.push({
        file: page.file,
        raw,
        title: firstHeading(raw) || page.file,
        html: mdToHtml(raw, page.file),
        kind: "md",
      });
    }
  }

  const onlyCanvas = chapters.every((ch) => ch.kind === "canvas");
  const withCover = args.flags.cover
    ? true
    : args.flags.noCover
      ? false
      : !(onlyCanvas && chapters.length === 1);

  const srcBase = fs.statSync(src).isFile() ? path.basename(src).replace(/\.canvas\.tsx$/i, "").replace(/\.md$/i, "") : path.basename(src);
  const title = args.title || chapters[0].title || srcBase;
  const outDir = fs.statSync(src).isFile() ? path.dirname(src) : src;
  const out = path.resolve(args.out || path.join(outDir, `${srcBase}.pdf`));
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const chrome = findChrome();
  if (!chrome) {
    throw new Error("Не найден Chrome или Edge. Задайте CHROME_PATH.");
  }

  const mermaidPath = await ensureMermaid();
  const html = buildHtml({
    title,
    kicker: args.kicker || "",
    lead: args.lead || "",
    dateLabel: args.date || ruDate(),
    chapters,
    mermaidPath,
    withCover,
    theme,
  });

  const htmlPath = path.join(path.dirname(out), `_${path.basename(out, ".pdf")}-print.html`);
  fs.writeFileSync(htmlPath, html, "utf8");

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: true,
    args: ["--disable-gpu", "--no-sandbox", "--allow-file-access-from-files"],
  });

  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(htmlPath).href, {
      waitUntil: "networkidle0",
      timeout: 120000,
    });
    const mermaidCount = await page.evaluate(async () => {
      const nodes = document.querySelectorAll(".mermaid");
      if (!nodes.length) return 0;
      await mermaid.run({ querySelector: ".mermaid" });
      return nodes.length;
    });
    if (mermaidCount > 0) {
      await page.waitForFunction(() => {
        const nodes = [...document.querySelectorAll(".mermaid")];
        return nodes.every((n) => n.querySelector("svg"));
      }, { timeout: 60000 });
    }

    const footer = args.footer || title;
    await page.pdf({
      path: out,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `
        <div style="font-size:9px; width:100%; padding:0 14mm; color:#667; display:flex; justify-content:space-between; font-family:Segoe UI, Arial, sans-serif;">
          <span>${escapeHtml(footer)}</span>
          <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`,
      margin: { top: "14mm", bottom: "16mm", left: "14mm", right: "14mm" },
    });
  } finally {
    await browser.close();
    if (!args.flags.keepHtml && fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
  }

  const mdCount = chapters.filter((c) => c.kind === "md").length;
  const canvasCount = chapters.filter((c) => c.kind === "canvas").length;
  console.log(`PDF: ${out}`);
  console.log(`Глав: ${chapters.length} (md: ${mdCount}, canvas: ${canvasCount})`);
}

main().catch((err) => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});
