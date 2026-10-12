const isNode = typeof window === 'undefined';

const isClearAccessTokenRequested = () =>
  !isNode && new URLSearchParams(window.location.search).get("clear_access_token") === 'true';

const clearStoredAccessToken = () => {
  if (isNode) return;
  window.localStorage.removeItem('supabase_access_token');
  window.localStorage.removeItem('token');
};

const getAppParams = () => {
  if (isClearAccessTokenRequested()) {
    clearStoredAccessToken();
  }
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    token: null,
  };
};

export const appParams = {
  ...getAppParams(),
};
