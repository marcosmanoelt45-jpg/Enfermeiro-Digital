import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-enfermeiro-digital.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

let isReachable = true;

export const markSupabaseOffline = (reason) => {
  if (isReachable) {
    console.warn(`[Supabase Circuit Breaker] Servidor remoto inacessível (${reason || 'erro de rede/DNS'}). Alternando instantaneamente para modo LocalStorage resiliente.`);
    isReachable = false;
  }
};

export const setSupabaseReachable = (status) => {
  isReachable = status;
};

// Prova rápida de conectividade com timeout agressivo de 2 segundos
if (
  typeof window !== 'undefined' &&
  supabaseUrl &&
  !supabaseUrl.includes('placeholder')
) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: { apikey: supabaseAnonKey },
      signal: controller.signal,
    })
      .then(() => {
        clearTimeout(timer);
        isReachable = true;
      })
      .catch((err) => {
        clearTimeout(timer);
        markSupabaseOffline(err?.message || 'timeout/DNS');
      });
  } catch {
    markSupabaseOffline('fetch initialization error');
  }
}

export const isSupabaseConfigured = () => {
  if (!isReachable) return false;
  return (
    Boolean(import.meta.env.VITE_SUPABASE_URL) &&
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY) &&
    !import.meta.env.VITE_SUPABASE_URL.includes('placeholder')
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
