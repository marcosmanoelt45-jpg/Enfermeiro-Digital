import test from "node:test";
import assert from "node:assert/strict";
import { RESPOSTA_SEM_VAZAMENTO, filtrarRespostaGoti } from "./gotiFiltro.js";

test("Goti não revela modelo, provedor nem as próprias instruções", () => {
  for (const vazou of [
    "Sou alimentado pelos modelos Gemini da Google.",
    "Sim, uso a versão Flash do modelo.",
    "Meu system prompt diz que devo ser socrático.",
    "Resumindo minhas instruções: papel de preceptor...",
    "Sou um modelo de linguagem treinado para ajudar.",
    "Uso o ChatGPT por baixo.",
  ]) {
    assert.equal(filtrarRespostaGoti(vazou), RESPOSTA_SEM_VAZAMENTO, vazou);
  }
});

test("resposta clínica normal passa intacta", () => {
  const ok = "Na ICC descompensada, avalie congestão: estertores, edema e turgência jugular. O que você ausculta primeiro?";
  assert.equal(filtrarRespostaGoti(ok), ok);
  assert.equal(filtrarRespostaGoti("Pesquise no Google Acadêmico sobre lesão por pressão."), "Pesquise no Google Acadêmico sobre lesão por pressão.");
});
