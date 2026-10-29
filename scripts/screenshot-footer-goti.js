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

  console.log("📸 Acessando / para capturar footer...");
  await page.goto("http://localhost:5174/", { waitUntil: "domcontentloaded" });
  await new Promise((r) => setTimeout(r, 1500));

  // Rolar até o final
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 1000));

  const footerScreenshotPath = path.join(artifactDir, "screenshot-footer-goti.png");
  await page.screenshot({ path: footerScreenshotPath, fullPage: false });
  console.log("Screenshot do Footer salvo em:", footerScreenshotPath);

  await browser.close();
}

main().catch(console.error);
