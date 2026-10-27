import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_DIR = path.resolve("scratch/screenshots");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log("🚀 Iniciando captura responsiva Desktop & Mobile...");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('enfermeiro_digital_local_user', JSON.stringify({ id: 'local-test', full_name: 'Marcos' }));
    sessionStorage.setItem('enfere_splash_passed', 'true');
  });

  // 1. Desktop 1440x900 - Tela Intro
  console.log("📸 Capturando Desktop 1440x900 - Intro");
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto("http://localhost:5174/videochamada", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "desktop-02-intro.png") });

  // 2. Mobile 390x844 - Tela Intro
  console.log("📸 Capturando Mobile 390x844 - Intro");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "mobile-02-intro.png") });

  // 3. Iniciar Atendimento
  console.log("▶️ Clicando em Iniciar atendimento...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const iniciarBtn = btns.find((b) => b.textContent.includes("Iniciar atendimento"));
    if (iniciarBtn) iniciarBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // 4. Mobile Fala
  console.log("📸 Capturando Mobile 390x844 - Fala do Paciente");
  await page.screenshot({ path: path.join(OUTPUT_DIR, "mobile-03-fala.png") });

  // 5. Desktop Fala
  console.log("📸 Capturando Desktop 1440x900 - Fala do Paciente");
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "desktop-03-fala.png") });

  // 6. Avançar para a Questão 1 clicando em Pular e depois em Continuar
  console.log("▶️ Clicando em Pular fala e avançando para Questão 1...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const pularBtn = btns.find((b) => b.textContent.includes("Pular"));
    if (pularBtn) pularBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => {
    const contBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent.trim() === "Continuar"
    );
    if (contBtn) contBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // 7. Desktop Questão
  console.log("📸 Capturando Desktop 1440x900 - Questão 1");
  await page.screenshot({ path: path.join(OUTPUT_DIR, "desktop-04-questao.png") });

  // 8. Mobile Questão
  console.log("📸 Capturando Mobile 390x844 - Questão 1");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "mobile-04-questao.png") });

  await browser.close();
  console.log("🎉 Todas as capturas salvas em scratch/screenshots/!");
}

capture().catch((e) => {
  console.error("Erro no teste:", e);
  process.exit(1);
});
