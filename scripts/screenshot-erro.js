import puppeteer from "puppeteer-core";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_DIR = path.resolve("scratch/screenshots");

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('enfermeiro_digital_local_user', JSON.stringify({ id: 'local-test', full_name: 'Marcos' }));
    sessionStorage.setItem('enfere_splash_passed', 'true');
  });

  await page.goto("http://localhost:5174/videochamada", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));

  // Iniciar atendimento
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const startBtn = btns.find((b) => b.textContent.includes("Iniciar atendimento"));
    if (startBtn) startBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Pular fala
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const pularBtn = btns.find((b) => b.textContent.includes("Pular"));
    if (pularBtn) pularBtn.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  // Continuar para questão 1
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const contBtn = btns.find((b) => b.textContent.includes("Continuar"));
    if (contBtn) contBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Seleciona alternativa B (Incorreta: "Aplicar pomada em toda a área...")
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const optB = btns.find((b) => b.textContent.includes("Aplicar pomada"));
    if (optB) optB.click();
  });
  await new Promise((r) => setTimeout(r, 300));

  // Clica em Verificar
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const verifBtn = btns.find((b) => b.textContent.includes("Verificar"));
    if (verifBtn) verifBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Captura Feedback de Erro (Tela 9)
  await page.screenshot({ path: path.join(OUTPUT_DIR, "09-feedback-erro-real.png") });
  console.log("✅ Capturada 09-feedback-erro-real.png");

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
