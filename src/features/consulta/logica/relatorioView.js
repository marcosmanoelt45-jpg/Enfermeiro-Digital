// Funções puras para desenhar o relatório (sem React), testadas em relatorioView.test.mjs.

// Pontos de uma polyline SVG para a linha de confiança (0 a 100), dentro de uma caixa largura × altura.
export function pontosDaLinha(linha, largura = 280, altura = 80, margem = 6) {
  if (!Array.isArray(linha) || linha.length === 0) return "";
  const n = linha.length;
  return linha
    .map((v, i) => {
      const x = n === 1 ? largura / 2 : margem + (i * (largura - 2 * margem)) / (n - 1);
      const y = altura - margem - (Math.max(0, Math.min(100, Number(v) || 0)) / 100) * (altura - 2 * margem);
      return `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`;
    })
    .join(" ");
}

export const ROTULO_PERSONALIDADE = {
  colaborativo: "Colaborativo", ansioso: "Ansioso", desconfiado: "Desconfiado", esquecido: "Esquecido",
  minimizador: "Minimizador", poliqueixoso: "Poliqueixoso", envergonhado: "Envergonhado", surpresa: "Surpresa",
};

// Tom (cor) da nota: >= 70 sucesso, >= 40 aviso, abaixo disso perigo.
export function tomDaNota(n) {
  if (n === null || n === undefined) return "brand";
  return n >= 70 ? "success" : n >= 40 ? "warning" : "danger";
}

// "No turno 4 você disse: '…'" (ou só a sugestão, quando a citação foi descartada).
export function frasePontoDeMelhoria(item) {
  if (item.trecho && item.ordem) return `No turno ${item.ordem} você disse: “${item.trecho}”`;
  return null;
}

// Resumo para o histórico do Perfil (nome do paciente + tema), no formato de submitActivity.
export function resumoParaHistorico({ briefing, tema, personalidadePublica }) {
  return {
    title: `${briefing.nome}${tema ? ` · ${tema}` : ""}`,
    patientInfo: `${briefing.nome}, ${briefing.idade} anos · ${ROTULO_PERSONALIDADE[personalidadePublica] ?? personalidadePublica}`,
  };
}
