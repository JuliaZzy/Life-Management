import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import puppeteer from "puppeteer-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readmePath = path.join(root, "README.md");
const outPath = path.join(root, "README.png");

const md = fs.readFileSync(readmePath, "utf8");

marked.use({
  gfm: true,
  breaks: false,
  renderer: {
    code({ text, lang }) {
      if (lang === "mermaid") {
        return `<pre class="mermaid">${text}</pre>\n`;
      }
      return false;
    },
  },
});
const bodyHtml = marked.parse(md);

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 48px 56px 64px;
      max-width: 920px;
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB",
        "Microsoft YaHei", "Segoe UI", sans-serif;
      font-size: 15px;
      line-height: 1.65;
      color: #1a1a1a;
      background: #fff;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #e5e5e5; padding-bottom: 0.3em; margin-top: 0; }
    h2 { font-size: 1.5em; margin-top: 1.6em; border-bottom: 1px solid #eee; padding-bottom: 0.25em; }
    h3 { font-size: 1.2em; margin-top: 1.4em; }
    blockquote {
      margin: 1em 0;
      padding: 0.5em 1em;
      border-left: 4px solid #3b82f6;
      background: #f8fafc;
      color: #334155;
    }
    code {
      font-family ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.9em;
      background: #f4f4f5;
      padding: 0.15em 0.35em;
      border-radius: 4px;
    }
    pre {
      background: #18181b;
      color: #e4e4e7;
      padding: 16px 18px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.5;
    }
    pre code { background: none; padding: 0; color: inherit; }
    pre.mermaid {
      background: #fff;
      border: 1px solid #e5e5e5;
      padding: 24px;
    }
    img { max-width: 100%; height: auto; display: block; margin: 12px 0; border-radius: 8px; border: 1px solid #e5e5e5; }
    ul, ol { padding-left: 1.5em; }
    li { margin: 0.35em 0; }
    hr { border: none; border-top: 1px solid #e5e5e5; margin: 2em 0; }
    strong { font-weight: 600; }
  </style>
</head>
<body>
${bodyHtml}
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
  mermaid.initialize({ startOnLoad: true, theme: "neutral", securityLevel: "loose" });
  await mermaid.run({ querySelector: ".mermaid" });
  window.__RENDER_DONE__ = true;
</script>
</body>
</html>`;

const tmpHtml = path.join(root, ".readme-export.html");
fs.writeFileSync(tmpHtml, html, "utf8");

const chromeCandidates = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
];
const executablePath = chromeCandidates.find((p) => fs.existsSync(p));
if (!executablePath) {
  throw new Error("未找到本机 Chrome/Chromium，请安装 Google Chrome 后重试。");
}

const browser = await puppeteer.launch({
  headless: true,
  executablePath,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 800, deviceScaleFactor: 2 });
  await page.goto(`file://${tmpHtml}`, { waitUntil: "load", timeout: 120_000 });
  await page.waitForFunction(() => window.__RENDER_DONE__ === true, { timeout: 90_000 });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 500)));
  await page.screenshot({ path: outPath, fullPage: true, type: "png" });
  console.log(`Wrote ${outPath}`);
} finally {
  await browser.close();
  fs.unlinkSync(tmpHtml);
}
