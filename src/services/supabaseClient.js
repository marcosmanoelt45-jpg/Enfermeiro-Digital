import { createClient } from '@supabase/supabase-js';

const safeGetEnv = (key) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch {}
  return '';
};

const rawUrl = safeGetEnv('VITE_SUPABASE_URL');
const isKnownOfflineOrPlaceholder =
  !rawUrl ||
  rawUrl.includes('placeholder');

const supabaseUrl = isKnownOfflineOrPlaceholder
  ? 'https://placeholder-enfermeiro-digital.supabase.co'
  : rawUrl;
const supabaseAnonKey = safeGetEnv('VITE_SUPABASE_ANON_KEY') || 'placeholder-anon-key';

let isReachable = !isKnownOfflineOrPlaceholder;
let offlineTimestamp = 0;
const OFFLINE_COOLDOWN_MS = 15000; // 15 segundos de cooldown

export const markSupabaseOffline = (reason) => {
  offlineTimestamp = Date.now();
  if (isReachable) {
    console.warn(`[Supabase Circuit Breaker] Servidor remoto temporariamente inacessível (${reason || 'erro de rede/DNS'}). Alternando para modo LocalStorage.`);
    isReachable = false;
  }
};

export const setSupabaseReachable = (status) => {
  isReachable = Boolean(status);
  if (status) offlineTimestamp = 0;
};

export const checkSupabaseReachable = () => {
  if (isKnownOfflineOrPlaceholder) return false;
  if (!isReachable && Date.now() - offlineTimestamp > OFFLINE_COOLDOWN_MS) {
    isReachable = true;
  }
  return isReachable;
};

export function isLocalDemoSession() {
  try {
    if (typeof localStorage === 'undefined') return false;
    const raw = localStorage.getItem('enfermeiro_digital_local_user');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const id = String(parsed?.id || '');
    return id.startsWith('aluno-demo') || id.startsWith('prof-demo');
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = () => {
  if (isKnownOfflineOrPlaceholder) return false;
  const url = safeGetEnv('VITE_SUPABASE_URL');
  const key = safeGetEnv('VITE_SUPABASE_ANON_KEY');
  return Boolean(url && key && !url.includes('placeholder'));
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: !isKnownOfflineOrPlaceholder,
    autoRefreshToken: !isKnownOfflineOrPlaceholder,
    detectSessionInUrl: !isKnownOfflineOrPlaceholder,
  },
  global: {
    fetch: (...args) => {
      const targetUrl = String(args[0] || '');
      // Se for especificamente a rota de placeholder falsa, rejeita imediatamente
      if (targetUrl.includes('placeholder-enfermeiro-digital')) {
        return Promise.reject(new Error('Supabase offline circuit breaker active'));
      }
      return fetch(...args);
    },
  },
});

export { supabaseUrl, supabaseAnonKey };
