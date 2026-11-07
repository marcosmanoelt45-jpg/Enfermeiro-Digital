// Gera supabase/functions/_shared/dados/sbar.js: cópia enxuta dos cenários do Plantão para a Edge Function
// avaliar_plantao carregar o cenário no servidor (o cliente nunca manda o gabarito).
// Um teste (supabase/functions/_shared/dados/sbar.test.mjs) confere se o arquivo está sincronizado com o original.
//   node scripts/plantao/exportar-cenarios.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PLANTAO_CENARIOS } from "../../src/data/sbarPlantaoDados.js";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// O que o servidor precisa: sem `exame` das lacunas (só serve ao cliente) e sem campos de tela.
export function cenariosEnxutos(cenarios = PLANTAO_CENARIOS) {
  return cenarios.map((c) => ({
    id: c.id,
    title: c.title,
    sector: c.sector,
    diagnosis: c.diagnosis,
    vitals: c.vitals,
    goldenSbar: c.goldenSbar,
    educationalPointers: c.educationalPointers,
    lacunas: c.lacunas.map((l) => ({ campo: l.campo, rotulo: l.rotulo, valorEsperado: l.valorEsperado })),
    perguntas: c.perguntas.map((p) => ({ id: p.id, letra: p.letra, texto: p.texto, espera: p.espera, ...(p.dependeDe ? { dependeDe: p.dependeDe } : {}) })),
    elementosChave: c.elementosChave,
  }));
}

export function conteudoDoArquivo(cenarios = PLANTAO_CENARIOS) {
  return `// GERADO por scripts/plantao/exportar-cenarios.mjs. Não edite à mão.
// Cenários do Plantão para o servidor (avaliar_plantao). A fonte é src/data/sbarPlantaoDados.js.
export const CENARIOS_PLANTAO = ${JSON.stringify(cenariosEnxutos(cenarios), null, 1)};

export function buscarCenarioPlantao(id) {
  return CENARIOS_PLANTAO.find((c) => c.id === id) ?? null;
}
`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const destino = path.join(raiz, "supabase/functions/_shared/dados/sbar.js");
  fs.writeFileSync(destino, conteudoDoArquivo());
  console.log(`${PLANTAO_CENARIOS.length} cenários gravados em ${path.relative(raiz, destino)}`);
}
