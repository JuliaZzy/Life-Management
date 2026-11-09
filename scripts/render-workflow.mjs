import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mmdPath = path.join(root, "docs/diagrams/workflow.mmd");
const svgOut = path.join(root, "docs/diagrams/workflow.svg");
const pngOut = path.join(root, "docs/diagrams/workflow.png");

const diagram = fs.readFileSync(mmdPath, "utf8");

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:24px;background:#fff;">
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
  mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose", fontFamily: "PingFang SC, sans-serif" });
  const src = ${JSON.stringify(diagram)};
  const { svg } = await mermaid.render("workflow", src);
  document.body.insertAdjacentHTML("beforeend", svg);
  window.__SVG__ = svg;
  window.__RENDER_DONE__ = true;
</script>
</body>
</html>`;

const tmpHtml = path.join(root, ".workflow-export.html");
fs.writeFileSync(tmpHtml, html, "utf8");

const executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!fs.existsSync(executablePath)) {
  throw new Error("未找到 Google Chrome");
}

const browser = await puppeteer.launch({
  headless: true,
  executablePath,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
try {
  const page = await browser.newPage();
  await page.goto(`file://${tmpHtml}`, { waitUntil: "load", timeout: 120_000 });
  await page.waitForFunction(() => window.__RENDER_DONE__ === true, { timeout: 90_000 });
  const svg = await page.evaluate(() => window.__SVG__);
  fs.writeFileSync(svgOut, svg, "utf8");

  const box = await page.evaluate(() => {
    const el = document.querySelector("svg");
    if (!el) return null;
    const { width, height } = el.getBoundingClientRect();
    return { width: Math.ceil(width), height: Math.ceil(height) };
  });
  if (box) {
    await page.setViewport({ width: box.width + 48, height: box.height + 48, deviceScaleFactor: 2 });
    await page.goto(`file://${tmpHtml}`, { waitUntil: "load" });
    await page.waitForFunction(() => window.__RENDER_DONE__ === true, { timeout: 90_000 });
    await page.screenshot({ path: pngOut, type: "png", clip: { x: 0, y: 0, width: box.width + 48, height: box.height + 48 } });
  }
  console.log(`Wrote ${svgOut}`);
  if (fs.existsSync(pngOut)) console.log(`Wrote ${pngOut}`);
} finally {
  await browser.close();
  fs.unlinkSync(tmpHtml);
}
