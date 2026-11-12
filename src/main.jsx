import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Nunito servida pelo próprio site (sem pedido ao Google a cada visita).
import '@fontsource-variable/nunito'
import './index.css'
import { instalarSomGlobal } from './lib/somGlobal.js'

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
