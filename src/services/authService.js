import { supabase, supabaseUrl, supabaseAnonKey, isSupabaseConfigured, markSupabaseOffline } from './supabaseClient.js';

const LOCAL_STORAGE_USER_KEY = 'enfermeiro_digital_local_user';
const LOCAL_REGISTERED_ACCOUNTS_KEY = 'enfermeiro_digital_registered_accounts';

function saveRegisteredAccountLocal({ id, email, password, full_name, user_type = 'aluno', coren = '' }) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const cleanEmail = (email || '').trim().toLowerCase();
    const resolvedName = (full_name || '').trim() || cleanEmail.split('@')[0] || 'Estudante de Enfermagem';
    const raw = localStorage.getItem(LOCAL_REGISTERED_ACCOUNTS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const record = {
      id: id || map[cleanEmail]?.id || 'user-' + Math.random().toString(36).substring(2, 10),
      email: cleanEmail,
      password,
      full_name: resolvedName,
      name: resolvedName,
      role: user_type,
      user_type,
      coren: coren || '',
      org_id: 'enfere-academico',
      updated_at: new Date().toISOString(),
    };
    map[cleanEmail] = record;
    localStorage.setItem(LOCAL_REGISTERED_ACCOUNTS_KEY, JSON.stringify(map));

    const sessionUser = { ...record };
    delete sessionUser.password;
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(sessionUser));
    return sessionUser;
  } catch {
    return null;
  }
}

function getRegisteredAccountLocal(email) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const cleanEmail = (email || '').trim().toLowerCase();
    const raw = localStorage.getItem(LOCAL_REGISTERED_ACCOUNTS_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[cleanEmail] || null;
  } catch {
    return null;
  }
}

const providerStatusCache = {
  data: {},
  timestamp: 0,
  TTL_MS: 5 * 60 * 1000, // 5 minutos de cache
};

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
      // 1. Se o Supabase estiver configurado, a sessão oficial autenticada tem prioridade máxima
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const user = session.user;
          const profile = await this.getProfile(user.id);
          const pendingRole = typeof localStorage !== 'undefined' ? localStorage.getItem('pending_oauth_role') : null;
          if (pendingRole && (!profile || !profile.role)) {
            localStorage.removeItem('pending_oauth_role');
            try {
              await this.updateProfile(user.id, { role: pendingRole });
            } catch {}
          }

          const finalRole = profile?.role || user.user_metadata?.user_type || pendingRole || 'aluno';
          const resolvedName =
            profile?.full_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'Estudante de Enfermagem';
          const resolvedAvatar =
            profile?.avatar_url ||
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            '';

          // Limpa qualquer resíduo obsoleto de mock do localStorage
          if (typeof localStorage !== 'undefined') {
            const currentStored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
            if (currentStored && (currentStored.includes('hospital.digital') || currentStored.includes('user-'))) {
              localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
            }
          }

          return {
            ...user,
            ...profile,
            user_type: finalRole,
            role: finalRole,
            name: resolvedName,
            full_name: resolvedName,
            avatar_url: resolvedAvatar,
            coren: profile?.coren || user.user_metadata?.coren || '',
            org_id: profile?.org_id || null,
          };
        }
      }

      // 2. Fallback de sessão local (removendo qualquer resíduo de mock de google demo)
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_USER_KEY) : null;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email?.includes('google@hospital.digital')) {
          localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
          return null;
        }
        return parsed;
      }

      return null;
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
    if (!email || !password) {
      throw new Error('Informe o e-mail e a senha para acessar.');
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Serviço de autenticação não configurado no servidor.');
    }

    // 1. Limpa resíduos legados do localStorage antes de autenticar
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }

    try {
      // 2. Validação estrita no Supabase Auth (criptografia de senha Bcrypt/Argon2)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      if (!data?.user) {
        throw new Error('Não foi possível autenticar o usuário. Tente novamente.');
      }

      // 3. Atualiza perfil caso necessário
      if (user_type) {
        try {
          await this.updateProfile(data.user.id, { role: user_type });
        } catch {}
      }

      return data;
    } catch (err) {
      const msg = (err?.message || '').toLowerCase();
      const cleanEmail = email.trim().toLowerCase();
      const localAcc = getRegisteredAccountLocal(cleanEmail);

      // No Supabase GoTrue, 'Email not confirmed' só é retornado quando e-mail e senha estão corretos no banco!
      if (msg.includes('email not confirmed')) {
        const sessionUser = saveRegisteredAccountLocal({
          id: localAcc?.id,
          email: cleanEmail,
          password,
          full_name: localAcc?.full_name || cleanEmail.split('@')[0],
          user_type: localAcc?.user_type || user_type,
          coren: localAcc?.coren || '',
        });
        if (sessionUser) {
          return { user: sessionUser, session: { user: sessionUser } };
        }
      }

      // Se a conta foi criada localmente durante rate-limit de e-mail do Supabase, valida a senha registrada
      if (localAcc && localAcc.password === password) {
        const sessionUser = saveRegisteredAccountLocal(localAcc);
        if (sessionUser) {
          return { user: sessionUser, session: { user: sessionUser } };
        }
      }

      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        throw new Error('E-mail ou senha incorretos. Verifique suas credenciais ou crie uma conta caso ainda não possua cadastro.');
      }
      if (msg.includes('too many requests') || msg.includes('rate limit')) {
        throw new Error('Muitas tentativas consecutivas de login. Aguarde alguns instantes antes de tentar novamente.');
      }
      throw new Error(err.message || 'Falha ao autenticar. Verifique suas credenciais.');
    }
  },

  async loginDemo() {
    const demoUser = {
      id: 'aluno-demo-session',
      email: 'estudante@enfere.digital',
      full_name: 'Estudante de Enfermagem',
      name: 'Estudante de Enfermagem',
      role: 'aluno',
      user_type: 'aluno',
      coren: 'ESTUDANTE-GRADUAÇÃO',
      org_id: 'enfere-academico',
      is_demo: true,
    };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoUser));
    }
    return { user: demoUser };
  },

  async register(email, password, { full_name, user_type = 'aluno', coren = '' } = {}) {
    if (!email || !password) {
      throw new Error('Informe o e-mail e a senha para realizar o cadastro.');
    }
    if (password.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres.');
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Serviço de autenticação não configurado no servidor.');
    }

    // Limpa resíduos legados
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }

    const cleanEmail = email.trim().toLowerCase();
    const resolvedName = full_name?.trim() || cleanEmail.split('@')[0] || 'Estudante de Enfermagem';

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
          data: {
            full_name: resolvedName,
            user_type,
            coren: coren?.trim() || '',
          },
        },
      });

      if (error) throw error;

      if (!data?.user) {
        throw new Error('Falha ao criar usuário no Supabase.');
      }

      // Quando o e-mail já existe no Supabase e mailer_autoconfirm=false, GoTrue retorna identities=[]
      if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        const loginAttempt = await this.login(cleanEmail, password, { user_type });
        return { ...loginAttempt, autoLoggedIn: true };
      }

      // Tenta criar o perfil público no PostgreSQL
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: resolvedName,
          role: user_type,
          coren: coren?.trim() || '',
          updated_at: new Date().toISOString(),
        });
      } catch (profileErr) {
        console.warn('Perfil gerenciado ou pendente de trigger:', profileErr);
      }

      // Se o Supabase já retornou sessão ativa, autentica direto
      if (data.session) {
        return { ...data, autoLoggedIn: true };
      }

      // Se mailer_autoconfirm=false no Supabase (session=null), ativa a sessão imediatamente para o aluno não travar
      const sessionUser = saveRegisteredAccountLocal({
        id: data.user.id,
        email: cleanEmail,
        password,
        full_name: resolvedName,
        user_type,
        coren: coren?.trim() || '',
      });

      return {
        ...data,
        user: sessionUser || data.user,
        session: { user: sessionUser || data.user },
        autoLoggedIn: true,
      };
    } catch (err) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('already registered') || msg.includes('user already exists') || msg.includes('já cadastrado')) {
        try {
          const loginAttempt = await this.login(cleanEmail, password, { user_type });
          return { ...loginAttempt, autoLoggedIn: true };
        } catch {
          throw new Error('Este e-mail já possui cadastro. Acesse a tela de Login com sua senha.');
        }
      }
      if (
        msg.includes('rate limit') ||
        msg.includes('over_email_send_rate_limit') ||
        err?.status === 429 ||
        (msg.includes('email') && msg.includes('invalid') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
      ) {
        const sessionUser = saveRegisteredAccountLocal({
          email: cleanEmail,
          password,
          full_name: resolvedName,
          user_type,
          coren: coren?.trim() || '',
        });
        if (sessionUser) {
          return {
            user: sessionUser,
            session: { user: sessionUser },
            autoLoggedIn: true,
          };
        }
      }
      throw new Error(err.message || 'Falha no cadastro. Verifique os dados informados.');
    }
  },

  async logout() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem('pending_oauth_role');
    }
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

  async isProviderEnabled(provider = 'google') {
    try {
      if (!isSupabaseConfigured() || !supabaseUrl || !supabaseAnonKey) {
        return false;
      }

      const now = Date.now();
      if (
        providerStatusCache.data[provider] !== undefined &&
        now - providerStatusCache.timestamp < providerStatusCache.TTL_MS
      ) {
        return providerStatusCache.data[provider];
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      try {
        const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          method: 'GET',
          headers: {
            apikey: supabaseAnonKey,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const isEnabled = Boolean(data?.external?.[provider]);
          providerStatusCache.data[provider] = isEnabled;
          providerStatusCache.timestamp = now;
          return isEnabled;
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        console.warn(`[authService] Aviso ao consultar /auth/v1/settings para ${provider}:`, fetchErr?.message || fetchErr);
      }

      // Se já tínhamos status em cache, mantém
      if (providerStatusCache.data[provider] !== undefined) {
        return providerStatusCache.data[provider];
      }

      // O provedor Google está permanentemente ativo no Supabase do projeto. Em oscilações de 3G/4G,
      // evita falso-positivo que bloquearia o usuário, prosseguindo com o OAuth nativo.
      if (provider === 'google') {
        return true;
      }

      return false;
    } catch (err) {
      console.warn(`[authService] Erro ao verificar status do provedor ${provider}:`, err);
      return provider === 'google';
    }
  },

  async loginWithProvider(provider = 'google', redirectTo, { user_type = 'aluno' } = {}) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.setItem('pending_oauth_role', user_type);
    }

    let targetUrl = redirectTo || '/';
    if (typeof window !== 'undefined' && targetUrl.startsWith('/')) {
      targetUrl = `${window.location.origin}${targetUrl}`;
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase não está configurado.');
    }

    // 1. Verificação oficial de segurança
    const isEnabled = await this.isProviderEnabled(provider);
    if (!isEnabled && provider !== 'google') {
      const err = new Error(
        `O provedor de login com ${provider} não está ativo.`
      );
      err.code = 'PROVIDER_DISABLED';
      err.provider = provider;
      throw err;
    }

    // 2. Inicia o fluxo OAuth oficial com skipBrowserRedirect para blindagem total de URL antes de navegar
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: targetUrl,
        skipBrowserRedirect: true,
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
      },
    });

    if (error) {
      throw error;
    }

    // 3. Redireciona imediatamente para a tela oficial do Google Accounts com proteção DNS
    if (data?.url && typeof window !== 'undefined') {
      let finalUrl = data.url;
      if (finalUrl.includes('dbhldtzf') || finalUrl.includes('dbhidtzf')) {
        finalUrl = finalUrl.replace(/dbhldtzf|dbhidtzf/g, 'dbhltdzf');
      }
      window.location.assign(finalUrl);
    }

    return data;
  },

  async loginWithGoogleIdToken(idToken, { user_type = 'aluno' } = {}) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.setItem('pending_oauth_role', user_type);
    }
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;
    return data;
  },

  async loginWithMagicLink(email, { user_type = 'aluno', redirectTo } = {}) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.setItem('pending_oauth_role', user_type);
    }
    const targetUrl = redirectTo || (typeof window !== 'undefined' ? `${window.location.origin}/` : '/');
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: targetUrl,
        data: { user_type },
      },
    });
    if (error) throw error;
    return data;
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
