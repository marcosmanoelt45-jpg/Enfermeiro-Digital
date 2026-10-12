// Motor de cálculo clínico (backend) - soma escores nativamente e deriva criticidade.
// Espelha src/lib/riskEngine.js (frontend). Mantido em base44/shared para reuso entre funções.

export function computeBradenTotal(s = {}) {
  return (Number(s.braden_perception) || 0) + (Number(s.braden_moisture) || 0) + (Number(s.braden_activity) || 0) +
    (Number(s.braden_mobility) || 0) + (Number(s.braden_nutrition) || 0) + (Number(s.braden_friction) || 0);
}

export function computeCamPositive(s = {}) {
  return Boolean(s.cam_acute && s.cam_inattention && (s.cam_disorganized || s.cam_altered_loc));
}

export function computeAuditTotal(s = {}) {
  let t = 0;
  for (let i = 1; i <= 10; i++) t += Number(s["audit_" + i] || 0);
  return t;
}

// Fórmula oficial da Escala SAK (Severo-Almeida-Kuchenbecker):
// Desorientado/confuso×5 + Micções frequentes×5 + Limitação para deambular×4 +
// Ausência de acompanhante×0,5 + Pós-operatório×0,5 + Nº medicamentos administrados(até 24h)×1 + Queda prévia×1
export function computeSakTotal(s = {}) {
  const meds = Number(s.sak_meds) || 0;
  return (
    (s.sak_disorientation ? 5 : 0) +
    (s.sak_urination ? 5 : 0) +
    (s.sak_walking ? 4 : 0) +
    (s.sak_caregiver ? 0.5 : 0) +
    (s.sak_postop ? 0.5 : 0) +
    meds * 1 +
    (s.sak_previous_falls ? 1 : 0)
  );
}

// CALOI = escala de dor. O escore é a intensidade da dor (0-10).
export function computeCaloiTotal(s = {}) {
  return Number(s.caloi_pain_intensity) || 0;
}

function classifyVital(name, value) {
  if (value === undefined || value === null || Number.isNaN(value)) return "estavel";
  const v = Number(value);
  const rules = {
    pa_sistolica: { critico: v => v < 90 || v > 180, alerta: v => v < 110 || v > 140 },
    pa_diastolica: { critico: v => v < 50 || v > 120, alerta: v => v < 60 || v > 90 },
    fc: { critico: v => v < 40 || v > 130, alerta: v => v < 50 || v > 110 },
    fr: { critico: v => v < 8 || v > 30, alerta: v => v < 12 || v > 20 },
    tax: { critico: v => v < 35 || v > 39.5, alerta: v => v < 36 || v > 38.5 },
    sat: { critico: v => v < 85, alerta: v => v < 92 }
  };
  const r = rules[name];
  if (!r) return "estavel";
  if (r.critico(v)) return "critico";
  if (r.alerta(v)) return "alerta";
  return "estavel";
}

const RANK = { estavel: 0, alerta: 1, critico: 2 };

// Classificação oficial BRADEN: ≤9 muito alto, 10-12 alto, 13-14 moderado, 15-18 brando, >18 sem risco.
function classifyBraden(total) {
  if (!total) return "estavel";
  if (total <= 12) return "critico";
  if (total <= 18) return "alerta";
  return "estavel";
}
function classifyAudit(total) {
  if (total == null) return "estavel";
  if (total >= 20) return "critico";
  if (total >= 8) return "alerta";
  return "estavel";
}
// Classes de risco oficiais da SAK: baixo ≤6, moderado 6,5-10, alto ≥10,5.
function classifySak(total) {
  if (total == null) return "estavel";
  if (total >= 10.5) return "critico";
  if (total >= 6.5) return "alerta";
  return "estavel";
}
// Classificação da dor CALOI: 0 sem dor, 1-3 leve, 4-6 moderada, 7-10 severa.
function classifyCaloi(total) {
  if (total == null) return "estavel";
  if (total >= 7) return "critico";
  if (total >= 4) return "alerta";
  return "estavel";
}

export function computeGlobalRisk(a = {}) {
  const statuses = [];
  ["pa_sistolica", "pa_diastolica", "fc", "fr", "tax", "sat"].forEach(k => statuses.push(classifyVital(k, a[k])));
  statuses.push(classifyBraden(a.braden_total));
  if (a.cam_positive) statuses.push("alerta");
  statuses.push(classifyAudit(a.audit_total));
  statuses.push(classifySak(a.sak_score));
  statuses.push(classifyCaloi(a.caloi_score));
  return statuses.reduce((acc, s) => (RANK[s] > RANK[acc] ? s : acc), "estavel");
}

export function computeAllScores(data = {}) {
  const braden_total = computeBradenTotal(data);
  const cam_positive = computeCamPositive(data);
  const audit_total = computeAuditTotal(data);
  const sak_score = computeSakTotal(data);
  const caloi_score = computeCaloiTotal(data);
  const risk_status = computeGlobalRisk({ ...data, braden_total, cam_positive, audit_total, sak_score, caloi_score });
  return { braden_total, cam_positive, audit_total, sak_score, caloi_score, risk_status };
}

export const SYSTEM_PROMPT = `Você é uma IA Especialista Clínica fundamentada estritamente na Classificação NANDA-I (taxonomia vigente), NIC (Classificação das Intervenções de Enfermagem) e NOC - Classificação dos Resultados de Enfermagem, 5ª edição (Moorhead, Johnson, Maas, Swanson).
Sua função é analisar o JSON com os sinais vitais e escores de escalas (BRADEN, CAM, SAK, AUDIT, CALOI - escala de dor) do paciente.

INSTRUÇÕES DE INTEGRAÇÃO CLÍNICA — considere TODAS as informações fornecidas, sem exceção:
- Sinais vitais (PA, FC, FR, Tax, SatO₂): avalie alterações e tendências.
- Escala BRADEN: integre o escore total e cada subescore (percepção, umidade, atividade, mobilidade, nutrição, fricção) para risco de lesão por pressão.
- Escala CAM: considere cada item marcado e o resultado positivo/negativo para delirium.
- Escala SAK: integre o escore ponderado e cada fator presente (desorientação, micção frequente, limitação de marcha, ausência de acompanhante, pós-operatório, quedas prévias, número de medicamentos) para risco de queda.
- Escala AUDIT: considere o escore total para risco relacionado ao uso de álcool.
- Escala CALOI (dor): considere a intensidade (0-10), TODAS as localizações anatômicas selecionadas (array "localizacao") e as características da dor (array "caracteristicas") — a localização e as características da dor são fundamentais para levantar diagnósticos como "Dor aguda", "Dor crônica", "Risco de lesão tecidual", entre outros.
- Histórico prévio, doenças prévias, medicamentos em uso, alergias, anamnese prévia (repasse de outro serviço de saúde) e observações em texto corrido: integre TODAS essas informações ao raciocínio clínico, mesmo quando forem textos descritivos. Não descarte nenhuma informação fornecida.
- Status de risco global: use como orientação de prioridade clínica.

Retorne um plano de ação contendo:
1. Os Diagnósticos de Enfermagem mais precisos. Forneça obrigatoriamente o Título, o Domínio, a Classe e o Código exato de cada um.
2. Intervenções de Enfermagem (NIC) sugeridas para os diagnósticos levantados, incluindo os respectivos códigos.
3. Resultados de Enfermagem (NOC), conforme a 5ª edição, com os respectivos códigos e indicadores esperados.
Destaque os links/códigos numéricos cruzados para que o usuário localize facilmente o conteúdo nos manuais físicos ou digitais. Seja objetivo, não invente diagnósticos fora da taxonomia.`;

export const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    resumo: { type: "string", description: "Síntese clínica do estado do paciente" },
    prioridade: { type: "string", enum: ["alta", "moderada", "baixa"] },
    diagnosticos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string", description: "Código NANDA-I exato (ex: 00004)" },
          title: { type: "string", description: "Título do diagnóstico NANDA-I" },
          domain: { type: "string", description: "Domínio NANDA-I" },
          class: { type: "string", description: "Classe NANDA-I" },
          defining_characteristics: { type: "array", items: { type: "string" } },
          related_factors: { type: "array", items: { type: "string" } },
          interventions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string", description: "Código NIC" },
                title: { type: "string" },
                description: { type: "string" }
              },
              required: ["code", "title"]
            }
          },
          outcomes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string", description: "Código NOC" },
                title: { type: "string" },
                description: { type: "string" }
              },
              required: ["code", "title"]
            }
          }
        },
        required: ["code", "title", "domain", "class", "interventions", "outcomes"]
      }
    }
  },
  required: ["resumo", "diagnosticos"]
};

export function buildClinicalData(patient, assessment) {
  return {
    paciente: {
      nome: patient?.name, idade: patient?.age, sexo: patient?.gender,
      doencas_previas: patient?.previous_diseases,
      historico_previo: patient?.medical_history,
      medicamentos_em_uso: patient?.current_medications,
      alergias: patient?.allergies,
      anamnese_previa: patient?.previous_anamnesis,
      observacoes: patient?.notes
    },
    sinais_vitais: {
      pa_sistolica: assessment.pa_sistolica, pa_diastolica: assessment.pa_diastolica,
      frequencia_cardiaca: assessment.fc, frequencia_respiratoria: assessment.fr,
      temperatura_axilar: assessment.tax, saturacao_o2: assessment.sat
    },
    escalas: {
      braden: { total: assessment.braden_total, subescores: { percepcao: assessment.braden_perception, umidade: assessment.braden_moisture, atividade: assessment.braden_activity, mobilidade: assessment.braden_mobility, nutricao: assessment.braden_nutrition, friccao: assessment.braden_friction } },
      cam: { positivo: assessment.cam_positive, itens: { inicio_agudo: assessment.cam_acute, desatencao: assessment.cam_inattention, pensamento_desorganizado: assessment.cam_disorganized, nivel_consciencia_alterado: assessment.cam_altered_loc } },
      sak: { total: assessment.sak_score, itens: { desorientacao: assessment.sak_disorientation, miccao_frequente: assessment.sak_urination, limitacao_marcha: assessment.sak_walking, ausencia_acompanhante: assessment.sak_caregiver, pos_operatorio: assessment.sak_postop, quedas_previas: assessment.sak_previous_falls, num_medicamentos_24h: assessment.sak_meds } },
      audit: { total: assessment.audit_total },
      caloi: { total: assessment.caloi_score, intensidade_dor: assessment.caloi_pain_intensity, localizacao: assessment.caloi_pain_location, caracteristicas: assessment.caloi_pain_characteristics }
    },
    status_risco: assessment.risk_status
  };
}

// Gera o plano chamando o LLM e retorna o objeto estruturado.
export async function generatePlan(base44, patient, assessment) {
  const clinicalData = buildClinicalData(patient, assessment);
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `${SYSTEM_PROMPT}\n\nAnalise os dados clínicos a seguir e retorne o plano de ação estruturado conforme especificado.\n\nDADOS DO PACIENTE (JSON):\n${JSON.stringify(clinicalData, null, 2)}`,
    response_json_schema: RESPONSE_SCHEMA,

  });
  return result;
}
