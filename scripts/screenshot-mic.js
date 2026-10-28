import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_DIR = path.resolve("scratch/screenshots_v4");

async function captureMic() {
  console.log("🚀 Capturando Tela de Questão de Voz com botão retangular...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('enfermeiro_digital_local_user', JSON.stringify({ id: 'local-shika', full_name: 'Shika' }));
    sessionStorage.setItem('enfere_splash_passed', 'true');
  });

  console.log("📸 Acessando /videochamada?tela=questao&tipo=voz");
  await page.goto("http://localhost:5174/videochamada?tela=questao&tipo=voz", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({ path: path.join(OUTPUT_DIR, "5-questao-voz-mic-retangular-confirmado.png") });
  console.log("✅ Captura da questão de voz concluída!");
  await browser.close();
}

captureMic().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
