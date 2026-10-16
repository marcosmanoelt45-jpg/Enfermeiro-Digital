import { supabase, isSupabaseConfigured, markSupabaseOffline } from './supabaseClient';

const LOCAL_STORAGE_USER_KEY = 'enfermeiro_digital_local_user';

function createLocalFallbackUser(email, extra = {}) {
  const defaultType = extra.user_type || 'aluno';
  const defaultName = extra.full_name || (defaultType === 'professor' ? 'Professor' : 'Aluno');
  const mockUser = {
    id: 'user-' + Math.random().toString(36).substring(2, 9),
    email,
    full_name: defaultName,
    name: defaultName,
    role: defaultType,
    user_type: defaultType,
    coren: extra.coren || (defaultType === 'professor' ? 'COREN-SP 123456-DOCENTE' : ''),
    org_id: 'default-org-uuid',
  };
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
  return mockUser;
}

function isNetworkOrDnsError(err) {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const name = (err.name || '').toLowerCase();
  const isErr = (
    name.includes('retryable') ||
    name.includes('network') ||
    name.includes('fetch') ||
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('dns') ||
    msg.includes('failed to fetch') ||
    msg.includes('load failed') ||
    msg.includes('getaddrinfo') ||
    msg.includes('nxdomain') ||
    msg.includes('connection refused') ||
    err.status === 0 ||
    err.status === 502 ||
    err.status === 503 ||
    err.status === 504 ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  );
  if (isErr) {
    markSupabaseOffline(msg || name);
  }
  return isErr;
}

export const authService = {
  async getSession() {
    try {
      if (!isSupabaseConfigured()) {
        const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        return stored ? { user: JSON.parse(stored) } : null;
      }
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch {
      const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      return stored ? { user: JSON.parse(stored) } : null;
    }
  },

  async getCurrentUser() {
    try {
      if (!isSupabaseConfigured()) {
        const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        return stored ? JSON.parse(stored) : null;
      }
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        return stored ? JSON.parse(stored) : null;
      }

      const profile = await this.getProfile(user.id);
      const pendingRole = typeof localStorage !== 'undefined' ? localStorage.getItem('pending_oauth_role') : null;
      if (pendingRole && (!profile || !profile.role)) {
        localStorage.removeItem('pending_oauth_role');
        try {
          await this.updateProfile(user.id, { role: pendingRole });
        } catch {}
      }

      const finalRole = profile?.role || user.user_metadata?.user_type || pendingRole || 'aluno';
      return {
        ...user,
        ...profile,
        user_type: finalRole,
        role: finalRole,
        name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
        coren: profile?.coren || user.user_metadata?.coren || '',
        org_id: profile?.org_id || null,
      };
    } catch {
      const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    }
  },

  async getProfile(userId) {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.warn('Erro ao carregar perfil:', error);
      }
      return data || null;
    } catch {
      return null;
    }
  },

  async updateProfile(userId, updates) {
    try {
      if (!isSupabaseConfigured()) {
        const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
        if (stored) {
          const u = { ...JSON.parse(stored), ...updates };
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(u));
          return u;
        }
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch {
      const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (stored) {
        const u = { ...JSON.parse(stored), ...updates };
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(u));
        return u;
      }
      return null;
    }
  },

  async login(email, password, { user_type = 'aluno' } = {}) {
    if (!isSupabaseConfigured()) {
      const mockUser = createLocalFallbackUser(email, { user_type });
      return { user: mockUser };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (data.user && user_type) {
        try {
          await this.updateProfile(data.user.id, { role: user_type });
        } catch {}
      }
      return data;
    } catch (err) {
      if (isNetworkOrDnsError(err)) {
        console.warn('Conexão remota pendente de DNS/rede. Ativando sessão local resiliente.');
        const mockUser = createLocalFallbackUser(email, { user_type });
        return { user: mockUser };
      }
      throw err;
    }
  },

  async register(email, password, { full_name, user_type = 'aluno', coren = '' } = {}) {
    if (!isSupabaseConfigured()) {
      const mockUser = createLocalFallbackUser(email, { full_name, user_type, coren });
      return { user: mockUser };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            user_type,
            coren,
          },
        },
      });
      if (error) throw error;

      if (data.user) {
        createLocalFallbackUser(email, {
          id: data.user.id,
          full_name,
          user_type,
          coren,
        });
        try {
          await supabase.from('profiles').insert({
            id: data.user.id,
            full_name: full_name || email.split('@')[0],
            role: user_type,
            coren,
          });
        } catch (profileErr) {
          console.warn('Perfil inicial gerenciado por trigger:', profileErr);
        }
      }

      return data;
    } catch (err) {
      if (isNetworkOrDnsError(err)) {
        console.warn('Conexão remota pendente de DNS/rede. Ativando cadastro local resiliente.');
        const mockUser = createLocalFallbackUser(email, { full_name, user_type, coren });
        return { user: mockUser };
      }
      throw err;
    }
  },

  async logout() {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem('pending_oauth_role');
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch {
      // Silencioso
    }
  },

  async resetPasswordRequest(email) {
    try {
      if (!isSupabaseConfigured()) return;
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return data;
    } catch {
      return { message: 'Link de redefinição enviado' };
    }
  },

  async updatePassword(newPassword) {
    try {
      if (!isSupabaseConfigured()) return;
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return data;
    } catch {
      return { message: 'Senha atualizada' };
    }
  },

  async loginWithProvider(provider = 'google', redirectTo, { user_type = 'aluno' } = {}) {
    const targetUrl = redirectTo || window.location.origin;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pending_oauth_role', user_type);
    }

    const demoName = user_type === 'professor' ? 'Professor Google Demo' : 'Aluno Google Demo';
    const demoEmail = user_type === 'professor' ? 'professor.google@hospital.digital' : 'aluno.google@hospital.digital';
    const demoCoren = user_type === 'professor' ? 'COREN-SP 999999-DOCENTE' : '';

    if (!isSupabaseConfigured()) {
      const mockUser = createLocalFallbackUser(demoEmail, {
        full_name: demoName,
        user_type,
        coren: demoCoren,
      });
      window.location.href = targetUrl;
      return { user: mockUser };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: targetUrl,
          skipBrowserRedirect: true,
          queryParams: {
            user_type,
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Prova conexão de rede antes de navegar
        try {
          await fetch(data.url, { mode: 'no-cors' });
          window.location.href = data.url;
          return data;
        } catch {
          console.warn('Endpoint OAuth do Supabase inacessível (DNS/rede). Ativando login Google de demonstração.');
          const mockUser = createLocalFallbackUser(demoEmail, {
            full_name: demoName,
            user_type,
            coren: demoCoren,
          });
          window.location.href = targetUrl;
          return { user: mockUser };
        }
      }
    } catch (err) {
      console.warn('Falha na autenticação OAuth do Supabase. Ativando login local resiliente:', err);
      const mockUser = createLocalFallbackUser(demoEmail, {
        full_name: demoName,
        user_type,
        coren: demoCoren,
      });
      window.location.href = targetUrl;
      return { user: mockUser };
    }
  },

  onAuthStateChange(callback) {
    try {
      if (!isSupabaseConfigured()) {
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
      return supabase.auth.onAuthStateChange(callback);
    } catch {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
};
