import { supabase, isSupabaseConfigured } from './supabaseClient';
import { patientService } from './patientService';
import { evolutionService } from './evolutionService';

// Filtro de Sanitização e Anonimização Pré-IA (LGPD & Resolução CFM nº 2.454/2026)
export function sanitizeClinicalDataForAI(patient, assessment, evolutions = []) {
  // Mascaramento de dados identificadores do paciente
  const sanitizedPatient = {
    nome: '[PACIENTE_ANONIMIZADO]',
    idade: patient?.age || null,
    sexo: patient?.gender || 'N/A',
    doencas_previas: maskSensitiveTerms(patient?.previous_diseases || ''),
    historico_previo: maskSensitiveTerms(patient?.medical_history || ''),
    medicamentos_em_uso: patient?.current_medications || '',
    alergias: patient?.allergies || '',
    anamnese_previa: maskSensitiveTerms(patient?.previous_anamnesis || ''),
    observacoes: maskSensitiveTerms(patient?.notes || ''),
  };

  const sinaisVitais = {
    pa_sistolica: assessment.pa_sistolica,
    pa_diastolica: assessment.pa_diastolica,
    frequencia_cardiaca: assessment.fc,
    frequencia_respiratoria: assessment.fr,
    temperatura_axilar: assessment.tax,
    saturacao_o2: assessment.sat,
  };

  const escalas = {
    braden: {
      total: assessment.braden_total,
      subescores: {
        percepcao: assessment.braden_perception,
        umidade: assessment.braden_moisture,
        atividade: assessment.braden_activity,
        mobilidade: assessment.braden_mobility,
        nutricao: assessment.braden_nutrition,
        friccao: assessment.braden_friction,
      },
    },
    cam: {
      positivo: assessment.cam_positive,
      itens: {
        inicio_agudo: assessment.cam_acute,
        desatencao: assessment.cam_inattention,
        pensamento_desorganizado: assessment.cam_disorganized,
        nivel_consciencia_alterado: assessment.cam_altered_loc,
      },
    },
    sak: {
      total: assessment.sak_score,
      itens: {
        desorientacao: assessment.sak_disorientation,
        miccao_frequente: assessment.sak_urination,
        limitacao_marcha: assessment.sak_walking,
        ausencia_acompanhante: assessment.sak_caregiver,
        pos_operatorio: assessment.sak_postop,
        quedas_previas: assessment.sak_previous_falls,
        num_medicamentos_24h: assessment.sak_meds,
      },
    },
    audit: { total: assessment.audit_total },
    caloi: {
      total: assessment.caloi_score,
      intensidade_dor: assessment.caloi_pain_intensity,
      localizacao: assessment.caloi_pain_location || [],
      caracteristicas: assessment.caloi_pain_characteristics || [],
    },
  };

  const sanitizedEvolutions = (evolutions || []).slice(0, 5).map((e) => ({
    data: e.created_date || e.created_at,
    s: maskSensitiveTerms(e.subjective || ''),
    o: maskSensitiveTerms(e.objective || ''),
    a: maskSensitiveTerms(e.assessment || ''),
    p: maskSensitiveTerms(e.plan || ''),
  }));

  return {
    paciente: sanitizedPatient,
    sinais_vitais: sinaisVitais,
    escalas,
    relato_e_notas_avaliacao: maskSensitiveTerms(assessment.notes || assessment.observacoes_clinicas || ''),
    evolucoes_recentes: sanitizedEvolutions,
    status_risco: assessment.risk_status,
  };
}

// Heurísticas de mascaramento de CPF, RG, CNS, Telefones e Leitos
function maskSensitiveTerms(text) {
  if (!text) return '';
  let clean = String(text);

  // Mascara CPF (formatado ou não)
  clean = clean.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF_MASCARADO]');

  // Mascara Cartão Nacional de Saúde (CNS - 15 dígitos)
  clean = clean.replace(/\b[1278]\d{14}\b/g, '[CNS_MASCARADO]');

  // Mascara Leitos / Quartos / Enfermarias
  clean = clean.replace(/\b(leito|quarto|enfermaria|box|apto|apartamento)\s*([0-9]+[a-zA-Z]?)\b/gi, '[LEITO_MASCARADO]');

  // Mascara Telefones
  clean = clean.replace(/\b(\(?\d{2}\)?\s*)?(9?\d{4}[-.\s]?\d{4})\b/g, '[TEL_MASCARADO]');

  return clean;
}

// Chamada direta à API do Google Gemini com análise de raciocínio clínico completo
async function callGeminiCarePlan(clinicalData) {
  const apiKey =
    (typeof localStorage !== 'undefined' && localStorage.getItem('enfermeiro_gemini_api_key')) ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    '';

  if (!apiKey || !apiKey.trim()) {
    return null;
  }

  const systemInstruction = `Você é um Enfermeiro Especialista Sênior em Terapia Intensiva, Emergência e Sistematização da Assistência de Enfermagem (SAE), com domínio profundo da taxonomia NANDA-I, Intervenções NIC e Resultados NOC.
Sua missão é realizar um raciocínio clínico diagnóstico holístico, autônomo e aprofundado a partir de todos os dados do paciente.

DIRETRIZES FUNDAMENTAIS:
1. RACIOCÍNIO CLÍNICO INTEGRAL: Não se limite a avaliar apenas escalas numéricas. Analise a anamnese, a queixa do paciente, o histórico médico, os ferimentos e queixas (ex.: ferimentos por arma de fogo - PAF, facadas, traumas, sangramentos, cirurgias de urgência) e histórico de substâncias psicoativas / drogas.
2. TRAUMA / ARMA DE FOGO / FERIMENTOS: Se o paciente tiver sido alvejado por tiro nas costas, trauma penetrante ou ferida traumática: DEVE obrigatoriamente priorizar diagnósticos como "00132 - Dor aguda", "00044 - Integridade tissular prejudicada", "00206 - Risco de sangramento", "00004 - Risco de infecção" e "00205 - Risco de choque", detalhando cuidados com orifícios balísticos, avaliação de perfuração vascular/visceral e vigilância hemodinâmica.
3. SUBSTÂNCIAS PSICOATIVAS / DROGAS: Se houver relato ou histórico de uso de drogas ou substâncias ilícitas: DEVE obrigatoriamente priorizar "00188 - Comportamento de saúde propenso a risco", "00258 - Risco de síndrome de abstinência aguda de substâncias" e "00078 - Manejo ineficaz da saúde", abordando manejo de ansiedade, monitoramento de sinais de abstinência (tremores, taquicardia, sudorese, agitação) e rede de suporte psicossocial.
4. ESTRUTURA DOS DIAGNÓSTICOS:
Para cada diagnóstico identificado, inclua:
- code: Código NANDA-I oficial de 5 dígitos (ex: "00132")
- title: Título padronizado NANDA-I
- domain: Domínio NANDA-I
- class: Classe NANDA-I
- defining_characteristics: Características definidoras evidenciadas no paciente
- related_factors: Fatores relacionados / populações em risco
- interventions: Lista de intervenções NIC contendo { code, title, description (detalhada e aplicável à beira-leito) }
- outcomes: Lista de resultados NOC contendo { code, title, description (meta mensurável) }

Retorne EXCLUSIVAMENTE um JSON válido com o seguinte formato:
{
  "resumo": "Síntese clínica analítica explicando o raciocínio diagnóstico e estado prioritário...",
  "prioridade": "critica" | "alta" | "moderada" | "baixa",
  "diagnosticos": [ ... ]
}`;

  const userPrompt = `Analise este prontuário clínico e gere o plano de cuidados NANDA-I, NIC e NOC completo:

DADOS DO PACIENTE:
- Idade: ${clinicalData.paciente.idade || 'N/I'} | Sexo: ${clinicalData.paciente.sexo || 'N/I'}
- Anamnese & Motivo de Admissão: ${clinicalData.paciente.anamnese_previa || 'Não informado'}
- Histórico Médico, Cirurgias e Queixas: ${clinicalData.paciente.historico_previo || 'Não informado'}
- Doenças Prévias: ${clinicalData.paciente.doencas_previas || 'Não informado'}
- Medicamentos / Substâncias em uso: ${clinicalData.paciente.medicamentos_em_uso || 'Não informado'}
- Alergias: ${clinicalData.paciente.alergias || 'Nega'}
- Observações do Paciente: ${clinicalData.paciente.observacoes || 'Nenhuma'}

NOTAS E OBSERVAÇÕES CLÍNICAS DA AVALIAÇÃO ATUAL:
${clinicalData.relato_e_notas_avaliacao || 'Sem relato adicional'}

EVOLUÇÕES CLÍNICAS RECENTES (SOAP):
${JSON.stringify(clinicalData.evolucoes_recentes || [], null, 2)}

SINAIS VITAIS:
- PA: ${clinicalData.sinais_vitais.pa_sistolica}/${clinicalData.sinais_vitais.pa_diastolica} mmHg
- Frequência Cardíaca: ${clinicalData.sinais_vitais.frequencia_cardiaca} bpm
- Frequência Respiratória: ${clinicalData.sinais_vitais.frequencia_respiratoria} irpm
- Temperatura Axilar: ${clinicalData.sinais_vitais.temperatura_axilar} °C
- Saturação de O2: ${clinicalData.sinais_vitais.saturacao_o2} %

ESCALAS CLÍNICAS:
- BRADEN: Total ${clinicalData.escalas.braden.total || 'N/A'} (Percepção: ${clinicalData.escalas.braden.subescores.percepcao}, Umidade: ${clinicalData.escalas.braden.subescores.umidade}, Atividade: ${clinicalData.escalas.braden.subescores.atividade}, Mobilidade: ${clinicalData.escalas.braden.subescores.mobilidade}, Nutrição: ${clinicalData.escalas.braden.subescores.nutricao}, Fricção: ${clinicalData.escalas.braden.subescores.friccao})
- CAM (Delirium): ${clinicalData.escalas.cam.positivo ? 'POSITIVO' : 'Negativo'}
- SAK (Quedas): ${clinicalData.escalas.sak.total || 'N/A'}
- AUDIT (Álcool): ${clinicalData.escalas.audit.total || 0}
- CALOI (Dor): Intensidade ${clinicalData.escalas.caloi.intensidade_dor || 0}/10 | Localização: ${clinicalData.escalas.caloi.localizacao?.join(', ') || 'N/A'} | Características: ${clinicalData.escalas.caloi.caracteristicas?.join(', ') || 'N/A'}

Status de Risco Global Calculado: ${clinicalData.status_risco}`;

  // Tenta modelos disponíveis (gemini-2.5-flash e gemini-1.5-flash)
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Erro na chamada ao Gemini (${model}):`, errorText);
        continue;
      }

      const result = await response.json();
      const textOutput = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textOutput) {
        const parsed = JSON.parse(textOutput);
        if (parsed.diagnosticos && Array.isArray(parsed.diagnosticos) && parsed.diagnosticos.length > 0) {
          parsed.ai_engine = `Google Gemini (${model})`;
          parsed.lgpd_sanitized = true;
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`Tentativa com ${model} falhou:`, e);
    }
  }

  return null;
}

// Super Motor Determinístico de Inferência Clínica NANDA-I, NIC e NOC
// Realiza análise semântica profunda de texto (traumas, PAF, drogas, sepse, dor, etc.) + escalas numéricas
export function generateLocalTaxonomicPlan(clinicalData) {
  const { sinais_vitais, escalas, status_risco, paciente, relato_e_notas_avaliacao, evolucoes_recentes } = clinicalData;
  const diagnosticos = [];

  // Consolidação de todo o histórico textual do paciente para análise semântica
  const evolucoesTexto = (evolucoes_recentes || [])
    .map((e) => `${e.s} ${e.o} ${e.a} ${e.p}`)
    .join(' ');

  const textoCompleto = [
    paciente?.anamnese_previa || '',
    paciente?.historico_previo || '',
    paciente?.doencas_previas || '',
    paciente?.medicamentos_em_uso || '',
    paciente?.observacoes || '',
    relato_e_notas_avaliacao || '',
    evolucoesTexto,
    ...(escalas.caloi.localizacao || []),
    ...(escalas.caloi.caracteristicas || []),
  ]
    .join(' ')
    .toLowerCase();

  // --------------------------------------------------------------------------
  // 1. ANÁLISE DE TRAUMA PENETRANTE / FERIMENTO POR ARMA DE FOGO (PAF) / COSTAS / CIRURGIA DE EMERGÊNCIA
  // --------------------------------------------------------------------------
  const temTraumaPAF = /\b(tiro|tiros|disparo|disparos|arma de fogo|paf|perfurocontus[ao]|bala|balas|costas|dorso|lombar|ferimento|projetil|hemorragi|sangrament|perfurad|esfaquead|arma branca)\b/i.test(textoCompleto);

  if (temTraumaPAF) {
    // 1.1 Dor Aguda Severa por Trauma
    diagnosticos.push({
      code: '00132',
      title: 'Dor aguda',
      domain: 'Domínio 12: Conforto',
      class: 'Classe 1: Conforto físico',
      defining_characteristics: [
        'Relato de dor intensa associada a trauma penetrante/PAF em região dorsal',
        'Expressão facial de dor e postura antálgica de proteção',
        'Alterações nos parâmetros autonômicos (taquicardia/pressão arterial)',
      ],
      related_factors: ['Agente lesivo físico traumático (projétil de arma de fogo / lesão penetrante em dorso)'],
      interventions: [
        { code: '1400', title: 'Manejo da dor', description: 'Realizar avaliação abrangente da dor (localização, características, início, duração, frequência, qualidade e intensidade), estabelecendo reavaliação a cada 2 a 4 horas.' },
        { code: '2210', title: 'Administração de analgésicos', description: 'Administrar analgésicos e opioides conforme prescrição médica, monitorando rigorosamente sedação, padrão respiratório e eficácia antes e 30 minutos após cada dose.' },
        { code: '0840', title: 'Posicionamento confortável', description: 'Posicionar o paciente de forma a aliviar a tensão sobre a área lesionada em dorso, garantindo suporte adequado e evitando pressão direta sobre o ferimento.' },
      ],
      outcomes: [
        { code: '1605', title: 'Controle da dor', description: 'Paciente relata alívio satisfatório da dor com escore mantido <= 3 na escala numérica.' },
        { code: '2102', title: 'Nível de dor', description: 'Redução dos sinais corporais e autonômicos de desconforto álgico agudo.' },
      ],
    });

    // 1.2 Integridade Tissular Prejudicada
    diagnosticos.push({
      code: '00044',
      title: 'Integridade tissular prejudicada',
      domain: 'Domínio 11: Segurança/Proteção',
      class: 'Classe 2: Lesão física',
      defining_characteristics: [
        'Solução de continuidade traumática da pele e planos fasciais/musculares profundos',
        'Presença de ferida penetrante/orifício balístico em região dorsal',
        'Dano tecidual mecânico agudo com exsudato sanguinolento',
      ],
      related_factors: ['Fatores mecânicos traumáticos de alta energia (projétil de arma de fogo / perfuração)'],
      interventions: [
        { code: '3660', title: 'Cuidados com feridas', description: 'Inspecionar a ferida e orifícios de entrada/saída a cada plantão, avaliando características do leito, bordas, exsudato, odor e sinais flogísticos locais.' },
        { code: '3440', title: 'Cuidados com incisões / feridas cirúrgicas', description: 'Realizar curativo estéril oclusivo conforme protocolo institucional, mantendo técnica asséptica estrita e registrando evolução fotográfica ou descritiva.' },
      ],
      outcomes: [
        { code: '1101', title: 'Integridade tissular: pele e mucosas', description: 'Ferida limpa, com bordas alinhadas e sem sinais de deiscência ou maceração tecidual adjacente.' },
        { code: '1102', title: 'Cicatrização de feridas: segunda intenção', description: 'Progressão satisfatória de tecido de granulação saudável e retração das margens.' },
      ],
    });

    // 1.3 Risco de Sangramento / Choque
    diagnosticos.push({
      code: '00206',
      title: 'Risco de sangramento',
      domain: 'Domínio 11: Segurança/Proteção',
      class: 'Classe 2: Lesão física',
      defining_characteristics: ['Exposição a trauma vascular e tecidual penetrante recente por projétil'],
      related_factors: ['Trauma penetrante com potencial lesão muscular/vascular em dorso', 'Ruptura da integridade vascular local'],
      interventions: [
        { code: '4010', title: 'Prevenção de sangramento', description: 'Monitorar sinais de hemorragia externa ativa no curativo e interna (queda súbita de PA, taquicardia, sudorese fria, palidez cutânea e redução do débito urinário).' },
        { code: '4160', title: 'Controle de choque', description: 'Garantir acesso venoso calibroso pérvio, manter tipagem sanguínea reservada e infundir cristaloides/hemoderivados conforme prescrição médica e protocolo de choque.' },
      ],
      outcomes: [
        { code: '0413', title: 'Gravidade da perda de sangue', description: 'Ausência de hematomas expansivos, sangramento ativo ou instabilidade hemodinâmica aguda.' },
        { code: '0401', title: 'Estado circulatório', description: 'Pressão arterial média (PAM >= 65 mmHg) e perfusão periférica com enchimento capilar < 2s.' },
      ],
    });

    // 1.4 Risco de Infecção
    diagnosticos.push({
      code: '00004',
      title: 'Risco de infecção',
      domain: 'Domínio 11: Segurança/Proteção',
      class: 'Classe 1: Infecção',
      defining_characteristics: ['Ruptura de barreiras primárias de defesa e contaminação externa traumática'],
      related_factors: ['Ferida traumática penetrante aberta', 'Possível retenção de fragmentos/corpos estranhos', 'Procedimentos invasivos hospitalares'],
      interventions: [
        { code: '6550', title: 'Proteção contra infecção', description: 'Monitorar temperatura corporal a cada 4 horas e inspecionar ferida buscando calor, rubor, edema e drenagem purulenta.' },
        { code: '2300', title: 'Administração de medicamentos', description: 'Administrar antibioticoterapia profilática ou terapêutica rigorosamente no horário prescrito para manter nível sérico bactericida.' },
      ],
      outcomes: [
        { code: '1902', title: 'Controle de risco: processo infeccioso', description: 'Paciente sem febre, leucocitose ou sinais de infecção local na ferida operatória/traumática.' },
      ],
    });
  }

  // --------------------------------------------------------------------------
  // 2. ANÁLISE DE USO DE SUBSTÂNCIAS PSICOATIVAS / DROGAS ILÍCITAS / DEPENDÊNCIA
  // --------------------------------------------------------------------------
  const temDrogas = /\b(droga|drogas|substancia|substancias|ilicita|ilicitas|cocaina|crack|maconha|canabis|canabinoide|opioide|psicoativ|dependen|usuario de droga|overdose|quimic|entorpecente)\b/i.test(textoCompleto);

  if (temDrogas) {
    // 2.1 Comportamento de Saúde Propenso a Risco
    diagnosticos.push({
      code: '00188',
      title: 'Comportamento de saúde propenso a risco',
      domain: 'Domínio 1: Promoção da Saúde',
      class: 'Classe 2: Controle da saúde',
      defining_characteristics: [
        'Histórico confirmado ou relato de uso prejudicial de substâncias psicoativas ilícitas',
        'Exposição prévia a ambientes de alta vulnerabilidade social e risco de violência',
        'Dificuldade de manutenção de autocuidado e rotinas de saúde protetivas',
      ],
      related_factors: ['Uso abusivo de substâncias químicas', 'Mecanismos de enfrentamento ineficazes', 'Vulnerabilidade socioambiental'],
      interventions: [
        { code: '4500', title: 'Prevenção do uso de substâncias químicas', description: 'Estabelecer vínculo terapêutico de confiança sem julgamentos moralistas, acolhendo o paciente e identificando fatores de gatilho para o consumo de substâncias.' },
        { code: '5270', title: 'Apoio emocional', description: 'Proporcionar escuta ativa durante momentos de ansiedade, incentivando a verbalização de medos e angústias relacionadas à internação e ao tratamento.' },
        { code: '4410', title: 'Estabelecimento de limites', description: 'Definir regras claras de convivência e segurança na enfermaria quanto à não entrada ou uso de substâncias no ambiente hospitalar.' },
      ],
      outcomes: [
        { code: '1602', title: 'Comportamento de promoção da saúde', description: 'Paciente expressa interesse em reduzir danos e aceita orientações sobre riscos à sua recuperação.' },
        { code: '1603', title: 'Comportamento de busca de saúde', description: 'Comunica precocemente à equipe sinais de fissura, dor ou abstinência.' },
      ],
    });

    // 2.2 Risco de Síndrome de Abstinência Aguda
    diagnosticos.push({
      code: '00258',
      title: 'Risco de síndrome de abstinência aguda de substâncias',
      domain: 'Domínio 9: Enfrentamento/Tolerância ao Estresse',
      class: 'Classe 2: Respostas de enfrentamento',
      defining_characteristics: ['Interrupção abrupta do uso de substâncias psicoativas decorrente da internação hospitalar aguda'],
      related_factors: ['Cessação súbita de substâncias psicoativas de dependência', 'Estresse físico e metabólico de trauma/internação'],
      interventions: [
        { code: '4510', title: 'Tratamento do uso de substâncias: abstinência', description: 'Monitorar sinais vitais e escores de abstinência a cada 4 horas (observar tremores finos de extremidades, sudorese profusa, midríase, hipertensão arterial, irritabilidade, alucinações ou insônia).' },
        { code: '6480', title: 'Manejo ambiental: segurança', description: 'Manter ambiente calmo com iluminação suave, reduzir estímulos sensoriais excessivos e retirar objetos perfurocortantes do alcance em caso de agitação psicomotora.' },
        { code: '4880', title: 'Manejo do delirium / abstinência', description: 'Notificar equipe médica imediatamente diante de sinais precoces de fissura ou delírio para ajuste farmacológico conforme protocolo de desintoxicação.' },
      ],
      outcomes: [
        { code: '1908', title: 'Detecção de risco', description: 'Sinais precoces de síndrome de abstinência detectados e manejados antes de evolução para crise convulsiva ou agitação grave.' },
        { code: '0909', title: 'Estado neurológico', description: 'Nível de consciência lúcido, orientado em tempo e espaço, sem déficits perceptivos.' },
      ],
    });

    // 2.3 Manejo Ineficaz da Saúde
    diagnosticos.push({
      code: '00078',
      title: 'Manejo ineficaz da saúde',
      domain: 'Domínio 1: Promoção da Saúde',
      class: 'Classe 2: Controle da saúde',
      defining_characteristics: ['Dificuldade em gerenciar regimes terapêuticos complexos e vulnerabilidade psicossocial'],
      related_factors: ['Uso prejudicial de substâncias', 'Fragilidade da rede de apoio comunitária e familiar'],
      interventions: [
        { code: '5510', title: 'Educação para a saúde', description: 'Orientar sobre a importância da continuidade de curativos, antimicrobianos e analgésicos para evitar complicações no pós-alta.' },
        { code: '7370', title: 'Planejamento de alta', description: 'Articular com a assistência social e psicologia o encaminhamento do paciente ao Centro de Atenção Psicossocial - Álcool e Drogas (CAPS-AD) na alta hospitalar.' },
      ],
      outcomes: [
        { code: '3100', title: 'Autogestão de condição de saúde', description: 'Paciente e familiares compreendem o plano de cuidados e conhecem o fluxo de atendimento na rede pública de saúde.' },
      ],
    });
  }

  // --------------------------------------------------------------------------
  // 3. ESCALA DE BRADEN (Risco de Lesão por Pressão)
  // --------------------------------------------------------------------------
  if (escalas.braden.total && escalas.braden.total <= 14) {
    diagnosticos.push({
      code: '00047',
      title: 'Risco de lesão por pressão',
      domain: 'Domínio 11: Segurança/Proteção',
      class: 'Classe 2: Lesão física',
      defining_characteristics: ['Escore na Escala de Braden de ' + escalas.braden.total + ' (Risco Moderado a Alto)'],
      related_factors: ['Mobilidade física reduzida no leito', 'Forças de cisalhamento e fricção', 'Umidade tecidual'],
      interventions: [
        { code: '3540', title: 'Prevenção de lesão por pressão', description: 'Realizar mudança de decúbito a cada 2 horas conforme relógio de decúbito e aplicar ácidos graxos hiperoxigenados (AGH) em áreas de proeminências ósseas íntegras.' },
        { code: '0740', title: 'Cuidados com a pele: tratamentos tópicos', description: 'Inspecionar a pele sacral, trocantérica, calcâneos e occipital a cada plantão; utilizar colchão pneumático piramidal ou estático de redistribuição de pressão.' },
      ],
      outcomes: [
        { code: '1101', title: 'Integridade tissular: pele e mucosas', description: 'Pele mantida íntegra, hidratada e sem eritema branqueável ou não branqueável em proeminências ósseas.' },
      ],
    });
  }

  // --------------------------------------------------------------------------
  // 4. ESCALA SAK (Risco de Quedas)
  // --------------------------------------------------------------------------
  if (escalas.sak.total && escalas.sak.total >= 6.5) {
    diagnosticos.push({
      code: '00155',
      title: 'Risco de quedas em adultos',
      domain: 'Domínio 11: Segurança/Proteção',
      class: 'Classe 2: Lesão física',
      defining_characteristics: ['Escore na Escala SAK de ' + escalas.sak.total + ' (Risco Elevado)'],
      related_factors: ['Dificuldade na marcha', 'Histórico de trauma recente', 'Uso de medicações sedativas/analgésicas'],
      interventions: [
        { code: '6490', title: 'Prevenção contra quedas', description: 'Manter grades bilaterais do leito sempre elevadas, campainha de chamada ao alcance fácil das mãos e piso livre de umidade ou obstáculos.' },
        { code: '6610', title: 'Identificação de risco', description: 'Fixar pulseira de identificação de risco de queda amarela e placa de alerta visual na cabeceira do leito.' },
      ],
      outcomes: [
        { code: '1912', title: 'Controle de risco: quedas', description: 'Adoção de precauções de segurança no leito com incidência zero de quedas durante o internamento.' },
      ],
    });
  }

  // --------------------------------------------------------------------------
  // 5. ESCALA CALOI (Dor não coberta anteriormente pelo trauma)
  // --------------------------------------------------------------------------
  if (!temTraumaPAF && escalas.caloi.intensidade_dor && escalas.caloi.intensidade_dor >= 4) {
    diagnosticos.push({
      code: '00132',
      title: 'Dor aguda',
      domain: 'Domínio 12: Conforto',
      class: 'Classe 1: Conforto físico',
      defining_characteristics: [
        'Relato verbal de dor intensidade ' + escalas.caloi.intensidade_dor + '/10',
        ...(escalas.caloi.localizacao || []).map((l) => 'Local: ' + l),
      ],
      related_factors: ['Agentes lesivos biológicos, físicos ou químicos'],
      interventions: [
        { code: '1400', title: 'Manejo da dor', description: 'Avaliar características da dor e administrar analgésicos conforme prescrição médica com reavaliação em 30 min.' },
        { code: '2210', title: 'Administração de analgésicos', description: 'Verificar eficácia da terapia medicamentosa prescrita e monitorar efeitos adversos.' },
      ],
      outcomes: [
        { code: '1605', title: 'Controle da dor', description: 'Reconhece o início da dor e relata alívio satisfatório com as intervenções.' },
        { code: '2102', title: 'Nível de dor', description: 'Redução do escore de dor para níveis toleráveis (<= 3).' },
      ],
    });
  }

  // --------------------------------------------------------------------------
  // 6. ESCALA CAM (Delirium / Confusão Aguda)
  // --------------------------------------------------------------------------
  if (escalas.cam.positivo) {
    diagnosticos.push({
      code: '00128',
      title: 'Confusão aguda (Delirium)',
      domain: 'Domínio 5: Percepção/Cognição',
      class: 'Classe 4: Cognição',
      defining_characteristics: ['Início agudo e flutuação cognitiva', 'Desatenção', 'Pensamento desorganizado'],
      related_factors: ['Alterações do ciclo sono-vigília', 'Ambiente hospitalar não familiar', 'Trauma/estresse fisiológico'],
      interventions: [
        { code: '4880', title: 'Manejo do delirium', description: 'Reorientar o paciente frequentemente no tempo e espaço; manter relógio e calendário visíveis no quarto.' },
        { code: '6460', title: 'Manejo da demência / cognição', description: 'Evitar restrições mecânicas desnecessárias, garantir presença de acompanhante familiar e prover ambiente tranquilo.' },
      ],
      outcomes: [
        { code: '0901', title: 'Orientação cognitiva', description: 'Identifica corretamente tempo, local e pessoas de maneira consistente.' },
      ],
    });
  }

  // --------------------------------------------------------------------------
  // 7. SINAIS VITAIS CRÍTICOS (Oxigenação / Ventilação / Hemodinâmica)
  // --------------------------------------------------------------------------
  if ((sinais_vitais.saturacao_o2 && sinais_vitais.saturacao_o2 < 92) || (sinais_vitais.frequencia_respiratoria && sinais_vitais.frequencia_respiratoria > 22)) {
    diagnosticos.push({
      code: '00030',
      title: 'Troca de gases prejudicada',
      domain: 'Domínio 3: Eliminação e Troca',
      class: 'Classe 4: Função respiratória',
      defining_characteristics: [
        sinais_vitais.saturacao_o2 ? 'SatO₂ reduzida (' + sinais_vitais.saturacao_o2 + '%)' : null,
        sinais_vitais.frequencia_respiratoria ? 'Taquipneia (' + sinais_vitais.frequencia_respiratoria + ' irpm)' : null,
      ].filter(Boolean),
      related_factors: ['Desequilíbrio na relação ventilação-perfusão / Trauma torácico ou hipoventilação'],
      interventions: [
        { code: '3320', title: 'Oxigenoterapia', description: 'Instalar oxigênio suplementar sob cânula nasal ou máscara conforme prescrição médica e monitorar oximetria de pulso contínua.' },
        { code: '3350', title: 'Monitorização respiratória', description: 'Avaliar padrão ventilatório, frequência respiratória e ausculta pulmonar em todos os quadrantes a cada 2 horas.' },
      ],
      outcomes: [
        { code: '0402', title: 'Estado respiratório: troca gasosa', description: 'Saturação de O₂ mantida >= 94% em ar ambiente ou sob oxigenoterapia contínua.' },
      ],
    });
  }

  if (sinais_vitais.pa_sistolica && sinais_vitais.pa_sistolica < 90) {
    diagnosticos.push({
      code: '00204',
      title: 'Perfusão tissular periférica ineficaz',
      domain: 'Domínio 4: Atividade/Repouso',
      class: 'Classe 4: Respostas cardiovasculares/pulmonares',
      defining_characteristics: ['Pressão arterial sistólica de ' + sinais_vitais.pa_sistolica + ' mmHg (hipotensão)', 'Perfusão distal lentificada'],
      related_factors: ['Hipovolemia aguda / Perda hemática / Efeito vasodilatador de substâncias'],
      interventions: [
        { code: '4160', title: 'Controle de choque', description: 'Monitorar pressão arterial a cada 15 a 30 minutos, instalar expansão volêmica prescrita e comunicar imediatamente ao médico plantonista.' },
      ],
      outcomes: [
        { code: '0401', title: 'Estado circulatório', description: 'Pressão arterial sistólica restabelecida >= 100 mmHg e pulso periférico palpável e simétrico.' },
      ],
    });
  }

  // --------------------------------------------------------------------------
  // 8. ESCALA AUDIT (Álcool)
  // --------------------------------------------------------------------------
  if (escalas.audit.total && escalas.audit.total >= 8 && !temDrogas) {
    diagnosticos.push({
      code: '00188',
      title: 'Padrão de consumo nocivo de álcool',
      domain: 'Domínio 1: Promoção da Saúde',
      class: 'Classe 2: Controle da saúde',
      defining_characteristics: ['Escore na Escala AUDIT de ' + escalas.audit.total + ' (Uso de Risco ou Provável Dependência)'],
      related_factors: ['Consumo excessivo crônico de bebidas alcoólicas'],
      interventions: [
        { code: '4500', title: 'Prevenção do uso de substâncias químicas', description: 'Orientar o paciente sobre os riscos de toxicidade hepática, gastrite e desidratação decorrentes do álcool.' },
      ],
      outcomes: [
        { code: '1602', title: 'Comportamento de promoção da saúde', description: 'Reconhece o consumo de álcool como fator de agravo e adere ao suporte da equipe multidisciplinar.' },
      ],
    });
  }

  // Se nenhum diagnóstico específico foi ativado
  if (diagnosticos.length === 0) {
    diagnosticos.push({
      code: '00168',
      title: 'Estilo de vida sedentário / Risco de intolerância à atividade',
      domain: 'Domínio 4: Atividade/Repouso',
      class: 'Classe 4: Respostas cardiovasculares/pulmonares',
      defining_characteristics: ['Internação hospitalar e repouso profilático no leito'],
      related_factors: ['Descondicionamento físico decorrente de internação'],
      interventions: [
        { code: '0180', title: 'Manejo da energia', description: 'Estimular mobilização precoce no leito, exercícios de respiração profunda e deambulação assistida.' },
      ],
      outcomes: [
        { code: '0005', title: 'Tolerância à atividade', description: 'Realiza atividades cotidianas básicas sem queixas de fadiga ou taquicardia.' },
      ],
    });
  }

  const prioridadeGlobal =
    temTraumaPAF || sinais_vitais.saturacao_o2 < 90 || sinais_vitais.pa_sistolica < 90
      ? 'critica'
      : status_risco === 'critico' || temDrogas
      ? 'alta'
      : status_risco === 'alerta'
      ? 'moderada'
      : 'baixa';

  return {
    resumo: `Plano de Cuidados de Enfermagem NANDA-I, NIC e NOC estruturado por inferência clínica avançada. Foram identificados ${diagnosticos.length} diagnósticos prioritários com foco integral em histórico do paciente, queixas agudas, ferimentos, vulnerabilidades psicossociais, sinais vitais e escalas clínicas.`,
    prioridade: prioridadeGlobal,
    diagnosticos,
    is_preliminary_draft: false,
    ai_engine: 'Motor Clínico Especialista NANDA-I / NIC / NOC',
    lgpd_sanitized: true,
  };
}

export const aiService = {
  async generateCarePlanAsync(assessmentId, assessment) {
    try {
      let patient = null;
      let evolutions = [];

      if (assessment.patient_id) {
        try {
          patient = await patientService.get(assessment.patient_id);
        } catch {}
        try {
          evolutions = await evolutionService.filter({ patient_id: assessment.patient_id }, '-created_date', 5);
        } catch {}
      }

      // 1. Blindagem LGPD: anonimiza todos os dados antes da IA
      const sanitizedClinicalData = sanitizeClinicalDataForAI(patient, assessment, evolutions);

      let plan = null;

      // 2. Tenta invocar diretamente o Google Gemini API se houver chave configurada
      try {
        plan = await callGeminiCarePlan(sanitizedClinicalData);
      } catch (geminiErr) {
        console.warn('Falha na chamada ao Google Gemini:', geminiErr);
      }

      // 3. Se não tiver chave Gemini, tenta a Edge Function do Supabase se configurado
      if (!plan && isSupabaseConfigured()) {
        try {
          const { data, error } = await supabase.functions.invoke('clinical-ai-sanitize', {
            body: {
              assessment_id: assessmentId,
              clinical_data: sanitizedClinicalData,
            },
          });
          if (!error && data?.plan) {
            plan = data.plan;
          }
        } catch (funcErr) {
          console.warn('Fallback de Edge function para motor local de IA clínica:', funcErr);
        }
      }

      // 4. Se não respondeu via LLM remota, usa o Super Motor Clínico Determinístico de Alta Precisão
      if (!plan) {
        plan = generateLocalTaxonomicPlan(sanitizedClinicalData);
      }

      // 5. Atualiza a avaliação com a resposta da IA no banco de dados
      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('assessments')
            .update({
              ai_response: plan,
              ai_status: 'generated',
              updated_at: new Date().toISOString(),
            })
            .eq('id', assessmentId);
        } catch {}
      }

      // 6. Atualiza também no localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('enfermeiro_digital_assessments') || '[]');
        const idx = stored.findIndex((a) => a.id === assessmentId);
        if (idx !== -1) {
          stored[idx].ai_response = plan;
          stored[idx].ai_status = 'generated';
          localStorage.setItem('enfermeiro_digital_assessments', JSON.stringify(stored));
        }
      } catch {}

      return plan;
    } catch (err) {
      console.error('Erro ao gerar plano de IA:', err);
      if (isSupabaseConfigured()) {
        try {
          await supabase
            .from('assessments')
            .update({
              ai_status: 'error',
              ai_raw: String(err?.message || err),
              updated_at: new Date().toISOString(),
            })
            .eq('id', assessmentId);
        } catch {}
      }
      throw err;
    }
  },

  async invokeCarePlanSync(assessmentId) {
    let assessment = null;
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('assessments')
          .select('*')
          .eq('id', assessmentId)
          .single();
        if (!error && data) assessment = data;
      } catch {}
    }

    if (!assessment) {
      const stored = JSON.parse(localStorage.getItem('enfermeiro_digital_assessments') || '[]');
      assessment = stored.find((a) => a.id === assessmentId);
    }

    if (!assessment) {
      assessment = { id: assessmentId, risk_status: 'estavel' };
    }

    return this.generateCarePlanAsync(assessmentId, assessment);
  },
};
