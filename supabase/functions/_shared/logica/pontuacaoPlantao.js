// Notas do Plantão (avaliar_plantao). A IA só marca presença de elementos-chave e dá clareza (0 a 2);
// as notas saem daqui: por letra, 50% de código (números e lacunas) e 50% de IA (texto).
// Se a IA falhar, a nota sai só por código. JS puro, sem dependências (roda no Deno e no Node).

export const LETRAS = ["S", "B", "A", "R"];
export const PENALIDADE_POR_LACUNA = 20;

const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

// texto = 100 × (presentes / total) × (0.8 + 0.1 × clareza), no máximo 100. null se não há elementos.
export function notaTexto({ elementos, clareza }) {
  if (!Array.isArray(elementos) || elementos.length === 0) return null;
  const presentes = elementos.filter((e) => e.presente).length;
  const c = [0, 1, 2].includes(clareza) ? clareza : 1;
  return Math.min(100, Math.round(100 * (presentes / elementos.length) * (0.8 + 0.1 * c)));
}

// Números conferidos pelo sistema nas respostas da letra: "ok" conta; "errado" e "nao_informado" não.
export function contarNumeros(respostas) {
  let ok = 0;
  let total = 0;
  for (const r of respostas) {
    for (const estado of Object.values(r.conferenciaNumerica ?? {})) {
      total++;
      if (estado === "ok") ok++;
    }
  }
  return { ok, total };
}

// % das perguntas da letra respondidas com pelo menos 3 palavras e com avaliação feita.
export function completude(perguntas, respostas) {
  if (!perguntas.length) return 0;
  const respondidas = perguntas.filter((p) => {
    const r = respostas.find((x) => x.perguntaId === p.id);
    return r && !r.semAvaliacao && norm(r.texto).split(" ").filter(Boolean).length >= 3;
  });
  return Math.round((100 * respondidas.length) / perguntas.length);
}

// −20 por lacuna não avaliada de que uma pergunta da letra dependia.
export function penalidadeDeLacunas(perguntas, lacunas) {
  const campos = new Set(perguntas.filter((p) => p.dependeDe).map((p) => p.dependeDe));
  let n = 0;
  for (const campo of campos) if (!lacunas?.[campo]?.avaliada) n++;
  return n * PENALIDADE_POR_LACUNA;
}

// nota = 0.5 × texto + 0.5 × código (com IA); só código (sem IA).
// código = % dos números certos (sem números: o texto, ou a completude se não há IA) − penalidade das lacunas.
export function notaDaLetra({ texto, numeros, completude: comp, penalidade }) {
  const base = numeros.total > 0 ? (100 * numeros.ok) / numeros.total : texto ?? comp;
  const codigo = Math.max(0, Math.round(base - penalidade));
  const nota = texto === null ? codigo : Math.round(0.5 * texto + 0.5 * codigo);
  return { nota: Math.max(0, Math.min(100, nota)), codigo };
}

export function notaGeral(notas) {
  const v = LETRAS.map((l) => notas[l]);
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
}

// Um elemento só conta como presente se a IA citou um trecho que o aluno de fato disse (em alguma resposta da letra).
function validarElementos(esperados, devolvidos, respostasDaLetra) {
  const corpo = norm(respostasDaLetra.map((r) => r.texto).join(" | "));
  let invalidas = 0;
  const lista = esperados.map((nome, i) => {
    const d = (devolvidos ?? []).find((x) => norm(x?.elemento) === norm(nome)) ?? (devolvidos?.length === esperados.length ? devolvidos[i] : null);
    const trecho = String(d?.trecho ?? "").trim();
    const citacaoOk = trecho !== "" && corpo.includes(norm(trecho));
    if (d?.presente && !citacaoOk) invalidas++;
    return { elemento: nome, presente: Boolean(d?.presente) && citacaoOk, trecho: citacaoOk ? trecho : "" };
  });
  return { lista, invalidas };
}

/**
 * Calcula as notas do Plantão.
 * cenario: { perguntas, elementosChave }; respostas: [{ perguntaId, letra, texto, conferenciaNumerica?, semAvaliacao? }];
 * lacunas: { campo: { avaliada, achado? } }; avaliacaoIA: { S|B|A|R: { elementos, clareza, faltou } } ou null.
 */
export function calcularNotas({ cenario, respostas, lacunas, avaliacaoIA = null }) {
  const letras = {};
  const notas = {};
  let citacoesInvalidas = 0;
  let letrasSemIA = 0;

  for (const letra of LETRAS) {
    const perguntas = cenario.perguntas.filter((p) => p.letra === letra);
    const respostasDaLetra = respostas.filter((r) => r.letra === letra);
    const ia = avaliacaoIA?.[letra];
    let elementos = [];
    let texto = null;
    let clareza = null;
    if (ia && Array.isArray(ia.elementos)) {
      const v = validarElementos(cenario.elementosChave[letra], ia.elementos, respostasDaLetra);
      elementos = v.lista;
      citacoesInvalidas += v.invalidas;
      clareza = [0, 1, 2].includes(ia.clareza) ? ia.clareza : 1;
      texto = notaTexto({ elementos, clareza });
    } else {
      letrasSemIA++;
    }
    const numeros = contarNumeros(respostasDaLetra);
    const comp = completude(perguntas, respostasDaLetra);
    const penalidade = penalidadeDeLacunas(perguntas, lacunas);
    const { nota, codigo } = notaDaLetra({ texto, numeros, completude: comp, penalidade });
    notas[letra] = nota;
    letras[letra] = { nota, texto, codigo, numeros, completude: comp, penalidade, clareza, elementos, faltou: String(ia?.faltou ?? "").trim() };
  }

  return { notas: { ...notas, geral: notaGeral(notas) }, letras, citacoesInvalidas, iaUsada: letrasSemIA < LETRAS.length, letrasSemIA };
}
