import puppeteer from "puppeteer-core";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:/Users/mxmin/.gemini/antigravity-ide/brain/ce7d4322-0401-4a52-9f7c-a6b212a5fe06";

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--autoplay-policy=no-user-gesture-required"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 880, deviceScaleFactor: 2 }); // Viewport mobile vertical

  // Destravar login e splash
  await page.goto("http://localhost:5174/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    sessionStorage.setItem("enfere_splash_passed", "true");
    localStorage.setItem("enfere_splash_seen", "true");
    localStorage.setItem("enfermeiro_digital_local_user", JSON.stringify({
      full_name: "Marcos Manoel Tavares Neumann",
      email: "marcos@enfere.com.br",
      created_at: "2026-01-01"
    }));
  });

  console.log("📸 Capturando Intro Marcus com Banco de 44 Questões...");
  await page.goto("http://localhost:5174/videochamada?noshuffle=1", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1200));

  const imgIntroMarcus = path.join(ARTIFACT_DIR, "screenshot-banco-marcus-intro.png");
  await page.screenshot({ path: imgIntroMarcus, fullPage: false });
  console.log("Salvo:", imgIntroMarcus);

  // Selecionar Teresinha
  console.log("📸 Selecionando Teresinha...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const btn = btns.find((b) => b.textContent.trim().toLowerCase() === "teresinha");
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  const imgIntroTeresinha = path.join(ARTIFACT_DIR, "screenshot-banco-teresinha-intro.png");
  await page.screenshot({ path: imgIntroTeresinha, fullPage: false });
  console.log("Salvo:", imgIntroTeresinha);

  // Iniciar atendimento
  console.log("📸 Clicando em Iniciar atendimento...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const btnIniciar = btns.find((b) => b.textContent.includes("Iniciar atendimento"));
    if (btnIniciar) btnIniciar.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const imgFalaPaciente = path.join(ARTIFACT_DIR, "screenshot-banco-fala-paciente.png");
  await page.screenshot({ path: imgFalaPaciente, fullPage: false });
  console.log("Salvo:", imgFalaPaciente);

  // Clicar em continuar para ir à primeira questão
  console.log("📸 Avançando para a primeira questão...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const btnContinuar = btns.find((b) => b.textContent.includes("Continuar") || b.textContent.includes("Pular"));
    if (btnContinuar) btnContinuar.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const btnContinuar = btns.find((b) => b.textContent.includes("Continuar"));
    if (btnContinuar && !btnContinuar.disabled) btnContinuar.click();
  });
  await new Promise((r) => setTimeout(r, 1500));

  const imgQuestao1 = path.join(ARTIFACT_DIR, "screenshot-banco-questao-1.png");
  await page.screenshot({ path: imgQuestao1, fullPage: false });
  console.log("Salvo:", imgQuestao1);

  await browser.close();
  console.log("🎉 Todas as capturas do novo banco foram salvas com sucesso!");
}

main().catch(console.error);
