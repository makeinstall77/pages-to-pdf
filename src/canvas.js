"use strict";

const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const RUNTIME = path.resolve(__dirname, "runtime", "index.js");

function canvasTitle(source, filename) {
  const h1 = source.match(/<H1\b[^>]*>([\s\S]*?)<\/H1>/);
  if (h1) {
    return h1[1]
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  return filename.replace(/\.canvas\.tsx$/i, "").replace(/-/g, " ");
}

async function bundleCanvas(entry, outfile) {
  await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    jsxImportSource: "react",
    alias: { "cursor/canvas": RUNTIME },
    external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    logLevel: "silent",
    absWorkingDir: path.dirname(entry),
    target: "node18",
  });
}

function loadComponent(bundlePath) {
  const resolved = require.resolve(bundlePath);
  delete require.cache[resolved];
  const mod = require(resolved);
  const Component = mod && (mod.default || mod);
  if (typeof Component !== "function") {
    throw new Error(`Canvas не экспортирует React-компонент: ${bundlePath}`);
  }
  return Component;
}

async function renderCanvasFile(filePath, { theme = "light", tmpDir }) {
  const source = fs.readFileSync(filePath, "utf8");
  const filename = path.basename(filePath);
  fs.mkdirSync(tmpDir, { recursive: true });
  const outfile = path.join(tmpDir, filename.replace(/[^\w.-]+/g, "_") + ".cjs");
  try {
    await bundleCanvas(filePath, outfile);
    globalThis.__PAGES_TO_PDF_THEME = theme;
    const Component = loadComponent(outfile);
    const markup = renderToStaticMarkup(React.createElement(Component));
    return {
      file: filename,
      title: canvasTitle(source, filename),
      html: markup,
    };
  } finally {
    if (fs.existsSync(outfile)) fs.unlinkSync(outfile);
  }
}

module.exports = { canvasTitle, renderCanvasFile };
