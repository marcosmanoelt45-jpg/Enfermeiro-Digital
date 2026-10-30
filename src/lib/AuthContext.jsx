import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '@/services/authService';

const AuthContext = createContext();

function hasPendingSupabaseOrOAuthSession() {
  try {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (
        hash.includes('access_token=') ||
        hash.includes('refresh_token=') ||
        search.includes('code=')
      ) {
        return true;
      }
    }
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          return true;
        }
      }
    }
  } catch {}
  return false;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const s = typeof localStorage !== 'undefined' ? localStorage.getItem('enfermeiro_digital_local_user') : null;
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return Boolean(typeof localStorage !== 'undefined' && localStorage.getItem('enfermeiro_digital_local_user'));
    } catch { return false; }
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(() => hasPendingSupabaseOrOAuthSession());
  const [isLoadingPublicSettings] = useState(false);
  const [authError] = useState(null);
  const [authChecked, setAuthChecked] = useState(() => !hasPendingSupabaseOrOAuthSession());
  const [appPublicSettings] = useState({ id: 'enfermeiro-digital' });

  useEffect(() => {
    checkUserAuth();

    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const fallbackName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split('@')[0] ||
          'Estudante de Enfermagem';
        setUser((prev) => prev || {
          ...session.user,
          name: fallbackName,
          full_name: fallbackName,
          role: session.user.user_metadata?.user_type || 'aluno',
          user_type: session.user.user_metadata?.user_type || 'aluno',
        });
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        setAuthChecked(true);

        const fullUser = await authService.getCurrentUser();
        if (fullUser) {
          setUser(fullUser);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.warn('Erro ao verificar autenticação:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = async (shouldRedirect = true) => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Erro ao deslogar:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      if (shouldRedirect) {
        window.location.href = '/login';
      }
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState: checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
