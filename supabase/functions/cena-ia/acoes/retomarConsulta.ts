// Ação retomar_consulta: devolve a conversa de uma sessão ativa (sem a ficha) para continuar após recarregar a página.
import { ErroApp } from "../../_shared/erros.ts";
// @ts-ignore: módulos JS puros compartilhados
import { rapportDe } from "../../_shared/logica/rapport.js";
import { MAX_TURNOS_ALUNO } from "./tipos.ts";
import type { Dependencias } from "./tipos.ts";

export async function retomarConsulta(userId: string, entrada: { sessaoId: string }, { repo }: Dependencias) {
  const sessao = await repo.carregarSessao(entrada.sessaoId, userId);
  if (!sessao) throw new ErroApp("ENTRADA_INVALIDA", "Consulta não encontrada.");
  if (sessao.status === "encerrada") throw new ErroApp("SESSAO_ENCERRADA", "Esta consulta já foi encerrada.");

  const ficha = await repo.carregarFicha(entrada.sessaoId);
  const turnos = await repo.carregarTurnos(entrada.sessaoId);
  return {
    sessaoId: sessao.id,
    personagemId: sessao.personagem_id,
    turnos: turnos.map((t) => ({ autor: t.autor, texto: t.texto })),
    rapport: rapportDe(sessao.confianca),
    turnosRestantes: MAX_TURNOS_ALUNO - sessao.turnos_aluno,
    briefing: ficha
      ? { nome: ficha.identificacao.nome, idade: ficha.identificacao.idade, sexo: ficha.identificacao.sexo, setor: ficha.setor, queixa: ficha.queixaPrincipal, sinaisVitais: ficha.sinaisVitais }
      : null,
  };
}
