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

  // Alterna paciente para Teresinha e captura
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const terBtn = btns.find((b) => b.textContent.trim() === "Teresinha");
    if (terBtn) terBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, "02-intro-teresinha-real.png") });
  console.log("✅ Capturada 02-intro-teresinha-real.png");

  // Iniciar Atendimento
  console.log("▶️ Clicando em Iniciar atendimento...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll("button"));
    const iniciarBtn = btns.find((b) => b.textContent.includes("Iniciar atendimento"));
    if (iniciarBtn) iniciarBtn.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  let capturedEscolha = false;
  let capturedSelecao = false;
  let capturedCalculo = false;
  let capturedVoz = false;
  let capturedFeedback = false;
  let capturedFala = false;

  for (let loop = 0; loop < 20; loop++) {
    await new Promise((r) => setTimeout(r, 600));

    // 1. Verifica se o modal de feedback está aberto
    const isFeedbackOpen = await page.evaluate(() => {
      const contBtn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent.trim() === "Continuar"
      );
      return !!contBtn;
    });

    if (isFeedbackOpen) {
      if (!capturedFeedback) {
        await page.screenshot({ path: path.join(OUTPUT_DIR, "08-feedback-acerto-real.png") });
        console.log("✅ Capturada 08-feedback-acerto-real.png");
        capturedFeedback = true;
      }
      await page.evaluate(() => {
        const contBtn = Array.from(document.querySelectorAll("button")).find((b) =>
          b.textContent.trim() === "Continuar"
        );
        if (contBtn) contBtn.click();
      });
      continue;
    }

    // 2. Verifica se chegou na tela de resumo
    const isResumo = await page.evaluate(() => {
      return document.body.innerText.includes("Atendimento concluído");
    });
    if (isResumo) {
      console.log("🎉 Tela de resumo alcançada!");
      await page.screenshot({ path: path.join(OUTPUT_DIR, "10-resumo-real.png") });
      console.log("✅ Capturada 10-resumo-real.png");
      break;
    }

    // 3. Verifica se é fala do paciente
    const isFala = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      return btns.some((b) => b.textContent.includes("Pular") || b.textContent.includes("Ouvir de novo"));
    });

    if (isFala) {
      if (!capturedFala) {
        await page.screenshot({ path: path.join(OUTPUT_DIR, "03-fala-paciente-real.png") });
        console.log("✅ Capturada 03-fala-paciente-real.png");
        capturedFala = true;
      }
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const pular = btns.find((b) => b.textContent.includes("Pular"));
        if (pular) pular.click();
      });
      await new Promise((r) => setTimeout(r, 400));
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const cont = btns.find((b) => b.textContent.includes("Continuar"));
        if (cont) cont.click();
      });
      continue;
    }

    // 4. Identifica tipo de questão ativa
    const questionType = await page.evaluate(() => {
      if (document.querySelector(".grid.grid-cols-3")) return "calculo";
      if (document.querySelector("button[aria-label='Gravar resposta por voz']")) return "voz";
      const badges = Array.from(document.querySelectorAll("span")).map((s) => s.textContent.trim());
      if (badges.includes("A") || badges.includes("B")) return "escolha";
      const hasCheckbox = document.querySelector(".rounded-lg.border-2");
      if (hasCheckbox) return "selecao";
      return "desconhecido";
    });

    console.log(`Passo ativo: tipo = ${questionType}`);

    if (questionType === "escolha") {
      if (!capturedEscolha) {
        await page.screenshot({ path: path.join(OUTPUT_DIR, "04-questao-escolha-real.png") });
        console.log("✅ Capturada 04-questao-escolha-real.png");
        capturedEscolha = true;
      }
      // Seleciona primeira alternativa A
      await page.evaluate(() => {
        const badges = Array.from(document.querySelectorAll("span"));
        const badgeA = badges.find((s) => s.textContent.trim() === "A");
        if (badgeA) {
          const btn = badgeA.closest("button");
          if (btn) btn.click();
        }
      });
    } else if (questionType === "selecao") {
      // Seleciona duas opções
      await page.evaluate(() => {
        const checkBtns = Array.from(document.querySelectorAll("button")).filter((b) =>
          b.querySelector(".rounded-lg.border-2")
        );
        if (checkBtns.length >= 2) {
          checkBtns[0].click();
          checkBtns[1].click();
        }
      });
      await new Promise((r) => setTimeout(r, 300));
      if (!capturedSelecao) {
        await page.screenshot({ path: path.join(OUTPUT_DIR, "05-questao-selecao-real.png") });
        console.log("✅ Capturada 05-questao-selecao-real.png");
        capturedSelecao = true;
      }
    } else if (questionType === "calculo") {
      if (!capturedCalculo) {
        await page.screenshot({ path: path.join(OUTPUT_DIR, "06-questao-calculo-real.png") });
        console.log("✅ Capturada 06-questao-calculo-real.png");
        capturedCalculo = true;
      }
      // Pressiona a tecla '5' (ou '2')
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn5 = btns.find((b) => b.textContent.trim() === "5") || btns.find((b) => b.textContent.trim() === "2");
        if (btn5) btn5.click();
      });
    } else if (questionType === "voz") {
      if (!capturedVoz) {
        await page.screenshot({ path: path.join(OUTPUT_DIR, "07-questao-voz-real.png") });
        console.log("✅ Capturada 07-questao-voz-real.png");
        capturedVoz = true;
      }
      // Prefiro digitar
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const dig = btns.find((b) => b.textContent.includes("Prefiro digitar"));
        if (dig) dig.click();
      });
      await new Promise((r) => setTimeout(r, 400));
      await page.type("textarea", "Higienizar as mãos com água e sabão");
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const sal = btns.find((b) => b.textContent.trim() === "Salvar");
        if (sal) sal.click();
      });
    }

    await new Promise((r) => setTimeout(r, 300));

    // Clica em Verificar
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const verif = btns.find((b) => b.textContent.trim() === "Verificar" && !b.disabled);
      if (verif) verif.click();
    });
  }

  await browser.close();
  console.log("🎉 Teste dinâmico finalizado com sucesso!");
}

run().catch((err) => {
  console.error("Erro no teste:", err);
  process.exit(1);
});
