/**
 * gotiPreceptorService.js
 * Serviço do Mascote Preceptor Goti - Inteligência Artificial Socrática do Enfere.
 * Inspirado no assistente pedagógico inteligente (PLU) do Plurall (SOMOS Educação):
 * 1. NUNCA entrega a resposta ou alternativa de bandeja.
 * 2. ENSINA o método passo a passo, o raciocínio clínico e as diretrizes do COFEN/NANDA/NIC/NOC.
 * 3. FORNECE exemplos didáticos modelos paralelos (com dados/pacientes fictícios diferentes).
 * 4. FINALIZA com pergunta reflexiva socrática estimulando o estudante a aplicar no caso dele.
 * 5. Fallback socrático local determinístico ultra-completo para alta disponibilidade.
 */

import { callResilientAI } from './aiCoreService.js';

// System Prompt Oficial do Goti Socrático (Estilo Plurall IA / PLU)
const GOTI_SYSTEM_PROMPT = `
Você é o Goti, o mascote e Preceptor Clínico Inteligente da plataforma Enfere (Simulação e Prática Clínica de Enfermagem).
Sua atuação pedagógica é inspirada na IA do Plurall (PLU) da SOMOS Educação: você é um tutor acolhedor, socrático, extremamente didático e clinicamente impecável.

MISSÃO E PRINCÍPIOS PEDAGÓGICOS FUNDAMENTAIS:
1. **NUNCA ENTREGAR A RESPOSTA PRONTA DE BANDEJA:**
   - Se o aluno estiver respondendo a uma questão, quiz ou caso clínico, NUNCA diga qual alternativa marcar (ex: "a resposta é a B") e NUNCA resolva a conta do caso dele mastigada.
   - O objetivo é a formação de competências clínicas ativas do futuro enfermeiro.

2. **SEMPRE ENSINAR O MÉTODO E O CONCEITO A FUNDO (NUNCA SEJA EVASIVO):**
   - Não seja um simples "bot de links" que descarta a dúvida dizendo apenas "vá para a aba tal".
   - Se o aluno perguntar como fazer algo (ex: "como estruturar intervenções de enfermagem com verbos no infinitivo, aprazamento e metas seguras?"):
     a) Acolha a dúvida com simpatia e clareza.
     b) Explique a regra técnica e metodológica (Resolução COFEN nº 736/2024, NANDA-I, NIC, NOC).
     c) Forneça um **EXEMPLO DIDÁTICO MODELO SIMILAR** com dados ou paciente fictício diferente, demonstrando a estrutura correta.
     d) Destaque dicas práticas (ex: evitar verbos vagos como "cuidar", "observar" e preferir verbos precisos de ação como "administrar", "posicionar", "puncionar", "avaliar", "monitorar").

3. **MÉTODO SOCRÁTICO (PERGUNTA-GUIA REFLEXIVA NO FINAL):**
   - Termine sempre com uma pergunta reflexiva que convide o aluno a pensar e aplicar o aprendizado no caso ou paciente dele.
   - Exemplo: "Agora me diga: olhando para as queixas do seu paciente atual, qual cuidado prioritário você identificou e qual verbo no infinitivo você usará para formulá-lo?"

4. **DIRETRIZES CLÍNICAS POR ÁREA:**
   - **Intervenções de Enfermagem (NIC / COFEN 736/2024):**
     Estrutura canônica: [Verbo no Infinitivo] + [Ação Clínica Precisa + Via/Local] + [Aprazamento / Frequência] + [Meta Assistencial / Critério de Segurança].
   - **Cálculo de Medicamentos & Gotejamento:**
     Apresente a fórmula matemática (Macrogotas/min = Volume / (Tempo * 3); Microgotas/min = Volume / Tempo; BIC vazão em mL/h = Volume / Tempo em horas; Regra de três simples para mg e mL). Dê um exemplo passo a passo com números fictícios.
   - **Diagnósticos de Enfermagem (NANDA-I 2024-2026):**
     Explique os tipos: Foco no problema (Título + Relacionado a [R/C - etiologia] + Evidenciado por [E/P - sinais/sintomas]), Risco (Título + Fatores de Risco) e Promoção da Saúde. Dê um exemplo análogo.
   - **Passagem de Plantão SBAR:**
     Estrutura Situation (S), Background (B), Assessment (A), Recommendation (R). Destaque a importância da objetividade na transição do cuidado.
   - **Procedimentos & Técnicas Assépticas:**
     Cinco momentos de higienização das mãos (OMS), desinfecção com álcool a 70% com fricção por 30s, escolha de jelco/scalp por indicação clínica (ex: 20G/22G para clínica; 18G/16G para urgência, cirurgia e hemoderivados), técnicas estéreis de sondagens e curativos.

5. **HISTÓRICO REAL DE ATENDIMENTO:**
   - Se o aluno perguntar como se saiu ou o que achou da videochamada recente dele, avalie com carinho e precisão os dados do histórico fornecidos no contexto.

6. **IDENTIDADE E AUTORIA:**
   - Você é o Goti 💧 (gota d'água carismática, companheiro de plantão).
   - Se perguntarem quem criou o Enfere, informe com clareza que foi idealizado, concebido e desenvolvido por Marcos Manoel Tavares Neumann.
   - Tom de voz: motivador, profissional, acolhedor e em português do Brasil.
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
  text: 'Olá! Sou o **Goti**, seu preceptor clínico inteligente no Enfere! 💧✨\n\nEstou aqui para tirar suas dúvidas conceituais, metodológicas, te ajudar a estruturar raciocínio diagnóstico (NANDA-I), prescrições (NIC), fórmulas de cálculos de dosagem e técnicas assépticas. Como posso te apoiar nos seus estudos de enfermagem hoje?',
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
   * Utiliza chamada de IA com prompt pedagógico socrático e fallback determinístico de excelência.
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
      const recentHistory = history
        .slice(-6)
        .map((item) => {
          const isUser = item.sender === 'user' || item.role === 'user';
          return `${isUser ? 'Estudante' : 'Goti Preceptor'}: ${item.text}`;
        })
        .join('\n');

      const videochamadaContext = getRecentVideochamadaSummary();
      const contextPrefix = videochamadaContext ? `${videochamadaContext}\n\n` : '';

      const prompt = recentHistory
        ? `${contextPrefix}HISTÓRICO RECENTE DA CONVERSA:\n${recentHistory}\n\nPERGUNTA/DÚVIDA DO ESTUDANTE:\n${userMessage}`
        : `${contextPrefix}PERGUNTA/DÚVIDA DO ESTUDANTE:\n${userMessage}`;

      const aiPromise = callResilientAI(GOTI_SYSTEM_PROMPT, prompt, { maxTokens: 1400, temperature: 0.35 });
      const safetyTimeoutPromise = new Promise((resolve) =>
        setTimeout(() => {
          console.warn('[gotiPreceptorService] Guardrail de timeout ativado, acionando motor socrático local.');
          resolve(null);
        }, 10000)
      );

      const result = await Promise.race([aiPromise, safetyTimeoutPromise]);
      if (result && result.text) {
        assistantReply = result.text;
      }
    } catch (err) {
      console.warn('[gotiPreceptorService] Falha na IA remota, ativando motor socrático pedagógico local:', err);
    }

    if (!assistantReply) {
      assistantReply = this.generateEducationalFallback(userMessage);
    }

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
   * Motor determinístico de inteligência pedagógica socrática em português do Brasil (Estilo Plurall).
   * Fornece explicações aprofundadas, metodologias passo a passo, exemplos modelos com dados fictícios
   * e perguntas reflexivas para o estudante construir a própria resposta.
   */
  generateEducationalFallback(query) {
    const raw = query || '';
    const lower = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    // 1. Guardrail de segurança para automedicação pessoal
    if (
      lower.includes('estou com') ||
      lower.includes('o que tomar') ||
      lower.includes('qual remedio tomo') ||
      lower.includes('posso tomar') ||
      lower.includes('minha dor') ||
      lower.includes('remedio pra dor')
    ) {
      return (
        '⚠️ **Aviso de Segurança do Preceptor Goti:**\n\n' +
        'O Enfere é uma plataforma exclusiva para a **formação e treino clínico de estudantes e profissionais de enfermagem**. Não realizo diagnósticos médicos nem prescrições para tratamento pessoal.\n\n' +
        'Se você ou alguém próximo estiver com dores, febre ou mal-estar, procure imediatamente uma Unidade Básica de Saúde (UBS), UPA 24h ou ligue para o **SAMU 192**! 🏥'
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

    // 3. Intervenções de Enfermagem (NIC), Prescrição de Cuidados e Verbos no Infinitivo
    if (
      lower.includes('intervenc') || lower.includes('prescri') || lower.includes('prescrever') ||
      lower.includes('infinitivo') || lower.includes('nic') || lower.includes('cuidado') ||
      lower.includes('aprazamento') || lower.includes('meta segura')
    ) {
      return (
        '📋 **Como Estruturar Intervenções de Enfermagem Seguras (Padrão NIC / COFEN nº 736/2024):**\n\n' +
        'Excelente pergunta! Na prática clínica e nas avaliações, a prescrição de enfermagem é um ato privativo do enfermeiro e deve ser clara para que toda a equipe execute o cuidado sem ambiguidades.\n\n' +
        'Toda intervenção de enfermagem de excelência é composta por **4 elementos fundamentais**:\n\n' +
        '1. **Verbo de Ação no Infinitivo:** Inicie sempre com uma ação direta e executável (ex: *Realizar, Administrar, Puncionar, Posicionar, Monitorar, Avaliar, Higienizar*). 🚫 Evite termos vagos como *"cuidar"*, *"observar"* ou *"dar atenção"*.\n' +
        '2. **Ação Clínica Detalhada:** O que deve ser feito, qual via, qual técnica ou qual dispositivo (ex: *mudança de decúbito em 30º*, *administração de ceftriaxona EV*, *curativo com cobertura hidrocoloide*).\n' +
        '3. **Aprazamento e Frequência Rigorosa:** Quando e de quanto em quanto tempo (ex: *a cada 2 horas*, *de 12 em 12 horas*, *uma vez ao dia no banho de leito*, *em jejum*).\n' +
        '4. **Meta Assistencial ou Critério de Segurança:** O objetivo terapêutico ou a condição para realizar (ex: *para alívio da pressão em proeminências ósseas e prevenção de LPP*, *se temperatura axilar ≥ 37,8ºC*).\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '💡 **Exemplos Didáticos Modelos (Dados Fictícios):**\n\n' +
        '• **Exemplo de Cuidado Físico/Posicionamento:**\n' +
        '  > *"Realizar mudança de decúbito a cada 2 horas conforme escala de revezamento lateral, mantendo elevação de calcâneos com coxins, para redistribuição da pressão tecidual e prevenção de lesões por pressão (LPP)."*\n\n' +
        '• **Exemplo de Cuidado Farmacológico:**\n' +
        '  > *"Administrar Dipirona 1g EV diluída em 100 mL de SF 0,9% em 30 minutos a cada 6 horas se o paciente apresentar queixa de dor (escala EVA ≥ 4) ou pico febril (Tax ≥ 37,8ºC) para controle álgico e térmico."*\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '🤔 **Reflexão Socrática para o seu caso:**\n' +
        'Agora olhe para o paciente que você está atendendo: qual é a necessidade assistencial prioritária que você identificou? Qual verbo no infinitivo você usará para iniciar a prescrição desse cuidado?'
      );
    }

    // 4. Cálculo de Medicamentos, Soluções, Gotejamento, Microgotas, BIC e Diluições
    if (
      lower.includes('calcul') || lower.includes('dose') || lower.includes('dosagem') ||
      lower.includes('gotej') || lower.includes('gota') || lower.includes('macro') ||
      lower.includes('micro') || lower.includes('dilui') || lower.includes('bic') ||
      lower.includes('vazao') || lower.includes('heparina') || lower.includes('insulina') ||
      lower.includes('reconstitu') || lower.includes('ceftriaxona')
    ) {
      return (
        '💊 **Metodologia de Cálculo de Doses e Infusões em Enfermagem:**\n\n' +
        'Para garantir a segurança do paciente e a regra dos Certos da Enfermagem, utilizamos fórmulas padronizadas e a regra de três simples.\n\n' +
        '📌 **Fórmulas Fundamentais de Infusão:**\n' +
        '• **Macrogotas por minuto (gotas/min):**\n' +
        '  $$\\text{Gotas/min} = \\frac{\\text{Volume total (mL)}}{\\text{Tempo (horas)} \\times 3}$$\n\n' +
        '• **Microgotas por minuto (microgotas/min):**\n' +
        '  $$\\text{Microgotas/min} = \\frac{\\text{Volume total (mL)}}{\\text{Tempo (horas)}}$$\n' +
        '  *(Lembrete clínico: 1 macrogota equivale exatamente a 3 microgotas!)*\n\n' +
        '• **Bomba de Infusão Contínua (BIC em mL/h):**\n' +
        '  $$\\text{Vazão (mL/h)} = \\frac{\\text{Volume (mL)}}{\\text{Tempo (horas)}}$$\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '💡 **Exemplo Didático de Reconstituição e Diluição (Dados Fictícios):**\n' +
        'Suponha uma prescrição fictícia de **Ampicilina 250 mg EV**. O frasco-ampola disponível no setor contém **1 g (1000 mg)** em pó liofilizado, que é reconstituído em **10 mL** de água destilada.\n\n' +
        'Montando a proporção:\n' +
        '• $1000\\text{ mg} \\longrightarrow 10\\text{ mL}$\n' +
        '• $250\\text{ mg} \\longrightarrow X\\text{ mL}$\n\n' +
        '$$X = \\frac{250 \\times 10}{1000} = \\frac{2500}{1000} = 2,5\\text{ mL}$$\n\n' +
        'Deverão ser aspirados exatamente **2,5 mL** para administrar a dose correta de 250 mg.\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '🤔 **Reflexão Socrática para o seu cálculo:**\n' +
        'Olhando agora para os valores da sua prescrição: qual é a concentração total do frasco que você tem no posto e qual volume de diluente foi utilizado? Consegue montar essa mesma relação cruzada?'
      );
    }

    // 5. Diagnósticos de Enfermagem (NANDA-I 2024-2026) e Raciocínio Diagnóstico
    if (
      lower.includes('nanda') || lower.includes('diagnostico') || lower.includes('etiqueta') ||
      lower.includes('fatores relacionados') || lower.includes('caracteristicas definidoras') ||
      lower.includes('r/c') || lower.includes('e/p')
    ) {
      return (
        '🩺 **Como Estruturar Diagnósticos de Enfermagem (Taxonomia NANDA-I 2024–2026):**\n\n' +
        'O diagnóstico de enfermagem é o julgamento clínico sobre as respostas da pessoa, família ou comunidade aos problemas de saúde reais ou potenciais.\n\n' +
        'A NANDA-I divide os diagnósticos em 3 estruturas principais:\n\n' +
        '1. **Diagnóstico com Foco no Problema (Real):**\n' +
        '   Estrutura: **[Título Diagnóstico]** + **relacionado a (R/C: fatores etiológicos)** + **evidenciado por (E/P: sinais e sintomas)**.\n' +
        '   • *Exemplo Didático:* *"Padrão respiratório ineficaz relacionado a fadiga da musculatura respiratória evidenciado por taquipneia (FR 28 rpm), batimento de asa de nariz e uso de musculatura acessória."*\n\n' +
        '2. **Diagnóstico de Risco (Vulnerabilidade Futura):**\n' +
        '   Estrutura: **[Título do Risco]** + **evidenciado por (fatores de risco)**. *(Atenção: Não tem R/C nem sinais clínicos atuais, pois o problema ainda não se instalou!)*\n' +
        '   • *Exemplo Didático:* *"Risco de lesão por pressão evidenciado por mobilidade física prejudicada, umidade perineal e escore de Braden de 11 pontos."*\n\n' +
        '3. **Diagnóstico de Promoção da Saúde:**\n' +
        '   Estrutura: **[Disposição para...]** + **evidenciado por (desejo expressado pelo paciente)**.\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '🤔 **Reflexão Socrática:**\n' +
        'Para o paciente que você está avaliando agora: o sinal ou sintoma que mais te chamou atenção indica um problema que já está acontecendo (com foco no problema) ou uma ameaça que a enfermagem precisa prevenir (risco)?'
      );
    }

    // 6. Passagem de Plantão SBAR e Comunicação Interprofissional
    if (
      lower.includes('sbar') || lower.includes('plantao') || lower.includes('plantão') ||
      lower.includes('passagem') || lower.includes('transicao')
    ) {
      return (
        '🎙️ **Como Estruturar uma Passagem de Plantão no Método SBAR:**\n\n' +
        'O método **SBAR** é o padrão ouro internacional da Organização Mundial da Saúde (OMS) para comunicação interprofissional padronizada e livre de ruídos.\n\n' +
        'Ele é dividido em 4 etapas sequenciais:\n\n' +
        '• **S (Situation - Situação):** Quem é você, quem é o paciente (nome, idade, leito) e qual o motivo imediato do contato ou da internação.\n' +
        '• **B (Background - Breve Histórico):** Histórico clínico relevante, diagnósticos médicos prévios, comorbidades (ex: HAS, DM2) e cirurgias realizadas.\n' +
        '• **A (Assessment - Avaliação):** O estado clínico atual do paciente: sinais vitais recentes, nível de consciência (Glasgow), padrão respiratório, dispositivos invasivos (acesso venoso, sondas) e exames laboratoriais alterados.\n' +
        '• **R (Recommendation - Recomendação):** O que você sugere ou precisa que a equipe faça a seguir (ex: manter cabeceira elevada a 45º, monitorar débito urinário de hora em hora, colher gasometria de controle).\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '💡 **Dica de Ouro do Preceptor:**\n' +
        'Seja direto, cronológico e destaque as alterações de alerta. Se você estiver treinando na aba **Plantão SBAR**, você pode falar no microfone e eu avalio sua clareza na hora!\n\n' +
        '🤔 **Pergunta reflexiva:** No seu paciente de hoje, qual dado da Avaliação (A) é o mais crítico e não pode ser esquecido de jeito nenhum?'
      );
    }

    // 7. Procedimentos, Punção Venosa, Cateteres (Jelco), Curativos e Técnicas Assépticas
    if (
      lower.includes('puncion') || lower.includes('puncao') || lower.includes('veia') ||
      lower.includes('acesso venoso') || lower.includes('jelco') || lower.includes('scalp') ||
      lower.includes('curativo') || lower.includes('sonda') || lower.includes('svd') ||
      lower.includes('sva') || lower.includes('sng') || lower.includes('sne') ||
      lower.includes('cateterismo') || lower.includes('calibre')
    ) {
      return (
        '💉 **Diretrizes de Boas Práticas em Procedimentos de Enfermagem:**\n\n' +
        'A segurança do procedimento depende do respeito estrito à técnica asséptica e à indicação correta de materiais.\n\n' +
        '📌 **Escolha de Calibre de Cateter Periférico (Jelco):**\n' +
        '• **14G e 16G (Laranja / Cinza):** Grandes volumes, infusões ultrarrápidas, choque hipovolêmico e centro cirúrgico/trauma.\n' +
        '• **18G (Verde):** Hemoderivados (sangue total/concentrado de hemácias), pós-operatório e exames com contraste iodado.\n' +
        '• **20G (Rosa):** Padrão em clínica médica/cirúrgica, antibioticoterapia e hidratação venosa em adultos com veias de bom calibre.\n' +
        '• **22G (Azul):** Veias frágeis, idosos, pacientes oncológicos ou veias de menor calibre.\n' +
        '• **24G (Amarelo):** Neonatologia e pediatria.\n\n' +
        '📌 **Técnica de Punção:** Fricção alcoólica por no mínimo 30 segundos com álcool a 70%, ângulo de inserção de 15º a 30º com o bisel voltado para cima, observar refluxo na câmara de refluxo e fixar com cobertura estéril transparente hipoalergênica.\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '🤔 **Pergunta reflexiva:** Para a terapia medicamentosa prescrita para o seu paciente atual, qual desses calibres equilibra melhor o fluxo necessário com a preservação da rede venosa dele?'
      );
    }

    // 8. Desempenho e Histórico de Videochamada
    if (
      lower.includes('videochamada') || lower.includes('video chamada') || lower.includes('chamada') ||
      lower.includes('paciente virtual') || lower.includes('marcus') || lower.includes('teresinha') ||
      lower.includes('voz') || lower.includes('microfone') || lower.includes('meu atendimento') ||
      lower.includes('como fui') || lower.includes('meu desempenho')
    ) {
      const summary = getRecentVideochamadaSummary();
      if (summary) {
        return (
          '🩺 **Análise do seu Desempenho Clínico na Videochamada:**\n\n' +
          'Acompanhei o seu atendimento recente! Aqui está o registro oficial do seu plantão:\n\n' +
          summary.replace('HISTÓRICO REAL DE ATENDIMENTO DO ALUNO:\n', '') + '\n\n' +
          '💡 **Feedback Formativo do Preceptor:**\n' +
          'Você demonstrou raciocínio rápido sob pressão. Lembre-se de sempre revisar a dose prescrita antes de confirmar a conduta e manter a escuta ativa empática com o paciente. Se quiser refazer a simulação para alcançar 100% de acertos, a aba **Videochamada** está sempre disponível no menu!'
        );
      }

      return (
        '📹 **Simulação por Vídeo e Voz com Pacientes Virtuais:**\n\n' +
        'Na aba **Videochamada** você vivencia o atendimento em tempo real com o **Sr. Marcus** e a **Dona Teresinha**!\n\n' +
        '• O paciente relata o caso em vídeo e você responde falando no microfone ou digitando.\n' +
        '• As questões abordam avaliação de sintomas, cálculos emergenciais e condutas imediatas de enfermagem.\n' +
        '• Você tem um sistema de 3 vidas para testar sua precisão sob pressão clínica!\n\n' +
        'Deseja iniciar um plantão com o Sr. Marcus ou a Dona Teresinha agora?'
      );
    }

    // 9. Guia Socrático Geral do Enfere
    return (
      '👋 **Olá! Sou o Goti, seu Preceptor Clínico Inteligente no Enfere!**\n\n' +
      'Como seu preceptor socrático, eu **não entrego respostas prontas de provas ou exercícios**, mas te ensino todo o caminho do raciocínio clínico para você dominar a prática!\n\n' +
      'Você pode me perguntar:\n' +
      '• **Prescrição & NIC:** Como estruturar cuidados com verbos no infinitivo e metas seguras.\n' +
      '• **Cálculos:** Regras de três, macrogotas, microgotas e taxas de infusão em bomba.\n' +
      '• **Diagnósticos NANDA-I:** Diferença entre foco no problema, risco e fatores associados.\n' +
      '• **Procedimentos:** Calibres de jelco, punção, técnicas estéreis e prevenção de infecção.\n' +
      '• **Plantão SBAR:** Como organizar uma passagem de plantão objetiva e segura.\n\n' +
      'Sobre qual desses temas clínicos você quer conversar agora?'
    );
  }
};

export const clinicalPreceptorService = gotiPreceptorService;
export default gotiPreceptorService;
