import puppeteer from "puppeteer-core";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950, deviceScaleFactor: 2 });

  // Acessar página inicial para setar localStorage e sessionStorage
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

  const artifactDir = "C:/Users/mxmin/.gemini/antigravity-ide/brain/ce7d4322-0401-4a52-9f7c-a6b212a5fe06";

  // 1. Acessar Perfil
  console.log("📸 Acessando /conta (Perfil)...");
  await page.goto("http://localhost:5174/conta", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2000));

  const perfilScreenshotPath = path.join(artifactDir, "screenshot-perfil-limpo.png");
  await page.screenshot({ path: perfilScreenshotPath, fullPage: true });
  console.log("Screenshot do Perfil salvo em:", perfilScreenshotPath);

  // 2. Acessar Dashboard e capturar o cabeçalho e footer
  console.log("📸 Acessando / (Dashboard)...");
  await page.goto("http://localhost:5174/", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 2000));

  const headerLogoScreenshotPath = path.join(artifactDir, "screenshot-logo-topo-rodape.png");
  await page.screenshot({ path: headerLogoScreenshotPath, fullPage: false });
  console.log("Screenshot do Logo salvo em:", headerLogoScreenshotPath);

  await browser.close();
  console.log("✅ Capturas concluídas com sucesso!");
}

main().catch(console.error);
