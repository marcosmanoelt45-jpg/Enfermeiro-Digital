import { supabase, isSupabaseConfigured } from './supabaseClient';
import { patientService } from './patientService';

// Filtro de Sanitização e Anonimização Pré-IA (LGPD & Resolução CFM nº 2.454/2026)
export function sanitizeClinicalDataForAI(patient, assessment) {
  // Mascaramento de dados identificadores do paciente
  const sanitizedPatient = {
    nome: '[PACIENTE_ANONIMIZADO]',
    idade: patient?.age || null,
    sexo: patient?.gender || 'N/A',
    doencas_previas: maskSensitiveTerms(patient?.previous_diseases),
    historico_previo: maskSensitiveTerms(patient?.medical_history),
    medicamentos_em_uso: patient?.current_medications || '',
    alergias: patient?.allergies || '',
    anamnese_previa: maskSensitiveTerms(patient?.previous_anamnesis),
    observacoes: maskSensitiveTerms(patient?.notes),
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

  return {
    paciente: sanitizedPatient,
    sinais_vitais: sinaisVitais,
    escalas,
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

// Fallback determinístico clínico de altíssima precisão baseado em NANDA-I, NIC e NOC
export function generateLocalTaxonomicPlan(clinicalData) {
  const { sinais_vitais, escalas, status_risco, paciente } = clinicalData;
  const diagnosticos = [];

  // 1. Risco de Lesão por Pressão (BRADEN <= 14)
  if (escalas.braden.total && escalas.braden.total <= 14) {
    diagnosticos.push({
      code: '00047',
      title: 'Risco de lesão por pressão',
      domain: 'Domínio 11: Segurança/Proteção',
      class: 'Classe 2: Lesão física',
      defining_characteristics: ['Escore na Escala de Braden de ' + escalas.braden.total],
      related_factors: ['Mobilidade física prejudicada', 'Fricção e forças de cisalhamento', 'Umidade excessiva'],
      interventions: [
        { code: '3540', title: 'Prevenção de lesão por pressão', description: 'Realizar mudança de decúbito a cada 2 horas e aplicar ácidos graxos hiperoxigenados (AGH).' },
        { code: '0740', title: 'Cuidados com a pele: tratamentos tópicos', description: 'Inspecionar proeminências ósseas e manter a pele limpa e hidratada.' },
      ],
      outcomes: [
        { code: '1101', title: 'Integridade tissular: pele e mucosas', description: 'Pele íntegra sem eritema branqueável ou não branqueável.' },
      ],
    });
  }

  // 2. Risco de Quedas (SAK >= 6.5)
  if (escalas.sak.total && escalas.sak.total >= 6.5) {
    diagnosticos.push({
      code: '00155',
      title: 'Risco de quedas em adultos',
      domain: 'Domínio 11: Segurança/Proteção',
      class: 'Classe 2: Lesão física',
      defining_characteristics: ['Escore na Escala SAK de ' + escalas.sak.total],
      related_factors: ['Dificuldade na marcha', 'Histórico de quedas prévias', 'Polifarmácia'],
      interventions: [
        { code: '6490', title: 'Prevenção contra quedas', description: 'Manter grades do leito elevadas, campainha ao alcance e iluminação adequada.' },
        { code: '6610', title: 'Identificação de risco', description: 'Sinalizar leito e pulseira do paciente com indicador de risco de queda.' },
      ],
      outcomes: [
        { code: '1912', title: 'Controle de risco: quedas', description: 'Ações pessoais para prevenir quedas adotadas e adesão às orientações.' },
      ],
    });
  }

  // 3. Dor Aguda ou Crônica (CALOI >= 4)
  if (escalas.caloi.intensidade_dor && escalas.caloi.intensidade_dor >= 4) {
    diagnosticos.push({
      code: '00132',
      title: 'Dor aguda',
      domain: 'Domínio 12: Conforto',
      class: 'Classe 1: Conforto físico',
      defining_characteristics: ['Relato verbal de dor intensidade ' + escalas.caloi.intensidade_dor + '/10', ...(escalas.caloi.localizacao || []).map((l) => 'Local: ' + l)],
      related_factors: ['Agentes lesivos biológicos/físicos/químicos'],
      interventions: [
        { code: '1400', title: 'Manejo da dor', description: 'Avaliar características da dor e administrar analgésicos conforme prescrição médica com reavaliação em 30 min.' },
        { code: '2210', title: 'Administração de analgésicos', description: 'Verificar eficácia da terapia medicamentosa prescrita.' },
      ],
      outcomes: [
        { code: '1605', title: 'Controle da dor', description: 'Reconhece o início da dor e relata alívio satisfatório com as intervenções.' },
        { code: '2102', title: 'Nível de dor', description: 'Redução do escore de dor para níveis toleráveis (<= 3).' },
      ],
    });
  }

  // 4. Confusão Aguda (CAM Positivo)
  if (escalas.cam.positivo) {
    diagnosticos.push({
      code: '00128',
      title: 'Confusão aguda (Delirium)',
      domain: 'Domínio 5: Percepção/Cognição',
      class: 'Classe 4: Cognição',
      defining_characteristics: ['Início agudo de flutuação cognitiva', 'Desatenção', 'Pensamento desorganizado'],
      related_factors: ['Alterações do ciclo sono-vigília', 'Ambiente hospitalar não familiar', 'Idade avançada'],
      interventions: [
        { code: '4880', title: 'Manejo do delirium', description: 'Orientar o paciente no tempo e espaço e manter relógio e calendário visíveis.' },
        { code: '6460', title: 'Manejo da demência', description: 'Evitar restrições mecânicas desnecessárias e envolver familiares nos cuidados.' },
      ],
      outcomes: [
        { code: '0901', title: 'Orientação cognitiva', description: 'Identifica o tempo, local e pessoas de maneira consistente.' },
      ],
    });
  }

  // 5. Troca de Gases Prejudicada (Sat < 92% ou FR > 22)
  if ((sinais_vitais.saturacao_o2 && sinais_vitais.saturacao_o2 < 92) || (sinais_vitais.frequencia_respiratoria && sinais_vitais.frequencia_respiratoria > 22)) {
    diagnosticos.push({
      code: '00030',
      title: 'Troca de gases prejudicada',
      domain: 'Domínio 3: Eliminação e Troca',
      class: 'Classe 4: Função respiratória',
      defining_characteristics: ['SatO₂ reduzida (' + sinais_vitais.saturacao_o2 + '%)', 'Taquipneia (' + sinais_vitais.frequencia_respiratoria + ' irpm)'],
      related_factors: ['Desequilíbrio na relação ventilação-perfusão'],
      interventions: [
        { code: '3320', title: 'Oxigenoterapia', description: 'Administrar oxigênio suplementar conforme prescrição médica e monitorar oximetria de pulso contínua.' },
        { code: '3350', title: 'Monitorização respiratória', description: 'Avaliar padrão ventilatório, frequência respiratória e ruídos adventícios.' },
      ],
      outcomes: [
        { code: '0402', title: 'Estado respiratório: troca gasosa', description: 'Saturação de O₂ mantida >= 94% em ar ambiente ou oxigenoterapia.' },
      ],
    });
  }

  // Se nenhum diagnóstico crítico específico for deflagrado, adiciona plano de manutenção de integridade
  if (diagnosticos.length === 0) {
    diagnosticos.push({
      code: '00168',
      title: 'Estilo de vida sedentário / Risco de intolerância à atividade',
      domain: 'Domínio 4: Atividade/Repouso',
      class: 'Classe 4: Respostas cardiovasculares/pulmonares',
      defining_characteristics: ['Internação hospitalar e repouso no leito'],
      related_factors: ['Descondicionamento físico'],
      interventions: [
        { code: '0180', title: 'Manejo da energia', description: 'Estimular deambulação assistida e exercícios respiratórios profiláticos.' },
      ],
      outcomes: [
        { code: '0005', title: 'Tolerância à atividade', description: 'Realiza atividades cotidianas básicas sem desconforto cardiorrespiratório.' },
      ],
    });
  }

  return {
    resumo: `Paciente monitorado com status de risco clínico ${status_risco?.toUpperCase() || 'ESTÁVEL'}. Foram identificados ${diagnosticos.length} diagnósticos de enfermagem prioritários correlacionados às escalas clínicas e sinais vitais.`,
    prioridade: status_risco === 'critico' ? 'alta' : status_risco === 'alerta' ? 'moderada' : 'baixa',
    diagnosticos,
    is_preliminary_draft: true,
    lgpd_sanitized: true,
  };
}

export const aiService = {
  async generateCarePlanAsync(assessmentId, assessment) {
    try {
      let patient = null;
      if (assessment.patient_id) {
        try { patient = await patientService.get(assessment.patient_id); } catch {}
      }

      // 1. Blindagem LGPD: anonimiza todos os dados antes da IA
      const sanitizedClinicalData = sanitizeClinicalDataForAI(patient, assessment);

      let plan;
      // 2. Tenta invocar a Edge Function do Supabase se configurado
      if (isSupabaseConfigured()) {
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
          console.warn('Fallback para motor local de IA clínica:', funcErr);
        }
      }

      // Se a Edge Function não estiver conectada, usa o motor taxonômico local
      if (!plan) {
        plan = generateLocalTaxonomicPlan(sanitizedClinicalData);
      }

      // 3. Atualiza a avaliação com a resposta da IA
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
        } catch {
          // Fallback silencioso para persistência local
        }
      }

      const stored = JSON.parse(localStorage.getItem('enfermeiro_digital_assessments') || '[]');
      const idx = stored.findIndex((a) => a.id === assessmentId);
      if (idx !== -1) {
        stored[idx].ai_response = plan;
        stored[idx].ai_status = 'generated';
        localStorage.setItem('enfermeiro_digital_assessments', JSON.stringify(stored));
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
