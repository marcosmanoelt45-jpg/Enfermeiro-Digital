/**
 * gotiPreceptorService.js
 * Serviço do Goti - Guia Inteligente da Plataforma Enfere.
 * Especializado em orientar os alunos e profissionais pelos recursos e simuladores do Enfere,
 * Farmacologia Segura e Preparação Acadêmica, com guardrails de segurança e proteção institucional.
 */

import { callResilientAI } from './aiCoreService.js';

// System Prompt oficial do Goti: Guia Inteligente da Plataforma Enfere
const GOTI_SYSTEM_PROMPT = `
Você é o Goti, o mascote e guia oficial de inteligência artificial da plataforma Enfere (Simulação e Prática Clínica de Enfermagem).

SUA MISSÃO E IDENTIDADE:
1. Você é o Goti, um guia amigável, inteligente e prestativo. NUNCA se denomine "preceptor" ou "tutor". Você é simplesmente o Goti!
2. REGRA DE OURO INEGOCIÁVEL: Você NUNCA dá as respostas prontas, diagnósticos mastigados, prescrições resolvidas ou contas de gotejamento calculadas. No Enfere, o usuário aprende na prática ativa resolvendo os desafios por conta própria!
3. SEU PAPEL É GUIAR O USUÁRIO PELAS COISAS DO SITE COM INTELIGÊNCIA:
   - Se o usuário perguntar sobre Videochamadas, Atendimento por Voz, Pacientes Virtuais, Sr. Marcus, Dona Teresinha, falar no microfone ou simulação por vídeo:
     -> Guie com entusiasmo para o módulo "Videochamada" (menu superior -> "Videochamada" ou /videochamada). Explique que lá ele atende pacientes reais por vídeo interativo, escuta os relatos clínicos em primeira pessoa (como o Sr. Marcus com pneumonia/DPOC ou Dona Teresinha com insuficiência cardíaca), responde falando no microfone ou digitando, calcula dosagens de urgência e testa suas decisões sob pressão com um sistema desafiador de 3 vidas!
   - Se o usuário perguntar sobre cálculos, medicamentos, gotejamento, macrogotas, microgotas, diluições ou heparina:
     -> Guie com entusiasmo para o "Laboratório de Cálculo de Doses" (menu superior -> "Cálculo de Doses"). Explique que lá ele encontra a calculadora interativa com todas as fórmulas e sistema de dupla checagem para ele mesmo resolver o desafio e conferir se acertou!
   - Se o usuário perguntar sobre punção venosa, cateterismo vesical (SVD/SVA), sondagem nasogástrica, curativos, injeções, técnicas assépticas ou POPs:
     -> Guie para a "Videoteca de Procedimentos" (menu superior -> "Procedimentos"). Explique que lá há vídeos detalhados com demonstrações técnicas e checklists interativos de técnica asséptica para ele acompanhar passo a passo!
   - Se o usuário trouxer uma situação clínica, caso de paciente, suspeita de sepse, parada cardíaca (PCR), IAM, dor torácica, AVC, sinais vitais alterados ou perguntar sobre diagnósticos NANDA-I, NIC e NOC:
     -> Guie para o "Simulador de Casos Clínicos" (menu superior -> "Casos Clínicos"). Explique que no Enfere nós não entregamos a conduta pronta; lá ele assume o papel do enfermeiro nas 5 etapas do Processo de Enfermagem (COFEN nº 736/2024), investiga o prontuário e toma as decisões assistenciais!
   - Se o usuário quiser criar seu próprio paciente ou caso do zero:
     -> Guie para "Montar Caso Clínico" (menu superior -> "Montar Caso"), onde é possível configurar sinais vitais, histórico e escores como Braden, Glasgow e CAM.
   - Se o usuário quiser treinar comunicação ou passagem de plantão:
     -> Guie para a aba "Plantão SBAR" (menu superior -> "Plantão SBAR"), onde ele pode gravar por voz ou texto e receber feedback imediato de clareza e segurança.
   - Se o usuário insistir para você dar a resposta pronta ou fizer uma pergunta conceitual:
     -> Responda de forma inteligente e descontraída: "Aqui no Enfere você aprende na prática! Eu não dou as respostas prontas para você poder desenvolver seu próprio raciocínio clínico. Mas eu te mostro o caminho exato no site para você treinar e dominar isso!" e aponte o módulo certo.

RECONHECIMENTO DE HISTÓRICO E ATENDIMENTOS REAIS:
- Você tem conhecimento do histórico de atendimentos realizados pelo estudante (como videochamadas com o Sr. Marcus ou Dona Teresinha). Se o aluno perguntar como foi o atendimento dele, como ele se saiu ou o que você achou, avalie o resultado real do histórico fornecido no contexto, elogiando os acertos e incentivando a melhoria contínua!

DIRETRIZES DE COMUNICAÇÃO:
- Seja sempre direto, empático, motivador e em português do Brasil.
- Aponte claramente o nome da aba no menu superior e o que o aluno vai fazer lá.
- Se o usuário perguntar quem criou a plataforma Enfere, diga que foi idealizada, concebida e desenvolvida por Marcos Manoel Tavares Neumann.
`;

const GOTI_CHAT_STORAGE_KEY = 'enfermeiro_goti_chat_history';

/**
 * Recupera o resumo dos atendimentos recentes em videochamada salvos no storage.
 */
function getRecentVideochamadaSummary() {
  try {
    if (typeof localStorage === 'undefined') return '';
    const raw = localStorage.getItem('enfermeiro_historico_videochamadas');
    if (!raw) return '';
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return '';
    const last = list[0];
    const statusVidas = last.semVidas
      ? 'Ficou sem vidas antes do término'
      : `${last.vidasRestantes} vida(s) restante(s)`;
    return `HISTÓRICO REAL DE ATENDIMENTO DO ALUNO:
- Última Videochamada: Paciente ${last.pacienteNome}
- Resultado: ${last.acertos} de ${last.totalQuestoes} questões acertadas (${last.precisao}% de precisão)
- Condição final: ${statusVidas}
- Data/Hora: ${last.data} às ${last.hora}
- PE Ganhos: ${last.xpGanho || 0} PE`;
  } catch {
    return '';
  }
}

const DEFAULT_GREETING = {
  role: 'assistant',
  sender: 'goti',
  text: 'Olá! Sou o **Goti**, seu guia no Enfere! 💧✨\n\nEstou aqui para te orientar em tudo na plataforma: desde o novo simulador de **Videochamada** com pacientes por voz, passando pela Videoteca de Procedimentos, Cálculo de Doses até os Casos Clínicos completos. O que você gostaria de treinar ou encontrar agora?',
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
   * Envia uma mensagem para o Goti com guardrail de segurança.
   * Garante resposta em no máximo 11 segundos, alternando com elegância para o motor local.
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
      // Normalização rigorosa de papéis para manter fidelidade no histórico
      const recentHistory = history
        .slice(-6)
        .map((item) => {
          const isUser = item.sender === 'user' || item.role === 'user';
          return `${isUser ? 'Usuário' : 'Goti'}: ${item.text}`;
        })
        .join('\n');

      const videochamadaContext = getRecentVideochamadaSummary();
      const contextPrefix = videochamadaContext ? `${videochamadaContext}\n\n` : '';

      const prompt = recentHistory
        ? `${contextPrefix}HISTÓRICO RECENTE DA CONVERSA:\n${recentHistory}\n\nPERGUNTA ATUAL DO ALUNO:\n${userMessage}`
        : `${contextPrefix}PERGUNTA ATUAL DO ALUNO:\n${userMessage}`;

      // Guardrail duplo: chamada da IA resiliente com timeout global de 11 segundos via Promise.race
      const aiPromise = callResilientAI(GOTI_SYSTEM_PROMPT, prompt, { maxTokens: 1200, temperature: 0.4 });
      const safetyTimeoutPromise = new Promise((resolve) =>
        setTimeout(() => {
          console.warn('[gotiPreceptorService] Guardrail de 11s acionado: chave/rede externa demorou, ativando motor local determinístico.');
          resolve(null);
        }, 11000)
      );

      const result = await Promise.race([aiPromise, safetyTimeoutPromise]);
      if (result && result.text) {
        assistantReply = result.text;
      }
    } catch (err) {
      console.warn('[gotiPreceptorService] Falha na chamada da IA remota, ativando motor guia local:', err);
    }

    // Se a IA externa falhar, esgotar o timeout ou não houver chave conectada, gera resposta clínica local de excelência
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
   * Motor determinístico de conhecimento clínico local de alta precisão em português do Brasil.
   * Fundamentado na Resolução COFEN nº 736/2024, NANDA-I 2024-2026, NIC, NOC e protocolos assistenciais.
   */
  generateEducationalFallback(query) {
    const raw = query || '';
    // Normalização completa de acentos e diacríticos (cálculo -> calculo, injeção -> injecao)
    const lower = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    // 1. Guardrail de segurança para automedicação e diagnóstico pessoal
    if (
      lower.includes('estou com') ||
      lower.includes('o que tomar') ||
      lower.includes('qual remedio tomo') ||
      lower.includes('posso tomar') ||
      lower.includes('minha dor') ||
      lower.includes('remedio pra dor')
    ) {
      return (
        '⚠️ **Aviso do Goti:**\n\n' +
        'O Enfere é uma plataforma voltada para o treino e simulação clínica de estudantes e profissionais de enfermagem. **Não realizo diagnósticos médicos nem prescrições para tratamento pessoal.**\n\n' +
        'Se você ou alguém próximo estiver com dores ou mal-estar, procure imediatamente uma Unidade Básica de Saúde (UBS), UPA ou acione o **SAMU 192**! 🏥'
      );
    }

    // 2. Criador e autoria oficial do Enfere
    if (
      lower.includes('criador') || lower.includes('quem criou') || lower.includes('quem te criou') ||
      lower.includes('quem fez') || lower.includes('quem te fez') || lower.includes('quem desenvolveu') ||
      lower.includes('autor') || lower.includes('dono') || lower.includes('marcos') || lower.includes('neumann')
    ) {
      return (
        'A plataforma **Enfere** foi idealizada, concebida e desenvolvida por **Marcos Manoel Tavares Neumann**, ' +
        'detentor exclusivo de todos os direitos autorais e da propriedade intelectual do sistema.'
      );
    }

    // 2.5. Videochamada, Atendimento por Voz e Pacientes Virtuais (Sr. Marcus, Dona Teresinha)
    if (
      lower.includes('videochamada') || lower.includes('video chamada') || lower.includes('chamada') ||
      lower.includes('paciente virtual') || lower.includes('marcus') || lower.includes('teresinha') ||
      lower.includes('voz') || lower.includes('microfone') || lower.includes('falar com paciente') ||
      lower.includes('meu atendimento') || lower.includes('minha chamada') || lower.includes('como fui')
    ) {
      const summary = getRecentVideochamadaSummary();
      if (summary && (lower.includes('como fui') || lower.includes('o que achou') || lower.includes('meu atendimento') || lower.includes('minha chamada') || lower.includes('desempenho'))) {
        return (
          '🩺 **Seu Desempenho na Videochamada:**\n\n' +
          'Acompanhei o seu atendimento recente! Veja o resumo dos seus registros clínicos:\n\n' +
          summary.replace('HISTÓRICO REAL DE ATENDIMENTO DO ALUNO:\n', '') + '\n\n' +
          '💡 **Dica do Goti:** Lembre-se sempre de conferir a prescrição com dupla checagem nos cálculos e manter a comunicação empática. Se quiser treinar novamente ou melhorar seu tempo e vidas, acesse a aba **Videochamada** no menu superior!'
        );
      }

      return (
        '📹 **Onde treinar Atendimento por Voz e Videochamada:**\n\n' +
        'O Enfere conta com simulações interativas por vídeo onde você conversa diretamente com pacientes virtuais!\n\n' +
        '👉 Acesse o módulo **Videochamada** no menu superior (ou /videochamada)!\n\n' +
        'Lá você atende casos como o do **Sr. Marcus** (DPOC/pneumonia) e da **Dona Teresinha** (insuficiência cardíaca), escuta os relatos clínicos em vídeo, responde falando no microfone ou digitando, calcula medicamentos de urgência e testa seu raciocínio com um sistema desafiador de 3 vidas!'
      );
    }

    // 3. Cálculo de Doses, Medicamentos, Gotejamento e Diluição
    if (
      lower.includes('calcul') || lower.includes('dose') || lower.includes('dosagem') ||
      lower.includes('gotej') || lower.includes('gota') || lower.includes('macro') ||
      lower.includes('micro') || lower.includes('dilui') || lower.includes('heparina') ||
      lower.includes('insulina') || lower.includes('medicament') || lower.includes('remedio')
    ) {
      return (
        '💊 **Onde treinar Cálculo de Medicamentos no Enfere:**\n\n' +
        'Aqui no Enfere você aprende calculando na prática ativa! Para resolver fórmulas de gotejamento (macrogotas e microgotas), diluições e cálculos com dupla checagem:\n\n' +
        '👉 Acesse a aba **Cálculo de Doses** no menu superior!\n\n' +
        'Lá você encontra a calculadora interativa com desafios clínicos reais para você mesmo calcular e testar seus resultados.'
      );
    }

    // 4. Procedimentos, Técnicas, POP, Punção Venosa e Curativos
    if (
      lower.includes('puncion') || lower.includes('puncao') || lower.includes('veia') ||
      lower.includes('acesso venoso') || lower.includes('cateter') || lower.includes('jelco') ||
      lower.includes('scalp') || lower.includes('procedimento') || lower.includes('curativo') ||
      lower.includes('injecao') || lower.includes('pop') || lower.includes('ferida') ||
      lower.includes('curativos')
    ) {
      return (
        '💉 **Onde aprender Procedimentos e Técnicas no Enfere:**\n\n' +
        'Para assistir à execução correta de punção venosa periférica, curativos e outros procedimentos assépticos:\n\n' +
        '👉 Acesse a **Videoteca de Procedimentos** no menu superior (clique em **Procedimentos**)!\n\n' +
        'Você poderá assistir aos vídeos demonstrativos e acompanhar o checklist interativo com as diretrizes do COFEN de "O Que Fazer" e "O Que NÃO Fazer".'
      );
    }

    // 5. Cateterismo Vesical (SVD / SVA) e Sondagens
    if (
      lower.includes('sonda') || lower.includes('svd') || lower.includes('sva') ||
      lower.includes('vesical') || lower.includes('cateterismo') || lower.includes('sng') ||
      lower.includes('sne') || lower.includes('nasogastrica') || lower.includes('nasoenteral')
    ) {
      return (
        '🩺 **Onde aprender Sondagens e Cateterismo no Enfere:**\n\n' +
        'Para dominar o passo a passo da técnica estéril de Cateterismo Vesical (SVD/SVA) ou Sondagem Nasogástrica/Nasoenteral:\n\n' +
        '👉 Acesse o módulo **Procedimentos** no menu superior e abra o procedimento desejado!\n\n' +
        'Lá você confere os materiais necessários, a técnica asséptica e os cuidados para prevenção de infecção do trato urinário.'
      );
    }

    // 6. Montar Caso Clínico, Criar Paciente e Escalas (Braden, Glasgow, CAM)
    if (
      lower.includes('montar') || lower.includes('criar') || lower.includes('novo caso') ||
      lower.includes('braden') || lower.includes('glasgow') || lower.includes('cam') ||
      lower.includes('escala') || lower.includes('escore') || lower.includes('lpp')
    ) {
      return (
        '📋 **Onde criar Casos e treinar Escalas Clínicas:**\n\n' +
        'Para construir o perfil de um paciente personalizado ou testar escalas como Braden (lesão por pressão), Glasgow-P ou CAM de delirium:\n\n' +
        '👉 Acesse **Montar Caso Clínico** no menu superior!\n\n' +
        'Você pode preencher a anamnese, calibrar os sinais vitais e gerar desafios práticos imediatos.'
      );
    }

    // 7. Casos Clínicos, Sepse, PCR, IAM, AVC, Sinais Vitais e Processo de Enfermagem
    if (
      lower.includes('caso') || lower.includes('simula') || lower.includes('sepse') ||
      lower.includes('pcr') || lower.includes('parada') || lower.includes('iam') ||
      lower.includes('infarto') || lower.includes('avc') || lower.includes('dor no peito') ||
      lower.includes('dor toracica') || lower.includes('nanda') || lower.includes('nic') ||
      lower.includes('noc') || lower.includes('cofen') || lower.includes('736') ||
      lower.includes('sinal vital') || lower.includes('sinais vitais') || lower.includes('paciente')
    ) {
      return (
        '🚨 **Onde simular Casos Clínicos e Tomada de Decisão:**\n\n' +
        'Eu não entrego a conduta pronta porque o objetivo é você mesmo treinar o seu raciocínio! Para atender um paciente e conduzir o caso do início ao fim:\n\n' +
        '👉 Acesse o **Simulador de Casos Clínicos** no menu superior (clique em **Casos Clínicos**)!\n\n' +
        'Lá você investiga a queixa, analisa os sinais vitais, define os diagnósticos NANDA-I e prescreve as intervenções NIC e resultados NOC nas 5 etapas do Processo de Enfermagem (COFEN nº 736/2024).'
      );
    }

    // 8. Passagem de Plantão SBAR
    if (
      lower.includes('sbar') || lower.includes('plantao') || lower.includes('plantão') ||
      lower.includes('passagem') || lower.includes('comunicacao') || lower.includes('audio')
    ) {
      return (
        '🎙️ **Onde treinar Passagem de Plantão SBAR:**\n\n' +
        'Para praticar a comunicação estruturada e segura na transição de plantão:\n\n' +
        '👉 Clique na aba **Plantão SBAR** no menu superior!\n\n' +
        'Você pode gravar sua passagem de plantão por voz ou digitar em texto para conferir se todos os dados essenciais do paciente foram transmitidos com segurança.'
      );
    }


    // 10. Guia Geral do Enfere (quando o usuário perguntar algo genérico ou pedir respostas prontas)
    return (
      '👋 **Olá! Sou o Goti, seu guia na plataforma Enfere.**\n\n' +
      'No Enfere você aprende na prática ativa, por isso eu **não entrego respostas prontas ou gabaritos**. Meu papel é te mostrar o caminho para você treinar e dominar cada área:\n\n' +
      '• **Videochamada:** Para simular atendimento por voz e vídeo em tempo real com pacientes virtuais (Sr. Marcus e Dona Teresinha).\n' +
      '• **Cálculo de Doses:** Para treinar gotejamentos, diluições e cálculos com calculadora interativa.\n' +
      '• **Procedimentos:** Para assistir aos vídeos com checklists de técnica asséptica (punção, sondagens, curativos).\n' +
      '• **Casos Clínicos:** Para simular atendimentos de emergência e enfermaria nas 5 etapas do Processo de Enfermagem (COFEN nº 736/2024).\n' +
      '• **Montar Caso:** Para criar seus próprios pacientes com escores clínicos.\n' +
      '• **Plantão SBAR:** Para treinar comunicação e passagem de plantão por voz ou texto.\n\n' +
      'Para qual dessas áreas do site você gostaria de ir agora?'
    );
  }
};

export const clinicalPreceptorService = gotiPreceptorService;

