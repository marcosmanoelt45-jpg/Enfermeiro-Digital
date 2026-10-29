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
  // Viewport Desktop
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

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

  console.log("📸 Acessando / para verificar cabeçalho desktop...");
  await page.goto("http://localhost:5174/?nosplash=1", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1500));

  const imgDesktopHeader = path.join(ARTIFACT_DIR, "screenshot-header-desktop-sem-goti.png");
  await page.screenshot({ path: imgDesktopHeader, fullPage: false });
  console.log("Salvo:", imgDesktopHeader);

  // Viewport Mobile
  console.log("📸 Testando viewport mobile...");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 800));

  const imgMobileHome = path.join(ARTIFACT_DIR, "screenshot-mobile-home-otimizada.png");
  await page.screenshot({ path: imgMobileHome, fullPage: false });
  console.log("Salvo:", imgMobileHome);

  await browser.close();
  console.log("🎉 Capturas concluídas!");
}

main().catch(console.error);
