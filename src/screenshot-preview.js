"use strict";
// Скриншот печатного HTML (отладка вёрстки конвертера).
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const puppeteer = require("puppeteer-core");

function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const home = process.env.LOCALAPPDATA || "";
  return [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(home, "Google\\Chrome\\Application\\chrome.exe"),
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].find((p) => fs.existsSync(p));
}

async function main() {
  const html = path.resolve(process.argv[2]);
  const out = path.resolve(process.argv[3] || "preview.png");
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ["--disable-gpu", "--no-sandbox", "--allow-file-access-from-files"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(html).href, { waitUntil: "networkidle0" });
  await page.evaluate(async () => {
    if (document.querySelectorAll(".mermaid").length) {
      await mermaid.run({ querySelector: ".mermaid" });
    }
  });
  await page.screenshot({ path: out, fullPage: false });
  await browser.close();
  console.log(out);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
