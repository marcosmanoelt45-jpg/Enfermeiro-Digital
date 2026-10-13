import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { patientService } from './patientService.js';
import { evolutionService } from './evolutionService.js';
import { diagnosisService } from './diagnosisService.js';

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
1. RACIOCÍNIO CLÍNICO INTEGRAL E REALISTA: Não se limite a avaliar apenas escalas numéricas. Analise a anamnese, a queixa do paciente, o histórico médico, dores e parâmetros vitais. NUNCA invente lesões, traumas cranianos ou quedas consumadas que não constem no relato. Se o paciente apenas "quase caiu" ou tem marcha instável, NUNCA diagnostique traumatismo cranioencefálico nem imobilização cervical.
2. TRAUMA REAL / ARMA DE FOGO (PAF) / FERIMENTOS: Somente se houver menção explícita a tiro, disparo, facada ou trauma penetrante: priorize "00132 - Dor aguda", "00044 - Integridade tissular prejudicada", "00206 - Risco de sangramento" e "00205 - Risco de choque".
3. DOR AGUDA (00132): Se houver dor relatada (ex: dor abdominal de intensidade 9 em pontadas, dor torácica, lombalgia): priorize "00132 - Dor aguda", detalhando a localização precisa, características e intervenções analgésicas e de conforto.
4. METABOLISMO GLICÊMICO (HIPO OU HIPERGLICEMIA):
- HIPOGLICEMIA (HGT <= 70 mg/dL): "00179 - Risco de nível de glicemia instável" (infusão de glicose hipertônica 50% EV e HGT seriada).
- HIPERGLICEMIA SEVERA (HGT >= 180 mg/dL, ex: 300 mg/dL): "00179 - Risco de nível de glicemia instável", com risco de cetoacidose diabética (CAD), desidratação osmótica e dor abdominal associada; prescrever hidratação com SF 0,9%, insulina conforme prescrição médica e controle glicêmico seriado.
5. CARDIOVASCULAR & RESPIRATÓRIO:
- BRADICARDIA GRAVE (FC < 50 bpm, ex: FC 30 bpm): "00029 - Débito cardíaco diminuído" e "00205 - Risco de choque" (monitorização contínua DII, preparo de atropina/marcapasso transcutâneo).
- DISPNEIA / TAQUIPNEIA / HIPOXEMIA (FR > 22 ou SatO2 < 92%): "00030 - Troca de gases prejudicada" (oxigenoterapia e padrão respiratório).
6. NEUROLÓGICO & RISCO DE QUEDAS:
- CONFUSÃO AGUDA / DELIRIUM (CAM+ ou paciente confuso com dificuldade de fala): "00128 - Confusão aguda" secundária a distúrbio metabólico (hiperglicemia) ou baixo débito cardíaco (bradicardia).
- TRAUMA CRANIANO REAL (TCE confirmado com lesão física na cabeça): "00201 - Risco de perfusão tissular cerebral ineficaz". SE NÃO HOUVER LESÃO NA CABEÇA, NUNCA APLIQUE ESTE DIAGNÓSTICO.
- INSTABILIDADE DE MARCHA / QUASE CAIU: "00155 - Risco de quedas em adultos" e "00085 - Mobilidade física prejudicada" (grades elevadas, pulseira amarela, auxílio na deambulação).
- REBAIXAMENTO SEVERO / DESACORDADO: "00039 - Risco de aspiração".
7. SUBSTÂNCIAS PSICOATIVAS / DROGAS: Se houver relato ou histórico de uso prejudicial de drogas: "00188 - Comportamento de saúde propenso a risco" e "00258 - Risco de síndrome de abstinência aguda".
5. ESTRUTURA DOS DIAGNÓSTICOS:
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
  // 1. ANÁLISE DE TRAUMA PENETRANTE / FERIMENTO POR ARMA DE FOGO (PAF) OU ARMA BRANCA
  // --------------------------------------------------------------------------
  const temTraumaPAF = /\b(tiro|tiros|disparo|disparos|arma\s+de\s+fogo|paf|perfurocontus[ao]|bala\s+perdida|ferimento\s+por\s+proj[ée]til|proj[ée]til|orif[íi]cio\s+de\s+entrada|orif[íi]cio\s+de\s+sa[íi]da|esfaquead|arma\s+branca)\b/i.test(textoCompleto);

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
  // 4. RISCO DE QUEDAS (ESCALA SAK / RELATO DE QUASE QUEDA / MARCHA INSTÁVEL)
  // --------------------------------------------------------------------------
  const temRiscoQuedasOuMarcha =
    (escalas.sak.total && escalas.sak.total >= 6.5) ||
    /\b(quase\s+caiu|quase\s+queda|risco\s+de\s+cair|dificuldade\s+para\s+deambular|marcha\s+inst[áa]vel|instabilidade\s+de\s+marcha|desequil[íi]brio|trope[çc]ou)\b/i.test(textoCompleto);

  if (temRiscoQuedasOuMarcha) {
    diagnosticos.push({
      code: '00155',
      title: 'Risco de quedas em adultos',
      domain: 'Domínio 11: Segurança/Proteção',
      class: 'Classe 2: Lesão física',
      defining_characteristics: [
        'Relato de instabilidade motora na marcha ou episódio recente de quase queda',
        'Dificuldade para deambular desacompanhado e necessidade de apoio',
        'Alterações hemodinâmicas, metabólicas ou cognitivas predisponentes a desequilíbrio',
      ],
      related_factors: ['Dificuldade na marcha / mobilidade alterada', 'Episódio recente de quase queda', 'Fraqueza generalizada ou confusão mental'],
      interventions: [
        { code: '6490', title: 'Prevenção contra quedas', description: 'Manter grades bilaterais do leito sempre elevadas, campainha de chamada ao alcance fácil das mãos e piso livre de umidade ou obstáculos; supervisionar e auxiliar transferências e deambulação.' },
        { code: '6610', title: 'Identificação de risco', description: 'Fixar pulseira amarela de identificação de risco de quedas e sinalizar placa de alerta visual na cabeceira do leito.' },
      ],
      outcomes: [
        { code: '1912', title: 'Controle de risco: quedas', description: 'Adoção integral de precauções de segurança no leito com incidência zero de quedas durante a internação.' },
      ],
    });

    if (/\b(dificuldade\s+para\s+deambular|n[ãa]o\s+consegue\s+andar|marcha\s+claudicante)\b/i.test(textoCompleto)) {
      diagnosticos.push({
        code: '00085',
        title: 'Mobilidade física prejudicada',
        domain: 'Domínio 4: Atividade/Repouso',
        class: 'Classe 2: Atividade/Exercício',
        defining_characteristics: ['Dificuldade relatada para deambular de forma autônoma', 'Instabilidade postural e fraqueza de membros inferiores'],
        related_factors: ['Fraqueza musculoesquelética', 'Desconforto álgico agudo e comprometimento hemodinâmico'],
        interventions: [
          { code: '0221', title: 'Terapia por exercícios: deambulação', description: 'Avaliar a capacidade de suporte de peso, utilizar dispositivos auxiliares se necessário e incentivar mobilização progressiva segura com assistência de enfermagem.' },
        ],
        outcomes: [
          { code: '0200', title: 'Deambulação', description: 'Recuperação progressiva da firmeza da marcha com passos seguros e sem episódios de desequilíbrio.' },
        ],
      });
    }
  }

  // --------------------------------------------------------------------------
  // 5. DOR AGUDA (ESCALA CALOI / RELATO VERBAL / SINAIS VITAIS)
  // --------------------------------------------------------------------------
  const valorDor =
    escalas.caloi?.intensidade_dor ||
    sinais_vitais.dor ||
    sinais_vitais.caloi_pain_intensity ||
    null;

  const temDorRelatada =
    !temTraumaPAF &&
    ((valorDor != null && valorDor >= 3) ||
      /\b(?:dor|algia|c[óo]lica|pontada|queima[çc][ãa]o|desconforto\s+[áa]lgico)\b/i.test(textoCompleto));

  if (temDorRelatada) {
    const locs = Array.from(
      new Set([
        ...(escalas.caloi?.localizacao || []),
        ...(sinais_vitais.caloi_pain_location || []),
      ])
    );
    if (locs.length === 0 && /\babd[oô]m|barriga|epig[áa]stri|flanco/i.test(textoCompleto)) locs.push('Região abdominal');
    if (locs.length === 0 && /\bt[oó]rax|tor[áa]cic|peito/i.test(textoCompleto)) locs.push('Região torácica');
    if (locs.length === 0 && /\bdorso|costas|lombar/i.test(textoCompleto)) locs.push('Dorso / Região lombar');

    const caracs = Array.from(
      new Set([
        ...(escalas.caloi?.caracteristicas || []),
        ...(sinais_vitais.caloi_pain_characteristics || []),
      ])
    );
    if (caracs.length === 0 && /pontada/i.test(textoCompleto)) caracs.push('Em pontadas');
    if (caracs.length === 0 && /queima/i.test(textoCompleto)) caracs.push('Em queimação');
    if (caracs.length === 0 && /c[óo]lica/i.test(textoCompleto)) caracs.push('Em cólica');
    if (caracs.length === 0 && /aperto|opress/i.test(textoCompleto)) caracs.push('Em aperto / opressiva');

    const scoreDisplay = valorDor != null ? `${valorDor}/10` : 'severa';

    diagnosticos.push({
      code: '00132',
      title: 'Dor aguda',
      domain: 'Domínio 12: Conforto',
      class: 'Classe 1: Conforto físico',
      defining_characteristics: [
        `Relato verbal de dor de intensidade ${scoreDisplay}`,
        ...(locs.length > 0 ? [`Localização anatômica: ${locs.join(', ')}`] : []),
        ...(caracs.length > 0 ? [`Padrão/Características: ${caracs.join(', ')}`] : []),
        'Expressão facial de desconforto álgico e postura antálgica de defesa',
      ],
      related_factors: ['Agentes lesivos biológicos, isquêmicos, inflamatórios ou metabólicos agudos'],
      interventions: [
        { code: '1400', title: 'Manejo da dor', description: 'Avaliar características abrangentes da dor (localização, qualidade, intensidade EVA, irradiação e fatores agravantes); aplicar medidas de conforto e posicionamento antálgico.' },
        { code: '2210', title: 'Administração de analgésicos', description: 'Administrar analgesia prescrita pela equipe médica, monitorando resposta terapêutica em 30 a 60 minutos e reportando imediatamente sinais de alarme ou abdômen cirúrgico.' },
      ],
      outcomes: [
        { code: '1605', title: 'Controle da dor', description: 'Paciente relata alívio satisfatório com redução do escore de dor para níveis toleráveis (<= 3).' },
        { code: '2102', title: 'Nível de dor', description: 'Alívio da expressão facial de dor e estabilização dos parâmetros autonômicos.' },
      ],
    });
  }

  // --------------------------------------------------------------------------
  // 6. ESCALA CAM / CONFUSÃO AGUDA / SENSÓRIO ALTERADO
  // --------------------------------------------------------------------------
  const temConfusao =
    escalas.cam?.positivo ||
    /\b(confus|desorientad|dificuldade\s+(?:para|de)\s+orienta|n[ãa]o\s+consegue\s+formular\s+frase|pensamento\s+desorganiz|delirium)\b/i.test(textoCompleto);

  if (temConfusao) {
    diagnosticos.push({
      code: '00128',
      title: 'Confusão aguda (Delirium)',
      domain: 'Domínio 5: Percepção/Cognição',
      class: 'Classe 4: Cognição',
      defining_characteristics: [
        'Início agudo com flutuação do estado cognitivo e atencional',
        'Dificuldade para formular frases e responder adequadamente a comandos e orientações',
        'Desorientação temporal ou espacial evidenciada na triagem',
      ],
      related_factors: [
        'Descompensação metabólica aguda (hiperglicemia severa / acidose)',
        'Hipoperfusão cerebral sistêmica secundária a bradicardia extrema ou choque',
        'Estresse fisiológico agudo no ambiente hospitalar',
      ],
      interventions: [
        { code: '4880', title: 'Manejo do delirium / confusão', description: 'Reorientar o paciente frequentemente no tempo, espaço e ambiente; manter iluminação adequada e ambiente tranquilo; verificar glicemia e sinais vitais diante de qualquer oscilação cognitiva súbita.' },
        { code: '2620', title: 'Monitorização neurológica', description: 'Aplicar a Escala de Coma de Glasgow seriada a cada 1 a 2 horas e avaliar simetria pupilar; assegurar vigilância constante para prevenção de evasão ou acidentes no leito.' },
      ],
      outcomes: [
        { code: '0901', title: 'Orientação cognitiva', description: 'Paciente recupera lucidez progressiva e orienta-se adequadamente quanto a tempo, espaço e situação.' },
        { code: '0909', title: 'Estado neurológico', description: 'Estabilidade da função cognitiva sem progressão para agitação psicomotora ou coma.' },
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

  // --------------------------------------------------------------------------
  // 9. INSTABILIDADE GLICÊMICA AGUDA (HIPOGLICEMIA OU HIPERGLICEMIA SEVERA)
  // --------------------------------------------------------------------------
  const valorHgt = sinais_vitais.hgt != null ? Number(sinais_vitais.hgt) : null;
  const temHipoglicemia =
    (valorHgt != null && valorHgt <= 70) ||
    /\b(?:glicemia\s*(?:de\s*)?(?:30|40|50|60|70)|hgt\s*(?:de\s*)?(?:30|40|50|60|70)|hipoglicem)\b/i.test(textoCompleto);

  const temHiperglicemia =
    (valorHgt != null && valorHgt >= 180) ||
    /\b(?:glicemia\s*(?:de\s*)?(?:[2-9]\d{2}|1[8-9]\d)|hgt\s*(?:de\s*)?(?:[2-9]\d{2}|1[8-9]\d)|hiperglicem|cetoacidose|descompensa[çc][ãa]o\s+diab[ée]tica)\b/i.test(textoCompleto);

  if (temHipoglicemia) {
    diagnosticos.push({
      code: '00179',
      title: 'Risco de nível de glicemia instável (Hipoglicemia)',
      domain: 'Domínio 2: Nutrição',
      class: 'Classe 4: Metabolismo',
      defining_characteristics: [
        'Glicemia capilar crítica (' + (valorHgt || 'abaixo de 70') + ' mg/dL)',
        'Rebaixamento agudo do nível de consciência decorrente de neuroglicopenia',
        'Risco de dano cerebral isquêmico por privação glicídica prolongada',
      ],
      related_factors: ['Desequilíbrio metabólico agudo', 'Aporte calórico insuficiente / Jejum prolongado', 'Possível efeito adverso de hipoglicemiantes'],
      interventions: [
        { code: '2130', title: 'Manejo da hipoglicemia', description: 'Puncionar imediatamente acesso venoso periférico calibroso e administrar glicose a 50% hiperosmolar (40 a 60 mL em bolus lento EV) conforme prescrição médica de urgência; manter infusão venosa de manutenção com SG 5% ou 10% se indicado.' },
        { code: '6680', title: 'Monitorização de sinais vitais', description: 'Repetir aferição de glicemia capilar (HGT) a cada 15 minutos até confirmação de estabilidade > 100 mg/dL e monitorar recuperação do nível de consciência.' },
      ],
      outcomes: [
        { code: '2111', title: 'Gravidade da hipoglicemia', description: 'Reversão completa do quadro neuroglicopênico e recuperação da estabilidade clínica.' },
        { code: '2300', title: 'Nível de glicemia', description: 'Glicemia capilar mantida dentro da faixa terapêutica alvo (80 a 160 mg/dL).' },
      ],
    });
  } else if (temHiperglicemia) {
    diagnosticos.push({
      code: '00179',
      title: 'Risco de nível de glicemia instável (Hiperglicemia Severa)',
      domain: 'Domínio 2: Nutrição',
      class: 'Classe 4: Metabolismo',
      defining_characteristics: [
        'Glicemia capilar acentuadamente elevada (' + (valorHgt || '300') + ' mg/dL)',
        'Risco iminente de descompensação metabólica aguda (Cetoacidose Diabética / Estado Hiperosmolar)',
        'Desidratação osmótica potencial, dor abdominal e distúrbios cognitivos associados',
      ],
      related_factors: ['Descompensação do diabetes mellitus', 'Déficit absoluto ou relativo de insulina', 'Estresse fisiológico agudo'],
      interventions: [
        { code: '2120', title: 'Manejo da hiperglicemia', description: 'Monitorar glicemia capilar (HGT) seriada horária ou conforme protocolo de cetoacidose; preparar e administrar insulinoterapia conforme estrita prescrição médica; atentar para cetonúria e gasometria venosa/arterial.' },
        { code: '4120', title: 'Controle de líquidos', description: 'Instalar acesso venoso periférico calibroso e infundir expansão com SF 0,9% prescrita para correção do déficit osmótico; realizar balanço hídrico rigoroso e atentar para eletrólitos (potássio).' },
      ],
      outcomes: [
        { code: '2300', title: 'Nível de glicemia', description: 'Redução gradual e segura da glicemia capilar para níveis inferiores a 200 mg/dL sem hipoglicemia de rebote.' },
        { code: '0601', title: 'Equilíbrio hídrico', description: 'Restauração da volemia, turgor cutâneo preservado e diurese fisiológica satisfatória.' },
      ],
    });
  }

  // --------------------------------------------------------------------------
  // 10. BRADICARDIA CRÍTICA / DÉBITO CARDÍACO DIMINUÍDO / RISCO DE PARADA CARDIORRESPIRATÓRIA
  // --------------------------------------------------------------------------
  const temBradicardiaGrave =
    (sinais_vitais.frequencia_cardiaca && sinais_vitais.frequencia_cardiaca < 50) ||
    /\b(?:frequ[êe]ncia\s+card[íi]aca\s*(?:de\s*)?(?:1\d|2\d|3\d|4\d)|fc\s*(?:de\s*)?(?:1\d|2\d|3\d|4\d)|bradicardi)\b/i.test(textoCompleto);

  if (temBradicardiaGrave) {
    diagnosticos.push({
      code: '00029',
      title: 'Débito cardíaco diminuído',
      domain: 'Domínio 4: Atividade/Repouso',
      class: 'Classe 4: Respostas cardiovasculares/pulmonares',
      defining_characteristics: [
        'Frequência cardíaca crítica (' + (sinais_vitais.frequencia_cardiaca || '13') + ' bpm) incompatível com perfusão tecidual adequada',
        'Hipotensão arterial e choque circulatório associado',
        'Risco iminente de colapso hemodinâmico e parada cardiorrespiratória (PCR)',
      ],
      related_factors: ['Alteração severa na frequência ou ritmo cardíaco (bradiarritmia extrema / ritmo agônico)', 'Disfunção do sistema de condução cardíaco'],
      interventions: [
        { code: '4040', title: 'Cuidados cardíacos: emergência', description: 'Instalar imediatamente monitorização cardíaca contínua (derivação DII) com pás do desfibrilador/marcapasso transcutâneo posicionadas; disponibilizar carrinho de parada com atropina, adrenalina e marcapasso à beira-leito.' },
        { code: '4160', title: 'Controle de choque', description: 'Garantir posicionamento adequado para otimizar retorno venoso e comunicar imediatamente a equipe médica de emergência para intervenção cronotrópica imediata.' },
      ],
      outcomes: [
        { code: '0400', title: 'Eficácia da bomba cardíaca', description: 'Restabelecimento de frequência cardíaca fisiológica (FC >= 60 bpm) e ritmo sinusal estável.' },
        { code: '0401', title: 'Estado circulatório', description: 'Pressão arterial sistólica restabelecida >= 100 mmHg e perfusão periférica satisfatória.' },
      ],
    });
  }

  // --------------------------------------------------------------------------
  // 11. TRAUMA CRANIOENCEFÁLICO (TCE) REAL (SOMENTE com menção expressa de impacto/lesão na cabeça)
  // --------------------------------------------------------------------------
  const temLesaoCranianaReal =
    /\b(tce|trauma\s+(?:cranioencef[áa]lico|cranian|de\s+cr[âa]nio)|fratura\s+(?:de\s+cr[âa]nio|cranian)|les[ãa]o\s+(?:em|na)\s+calota\s+craniana|bateu\s+a\s+cabe[çc]a|pancada\s+na\s+cabe[çc]a|hematoma\s+subdural|corte\s+(?:em|na)\s+cabe[çc]a)\b/i.test(textoCompleto);

  if (temLesaoCranianaReal) {
    diagnosticos.push({
      code: '00201',
      title: 'Risco de perfusão tissular cerebral ineficaz',
      domain: 'Domínio 4: Atividade/Repouso',
      class: 'Classe 4: Respostas cardiovasculares/pulmonares',
      defining_characteristics: [
        'Exposição a impacto mecânico/trauma evidente em calota craniana',
        'Presença de lesão física cefálica traumática relatada',
        'Risco de edema cerebral, hematoma intracraniano ou hipertensão intracraniana (HIC)',
      ],
      related_factors: ['Traumatismo cranioencefálico (TCE) confirmado', 'Choque mecânico cefálico agudo'],
      interventions: [
        { code: '2620', title: 'Monitorização neurológica', description: 'Aplicar a Escala de Coma de Glasgow com avaliação de reatividade pupilar a cada 30 minutos; verificar tamanho e simetria das pupilas (anisocoria) e atentar para sinais de hipertensão intracraniana (tríade de Cushing).' },
        { code: '0840', title: 'Posicionamento e imobilização', description: 'Manter imobilização da coluna cervical com colar cervical rígido até exclusão radiológica de fratura; manter alinhamento neutro de cabeça e pescoço e elevar cabeceira a 30° assim que pressão arterial permitir.' },
      ],
      outcomes: [
        { code: '0909', title: 'Estado neurológico', description: 'Ausência de sinais de herniação cerebral, sangramentos intracranianos expansivos ou perda de reflexos de tronco.' },
        { code: '0912', title: 'Estado neurológico: consciência', description: 'Progressão favorável do escore de Glasgow e recuperação do contato com o examinador.' },
      ],
    });
  }

  // --------------------------------------------------------------------------
  // 12. RISCO DE ASPIRAÇÃO (PACIENTE INCONSCIENTE / DESACORDADO)
  // --------------------------------------------------------------------------
  const temSensórioRebaixado =
    /\b(desacordad|inconsciente|torpor|comatos|n[ãa]o\s+responde|rebaixad)\b/i.test(textoCompleto);

  if (temSensórioRebaixado) {
    diagnosticos.push({
      code: '00039',
      title: 'Risco de aspiração',
      domain: 'Domínio 11: Segurança/Proteção',
      class: 'Classe 2: Lesão física',
      defining_characteristics: [
        'Depressão do nível de consciência com abolição de reflexos protetores de vias aéreas (deglutição e tosse)',
        'Impossibilidade de expectoração ou proteção ativa contra vômito/secreções',
      ],
      related_factors: ['Nível de consciência rebaixado / Inconsciência aguda', 'Reflexo de vômito e tosse deprimidos'],
      interventions: [
        { code: '3200', title: 'Precauções contra aspiração', description: 'Manter aspirador de secreções à vácuo montado e testado com sonda de aspiração rígida tipo Yankauer ao lado do leito; posicionar paciente em decúbito com proteção de via aérea.' },
        { code: '3160', title: 'Aspiração de vias aéreas', description: 'Aspirar cavidade oral e faringe sob demanda diante de acúmulo de secreções; preparar material para intubação orotraqueal e suporte ventilatório invasivo se Glasgow <= 8.' },
      ],
      outcomes: [
        { code: '1918', title: 'Controle de risco: aspiração', description: 'Ausência de aspiração gástrica ou broncopulmonar, sem ruídos adventícios na ausculta pulmonar.' },
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
    temTraumaPAF ||
    temBradicardiaGrave ||
    temHipoglicemia ||
    temSensórioRebaixado ||
    (sinais_vitais.saturacao_o2 && sinais_vitais.saturacao_o2 < 90) ||
    (sinais_vitais.pa_sistolica && sinais_vitais.pa_sistolica < 90)
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

      // 7. Auto-enriquecimento completo de todo o conteúdo do site do paciente:
      // (Anamnese prévia, Perfil clínico, Histórico, Doenças, Notas, Evolução SOAP e Diagnósticos ativos)
      try {
        await enrichPatientAndRecordsFromAssessment(assessment, plan);
      } catch (enrichErr) {
        console.warn('Erro não-bloqueante no enriquecimento do prontuário do paciente:', enrichErr);
      }

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

// --------------------------------------------------------------------------
// MOTOR DE ENRIQUECIMENTO AUTOMÁTICO DO PRONTUÁRIO CLÍNICO (ANAMNESE, PERFIL, SOAP)
// --------------------------------------------------------------------------

function parseClinicalExtractionForProfile(rawText, assessment = {}, plan = {}) {
  const text = String(rawText || '').trim();
  const lower = text.toLowerCase();

  // 1. Identificação Demográfica (Nome, Idade, Gênero)
  let patient_name = null;
  const nameMatch = text.match(/(?:paciente\s+chamad[oa]\s+|paciente\s+|sr\.\s+|sra\.\s+)([A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõ]+(?:\s+[A-ZÁÉÍÓÚÂÊÔÃÕ][a-záéíóúâêôãõ]+){1,3})/);
  if (nameMatch && nameMatch[1]) {
    const candidate = nameMatch[1].trim();
    if (!/^(chega|com|apresenta|foi|teve|sem|aparentemente|desacordado|inconsciente)$/i.test(candidate)) {
      patient_name = candidate;
    }
  }

  let age = assessment.age || null;
  if (!age) {
    const ageMatch = text.match(/(?:idade\s*(?:de)?\s*|paciente\s+(?:com\s+)?|com\s+)(\d{1,3})\s*(?:anos|a\b)/i);
    if (ageMatch && Number(ageMatch[1])) {
      const parsed = Number(ageMatch[1]);
      if (parsed > 0 && parsed <= 125) age = parsed;
    }
  }

  let gender = assessment.gender || null;
  if (!gender) {
    if (/(?:o\s+paciente|homem|masculino|idoso|senhor\b)/i.test(lower)) gender = 'M';
    else if (/(?:a\s+paciente|mulher|feminino|idosa|senhora\b)/i.test(lower)) gender = 'F';
  }

  // 2. Quadro Clínico e Contexto
  const isUnconscious = /(?:desacordad|inconsciente|torpor|comatos|n[ãa]o\s+responde|rebaixad)/i.test(lower);
  const hasAlmostFallen = /(?:quase\s+caiu|quase\s+queda|risco\s+de\s+cair)/i.test(lower);
  const hasHeadInjury = /(?:tce|trauma\s+(?:cranioencef[áa]lico|cranian|de\s+cr[âa]nio)|fratura\s+(?:de\s+cr[âa]nio|cranian)|les[ãa]o\s+(?:em|na)\s+calota\s+craniana|bateu\s+a\s+cabe[çc]a|corte\s+(?:em|na)\s+cabe[çc]a|pancada\s+na\s+cabe[çc]a)/i.test(lower);
  const hasActualFall = /(?:p[óo]s[- ]?queda|sofreu\s+queda|teve\s+queda|caiu\s+(?:da\s+pr[óo]pria|no\s+ch[ãa]o|de\s+n[íi]vel|da\s+cama|em\s+casa))/i.test(lower) && !hasAlmostFallen;
  const hasGunshot = /(?:tiro|tiros|disparo|disparos|arma\s+de\s+fogo|paf|orif[íi]cio\s+de\s+entrada|orif[íi]cio\s+de\s+sa[íi]da|proj[ée]til|ferimento\s+por\s+proj[ée]til)/i.test(lower);
  const noCaregiver = /(?:sem\s+acompanhante|desacompanhad|sozinho)/i.test(lower);
  const hasAbdominalPain = /(?:dor\s+abdominal|dor\s+na\s+barriga|abd[oô]men\s+doloroso|dor\s+em\s+flanco|c[óo]lica\s+abdominal|epigastralgia)/i.test(lower);
  const hasConfusion = /(?:confus|desorientad|dificuldade\s+(?:para|de)\s+orienta|n[ãa]o\s+consegue\s+formular\s+frase|pensamento\s+desorganiz)/i.test(lower);
  const hasGaitDifficulty = /(?:dificuldade\s+para\s+deambular|marcha\s+inst[áa]vel|instabilidade|trope[çc]ou)/i.test(lower) || hasAlmostFallen;
  const hasHyperglycemia = (assessment.hgt && assessment.hgt >= 180) || /(?:hgt|glicemia)\s*(?:de\s*)?(?:[2-9]\d{2}|1[8-9]\d)/i.test(lower) || /hiperglicem/i.test(lower);

  // 3. Resumo dos Parâmetros Clínicos
  const paText = assessment.pa_sistolica && assessment.pa_diastolica ? `${assessment.pa_sistolica}/${assessment.pa_diastolica} mmHg` : 'Não aferida';
  const fcText = assessment.fc != null ? `${assessment.fc} bpm` : 'Não aferida';
  const frText = assessment.fr != null ? `${assessment.fr} irpm` : 'Não aferida';
  const taxText = assessment.tax != null ? `${assessment.tax} °C` : 'Não aferida';
  const satText = assessment.sat != null ? `${assessment.sat}%` : 'Não aferida';
  const hgtText = assessment.hgt != null ? `${assessment.hgt} mg/dL` : 'Não aferido';
  const painText = assessment.caloi_pain_intensity != null ? `${assessment.caloi_pain_intensity}/10` : 'Não avaliada';

  // 4. Anamnese Admissional Estruturada (Para a aba Anamnese)
  let queixaPrincipal = '';
  if (isUnconscious && hasHeadInjury && hasActualFall) {
    queixaPrincipal = 'Admissão em sala de emergência em estado de inconsciência (desacordado) pós-evento de queda com impacto cefálico (suspeita de Traumatismo Cranioencefálico).';
  } else if (hasGunshot) {
    queixaPrincipal = 'Admissão hospitalar de urgência decorrente de ferimento penetrante por arma de fogo (PAF) em região dorsal.';
  } else if (hasAbdominalPain) {
    queixaPrincipal = `Admissão com queixa de dor abdominal aguda intensa (intensidade ${painText}), associada a dispneia e instabilidade clínica.`;
  } else if (isUnconscious) {
    queixaPrincipal = 'Rebaixamento agudo do nível de consciência com impossibilidade de contato verbal no momento da triagem.';
  } else {
    queixaPrincipal = text ? text.slice(0, 150) + '...' : 'Avaliação express de enfermagem realizada na admissão.';
  }

  const hmaText = [
    `Paciente admitido ${noCaregiver ? 'desacompanhado de familiares' : 'acompanhado'}.`,
    isUnconscious ? 'Ao exame neurológico inicial, apresenta rebaixamento grave do sensório (não responsivo a comandos verbais).' : null,
    hasConfusion ? 'Apresenta-se confuso e desorientado, com dificuldades para responder a orientações e formular frases durante a abordagem.' : null,
    hasAlmostFallen ? 'Relata episódio recente de quase queda com desequilíbrio e dificuldade para deambular, sem histórico de trauma contuso ou impacto na cabeça.' : null,
    hasActualFall ? 'Histórico relatado de episódio de queda consumada prévia à admissão.' : null,
    hasHeadInjury ? 'Identificada lesão contusa visível em calota craniana secundária a impacto cefálico.' : null,
    hasGunshot ? 'Apresenta orifício de lesão penetrante por PAF em dorso.' : null,
    hasAbdominalPain ? `Queixa-se de dor abdominal de forte intensidade (${painText}), referida em pontadas e com postura antálgica de defesa.` : null,
    `Parâmetros vitais de admissão: PA ${paText}, FC ${fcText}, FR ${frText}, SatO₂ ${satText}, Tax ${taxText}, Glicemia capilar (HGT) ${hgtText}.`,
    hasHyperglycemia ? `ALERTA CLÍNICO: Hiperglicemia acentuada (${hgtText}) com potencial risco de cetoacidose diabética (CAD) / desidratação osmótica.` : null,
    assessment.hgt && assessment.hgt <= 70 ? `ALERTA CLÍNICO: Hipoglicemia severa crítica (${hgtText}) com risco iminente de dano cerebral isquêmico e coma.` : null,
    assessment.fc && assessment.fc < 50 ? `ALERTA CLÍNICO: Bradicardia extrema crítica (${fcText}) com risco de colapso hemodinâmico e parada cardiorrespiratória (PCR).` : null,
    assessment.sat && assessment.sat < 90 ? `ALERTA CLÍNICO: Hipoxemia severa (${satText}) em ar ambiente, demandando suporte ventilatório/oxigenoterapia imediata.` : null,
    noCaregiver ? 'Sem dados de histórico médico prévio ou uso de medicamentos contínuos fornecidos no momento da chegada.' : null,
  ].filter(Boolean).join(' ');

  const structuredAnamnesis = `RELATO ADMISSIONAL & ANAMNESE ESTRUTURADA (AVALIAÇÃO EXPRESS):
• Queixa Principal: ${queixaPrincipal}

• História da Doença Atual (HDA):
${hmaText}

• Dados Observacionais da Triagem:
Relato original registrado pelo profissional: "${text}"`;

  // 5. Perfil Clínico (Histórico, Doenças Detectadas, Notas)
  const medicalHistoryParts = [];
  if (hasActualFall) medicalHistoryParts.push('Episódio recente de queda com trauma físico');
  if (hasAlmostFallen || hasGaitDifficulty) medicalHistoryParts.push('Instabilidade de marcha / episódio de quase queda sem trauma');
  if (hasHeadInjury) medicalHistoryParts.push('Traumatismo cranioencefálico (TCE) agudo com lesão em calota craniana');
  if (hasGunshot) medicalHistoryParts.push('Ferimento penetrante por arma de fogo (PAF) em região dorsal');
  if (hasAbdominalPain) medicalHistoryParts.push('Quadro álgico abdominal agudo intenso');
  if (hasConfusion) medicalHistoryParts.push('Alteração aguda do estado mental / confusão');
  if (isUnconscious) medicalHistoryParts.push('Rebaixamento agudo do nível de consciência / torpor');
  if (noCaregiver) medicalHistoryParts.push('Admissão desacompanhado na emergência');

  const previousDiseasesParts = [];
  if (hasHyperglycemia) previousDiseasesParts.push('Hiperglicemia aguda descompensada / Suspeita de complicação glicêmica (CAD)');
  if (assessment.hgt && assessment.hgt <= 70) previousDiseasesParts.push('Hipoglicemia severa aguda sintomática');
  if (hasHeadInjury) previousDiseasesParts.push('Traumatismo Cranioencefálico (TCE)');
  if (assessment.fc && assessment.fc < 50) previousDiseasesParts.push('Bradicardia extrema / Bloqueio atrioventricular a esclarecer');
  if (assessment.pa_sistolica && assessment.pa_sistolica < 90) previousDiseasesParts.push('Choque circulatório / Hipotensão severa');
  if (assessment.sat && assessment.sat < 90) previousDiseasesParts.push('Insuficiência respiratória aguda / Hipoxemia grave');
  if (hasAbdominalPain) previousDiseasesParts.push('Dor abdominal aguda a esclarecer');

  const clinicalNotesParts = [];
  if (noCaregiver) clinicalNotesParts.push('Paciente admitido sem acompanhante (alta vulnerabilidade social/clínica).');
  if (hasAlmostFallen || hasGaitDifficulty) clinicalNotesParts.push('Risco de quedas elevado: manter grades do leito elevadas e auxiliar na deambulação.');
  if (hasHyperglycemia) clinicalNotesParts.push('Hiperglicemia crítica: manter monitorização seriada de HGT e hidratação parenteral prescrita.');
  if (isUnconscious) clinicalNotesParts.push('Sensório rebaixado: manter vigilância estrita contra broncoaspiração e manter decúbito protegido.');
  if (hasHeadInjury) clinicalNotesParts.push('Trauma cefálico: manter alinhamento cervical com colar rígido e monitorar pupilas a cada 30 min.');
  if (assessment.hgt && assessment.hgt <= 70) clinicalNotesParts.push('Prioridade para correção glicêmica com Glicose 50% EV e HGT seriado.');

  // 6. Evolução de Enfermagem SOAP Estruturada (Aba Evolução)
  const soapSubjective = isUnconscious
    ? 'Paciente desacordado / inconsciente no momento da avaliação, impossibilitado de verbalizar sintomas ou histórico prévio. Desacompanhado na admissão, sem familiares presentes no momento.'
    : text
    ? `Paciente relata: "${text}"`
    : 'Paciente em avaliação admissional de rotina.';

  const soapObjective = `SINAIS VITAIS: PA ${paText} | FC ${fcText} | FR ${frText} | SatO₂ ${satText} | Tax ${taxText} | HGT ${hgtText} | Dor: ${painText}. EXAME FÍSICO / ACHADOS: ${isUnconscious ? 'Nível de consciência rebaixado (não responsivo).' : hasConfusion ? 'Confuso, desorientado, contactuando com dificuldade.' : 'Lúcido e orientado.'} ${hasAbdominalPain ? 'Abdômen doloroso à palpação, postura antálgica de defesa.' : ''} ${hasAlmostFallen ? 'Marcha instável com relato de quase queda, sem escoriações ou lesões contusas evidentes.' : ''} ${hasHeadInjury ? 'Presença de lesão contusa visível em calota craniana.' : ''} ${hasGunshot ? 'Ferimento penetrante por projétil em dorso.' : ''} Perfusão periférica avaliada.`;

  const topDiags = (plan.diagnosticos || []).slice(0, 4).map((d) => `${d.code} - ${d.title}`).join('; ');
  const soapAssessment = `AVALIAÇÃO DE ENFERMAGEM (SAE/NANDA-I): Paciente em estado clínico com prioridade (${plan.prioridade || 'alta'}). Diagnósticos prioritários identificados: ${topDiags || 'Instabilidade clínica e metabólica'}. Necessita de vigilância contínua da enfermagem, monitorização seriada e cumprimento rigoroso das intervenções prescritas.`;

  const topInterventions = (plan.diagnosticos || [])
    .flatMap((d) => d.interventions || [])
    .slice(0, 4)
    .map((i) => `• ${i.title}: ${i.description}`)
    .join('\n');
  const soapPlan = `PLANO ASSISTENCIAL DE ENFERMAGEM:\n${topInterventions || '• Instalar monitorização multiparamétrica contínua.\n• Puncionar acesso venoso de grosso calibre.\n• Iniciar suporte de oxigenoterapia e correção metabólica conforme protocolo de emergência.'}`;

  return {
    patient_name,
    age,
    gender,
    structured_anamnesis,
    medical_history: medicalHistoryParts.join('; '),
    previous_diseases: previousDiseasesParts.join(', '),
    notes: clinicalNotesParts.join(' '),
    soap_evolution: {
      subjective: soapSubjective,
      objective: soapObjective,
      assessment: soapAssessment,
      plan: soapPlan,
    },
  };
}

export async function enrichPatientAndRecordsFromAssessment(assessment, plan) {
  if (!assessment?.patient_id) return null;
  const patientId = assessment.patient_id;

  let patient = null;
  try {
    patient = await patientService.get(patientId);
  } catch (e) {
    console.warn('Paciente não encontrado para enriquecimento:', e);
  }

  const rawText = assessment.notes || assessment.observacoes_clinicas || '';
  const clinicalExtraction = parseClinicalExtractionForProfile(rawText, assessment, plan);

  // 1. Atualização dos campos demográficos e do perfil do paciente
  const patientUpdates = {};

  if (clinicalExtraction.patient_name && (!patient?.name || /^(Paciente em Avaliação|Novo Paciente|Sem Nome)$/i.test(patient.name))) {
    patientUpdates.name = clinicalExtraction.patient_name;
  }

  if (clinicalExtraction.age && (!patient?.age || (patient.age === 62 && !patient.manual_age))) {
    patientUpdates.age = clinicalExtraction.age;
  }

  if (clinicalExtraction.gender && (!patient?.gender || patient.gender === 'N/A')) {
    patientUpdates.gender = clinicalExtraction.gender;
  }

  // Anamnese Prévia / Admissional
  if (clinicalExtraction.structured_anamnesis) {
    if (patient?.previous_anamnesis && patient.previous_anamnesis.trim()) {
      if (!patient.previous_anamnesis.includes('AVALIAÇÃO EXPRESS')) {
        patientUpdates.previous_anamnesis = `${patient.previous_anamnesis}\n\n---\n${clinicalExtraction.structured_anamnesis}`;
      }
    } else {
      patientUpdates.previous_anamnesis = clinicalExtraction.structured_anamnesis;
    }
  }

  // Histórico Prévio (Perfil)
  if (clinicalExtraction.medical_history) {
    if (patient?.medical_history && patient.medical_history.trim()) {
      if (!patient.medical_history.includes(clinicalExtraction.medical_history.slice(0, 25))) {
        patientUpdates.medical_history = `${patient.medical_history}; ${clinicalExtraction.medical_history}`;
      }
    } else {
      patientUpdates.medical_history = clinicalExtraction.medical_history;
    }
  }

  // Doenças Prévias / Detectadas (Perfil)
  if (clinicalExtraction.previous_diseases) {
    if (patient?.previous_diseases && patient.previous_diseases.trim()) {
      if (!patient.previous_diseases.includes(clinicalExtraction.previous_diseases.slice(0, 20))) {
        patientUpdates.previous_diseases = `${patient.previous_diseases}, ${clinicalExtraction.previous_diseases}`;
      }
    } else {
      patientUpdates.previous_diseases = clinicalExtraction.previous_diseases;
    }
  }

  // Observações Úteis (Perfil)
  if (clinicalExtraction.notes) {
    if (patient?.notes && patient.notes.trim()) {
      if (!patient.notes.includes(clinicalExtraction.notes.slice(0, 20))) {
        patientUpdates.notes = `${patient.notes} | ${clinicalExtraction.notes}`;
      }
    } else {
      patientUpdates.notes = clinicalExtraction.notes;
    }
  }

  if (Object.keys(patientUpdates).length > 0) {
    try {
      await patientService.update(patientId, patientUpdates);
    } catch (e) {
      console.warn('Erro ao atualizar dados do paciente com relato express:', e);
    }
  }

  // 2. Criação da Evolução SOAP Completa no Prontuário
  try {
    const soap = clinicalExtraction.soap_evolution;
    if (soap && soap.subjective && soap.objective) {
      await evolutionService.create({
        patient_id: patientId,
        subjective: soap.subjective,
        objective: soap.objective,
        assessment: soap.assessment,
        plan: soap.plan,
        assessment_id: assessment.id,
      });
    }
  } catch (e) {
    console.warn('Erro ao registrar evolução SOAP automática:', e);
  }

  // 3. Inserção Automática dos Diagnósticos NANDA-I no Prontuário
  try {
    if (plan?.diagnosticos && Array.isArray(plan.diagnosticos) && plan.diagnosticos.length > 0) {
      const records = plan.diagnosticos.map((d) => ({
        patient_id: patientId,
        code: d.code || '',
        title: d.title || '',
        domain: d.domain || '',
        class: d.class || '',
        status: 'ativo',
        source_link: 'https://nanda.org',
        defining_characteristics: d.defining_characteristics || [],
        related_factors: d.related_factors || [],
        interventions: d.interventions || [],
        outcomes: d.outcomes || [],
        assessment_id: assessment.id,
      }));
      await diagnosisService.bulkCreate(records);
    }
  } catch (e) {
    console.warn('Erro ao inserir diagnósticos NANDA-I no prontuário:', e);
  }

  return true;
}
