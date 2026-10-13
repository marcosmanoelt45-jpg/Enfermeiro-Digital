// Transcrição de áudio pela API da AssemblyAI (https://api.assemblyai.com/v2).
// A chave fica salva no localStorage do navegador ("enfermeiro_assemblyai_api_key").

const STORAGE_KEY = "enfermeiro_assemblyai_api_key";
const API_BASE = "https://api.assemblyai.com/v2";
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 4 * 60 * 1000;

export function getAssemblyAiKey() {
  try {
    return (window.localStorage.getItem(STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function saveAssemblyAiKey(key) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(key || "").trim());
  } catch {}
}

async function errorMessage(res) {
  try {
    const data = await res.json();
    return data?.error || data?.message || `Erro ${res.status}`;
  } catch {
    return `Erro ${res.status}`;
  }
}

// Valida a chave consultando a API (401 = chave inválida).
export async function testAssemblyAiKey(key) {
  const apiKey = String(key || "").trim();
  if (!apiKey) throw new Error("Cole a sua chave de API da AssemblyAI.");
  const res = await fetch(`${API_BASE}/transcript?limit=1`, {
    headers: { authorization: apiKey }
  });
  if (res.status === 401) throw new Error("Chave inválida ou expirada. Confira e cole novamente.");
  if (!res.ok) throw new Error(await errorMessage(res));
  return true;
}

// Envia o áudio, cria a transcrição em português e aguarda o resultado.
export async function transcribeAudio(blob, { apiKey, languageCode = "pt", onStage = () => {} } = {}) {
  const key = String(apiKey || "").trim();
  if (!key) throw new Error("Nenhuma chave da AssemblyAI configurada. Cole a chave em Minha Conta.");
  if (!blob) throw new Error("Nenhum áudio gravado.");

  onStage("Enviando o áudio...");
  const upload = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: { authorization: key, "content-type": "application/octet-stream" },
    body: blob
  });
  if (!upload.ok) throw new Error(await errorMessage(upload));
  const { upload_url: uploadUrl } = await upload.json();
  if (!uploadUrl) throw new Error("Falha no envio do áudio. Tente novamente.");

  onStage("Iniciando a transcrição...");
  const job = await fetch(`${API_BASE}/transcript`, {
    method: "POST",
    headers: { authorization: key, "content-type": "application/json" },
    body: JSON.stringify({ audio_url: uploadUrl, language_code: languageCode })
  });
  if (!job.ok) throw new Error(await errorMessage(job));
  const { id } = await job.json();
  if (!id) throw new Error("Não foi possível iniciar a transcrição.");

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let elapsed = 0;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    elapsed += POLL_INTERVAL_MS / 1000;
    const poll = await fetch(`${API_BASE}/transcript/${id}`, { headers: { authorization: key } });
    if (!poll.ok) throw new Error(await errorMessage(poll));
    const data = await poll.json();
    if (data.status === "completed") {
      onStage("Transcrição concluída.");
      return String(data.text || "").trim();
    }
    if (data.status === "error") {
      throw new Error(data.error || "A AssemblyAI não conseguiu transcrever este áudio.");
    }
    onStage(`Transcrevendo o áudio... ${Math.round(elapsed)}s`);
  }
  throw new Error("A transcrição demorou mais que o esperado. Tente gravar um relato mais curto.");
}
