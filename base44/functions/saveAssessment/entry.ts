import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { waitUntil } from 'base44:runtime';
import { computeAllScores, generatePlan } from "../../shared/scoring.ts";

// Salva a avaliação: processa os cálculos lógicos (somatório BRADEN, CAM, AUDIT, SAK, CALOI),
// deriva o status de risco, cria o registro e dispara a geração do plano de IA em background.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { patient_id, data } = body || {};
    if (!patient_id) return Response.json({ error: 'patient_id é obrigatório' }, { status: 400 });

    // 1. Cálculos lógicos nativos (somatórios e criticidade)
    const scores = computeAllScores(data || {});

    let patient;
    try { patient = await base44.entities.Patient.get(patient_id); } catch {}

    // 2. Cria o registro da avaliação com status de IA pendente
    const assessment = await base44.entities.Assessment.create({
      ...data,
      ...scores,
      patient_id,
      patient_name: patient?.name,
      ai_status: "pending"
    });

    // 3. Dispara a requisição de IA em background (não bloqueia a resposta)
    waitUntil((async () => {
      try {
        const plan = await generatePlan(base44, patient, { ...data, ...scores });
        await base44.entities.Assessment.update(assessment.id, { ai_response: plan, ai_status: "generated" });
      } catch (err) {
        await base44.entities.Assessment.update(assessment.id, { ai_status: "error", ai_raw: String(err?.message || err) });
      }
    })());

    // 4. Retorna imediatamente o id da avaliação
    return Response.json({ assessment_id: assessment.id, risk_status: scores.risk_status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
