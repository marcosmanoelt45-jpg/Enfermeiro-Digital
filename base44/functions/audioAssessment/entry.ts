import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil } from 'base44:runtime';
import { computeAllScores, generatePlan } from "../../shared/scoring.ts";

// Avaliação por áudio: recebe o relato transcrito do cliente (Web Speech API) ou áudio,
// extrai dados estruturados da avaliação (sinais vitais + escalas) via LLM,
// cria o registro e dispara a geração do plano de IA em background.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { audio_url, patient_id, transcript: clientTranscript } = body || {};
    if (!patient_id) return Response.json({ error: 'patient_id é obrigatório' }, { status: 400 });

    const transcript = (clientTranscript || '').trim();
    if (!transcript) {
      return Response.json({ error: 'Nenhum relato transcrito de voz foi fornecido. Fale novamente ao microfone.' }, { status: 422 });
    }

    // 2. Extrai dados estruturados da avaliação a partir da transcrição
    const extractSchema = {
      type: "object",
      properties: {
        pa_sistolica: { type: "number" },
        pa_diastolica: { type: "number" },
        fc: { type: "number" },
        fr: { type: "number" },
        tax: { type: "number" },
        sat: { type: "number" },
        braden_perception: { type: "number" },
        braden_moisture: { type: "number" },
        braden_activity: { type: "number" },
        braden_mobility: { type: "number" },
        braden_nutrition: { type: "number" },
        braden_friction: { type: "number" },
        cam_acute: { type: "boolean" },
        cam_inattention: { type: "boolean" },
        cam_disorganized: { type: "boolean" },
        cam_altered_loc: { type: "boolean" },
        audit_1: { type: "number" }, audit_2: { type: "number" }, audit_3: { type: "number" },
        audit_4: { type: "number" }, audit_5: { type: "number" }, audit_6: { type: "number" },
        audit_7: { type: "number" }, audit_8: { type: "number" }, audit_9: { type: "number" }, audit_10: { type: "number" },
        sak_disorientation: { type: "boolean" },
        sak_urination: { type: "boolean" },
        sak_walking: { type: "boolean" },
        sak_caregiver: { type: "boolean" },
        sak_postop: { type: "boolean" },
        sak_previous_falls: { type: "boolean" },
        sak_meds: { type: "number" },
        caloi_pain_intensity: { type: "number" },
        caloi_pain_location: { type: "array", items: { type: "string" } },
        caloi_pain_characteristics: { type: "array", items: { type: "string" } }
      }
    };

    const extracted = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em enfermagem. Analise a transcrição de um relato clínico falado por um enfermeiro à beira-leito e extraia os dados estruturados da avaliação.

Extraia apenas os dados que forem explicitamente mencionados no relato. Se um dado não foi mencionado, omita-o (não invente valores).

Mapeie:
- Sinais vitais: PA sistólica/diastólica (mmHg), frequência cardíaca (bpm), frequência respiratória (irpm), temperatura axilar (°C), saturação O₂ (%).
- Escala BRADEN: percepção sensorial, umidade, atividade, mobilidade, nutrição, fricção/cisalhamento (1-4 cada).
- Escala CAM: início agudo, desatenção, pensamento desorganizado, nível de consciência alterado (booleanos).
- Escala AUDIT: 10 itens (0-4 cada).
- Escala SAK: desorientação, micção frequente, limitação para deambular, ausência de acompanhante, pós-operatório, queda prévia (booleanos) e número de medicamentos (até 24h).
- Escala CALOI: intensidade da dor (0-10), localizações da dor (array de strings), características da dor (array de strings).

TRANSCRIÇÃO:
"""
${transcript}
"""`,
      response_json_schema: extractSchema
    });

    // 3. Calcula escores derivados
    const scores = computeAllScores(extracted || {});

    let patient;
    try { patient = await base44.entities.Patient.get(patient_id); } catch {}

    // 4. Cria o registro da avaliação
    const assessment = await base44.entities.Assessment.create({
      ...extracted,
      ...scores,
      patient_id,
      patient_name: patient?.name,
      notes: `Relato por voz: "${transcript}"`,
      ai_status: "pending"
    });

    // 5. Dispara a geração do plano em background
    waitUntil((async () => {
      try {
        const plan = await generatePlan(base44, patient, { ...extracted, ...scores });
        await base44.entities.Assessment.update(assessment.id, { ai_response: plan, ai_status: "generated" });
      } catch (err) {
        await base44.entities.Assessment.update(assessment.id, { ai_status: "error", ai_raw: String(err?.message || err) });
      }
    })());

    return Response.json({ assessment_id: assessment.id, transcript, risk_status: scores.risk_status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
