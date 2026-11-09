// C4. Máquina de estados da cena. Função pura: toda transição inválida devolve o MESMO estado.

export const ESTADO_INICIAL = Object.freeze({
  status: "ocioso",
  falaAtual: null,
  filaFalas: [],
  rascunhoAluno: "",
  turnos: [],
  erro: null,
  turnoPendenteId: null,
});

export function criarEstado(sobrescrever = {}) {
  return { ...ESTADO_INICIAL, filaFalas: [], turnos: [], ...sobrescrever };
}

const FINAIS = new Set(["encerrada", "bloqueada"]);

function comecarFalas(estado, falas) {
  const [primeira, ...resto] = falas;
  if (!primeira) return { ...estado, status: "aguardando_aluno", falaAtual: null, filaFalas: [] };
  return { ...estado, status: "personagem_falando", falaAtual: primeira, filaFalas: resto };
}

function registrarFalas(turnos, falas) {
  // Guarda id/origem/emoção da fala para "ouvir de novo" tocar com a mesma voz (mp3 fixo ou voz ao vivo).
  return [...turnos, ...falas.map((f) => ({ autor: "personagem", texto: f.texto, ...(f.id ? { id: f.id } : {}), ...(f.origem ? { origem: f.origem } : {}), ...(f.emocao ? { emocao: f.emocao } : {}) }))];
}

export function cenaReducer(estado, acao) {
  const { status } = estado;
  switch (acao.tipo) {
    case "INICIAR": {
      if (status !== "ocioso") return estado;
      const falas = acao.falas ?? [];
      return { ...comecarFalas(estado, falas), turnos: registrarFalas(estado.turnos, falas) };
    }

    case "FALA_TERMINOU": {
      if (status !== "personagem_falando") return estado;
      return comecarFalas(estado, estado.filaFalas);
    }

    case "ALUNO_SEGUROU": {
      // Também revisando o texto: gravar de novo antes de enviar (antes a 2ª gravação era ignorada e a frase sumia).
      if (status !== "personagem_falando" && status !== "aguardando_aluno" && status !== "revisando_texto") return estado;
      return { ...estado, status: "aluno_falando", falaAtual: null, filaFalas: [] };
    }

    case "SOLTOU": {
      if (status !== "aluno_falando") return estado;
      const texto = String(acao.texto ?? "").trim();
      if (!texto) return { ...estado, status: "aguardando_aluno" };
      return { ...estado, status: "revisando_texto", rascunhoAluno: texto };
    }

    case "ENVIOU_TEXTO": {
      // Também durante a fala do personagem: o aluno não precisa esperar terminar (a fala é interrompida).
      if (status !== "aguardando_aluno" && status !== "revisando_texto" && status !== "personagem_falando") return estado;
      const texto = String(acao.texto ?? "").trim();
      if (!texto) return estado;
      return {
        ...estado,
        status: "processando",
        falaAtual: null,
        filaFalas: [],
        rascunhoAluno: texto,
        turnos: [...estado.turnos, { autor: "aluno", texto, canal: acao.canal ?? "texto" }],
        turnoPendenteId: acao.turnoId ?? null,
        erro: null,
      };
    }

    case "RESPOSTA": {
      if (status !== "processando") return estado;
      const falas = acao.falas ?? [];
      return {
        ...comecarFalas(estado, falas),
        turnos: registrarFalas(estado.turnos, falas),
        rascunhoAluno: "",
        turnoPendenteId: null,
        erro: null,
      };
    }

    case "FALHOU": {
      // Mantém o texto do aluno (rascunhoAluno) para "Tentar de novo".
      if (status !== "processando") return estado;
      return { ...estado, status: "erro_recuperavel", erro: acao.erro ?? { codigo: "ERRO_INTERNO" } };
    }

    case "REENVIAR": {
      // Reaproveita o turnoPendenteId: o servidor trata o repetido como idempotente (TURNO_DUPLICADO).
      if (status !== "erro_recuperavel") return estado;
      return { ...estado, status: "processando", erro: null };
    }

    case "ENCERRAR": {
      if (FINAIS.has(status)) return estado;
      return { ...estado, status: "encerrada", falaAtual: null, filaFalas: [] };
    }

    case "COTA_EXCEDIDA": {
      if (FINAIS.has(status)) return estado;
      return { ...estado, status: "bloqueada", falaAtual: null, filaFalas: [], erro: { codigo: "COTA_EXCEDIDA", mensagem: acao.mensagem } };
    }

    default:
      return estado;
  }
}
