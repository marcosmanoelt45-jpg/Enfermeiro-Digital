import puppeteer from "puppeteer-core";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:/Users/mxmin/.gemini/antigravity-ide/brain/ce7d4322-0401-4a52-9f7c-a6b212a5fe06";

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 440, height: 840, deviceScaleFactor: 2 });

  const sessoesPerguntas = [];

  for (let rodada = 1; rodada <= 3; rodada++) {
    console.log(`\n🩺 Iniciando Sessão #${rodada}...`);
    await page.goto("http://localhost:5174/videochamada", { waitUntil: "domcontentloaded" });
    await new Promise((r) => setTimeout(r, 800));

    // Se estiver na tela de Splash, clica em "Pular"
    await page.evaluate(() => {
      const splashPular = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Pular'));
      if (splashPular) splashPular.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Clica em "Iniciar atendimento" na tela de intro
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('Iniciar atendimento'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    // Clica em "Pular" para encerrar a fala do paciente e depois "Continuar"
    await page.evaluate(() => {
      const pularBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Pular'));
      if (pularBtn) pularBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    await page.evaluate(() => {
      const continuarBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Continuar'));
      if (continuarBtn) continuarBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    // Captura o tema e o texto da pergunta da sessão
    const info = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const sessaoBadge = spans.find(s => s.textContent.includes('Sessão #'));
      const temaEl = document.querySelector('.truncate');
      const bubbleEl = document.querySelector('.text-center');
      return {
        sessao: sessaoBadge ? sessaoBadge.textContent.trim() : 'Sessão Ativa',
        tema: temaEl ? temaEl.textContent.trim() : 'Tema Clínico',
        pergunta: bubbleEl ? bubbleEl.textContent.trim() : 'Pergunta'
      };
    });

    console.log(`✅ Sessão #${rodada}: [${info.sessao}] | ${info.tema} | Pergunta: "${info.pergunta.slice(0, 80)}..."`);
    sessoesPerguntas.push(info);

    const screenshotPath = path.join(ARTIFACT_DIR, `screenshot-sessao-${rodada}.png`);
    await page.screenshot({ path: screenshotPath });
  }

  await browser.close();
  console.log("\n🎉 Todas as 3 sessões foram capturadas!");
  console.log("Resumo:", JSON.stringify(sessoesPerguntas, null, 2));
}

main().catch(console.error);
