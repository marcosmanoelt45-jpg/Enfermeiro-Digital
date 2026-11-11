// Formatos de 01-contratos.md (C1 a C5) como JSDoc. Mudou aqui, muda lá.

/** @typedef {'parado'|'falando'|'pensando'|'feliz'|'dor'|'desconfiado'|'confuso'|'irritado'|'acerto'|'erro'} Emocao */

/**
 * C1. Personagem.
 * @typedef {Object} Personagem
 * @property {string} id
 * @property {string} nome
 * @property {'paciente'|'medico'|'enfermeira'|'preceptor'} papel
 * @property {'crianca'|'jovem'|'adulto'|'idoso'} faixa
 * @property {'M'|'F'} sexo
 * @property {{ voiceboxPerfil: string, modo?: "mp3", navegador: { pitch: number, rate: number } }} voz
 * @property {Emocao[]} clipes Emoções que existem em disco.
 * @property {string} poster
 * @property {string} [pasta] Pasta pública dos clipes (padrão: /personagens/<id>).
 * @property {Partial<Record<Emocao,string>>} [arquivos] Nome do arquivo por emoção, quando difere da emoção.
 */

/**
 * C3. Fala na fila de voz.
 * @typedef {Object} Fala
 * @property {string} [id]
 * @property {string} texto
 * @property {Emocao} [emocao]
 * @property {'fixa'|'aovivo'} origem
 */

/**
 * C4. Estado da cena.
 * @typedef {'ocioso'|'personagem_falando'|'aguardando_aluno'|'aluno_falando'|'revisando_texto'|'processando'|'erro_recuperavel'|'encerrada'|'bloqueada'} StatusCena
 */

/**
 * @typedef {Object} EstadoCena
 * @property {StatusCena} status
 * @property {Fala|null} falaAtual
 * @property {Fala[]} filaFalas
 * @property {string} rascunhoAluno
 * @property {Array<{ autor: 'aluno'|'personagem', texto: string, canal?: string }>} turnos
 * @property {{ codigo: string, mensagem?: string }|null} erro
 * @property {string|null} turnoPendenteId
 */

export {};
