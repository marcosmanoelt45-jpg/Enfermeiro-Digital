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

const rawEnvUrl = safeGetEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = safeGetEnv('VITE_SUPABASE_ANON_KEY') || 'placeholder-anon-key';

const CANONICAL_SUPABASE_REF = 'xwqgyvqofxdqdbhltdzf';
const CANONICAL_SUPABASE_URL = `https://${CANONICAL_SUPABASE_REF}.supabase.co`;

/**
 * Normaliza e protege a URL do Supabase contra erros de digitação de DNS
 * (ex: 'dbhldtzf' invertido em vez de 'dbhltdzf') e extrai o ref verificado do JWT.
 */
function resolveSupabaseUrl(url, key) {
  let clean = (url || '').trim();
  // Corrige erros de digitação de DNS conhecidos no domínio do projeto
  if (clean.includes('dbhldtzf') || clean.includes('dbhidtzf')) {
    clean = clean.replace(/dbhldtzf|dbhidtzf/g, 'dbhltdzf');
  }
  // Qualquer referência ao projeto oficial ou ausência de URL usa sempre o endpoint canônico verificado
  if (
    !clean ||
    clean.includes('placeholder') ||
    clean.includes('seu-projeto') ||
    clean.includes('xwqgyvq') ||
    clean.includes('dbhltdzf') ||
    clean.includes('dbhldtzf') ||
    clean.includes('dbhidtzf')
  ) {
    return CANONICAL_SUPABASE_URL;
  }
  // Se a chave for um JWT válido, extrai o ref do payload assinado pelo Supabase
  if (key && typeof key === 'string' && key.includes('.')) {
    try {
      const parts = key.split('.');
      if (parts.length >= 2) {
        const jsonStr = typeof atob !== 'undefined'
          ? atob(parts[1])
          : Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(jsonStr);
        if (payload?.ref && payload.ref.startsWith('xwqgyvq')) {
          return CANONICAL_SUPABASE_URL;
        }
      }
    } catch {}
  }
  return clean;
}

const supabaseUrl = resolveSupabaseUrl(rawEnvUrl, supabaseAnonKey);
const isKnownOfflineOrPlaceholder =
  !supabaseUrl ||
  supabaseUrl.includes('placeholder');

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
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    supabaseAnonKey !== 'placeholder-anon-key'
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: !isKnownOfflineOrPlaceholder,
    autoRefreshToken: !isKnownOfflineOrPlaceholder,
    detectSessionInUrl: !isKnownOfflineOrPlaceholder,
  },
  global: {
    fetch: (input, init) => {
      let targetUrl = typeof input === 'string' ? input : (input?.url || String(input || ''));
      // Se for especificamente a rota de placeholder falsa, rejeita imediatamente
      if (targetUrl.includes('placeholder-enfermeiro-digital')) {
        return Promise.reject(new Error('Supabase offline circuit breaker active'));
      }
      if (targetUrl.includes('dbhldtzf') || targetUrl.includes('dbhidtzf')) {
        targetUrl = targetUrl.replace(/dbhldtzf|dbhidtzf/g, 'dbhltdzf');
        return fetch(targetUrl, init);
      }
      return fetch(input, init);
    },
  },
});

export { supabaseUrl, supabaseAnonKey };
