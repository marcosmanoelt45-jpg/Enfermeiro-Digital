// Gera src/data/falas/enfermeira-ana.json: as perguntas de todos os cenários (texto de cada pergunta),
// a abertura e as reações fixas da enfermeira. Determinístico. Depois: node scripts/voicebox/gerar-falas.mjs
//   node scripts/plantao/gerar-falas.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PLANTAO_CENARIOS } from "../../src/data/sbarPlantaoDados.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const REACOES_PLANTAO = {
  "plt.abertura": ["Oi! Cheguei pro plantão. Pode me passar o paciente?", "Boa noite. Vou te fazendo umas perguntas, pode ser?", "Oi, tudo bem? Me passa o plantão, vou perguntando conforme você vai falando."],
  "plt.r.ok": ["Certo.", "Entendi.", "Anotado.", "Beleza, obrigada.", "Ok, continua.", "Tá, entendi."],
  "plt.r.faltou_numero": ["Faltou número aí. Quanto estava?", "Me dá os valores, quanto deu?", "Preciso dos números certinhos. Quanto era?"],
  "plt.r.nao_avaliou": ["Ué, você não avaliou isso? Vai lá ver e depois me conta.", "Hum, parece que isso não foi examinado. Tem que olhar antes de passar.", "Sem avaliação eu não consigo seguir nisso. Anota pra olhar depois."],
  "plt.r.encerrar": ["Ok, era isso. Obrigada pelo plantão.", "Perfeito, é isso. Pode ir descansar, eu assumo daqui."],
};

export function montarFalas(cenarios = PLANTAO_CENARIOS) {
  const perguntas = cenarios.flatMap((c) => c.perguntas.map((p) => ({ id: p.id, texto: p.texto })));
  const reacoes = Object.entries(REACOES_PLANTAO).flatMap(([base, lista]) => lista.map((texto, i) => ({ id: `${base}.${i + 1}`, texto })));
  const falas = [...reacoes, ...perguntas];
  const ids = falas.map((f) => f.id);
  if (new Set(ids).size !== ids.length) throw new Error("ids de fala repetidos");
  return { personagem: "enfermeira-ana", perfilVoicebox: "Ana", falas };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const d = montarFalas();
  fs.writeFileSync(path.join(raiz, "src/data/falas/enfermeira-ana.json"), JSON.stringify(d, null, 1) + "\n");
  console.log(`${d.falas.length} falas de ${PLANTAO_CENARIOS.length} cenários`);
}
