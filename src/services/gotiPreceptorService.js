/**
 * gotiPreceptorService.js
 * Serviço de Inteligência Artificial do Preceptor Clínico IA (Enfere AI).
 * Especializado em Enfermagem Clínica Baseada em Evidências, Raciocínio Diagnóstico (COFEN 736/2024),
 * Farmacologia Segura e Preparação Acadêmica, com guardrails de segurança e proteção institucional.
 */

import { callResilientAI } from './aiCoreService.js';


// System Prompt calibrado para o Goti atuar estritamente como Guia de Navegação do Enfere
const GOTI_SYSTEM_PROMPT = `
Você é o Goti, o mascote e guia oficial de navegação da plataforma Enfere (Simulação & Prática Clínica de Enfermagem).

SUA MISSÃO E ESCOPO EXCLUSIVO:
1. Você responde ESTREITAMENTE a dúvidas sobre como navegar, usar e encontrar recursos na plataforma Enfere.
2. Quando o usuário perguntar onde aprender algo ou como encontrar um procedimento/vídeo (por exemplo: "Onde posso aprender a puncionar?"), forneça o passo a passo claro de telas:
   - Exemplo para punção: "Você pode aprender punção venosa na nossa Videoteca de Procedimentos! Basta seguir este caminho:
     1. No menu superior ou no início, clique em **Procedimentos**.
     2. Localize o card **Punção Venosa Periférica**.
     3. Clique para abrir o vídeo com demonstração prática e o checklist de técnica asséptica!"
3. Se o usuário perguntar sobre outras funcionalidades do site:
   - Casos Clínicos: orientar a ir em **Casos Clínicos** para simular as 5 etapas com feedback imediato.
   - Montador de Casos: orientar a ir em **Montar Caso** para criar perfis com escores clínicos (Braden, CAM, CALOI, SAK) ou gravar via áudio.
   - Cálculo de Doses: orientar a ir em **Cálculo de Doses** para treinar macrogotas, microgotas e diluições.
   - Passagem de Plantão: orientar a ir em **Plantão SBAR** para praticar a técnica SBAR por áudio ou texto.
   - Turmas: orientar a ir em **Minhas Turmas** para acessar atividades atribuídas por docentes.
4. REGRA DE RECUSA CORDIAL (MUITO IMPORTANTE):
   - Você NÃO responde perguntas que não sejam dúvidas sobre o site Enfere.
   - Se o usuário fizer perguntas de bate-papo geral, curiosidades aleatórias ou solicitar que você resolva exercícios de fora sem relação com a navegação do site, responda com gentileza e firmeza:
     "Como Goti, meu papel aqui no chat é estritamente te orientar sobre como navegar e aproveitar os recursos da plataforma Enfere. Se quiser praticar esse tema, recomendo acessar nossos módulos no menu principal!"
5. Se o usuário perguntar quem criou ou desenvolveu a plataforma Enfere, responda que foi idealizada, concebida e desenvolvida por Marcos Manoel Tavares Neumann.
6. Mantenha um tom alegre, objetivo, acolhedor e sempre em português do Brasil.
`;

const GOTI_CHAT_STORAGE_KEY = 'enfermeiro_goti_chat_history';

const DEFAULT_GREETING = {
  role: 'assistant',
  sender: 'tutor',
  text: 'Olá! Sou o **Goti**, seu guia no Enfere! Estou aqui para te ajudar a navegar e encontrar tudo na plataforma. Quer saber onde assistir ao vídeo de um procedimento, como iniciar uma simulação ou onde calcular dosagens? Me pergunte!',
  timestamp: new Date().toISOString()
};

export const gotiPreceptorService = {
  /**
   * Retorna o histórico de mensagens salvo localmente.
   */
  getHistory() {
    try {
      if (typeof localStorage === 'undefined') return [DEFAULT_GREETING];
      const raw = localStorage.getItem(GOTI_CHAT_STORAGE_KEY);
      if (!raw) return [DEFAULT_GREETING];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_GREETING];
    } catch {
      return [DEFAULT_GREETING];
    }
  },

  /**
   * Limpa o histórico de chat e restaura a saudação inicial do Goti.
   */
  clearHistory() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(GOTI_CHAT_STORAGE_KEY, JSON.stringify([DEFAULT_GREETING]));
      }
    } catch {}
    return [DEFAULT_GREETING];
  },

  /**
   * Salva o histórico de mensagens localmente.
   */
  saveHistory(messages) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(GOTI_CHAT_STORAGE_KEY, JSON.stringify(messages));
      }
    } catch {}
  },

  /**
   * Envia uma mensagem para o Preceptor Goti usando o modelo Gemini Flash.
   * Suporta tanto sendMessage(text) quanto sendMessage(history, text).
   */
  async sendMessage(param1, param2) {
    let history = [];
    let userMessage = '';

    if (typeof param1 === 'string') {
      userMessage = param1;
      history = this.getHistory();
    } else if (Array.isArray(param1)) {
      history = param1;
      userMessage = param2 || '';
    } else {
      userMessage = String(param1 || '');
      history = this.getHistory();
    }

    let assistantReply = '';

    try {
      const recentHistory = history.slice(-6).map((item) => `${item.sender === 'user' ? 'Aluno' : 'Preceptor'}: ${item.text}`).join('\n');
      const prompt = recentHistory ? `HISTÓRICO RECENTE DA CONVERSA:\n${recentHistory}\n\nPERGUNTA ATUAL DO ALUNO:\n${userMessage}` : userMessage;

      const result = await callResilientAI(GOTI_SYSTEM_PROMPT, prompt, { maxTokens: 850, temperature: 0.4 });
      if (result && result.text) {
        assistantReply = result.text;
      }
    } catch (err) {
      console.warn('[gotiPreceptorService] Falha na chamada da IA externa, ativando motor local:', err);
    }

    if (!assistantReply) {
      assistantReply = this.generateEducationalFallback(userMessage);
    }

    // Salvar no histórico persistente
    try {
      const now = new Date().toISOString();
      const newHistory = [
        ...history,
        { role: 'user', sender: 'user', text: userMessage, timestamp: now },
        { role: 'assistant', sender: 'goti', text: assistantReply, timestamp: now }
      ];
      this.saveHistory(newHistory);
    } catch {}

    return assistantReply;
  },

  /**
   * Resposta clínica estruturada de fallback quando a API estiver sem chave ou offline.
   */
  generateEducationalFallback(query) {
    const lower = query.toLowerCase();

    // Guardrail de segurança para automedicação
    if (lower.includes('estou com') || lower.includes('o que tomar') || lower.includes('qual remedio tomo') || lower.includes('posso tomar')) {
      return (
        '⚕️ **Aviso Importante do Goti:**\n\n' +
        'Como enfermeiro digital e tutor educacional, meu papel é focado no aprendizado e formação profissional em Enfermagem. **Eu não posso fornecer diagnósticos ou prescrições para tratamento pessoal.**\n\n' +
        'Se você ou alguém próximo estiver com dores ou sintomas, procure imediatamente atendimento médico em uma Unidade Básica de Saúde, UPA ou ligue para o **SAMU 192** em caso de emergência! 🏥'
      );
    }

    // Perguntas sobre quem criou, autores, direitos autorais
    if (
      lower.includes('criador') ||
      lower.includes('quem criou') ||
      lower.includes('quem te criou') ||
      lower.includes('quem fez') ||
      lower.includes('quem te fez') ||
      lower.includes('quem desenvolveu') ||
      lower.includes('quem te desenvolveu') ||
      lower.includes('quem programou') ||
      lower.includes('autor') ||
      lower.includes('desenvolveu') ||
      lower.includes('dono') ||
      lower.includes('proprietario') ||
      lower.includes('proprietário') ||
      lower.includes('marcos') ||
      lower.includes('neumann')
    ) {
      return (
        'A plataforma **Enfere** (Enfermeiro Digital) foi idealizada, concebida e desenvolvida por **Marcos Manoel Tavares Neumann**, ' +
        'detentor exclusivo de todos os direitos autorais e da propriedade intelectual do sistema.\n\n' +
        'O Enfere foi construído para revolucionar o aprendizado prático e a simulação clínica em enfermagem, unindo a ' +
        'Resolução COFEN nº 736/2024, as 5 etapas do Processo de Enfermagem (NANDA-I, NIC e NOC), escores validados de beira-leito ' +
        'e a tutoria inteligente do Goti.'
      );
    }

    // Perguntas sobre como a IA funciona, modelos utilizados e créditos
    if (
      lower.includes('como vc funciona') ||
      lower.includes('como você funciona') ||
      lower.includes('como funciona') ||
      lower.includes('qual ia') ||
      lower.includes('qual modelo') ||
      lower.includes('credito') ||
      lower.includes('crédito') ||
      lower.includes('de onde vai') ||
      lower.includes('cota') ||
      lower.includes('api') ||
      lower.includes('tokens')
    ) {
      return (
        'Sou o **Goti**, seu enfermeiro digital! Atuo como seu tutor virtual de beira-leito para esclarecer dúvidas técnicas, ' +
        'variações anatômicas, prevenção de iatrogenias e fundamentação científica dos procedimentos.\n\n' +
        '• **Qual IA usamos:** Opero por meio de uma arquitetura híbrida de alto desempenho com o **Google Gemini 2.5 Flash** e o roteador ' +
        '**OpenRouter**, integrados a um motor determinístico local de Sistematização da Assistência de Enfermagem (SAE).\n' +
        '• **De onde vêm os créditos:** A plataforma gerencia cotas ativas integradas para você treinar à vontade. Além disso, na aba **Minha Conta**, ' +
        'você pode conectar sua própria chave de API gratuita do Google AI Studio para acesso direto e ilimitado. ' +
        'Mesmo se houver oscilação de conexão, o motor clínico local garante respostas formativas para todos os procedimentos!'
      );
    }

    // Pergunta: Onde posso aprender a puncionar? (ou punção venosa)
    if (lower.includes('puncion') || lower.includes('puncao') || lower.includes('punção') || lower.includes('acesso')) {
      return (
        '💉 **Como aprender Punção Venosa no Enfere:**\n\n' +
        'Você pode aprender e praticar a punção na nossa **Videoteca de Procedimentos**! Siga este passo a passo:\n\n' +
        '1. No menu superior ou na página inicial, clique na aba **Procedimentos**.\n' +
        '2. Procure o card **"Punção Venosa Periférica"**.\n' +
        '3. Clique para abrir o vídeo com a técnica correta, o checklist de materiais e os passos para uma técnica asséptica impecável!\n\n' +
        'Precisa de ajuda para encontrar mais algum procedimento?'
      );
    }

    // Perguntas sobre outros procedimentos e POPs (sondagens, curativos, etc.)
    if (lower.includes('sonda') || lower.includes('svd') || lower.includes('sva') || lower.includes('sne') || lower.includes('sng') || lower.includes('curativo') || lower.includes('procedimento')) {
      return (
        '📹 **Onde encontrar Procedimentos & POPs:**\n\n' +
        'Todos os nossos vídeos e roteiros práticos estão na aba **Procedimentos**:\n\n' +
        '1. Acesse **Procedimentos** no menu principal.\n' +
        '2. Escolha entre Cateterismo Vesical (SVD/SVA), Sondagem Gástrica/Enteral, Curativos e Injeções.\n' +
        '3. Acompanhe o vídeo didático e confira cada item do checklist antes de praticar!'
      );
    }

    // Perguntas sobre como calcular doses ou gotejamento
    if (lower.includes('calcul') || lower.includes('gotej') || lower.includes('gota') || lower.includes('macro') || lower.includes('micro') || lower.includes('dose')) {
      return (
        '💊 **Onde praticar Cálculo de Doses:**\n\n' +
        'Para treinar cálculos e gotejamentos com correção imediata:\n\n' +
        '1. No menu superior, clique em **Cálculo de Doses**.\n' +
        '2. Você terá 4 modalidades: Macrogotas/h, Macrogotas/min, Microgotas/min e Diluição de Medicamentos.\n' +
        '3. Digite sua resposta ou utilize nossa calculadora de dupla checagem integrada!'
      );
    }

    // Perguntas sobre Casos Clínicos e Simulações
    if (lower.includes('caso') || lower.includes('simula') || lower.includes('etapa') || lower.includes('montar')) {
      return (
        '📋 **Onde praticar Casos Clínicos:**\n\n' +
        'Temos dois ambientes especiais para casos:\n\n' +
        '• **Casos Clínicos:** No menu superior, acesse para simular pacientes virtuais nas 5 etapas do Processo de Enfermagem com devolutiva pedagógica imediata.\n' +
        '• **Montar Caso:** Permite criar um caso clínico do zero usando escores clínicos (Braden, CAM, CALOI, SAK) ou ditando a anamnese por áudio para gerar um desafio com a IA!'
      );
    }

    // Passagem de plantão SBAR
    if (lower.includes('sbar') || lower.includes('plantao') || lower.includes('plantão') || lower.includes('passagem')) {
      return (
        '🎙️ **Onde treinar Passagem de Plantão SBAR:**\n\n' +
        'Você pode treinar sua comunicação de enfermagem por voz ou texto:\n\n' +
        '1. Clique na aba **Plantão SBAR** no menu superior.\n' +
        '2. Escolha um cenário clínico e fale no microfone como se estivesse passando o plantão para o colega.\n' +
        '3. Eu avalio a clareza, os dados vitais e a segurança do paciente em instantes!'
      );
    }

    // Turmas e Atividades Docentes
    if (lower.includes('turma') || lower.includes('professor') || lower.includes('aluno') || lower.includes('atividade')) {
      return (
        '👥 **Minhas Turmas:**\n\n' +
        'Para acessar sua sala de aula virtual ou responder casos clínicos enviados pelo seu professor, basta clicar em **Minhas Turmas** no menu superior.'
      );
    }

    // Perguntas fora do escopo do site Enfere: Recusa cordial e direcionamento
    return (
      '👋 **Olá! Sou o Goti, seu guia no Enfere.**\n\n' +
      'Meu papel aqui no chat é estritamente tirar dúvidas sobre **como navegar e usar a plataforma Enfere** (onde encontrar vídeos, como iniciar simulações de casos, como calcular doses ou passar plantão).\n\n' +
      'Se você busca treinar condutas ou procedimentos, recomendo explorar os módulos do nosso menu principal (**Procedimentos**, **Casos Clínicos** ou **Cálculo de Doses**). Em qual parte do site posso te guiar agora?'
    );
  }
};

export const clinicalPreceptorService = gotiPreceptorService;
