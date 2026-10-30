import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Purga definitiva de Service Workers obsoletos e CacheStorage estagnado (Opera GX, Chrome, Mobile)
if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      window.location.reload();
    }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.update().catch(() => {});
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }

  if ('caches' in window) {
    caches.keys().then((keys) => {
      for (const key of keys) {
        if (key.includes('workbox-precache')) {
          caches.delete(key).catch(() => {});
        }
      }
    }).catch(() => {});
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
