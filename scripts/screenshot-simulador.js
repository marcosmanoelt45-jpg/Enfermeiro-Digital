import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_DIR = path.resolve("scratch/screenshots");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log("🚀 Iniciando navegador Chrome headless em 390x844...");
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

  // 1. Tela 1: Casos (Drawer no Início)
  console.log("📸 Testando Tela 1: Casos");
  await page.goto("http://localhost:5174/", { waitUntil: "networkidle0" });
  await page.waitForSelector("nav", { timeout: 10000 });

  // Clica no botão Casos via evaluate na dock inferior móvel
  await page.evaluate(() => {
    const dock = document.querySelector("nav.fixed.bottom-0");
    if (dock) {
      const btns = Array.from(dock.querySelectorAll("button"));
      const casosBtn = btns.find((b) => b.textContent.includes("Casos"));
      if (casosBtn) casosBtn.click();
    }
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "01-casos-real.png") });
  console.log("✅ Capturada 01-casos-real.png");

  // 2. Tela 2: Abertura / Intro do Caso
  console.log("📸 Testando Tela 2: Abertura do Caso");
  await page.goto("http://localhost:5174/videochamada", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "02-intro-real.png") });
  console.log("✅ Capturada 02-intro-real.png");

  // Testa alternar paciente para Teresinha e captura
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const terBtn = btns.find((b) => b.textContent.trim() === "Teresinha");
    if (terBtn) terBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "02-intro-teresinha-real.png") });
  console.log("✅ Capturada 02-intro-teresinha-real.png");

  // Volta para Marcus
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const marBtn = btns.find((b) => b.textContent.trim() === "Marcus");
    if (marBtn) marBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // Clica em Iniciar atendimento
  console.log("▶️ Clicando em Iniciar atendimento...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const startBtn = btns.find((b) => b.textContent.includes("Iniciar atendimento"));
    if (startBtn) startBtn.click();
  });

  // 3. Tela 3: Paciente Falando
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "03-fala-paciente-real.png") });
  console.log("✅ Capturada 03-fala-paciente-real.png");

  // Clica em Pular fala
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const pularBtn = btns.find((b) => b.textContent.includes("Pular"));
    if (pularBtn) pularBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // Clica em Continuar para ir para a Tela 4
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const contBtn = btns.find((b) => b.textContent.includes("Continuar"));
    if (contBtn) contBtn.click();
  });

  // 4. Tela 4: Múltipla Escolha
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "04-questao-escolha-real.png") });
  console.log("✅ Capturada 04-questao-escolha-real.png");

  // Seleciona a primeira alternativa A
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const optA = btns.find((b) => b.textContent.includes("Avaliar a ferida"));
    if (optA) optA.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // Clica em Verificar
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const verifBtn = btns.find((b) => b.textContent.includes("Verificar"));
    if (verifBtn) verifBtn.click();
  });

  // 8. Tela 8: Feedback de Acerto
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "08-feedback-acerto-real.png") });
  console.log("✅ Capturada 08-feedback-acerto-real.png");

  // Clica em Continuar no feedback
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const contBtn = btns.find((b) => b.textContent.includes("Continuar"));
    if (contBtn) contBtn.click();
  });

  // 5. Tela 5: Múltipla Seleção
  await new Promise((r) => setTimeout(r, 800));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    btns.forEach((b) => {
      const text = b.textContent;
      if (
        text.includes("Soro fisiológico") ||
        text.includes("Luvas de procedimento") ||
        text.includes("Gaze estéril") ||
        text.includes("Fita hipoalergênica")
      ) {
        b.click();
      }
    });
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "05-questao-selecao-real.png") });
  console.log("✅ Capturada 05-questao-selecao-real.png");

  // Clica em Verificar
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const verifBtn = btns.find((b) => b.textContent.includes("Verificar"));
    if (verifBtn) verifBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Clica em Continuar no feedback
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const contBtn = btns.find((b) => b.textContent.includes("Continuar"));
    if (contBtn) contBtn.click();
  });

  // 6. Tela 6: Cálculo de Dose
  await new Promise((r) => setTimeout(r, 800));
  // Clica na tecla '2' do teclado virtual
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const btn2 = btns.find((b) => b.textContent.trim() === "2");
    if (btn2) btn2.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "06-questao-calculo-real.png") });
  console.log("✅ Capturada 06-questao-calculo-real.png");

  // Clica em Verificar
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const verifBtn = btns.find((b) => b.textContent.includes("Verificar"));
    if (verifBtn) verifBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Clica em Continuar no feedback
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const contBtn = btns.find((b) => b.textContent.includes("Continuar"));
    if (contBtn) contBtn.click();
  });

  // 7. Tela 7: Resposta Falada
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "07-questao-voz-real.png") });
  console.log("✅ Capturada 07-questao-voz-real.png");

  // Clica em Prefiro digitar
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const digBtn = btns.find((b) => b.textContent.includes("Prefiro digitar"));
    if (digBtn) digBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.type("textarea", "Higienizar as mãos com água e sabão");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const salvarBtn = btns.find((b) => b.textContent.trim() === "Salvar");
    if (salvarBtn) salvarBtn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  // Clica em Verificar
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const verifBtn = btns.find((b) => b.textContent.includes("Verificar"));
    if (verifBtn) verifBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // Clica em Continuar no feedback para ir ao resumo
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const contBtn = btns.find((b) => b.textContent.includes("Continuar"));
    if (contBtn) contBtn.click();
  });

  // 10. Tela 10: Conclusão / Resumo
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "10-resumo-real.png") });
  console.log("✅ Capturada 10-resumo-real.png");

  await browser.close();
  console.log("🎉 Teste automatizado de todas as telas concluído com sucesso!");
}

run().catch((err) => {
  console.error("Erro no teste:", err);
  process.exit(1);
});
