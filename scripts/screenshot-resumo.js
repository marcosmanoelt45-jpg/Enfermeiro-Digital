import puppeteer from "puppeteer-core";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_DIR = path.resolve("scratch/screenshots_v4");

async function captureResumos() {
  console.log("🚀 Capturando telas de resumo (Sucesso e Sem Vidas)...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("enfermeiro_digital_local_user", JSON.stringify({ id: "local-shika", full_name: "Shika" }));
    sessionStorage.setItem("enfere_splash_passed", "true");
  });

  // 1. Tela de Sem Vidas (Derrota)
  console.log("📸 Acessando tela de resumo com vidas=0");
  await page.goto("http://localhost:5174/videochamada?tela=resumo&vidas=0", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "6-resumo-sem-vidas-goti-atento.png") });
  console.log("✅ Captura sem vidas concluída!");

  // 2. Tela de Atendimento Concluído (Sucesso)
  console.log("📸 Acessando tela de resumo com vidas=3");
  await page.goto("http://localhost:5174/videochamada?tela=resumo&vidas=3", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "7-resumo-sucesso-goti-feliz.png") });
  console.log("✅ Captura sucesso concluída!");

  await browser.close();
}

captureResumos().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});
