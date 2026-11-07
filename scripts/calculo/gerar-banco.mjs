// Gera o banco fechado do Cálculo com o Médico (C12) e as falas do Dr. Rui.
// Determinístico: rodar duas vezes produz exatamente os mesmos arquivos.
//   node scripts/calculo/gerar-banco.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDosageProblems } from "../../src/data/dosageProblems.js";
import {
  generateMacrogotasHoras, generateMicrogotasHoras, generateMacrogotasMinutos,
  generateBicInfusion, generatePenicilinaCristalina, generatePediatricRedilution,
} from "../../src/services/proceduralDosageGenerator.js";
import { mulberry32 } from "../../src/features/calculo/logica/rng.js";
import { AUTORAIS, ERROS } from "./autorais.mjs";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const GERADORES = [generateMacrogotasHoras, generateMicrogotasHoras, generateMacrogotasMinutos, generateBicInfusion, generatePenicilinaCristalina, generatePediatricRedilution];
const ALTA_VIGILANCIA = /kcl|cloreto de pot|heparina|insulina|noradrenalina|fentanil|milrinona|morfina|digoxina/i;

// ---------- fala ----------
const SUBSTITUICOES = [
  [/\bmcg\/mL\b/g, "microgramas por mililitro"], [/\bUI\/mL\b/g, "unidades por mililitro"], [/\bmEq\b/g, "miliequivalentes"],
  [/\bUI\b/g, "unidades"], [/\bmcg\b/g, "microgramas"], [/\bmg\b/g, "miligramas"], [/\bmL\b/g, "mililitros"], [/\bg\b/g, "gramas"],
  [/\bKCl\b/g, "cloreto de potássio"], [/\bSF\b/g, "soro fisiológico"], [/\bSG\b/g, "soro glicosado"], [/\bRL\b/g, "Ringer lactato"], [/\bAD\b/g, "água destilada"],
];
const falar = (txt) => SUBSTITUICOES.reduce((s, [de, para]) => s.replace(de, para), String(txt));
const UNIDADE_FALADA = { "UI/h": "unidades por hora", "mcg/min": "microgramas por minuto", "mEq/h": "miliequivalentes por hora", mg: "miligramas", UI: "unidades", mL: "mililitros" };
function numeroFalado(n) {
  if (n >= 1e6 && n % 1e5 === 0) { const m = n / 1e6; return `${m.toLocaleString("pt-BR")} ${m === 1 ? "milhão" : "milhões"}`; }
  if (n >= 1000 && n % 1000 === 0) return `${(n / 1000).toLocaleString("pt-BR")} mil`;
  return n.toLocaleString("pt-BR");
}
const capitaliza = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function enunciadoGerado(item, i) {
  const { tipo, prescricao: p, disponivel } = item;
  const v = i % 3;
  const farmaco = falar(p.farmaco);
  if (tipo === "gotejamento_macro" || tipo === "gotejamento_micro") {
    const micro = tipo === "gotejamento_micro";
    const gotas = micro ? "microgotas" : "gotas";
    const equipo = micro ? "microgotas" : "macrogotas";
    const base = [
      `Olha, ${farmaco} ${p.dose} mililitros ${p.frequencia}, no equipo de ${equipo}. Quantas ${gotas} por minuto?`,
      `${capitaliza(farmaco)}, ${p.dose} mililitros, ${p.frequencia}. Equipo de ${equipo}. Qual é o gotejamento?`,
      `Prescrevi ${farmaco}, ${p.dose} mililitros ${p.frequencia}, no ${equipo}. Me diz o gotejamento em ${gotas} por minuto.`,
    ];
    return base[v];
  }
  if (tipo === "bic") {
    const dose = `${numeroFalado(p.dose)} ${UNIDADE_FALADA[p.unidadeDose] ?? falar(p.unidadeDose)}`;
    return [
      `Deixa ${farmaco} a ${dose} na bomba. A solução é ${falar(disponivel)}. Qual vazão você programa, em mililitros por hora?`,
      `${capitaliza(farmaco)}, ${dose}, contínuo. Tem ${falar(disponivel)}. Quantos mililitros por hora na bomba?`,
      `Programa ${farmaco} em ${dose}. A solução preparada é ${falar(disponivel)}. Me diz a vazão em mililitros por hora.`,
    ][v];
  }
  const dose = `${numeroFalado(p.dose)} ${UNIDADE_FALADA[p.unidadeDose] ?? falar(p.unidadeDose)}`;
  const via = p.via === "IV" ? "na veia" : p.via === "SC" ? "subcutânea" : p.via;
  return [
    `Olha, faz ${dose} de ${farmaco}, ${via}. Tem ${falar(disponivel)}. Quantos mililitros você aspira?`,
    `${capitaliza(farmaco)} ${dose}, ${via}. A apresentação é ${falar(disponivel)}. Quantos mililitros aspira?`,
    `Prescrevi ${dose} de ${farmaco}, ${via}. Disponível: ${falar(disponivel)}. Quanto você aspira, em mililitros?`,
  ][v];
}

const DICA_CHAVE = { gotejamento_macro: "gotejamento_macro", gotejamento_micro: "gotejamento_micro", bic: "bic", reconstituicao: "regra3", diluicao: "regra3", pediatrica: "regra3", ampolas: "regra3" };
const DICAS = {
  gotejamento_macro: "Macrogotas em horas: volume dividido por três vezes as horas. Em minutos: volume vezes vinte, dividido pelos minutos.",
  gotejamento_micro: "Microgotas: o volume dividido pelas horas.",
  bic: "Na bomba, mililitros por hora é a dose por hora dividida pela concentração. Se a dose vier por minuto, multiplica por sessenta.",
  regra3: "Regra de três: o que tem no frasco está para o volume, assim como a dose prescrita está para o que você quer aspirar.",
};

const REACOES = {
  "calc.r.acerto": ["Isso. Pode fazer.", "Certinho. Obrigado.", "Bateu com o meu. Pode seguir.", "Boa. Conta fechada.", "É isso mesmo. Vai lá.", "Perfeito."],
  "calc.r.erro1": ["Hum, não bateu aqui. Confere comigo de novo.", "Tem certeza? Refaz a conta com calma.", "Não é isso. Olha a unidade e tenta de novo.", "Esse valor me preocupou. Confere de novo."],
  "calc.r.erro2": ["Também não. Vamos fazer juntos, olha o passo a passo.", "Calma, acontece. Olha como eu cheguei no valor.", "Errou de novo, mas vê a conta aqui e fixa o caminho."],
  "calc.r.questionou_certo": ["Boa, você tem razão, eu me confundi. Obrigado por perguntar.", "Ainda bem que você me questionou. Eu errei a prescrição, vou corrigir.", "Você está certa de questionar, escrevi errado. Vou refazer.", "Excelente. Quem questiona evita erro. Corrijo agora."],
  "calc.r.questionou_sem_motivo": ["Essa prescrição está certa, pode fazer.", "Conferi aqui e está certa. Pode seguir com o cálculo.", "Não tem erro nessa. Faz a conta e me diz."],
  "calc.r.pressa": ["Preciso desse valor agora.", "O paciente está esperando, anda.", "Tempo. Quanto deu?"],
  "calc.r.erro_grave": ["Espera… você ia fazer isso mesmo? Essa prescrição está errada.", "Para! Olha de novo a prescrição antes de preparar.", "Você calculou, mas a prescrição tinha problema. Era pra me avisar."],
  "calc.r.abertura": ["Vamos às prescrições. Vou ditando, você me diz o valor.", "Tenho prescrições aqui. Atenção na unidade e na via.", "Vamos nessa. E se algo não parecer certo, me questiona."],
};

// ---------- itens ----------
function montar({ id, tipo, prescricao, disponivel, entrada, answer, passos, categoria, enunciado, extras = {} }) {
  const inteiro = answer.kind === "integer";
  return {
    id, tipo, categoria, prescricao, disponivel, entrada,
    resposta: answer.value, unidade: answer.unit, casas: inteiro ? 0 : (answer.decimals ?? 1), tolerancia: inteiro ? 0.5 : 0.05,
    memoria: passos, erroProposital: null,
    falas: { enunciado: `calc.${id}.enunciado`, dica: `calc.dica.${DICA_CHAVE[tipo]}` },
    altaVigilancia: ALTA_VIGILANCIA.test(prescricao.farmaco),
    _texto: enunciado,
    ...extras,
  };
}

const itens = [];
const textos = [];
let n = 0;
const proximoId = () => `p${String(++n).padStart(3, "0")}`;

for (const p of getDosageProblems()) {
  const a = AUTORAIS[p.id];
  if (!a) throw new Error(`Falta cadastro de ${p.id} em autorais.mjs`);
  itens.push(montar({ id: proximoId(), tipo: a.tipo, prescricao: a.prescricao, disponivel: a.disponivel, entrada: a.entrada, answer: p.answer, passos: p.explanationSteps, categoria: p.category, enunciado: a.enunciado, extras: { origem: p.id } }));
}

// Teto por gerador, para balancear os tipos (só o de macrogotas teria mais de 50 combinações).
const TETO = [28, 20, 11, 18, 5, 8];
const contagem = GERADORES.map(() => 0);
const vistos = new Set();
let semNovos = 0;
let geradosIdx = 0;
for (let semente = 1; semente <= 20000 && semNovos < 1500; semente++) {
  const idx = semente % GERADORES.length;
  if (contagem[idx] >= TETO[idx]) { semNovos++; continue; }
  const g = GERADORES[idx](mulberry32(semente));
  const chave = `${g.tipo}|${JSON.stringify(g.prescricao)}|${g.disponivel}`;
  if (vistos.has(chave)) { semNovos++; continue; }
  vistos.add(chave);
  contagem[idx]++;
  semNovos = 0;
  const item = montar({ id: proximoId(), tipo: g.tipo, prescricao: g.prescricao, disponivel: g.disponivel, entrada: g.entrada, answer: g.answer, passos: g.explanationSteps, categoria: g.category, enunciado: "", extras: { origem: `semente:${semente}` } });
  item._texto = enunciadoGerado(item, geradosIdx++);
  itens.push(item);
}

for (const e of ERROS) {
  const id = proximoId();
  itens.push({
    id, tipo: e.tipo, categoria: "Prescrição com erro", prescricao: e.prescricao, disponivel: e.disponivel, entrada: null,
    resposta: null, unidade: null, casas: null, tolerancia: null,
    memoria: [e.explicacao, `Conduta: ${e.correcao}. Não calcule: questione a prescrição.`],
    erroProposital: { tipo: e.erro, correcao: e.correcao, explicacao: e.explicacao, regra: e.regra },
    falas: { enunciado: `calc.${id}.enunciado`, dica: `calc.dica.${DICA_CHAVE[e.tipo]}` },
    altaVigilancia: ALTA_VIGILANCIA.test(e.prescricao.farmaco),
    ...(e.paciente ? { paciente: e.paciente } : {}),
    origem: `erro:${e.erro}`,
    _texto: e.enunciado,
  });
}

const banco = itens.map(({ _texto, ...resto }) => { textos.push({ id: resto.falas.enunciado, texto: _texto }); return resto; });

const falas = [
  ...textos,
  ...Object.entries(DICAS).map(([k, texto]) => ({ id: `calc.dica.${k}`, texto })),
  ...Object.entries(REACOES).flatMap(([base, lista]) => lista.map((texto, i) => ({ id: `${base}.${i + 1}`, texto }))),
];
const ids = falas.map((f) => f.id);
if (new Set(ids).size !== ids.length) throw new Error("ids de fala repetidos");

fs.mkdirSync(path.join(raiz, "src/data/calculo"), { recursive: true });
fs.writeFileSync(path.join(raiz, "src/data/calculo/banco.json"), JSON.stringify(banco, null, 1) + "\n");
fs.writeFileSync(path.join(raiz, "src/data/falas/medico-rui.json"), JSON.stringify({ personagem: "medico-rui", perfilVoicebox: "Rui", falas }, null, 1) + "\n");

const porTipo = {};
for (const i of banco) porTipo[i.tipo + (i.erroProposital ? ":erro" : "")] = (porTipo[i.tipo + (i.erroProposital ? ":erro" : "")] ?? 0) + 1;
const erros = banco.filter((i) => i.erroProposital);
console.log(`${banco.length} itens (${erros.length} com erro, ${Math.round((erros.length / banco.length) * 100)}%), ${falas.length} falas`);
console.log(porTipo);
