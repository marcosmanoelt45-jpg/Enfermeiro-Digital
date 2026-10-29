import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_DIR = path.resolve("scratch/screenshots_v4");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log("🚀 Iniciando capturas das correções da Videochamada...");
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

  // 1. Tela Intro (/videochamada) - Paciente agora aparece
  console.log("📸 Capturando Tela 1: Intro com Paciente presente");
  await page.goto("http://localhost:5174/videochamada", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "1-intro-com-video.png") });

  // Iniciar atendimento
  console.log("📸 Avançando para Tela 2: Fala do Paciente");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const iniciarBtn = btns.find((b) => b.textContent.includes("Iniciar atendimento"));
    if (iniciarBtn) iniciarBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "2-fala-com-video-e-ondas-centro.png") });

  // Pular fala e avançar para questão
  console.log("📸 Avançando para Tela 3: Questão com vídeo largo e ondas no centro");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const pularBtn = btns.find((b) => b.textContent.includes("Pular"));
    if (pularBtn) pularBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "3-questao-video-largo.png") });

  // Navegar até a questão de voz (passo 7 - BIOSSEGURANÇA UNIVERSAL)
  console.log("📸 Navegando até a questão de resposta falada...");
  // Vamos definir diretamente o stepIndex ou avançar com mock
  for (let step = 1; step <= 6; step++) {
    await page.evaluate(() => {
      // seleciona primeira opcao se houver
      const opt = document.querySelector("button[type='button']");
      const verif = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Verificar") || b.textContent.includes("Continuar"));
      if (verif) verif.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const cont = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Continuar"));
      if (cont) cont.click();
    });
    await new Promise((r) => setTimeout(r, 400));
  }

  await page.screenshot({ path: path.join(OUTPUT_DIR, "4-questao-voz-mic-retangular.png") });

  console.log("✅ Todas as capturas salvas em scratch/screenshots_v4!");
  await browser.close();
}

capture().catch((err) => {
  console.error("❌ Erro ao capturar:", err);
  process.exit(1);
});
