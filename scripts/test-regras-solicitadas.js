import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

console.log("--- TESTANDO VALIDAÇÕES DAS 6 REGRAS SOLICITADAS ---");

// 1. Validar PacienteVideoStage.jsx
const videoStageContent = fs.readFileSync(path.join(root, "src/components/simulador/PacienteVideoStage.jsx"), "utf-8");
if (
  videoStageContent.includes("disablePictureInPicture") &&
  videoStageContent.includes("disableRemotePlayback") &&
  videoStageContent.includes("pointer-events-none") &&
  videoStageContent.includes("videoFala.loop = false") &&
  !videoStageContent.includes("videoFala.loop = true")
) {
  console.log("✅ SUCESSO: PacienteVideoStage sem controles nativos, sem PiP e sem loop infinito no vídeo de fala.");
} else {
  console.error("❌ ERRO: PacienteVideoStage falhou na validação de atributos ou loop.");
  process.exit(1);
}

// 2. Validar Videochamada.jsx
const videochamadaContent = fs.readFileSync(path.join(root, "src/pages/Videochamada.jsx"), "utf-8");
if (
  videochamadaContent.includes("selectedMultipla.length >= 2") &&
  !videochamadaContent.includes("truncate max-w-[190px]")
) {
  console.log("✅ SUCESSO: Videochamada exige no mínimo 2 respostas para múltipla seleção e fórmula não é truncada.");
} else {
  console.error("❌ ERRO: Videochamada falhou na regra de múltipla seleção ou truncamento de fórmula.");
  process.exit(1);
}

// 3. Validar Conta.jsx
const contaContent = fs.readFileSync(path.join(root, "src/pages/Conta.jsx"), "utf-8");
if (
  !contaContent.includes("Modo Claro") &&
  !contaContent.includes("handleSaveGeminiKey") &&
  !contaContent.includes("handleSaveAssemblyAIKey")
) {
  console.log("✅ SUCESSO: Conta.jsx não possui mais seletor de tema claro/escuro nem ajustes de chave de IA.");
} else {
  console.error("❌ ERRO: Conta.jsx ainda contém tema claro ou chaves de IA.");
  process.exit(1);
}

// 4. Validar StudentHeader.jsx
const studentHeaderContent = fs.readFileSync(path.join(root, "src/components/StudentHeader.jsx"), "utf-8");
if (!studentHeaderContent.includes("Alternador Rápido de Tema")) {
  console.log("✅ SUCESSO: StudentHeader.jsx não possui mais o botão de alternador de tema claro/escuro.");
} else {
  console.error("❌ ERRO: StudentHeader.jsx ainda contém botão de tema.");
  process.exit(1);
}

// 5. Validar ClinicalOptionsModal.jsx
const clinicalModalContent = fs.readFileSync(path.join(root, "src/components/mobile/ClinicalOptionsModal.jsx"), "utf-8");
if (!clinicalModalContent.includes("Tema da Interface (Escuro / Claro)")) {
  console.log("✅ SUCESSO: ClinicalOptionsModal.jsx não possui mais seleção de tema claro.");
} else {
  console.error("❌ ERRO: ClinicalOptionsModal.jsx ainda possui seção de tema.");
  process.exit(1);
}

// 6. Validar ThemeContext.jsx
const themeContextContent = fs.readFileSync(path.join(root, "src/lib/ThemeContext.jsx"), "utf-8");
if (themeContextContent.includes("useState('dark')")) {
  console.log("✅ SUCESSO: ThemeContext.jsx fixado no tema escuro permanente.");
} else {
  console.error("❌ ERRO: ThemeContext.jsx não está fixado no tema escuro.");
  process.exit(1);
}

console.log("🎉 TODAS AS 6 REGRAS SOLICITADAS FORAM VALIDADAS COM SUCESSO!");
