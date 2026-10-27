import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_DIR = path.resolve("scratch/screenshots_v3");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log("🚀 Iniciando capturas de validação...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('enfermeiro_digital_local_user', JSON.stringify({ id: 'local-shika', full_name: 'Shika' }));
    sessionStorage.setItem('enfere_splash_passed', 'true');
  });

  // 1. Mobile Home (390x844)
  console.log("📸 Capturando Mobile Home (Goti ampliado + Sugestões de Hoje + Boas-vindas)");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto("http://localhost:5174/", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "mobile-dashboard-shika.png") });

  // 2. Desktop Home (1440x900)
  console.log("📸 Capturando Desktop Home");
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "desktop-dashboard-shika.png") });

  // 3. Mobile Videochamada - Questão
  console.log("📸 Navegando para Videochamada...");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto("http://localhost:5174/videochamada", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));

  // Iniciar atendimento
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const iniciarBtn = btns.find((b) => b.textContent.includes("Iniciar atendimento"));
    if (iniciarBtn) iniciarBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Pular fala e avançar para questão
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const pularBtn = btns.find((b) => b.textContent.includes("Pular"));
    if (pularBtn) pularBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const contBtn = btns.find((b) => b.textContent.includes("Continuar"));
    if (contBtn) contBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  console.log("📸 Capturando Mobile Questão 1 (Paciente maior, fala abaixo, sem espaço morto)");
  await page.screenshot({ path: path.join(OUTPUT_DIR, "mobile-questao-refinada.png") });

  // 4. Desktop Videochamada - Questão
  console.log("📸 Capturando Desktop Questão 1");
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "desktop-questao-refinada.png") });

  await browser.close();
  console.log("🎉 Todas as capturas foram salvas em:", OUTPUT_DIR);
}

capture().catch((err) => {
  console.error("Erro na captura:", err);
  process.exit(1);
});
