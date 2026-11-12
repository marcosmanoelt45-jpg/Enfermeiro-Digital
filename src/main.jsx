import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Nunito servida pelo próprio site (sem pedido ao Google a cada visita).
import '@fontsource-variable/nunito'
import './index.css'
import { instalarSomGlobal } from './lib/somGlobal.js'

// Reset geral do progresso (12/11/2026, pedido do dono): apaga uma vez, em cada aparelho, a cópia local do
// progresso (ofensiva, PE, histórico, revisão, rascunhos de consulta). Sem isso a sincronização devolveria ao
// servidor o que foi zerado lá. Para um próximo reset, basta trocar a data.
const RESET_PROGRESSO = '2026-11-12'
try {
  if (localStorage.getItem('enfere_reset_progresso') !== RESET_PROGRESSO) {
    const prefixos = ['enfermeiro_digital_gamification_state', 'enfere_clinical_history_v1', 'enfere_questoes_revisao_v1', 'enfere_consulta_rascunho_', 'enfere_notas_']
    Object.keys(localStorage).filter((k) => prefixos.some((p) => k.startsWith(p))).forEach((k) => localStorage.removeItem(k))
    localStorage.setItem('enfere_reset_progresso', RESET_PROGRESSO)
  }
} catch { /* localStorage bloqueado */ }

// "Mutar sons" do perfil vale para o site todo (mídia, voz do navegador e Web Audio).
instalarSomGlobal()

// A chave da AssemblyAI deixou o navegador (agora fica só no servidor): apaga a que ficou guardada.
try { localStorage.removeItem('enfermeiro_assemblyai_api_key'); } catch { /* localStorage bloqueado */ }

// A limpeza de Service Workers antigos fica só em public/registerSW.js (carregado pelo index.html).
// Sem recarregar no pageshow: voltar pelo histórico usa o bfcache.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
