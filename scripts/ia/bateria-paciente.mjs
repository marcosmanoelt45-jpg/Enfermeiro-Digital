// Bateria de comportamento do paciente. Roda SÓ contra o branch do Supabase, com um usuário de teste.
// Uso: node scripts/ia/bateria-paciente.mjs [--casos 1,3,13] [--vezes 3]
// Variáveis (em .env.bateria.local, no .gitignore): BATERIA_SUPABASE_URL, BATERIA_ANON_KEY, BATERIA_EMAIL, BATERIA_SENHA.
// O branch precisa do secret CENA_IA_DEBUG=1 (a resposta traz `_debug`). Saída: docs/plano/bateria/AAAA-MM-DD.md.
// Custo: ~100 chamadas de IA. Rode só ao mudar prompt, modelo ou regras.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CASOS, CRITERIOS, REPETIR_3X, foraDoPersonagem } from "./casos.mjs";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function lerEnv() {
  const arquivo = join(raiz, ".env.bateria.local");
  const env = { ...process.env };
  if (existsSync(arquivo)) {
    for (const linha of readFileSync(arquivo, "utf8").split(/\r?\n/)) {
      const m = linha.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const args = process.argv.slice(2);
const pedidos = args.includes("--casos") ? new Set(args[args.indexOf("--casos") + 1].split(",").map(Number)) : null;
const vezesFixas = args.includes("--vezes") ? Number(args[args.indexOf("--vezes") + 1]) : null;

const env = lerEnv();
for (const k of ["BATERIA_SUPABASE_URL", "BATERIA_ANON_KEY", "BATERIA_EMAIL", "BATERIA_SENHA"]) {
  if (!env[k]) {
    console.error(`Falta ${k}. Defina em .env.bateria.local (e use SÓ um branch do Supabase, nunca produção).`);
    process.exit(1);
  }
}
if (/xwqgyvqofxdqdbhltdzf/.test(env.BATERIA_SUPABASE_URL)) {
  console.error("Recusado: BATERIA_SUPABASE_URL aponta para o projeto de produção. Use um branch do Supabase.");
  process.exit(1);
}

async function entrar() {
  const r = await fetch(`${env.BATERIA_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: env.BATERIA_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: env.BATERIA_EMAIL, password: env.BATERIA_SENHA }),
  });
  if (!r.ok) throw new Error(`login falhou (${r.status})`);
  return (await r.json()).access_token;
}

async function chamar(token, corpo) {
  const r = await fetch(`${env.BATERIA_SUPABASE_URL}/functions/v1/cena-ia`, {
    method: "POST",
    headers: { apikey: env.BATERIA_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${corpo.acao} -> ${r.status} ${json?.erro?.codigo ?? ""} ${json?.erro?.mensagem ?? ""}`);
  return json;
}

async function rodarCaso(token, caso) {
  const sessao = await chamar(token, {
    acao: "criar_consulta", arquetipoId: caso.setup.arquetipoId ?? "sc_icc_perfil_b", tema: null, idade: 68, sexo: "M", personagemId: "marcus",
    personalidadeId: caso.setup.personalidadeId, dificuldade: caso.setup.dificuldade,
  });
  const respostas = [];
  for (const texto of caso.falas) {
    const r = await chamar(token, { acao: "turno_consulta", sessaoId: sessao.sessaoId, turnoId: randomUUID(), texto, canal: "texto" });
    if (!r._debug) throw new Error("A resposta não trouxe _debug: defina CENA_IA_DEBUG=1 no branch.");
    respostas.push(r);
  }
  const ctx = { briefing: sessao.briefing };
  const geral = foraDoPersonagem(respostas);
  const especifico = caso.checar(respostas, ctx);
  return { respostas, ok: geral.ok && especifico.ok, motivo: [geral.ok ? "" : geral.motivo, especifico.ok ? especifico.motivo : especifico.motivo].filter(Boolean).join("; ") };
}

const token = await entrar();
const resultados = [];
for (const caso of CASOS.filter((c) => !pedidos || pedidos.has(c.id))) {
  const vezes = vezesFixas ?? (REPETIR_3X.has(caso.id) ? 3 : 1);
  const rodadas = [];
  for (let i = 0; i < vezes; i++) {
    try {
      rodadas.push(await rodarCaso(token, caso));
    } catch (e) {
      rodadas.push({ respostas: [], ok: false, motivo: `erro: ${e.message}` });
    }
    process.stdout.write(rodadas.at(-1).ok ? "." : "F");
  }
  resultados.push({ caso, rodadas });
}

const hoje = new Date().toISOString().slice(0, 10);
const linhas = [`# Bateria do paciente — ${hoje}`, "", "| # | Caso | Acerto | Mínimo | Resultado |", "|---|---|---|---|---|"];
let reprovado = false;
for (const { caso, rodadas } of resultados) {
  const taxa = rodadas.filter((r) => r.ok).length / rodadas.length;
  const minimo = CRITERIOS[caso.id];
  const passou = minimo === null ? true : taxa >= minimo;
  if (!passou) reprovado = true;
  linhas.push(`| ${caso.id} | ${caso.nome} | ${Math.round(taxa * 100)}% (${rodadas.filter((r) => r.ok).length}/${rodadas.length}) | ${minimo === null ? "revisão humana" : `${minimo * 100}%`} | ${passou ? "ok" : "FALHOU"} |`);
}
linhas.push("", "## Transcrições", "");
for (const { caso, rodadas } of resultados) {
  rodadas.forEach((r, i) => {
    linhas.push(`### Caso ${caso.id} — ${caso.nome} (rodada ${i + 1}): ${r.ok ? "ok" : "FALHOU"} ${r.motivo ? `— ${r.motivo}` : ""}`);
    caso.falas.forEach((f, k) => {
      linhas.push(`- **Aluno:** ${f}`, `- **Paciente** (${r.respostas[k]?.emocao ?? "?"}, confiança ${r.respostas[k]?._debug?.confianca ?? "?"}): ${r.respostas[k]?.fala ?? "(sem resposta)"}`);
    });
    linhas.push("");
  });
}
mkdirSync(join(raiz, "docs", "plano", "bateria"), { recursive: true });
const saida = join(raiz, "docs", "plano", "bateria", `${hoje}.md`);
writeFileSync(saida, linhas.join("\n") + "\n");
console.log(`\nRelatório: ${saida}\n${reprovado ? "REPROVADO em pelo menos um critério." : "Todos os critérios cumpridos."}`);
process.exit(reprovado ? 1 : 0);
