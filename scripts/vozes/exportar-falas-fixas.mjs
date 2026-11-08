// Exporta as falas fixas (src/data/falas/*.json) para a função `voz`. O bot diário (pg_cron) gera a versão
// Gemini de 10 por dia (cota grátis) e guarda no Storage. A ordem da lista é a chance de a fala tocar:
// aberturas e reações repetidas primeiro, depois o começo de cada cenário, por fim o resto.
// Uso: node scripts/vozes/exportar-falas-fixas.mjs   (rodar de novo sempre que mudar uma fala fixa)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const pasta = join(raiz, "src", "data", "falas");
const PERSONAGENS = ["marcus", "teresinha", "enfermeira-ana", "medico-rui"];

// 0 = toca em toda sessão; quanto maior, mais rara.
export function nivelDaFala(id) {
  if (/^(consulta\.abertura|plt\.abertura|calc\.r\.abertura)\./.test(id)) return 0;
  if (/^(calc\.r\.(acerto|erro1)|plt\.r\.(ok|encerrar))\./.test(id)) return 1;
  if (/\.r\.|^calc\.dica\./.test(id)) return 2;
  if (/\.(s1|enunciado)$/.test(id)) return 3;
  return 4;
}

const lista = [];
const vistos = new Set();
const porGrupo = new Map();
for (const nome of readdirSync(pasta).filter((n) => n.endsWith(".json") && n !== "dev.json")) {
  const dados = JSON.parse(readFileSync(join(pasta, nome), "utf8"));
  if (!dados?.personagem || !Array.isArray(dados.falas)) continue;
  for (const f of dados.falas) {
    const texto = String(f.texto ?? "").trim();
    const chave = `${dados.personagem}|${texto}`;
    if (!texto || texto.length > 400 || vistos.has(chave)) continue;
    vistos.add(chave);
    // Variantes do mesmo grupo (ex.: calc.r.acerto.1..6): a 1ª de cada grupo vem antes da 2ª de qualquer um.
    const grupo = `${dados.personagem}|${String(f.id).split(".").slice(0, -1).join(".")}`;
    const variante = porGrupo.get(grupo) ?? 0;
    porGrupo.set(grupo, variante + 1);
    lista.push({ p: dados.personagem, t: texto, nivel: nivelDaFala(String(f.id)), variante, ordem: lista.length });
  }
}
const pers = (p) => (PERSONAGENS.includes(p) ? PERSONAGENS.indexOf(p) : PERSONAGENS.length);
lista.sort((a, b) => a.nivel - b.nivel || a.variante - b.variante || pers(a.p) - pers(b.p) || a.ordem - b.ordem);

const destino = join(raiz, "supabase", "functions", "_shared", "falasFixas.json");
writeFileSync(destino, `${JSON.stringify(lista.map(({ p, t }) => ({ p, t })))}\n`);
const contagem = [0, 1, 2, 3, 4].map((n) => lista.filter((f) => f.nivel === n).length);
console.log(`${lista.length} falas fixas exportadas (por nível 0-4: ${contagem.join(", ")})`);
