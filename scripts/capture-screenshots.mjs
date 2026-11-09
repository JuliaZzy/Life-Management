import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "docs/screenshots");
const baseUrl = process.env.APP_URL ?? "http://127.0.0.1:3000";

const shots = [
  { file: "01-overview.png", tab: "overview", navLabel: "今日总览", waitText: "今天，先把重要的事做完" },
  { file: "02-projects.png", tab: "projects", navLabel: "项目与事实", waitText: "项目与事实" },
  { file: "03-applications.png", tab: "applications", navLabel: "求职投递", waitText: "求职投递" },
  { file: "04-interviews.png", tab: "interviews", navLabel: "面试题库", waitText: "面试题库" },
  { file: "05-study.png", tab: "study", navLabel: "学习复习", waitText: "学习复习" },
  { file: "06-memory.png", tab: "memory", navLabel: "记忆与日志", waitText: "记忆与日志" },
];

const executablePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!fs.existsSync(executablePath)) {
  throw new Error("未找到 Google Chrome");
}

async function waitForServer(url, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`应用未就绪：${url}，请先运行 pnpm dev`);
}

await waitForServer(baseUrl);
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: true,
  executablePath,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=medium"],
});

try {
  for (const shot of shots) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto(baseUrl, { waitUntil: "networkidle2", timeout: 60_000 });
    await page.evaluate((navLabel) => {
      const btn = [...document.querySelectorAll("button.nav-item")].find((el) =>
        el.textContent?.includes(navLabel),
      );
      btn?.click();
    }, shot.navLabel);
    await page.waitForFunction(
      (label) => document.body?.innerText?.includes(label),
      { timeout: 30_000 },
      shot.waitText,
    );
    await new Promise((r) => setTimeout(r, 500));
    const outPath = path.join(outDir, shot.file);
    await page.screenshot({ path: outPath, type: "png" });
    console.log(`Wrote ${outPath}`);
    await page.close();
  }
} finally {
  await browser.close();
}
