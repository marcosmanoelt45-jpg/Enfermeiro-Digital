// Erro único do cliente para tudo que vem das Edge Functions (formato C5: { erro: { codigo, mensagem } }).
export const MENSAGENS_PADRAO = {
  NAO_AUTENTICADO: "Entre na sua conta para usar este recurso.",
  SESSAO_DEMO: "Este recurso não está disponível na conta de demonstração.",
  COTA_EXCEDIDA: "Você chegou ao limite de hoje. Volte amanhã.",
  ENTRADA_INVALIDA: "Não foi possível enviar. Confira os dados e tente de novo.",
  SESSAO_ENCERRADA: "Esta sessão já foi encerrada.",
  TURNO_DUPLICADO: "Esta fala já foi enviada.",
  IA_INDISPONIVEL: "O serviço está indisponível no momento. Tente de novo em instantes.",
  SEM_PERMISSAO: "Você não tem permissão para isso.",
  NAO_ENCONTRADO: "Não encontrado.",
  CONFLITO: "Não foi possível concluir por causa de dados ligados.",
  ERRO_INTERNO: "Algo deu errado no servidor. Tente de novo.",
  REDE: "Sem conexão com o servidor. Confira a internet e tente de novo.",
  TIMEOUT: "O servidor demorou demais para responder. Tente de novo.",
};

export class ErroServidor extends Error {
  constructor(codigo, mensagem, status = 0) {
    super(mensagem || MENSAGENS_PADRAO[codigo] || MENSAGENS_PADRAO.ERRO_INTERNO);
    this.name = "ErroServidor";
    this.codigo = codigo;
    this.status = status;
  }
}

// Converte o corpo de uma resposta de erro em ErroServidor. Corpo fora do formato vira ERRO_INTERNO.
export function erroDeCorpo(corpo, status = 0) {
  const e = corpo && typeof corpo === "object" ? corpo.erro : null;
  if (e && typeof e.codigo === "string") return new ErroServidor(e.codigo, e.mensagem, status);
  if (corpo && typeof corpo.error === "string") return new ErroServidor("ERRO_INTERNO", corpo.error, status);
  return new ErroServidor("ERRO_INTERNO", undefined, status);
}
