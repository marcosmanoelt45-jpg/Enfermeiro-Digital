// POP de referência de cada procedimento da biblioteca (aba Técnicas), conferido nos PDFs em 2026-11-08.
// Base do projeto: Hospital de Clínicas de Porto Alegre (HCPA). Os POPs do HCPA não são públicos (exceto o do
// curativo, no manual de feridas), então a referência é: 1) norma nacional (ANVISA/MS) quando ela define o ponto;
// 2) POP público de hospital universitário federal (Ebserh). Os vídeos continuam sendo do LabEnf/UFSM.
// `observacao` registra onde a biblioteca segue outra referência que o POP, e por quê.

const HUMAP = "Manual de POP do Serviço de Enfermagem do HUMAP/Ebserh (POP/DIEN/002/2016, v1.1)";
const HUMAP_URL = "https://biblioteca.cofen.gov.br/wp-content/uploads/2020/09/manual-procedimento-operacional-padrao-servico-enfermagem.pdf";
const TQT_UFTM = "POP.HC-UFTM-UMULTI.021 v4 (Ebserh, 2026): Traqueostomia, cuidados e decanulação";
const TQT_UFTM_URL = "https://www.gov.br/hubrasil/pt-br/hospitais-universitarios/regiao-sudeste/hc-uftm/documentos/procedimentos-e-rotinas-operacionais-padrao/pops/pop-hc-uftm-umulti-021-traqueostomia-cuidados-e-decanulacao-versao-4.pdf";

export const REFERENCIAS_POP = {
  "verificacao-sinais-vitais": { titulo: `${HUMAP}, POPs REG 01.1 a 01.4 e REG 02.1`, url: HUMAP_URL },
  "colocacao-remocao-luvas-estereis": { titulo: `${HUMAP}, POPs SPI 02.7 e SPI 02.8`, url: HUMAP_URL },
  "sondagem-vesical-demora": { titulo: `${HUMAP}, POP ELI 03.3 (e fixação ELI 03.5)`, url: HUMAP_URL },
  "cateterismo-urinario-demora-masculino": { titulo: `${HUMAP}, POP ELI 03.4 (e fixação ELI 03.6)`, url: HUMAP_URL },
  "sondagem-nasogastrica-nasoenteral": {
    titulo: `${HUMAP}, POPs HIN 02.2, HIN 02.4 e HIN 02.9`,
    url: HUMAP_URL,
    observacao: "A confirmação por radiografia antes de liberar dieta segue a recomendação atual; o POP de 2016 também testa à beira do leito.",
  },
  "curativo-cateter-venoso-central": {
    titulo: `${HUMAP}, POPs FCM 01.1 e FCM 01.2`,
    url: HUMAP_URL,
    observacao: "O POP de 2016 usa álcool 70% na antissepsia; aqui fica a clorexidina alcoólica, recomendada pela ANVISA (Medidas de Prevenção de IRAS, 2017).",
  },
  "curativo-ferida-cirurgica": { titulo: `${HUMAP}, POP FCM 01.4`, url: HUMAP_URL },
  "retirada-de-pontos": {
    titulo: "Manual de POP de Enfermagem de Jundiaí-SP, POP 33: Retirada de pontos (revisão 4, 2026)",
    url: "https://jundiai.sp.gov.br/saude/wp-content/uploads/sites/17/2026/10/pop-enfermagem-rev2026.pdf",
  },
  "curativo-cadarco-traqueostomia": {
    titulo: `${HUMAP}, POP FCM 01.9; ${TQT_UFTM}`,
    url: HUMAP_URL,
    observacao: "O POP do HUMAP corta o cadarço antigo e depois põe o novo; aqui o novo é passado antes de soltar o antigo, para reduzir o risco de decanulação.",
  },
  "limpeza-endocanula-traqueostomia": { titulo: TQT_UFTM, url: TQT_UFTM_URL },
  "higiene-oral-cadarco-entubado": {
    titulo: `${HUMAP}, POP CUC 01.3; cuff conforme ${TQT_UFTM}`,
    url: HUMAP_URL,
    observacao: "Cuff entre 20 e 30 cmH2O como no POP do HC-UFTM de 2026 (o do HUMAP, de 2016, pede 25 a 30).",
  },
  "troca-selo-dagua-drenagem-toracica": { titulo: `${HUMAP}, POP ELI 04.1`, url: HUMAP_URL },
  "higiene-bolsa-colostomia-ileostomia": { titulo: `${HUMAP}, POP ELI 02.8`, url: HUMAP_URL },
  "troca-bolsa-colostomia-ileostomia": { titulo: `${HUMAP}, POP ELI 02.8`, url: HUMAP_URL },
  "rcp-suporte-basico-vida": { titulo: `${HUMAP}, POPs REG 03.1 e REG 03.2`, url: HUMAP_URL },
  "puncao-venosa": {
    titulo: `${HUMAP}, POP TER 05.1`,
    url: HUMAP_URL,
    observacao: "A antissepsia aceita clorexidina alcoólica (ANVISA, 2017) além do álcool 70% do POP.",
  },
  "injecao-intramuscular-z": {
    titulo: `${HUMAP}, POP TER 03.3`,
    url: HUMAP_URL,
    observacao: "O POP de 2016 aspira antes de injetar; aqui a aspiração segue o protocolo local, porque as recomendações atuais a dispensam nesses sítios.",
  },
  "aspiracao-vias-aereas": {
    titulo: `${HUMAP}, POPs RES 02.2 e RES 02.3`,
    url: HUMAP_URL,
    observacao: "O POP de 2016 limita o vácuo a 100 mmHg; aqui fica 80 a 120 mmHg (máximo 150), a faixa das diretrizes atuais para adultos.",
  },
  "curativo-lesao-pressao": {
    titulo: `${HUMAP}, POPs FCM 01.5 a 01.7 e SPI 01.6; classificação NPIAP 2016`,
    url: HUMAP_URL,
  },
};

export function referenciaPop(id) {
  return REFERENCIAS_POP[id] ?? null;
}
