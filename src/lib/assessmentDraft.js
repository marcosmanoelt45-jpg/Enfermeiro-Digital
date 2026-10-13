// Rascunho da Avaliação Express salvo no navegador: evita perda de dados quando o
// enfermeiro sai da tela para consultar o prontuário ou recarrega a página no meio do preenchimento.

const PREFIX = "enfermeiro_assessment_draft_";

export function draftKey(patientId) {
  return `${PREFIX}${patientId}`;
}

export function loadDraft(patientId) {
  if (!patientId) return null;
  try {
    const raw = window.localStorage.getItem(draftKey(patientId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDraft(patientId, { data, step }) {
  if (!patientId) return null;
  const savedAt = new Date().toISOString();
  try {
    window.localStorage.setItem(draftKey(patientId), JSON.stringify({ data, step, saved_at: savedAt }));
  } catch {}
  return savedAt;
}

export function clearDraft(patientId) {
  if (!patientId) return;
  try {
    window.localStorage.removeItem(draftKey(patientId));
  } catch {}
}
