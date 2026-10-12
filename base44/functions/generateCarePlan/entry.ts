import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { generatePlan } from "../../shared/scoring.ts";

// Gera (ou regenera) o plano de cuidados via IA para uma avaliação existente.
// Usado pelo Dashboard de IA (regeneração manual) e pode ser reinvocado se a geração em background falhar.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const assessment_id = body?.assessment_id;
    if (!assessment_id) return Response.json({ error: 'assessment_id é obrigatório' }, { status: 400 });

    const assessment = await base44.entities.Assessment.get(assessment_id);
    if (!assessment) return Response.json({ error: 'Avaliação não encontrada' }, { status: 404 });

    let patient;
    if (assessment.patient_id) {
      try { patient = await base44.entities.Patient.get(assessment.patient_id); } catch {}
    }

    await base44.entities.Assessment.update(assessment_id, { ai_status: "pending" });

    const plan = await generatePlan(base44, patient, assessment);
    await base44.entities.Assessment.update(assessment_id, { ai_response: plan, ai_status: "generated" });

    return Response.json({ plan });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
