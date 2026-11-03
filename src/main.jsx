import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// A limpeza de Service Workers antigos fica só em public/registerSW.js (carregado pelo index.html).
// Sem recarregar no pageshow: voltar pelo histórico usa o bfcache.

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
