import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_DIR = path.resolve("scratch/screenshots_v3");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log("🚀 Iniciando capturas do Splash Screen...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  // Navegar para /splash
  console.log("📸 Acessando /splash");
  await page.goto("http://localhost:5174/splash", { waitUntil: "domcontentloaded" });

  // Capturar olhinhos olhando pros lados (~400ms)
  await new Promise((r) => setTimeout(r, 450));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "splash-1-olhar.png") });

  // Capturar olhinhos felizes fechados (^ ^) aos ~1350ms
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "splash-2-happy.png") });

  // Capturar tela final aos ~2800ms
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "splash-3-final.png") });

  console.log("✅ Capturas concluídas em scratch/screenshots_v3!");
  await browser.close();
}

capture().catch((err) => {
  console.error("❌ Erro ao capturar:", err);
  process.exit(1);
});
