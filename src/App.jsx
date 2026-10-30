import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import EnfereSplash from '@/components/EnfereSplash';

// Páginas Principais Carregadas sob Demanda (Code-Splitting)
const StudentDashboard = lazy(() => import('@/pages/StudentDashboard'));
const CaseStudySimulator = lazy(() => import('@/pages/CaseStudySimulator'));
const CaseStudio = lazy(() => import('@/pages/CaseStudio'));
const MedicationDosageLab = lazy(() => import('@/pages/MedicationDosageLab'));
const PrivacyPolicyLGPD = lazy(() => import('@/pages/PrivacyPolicyLGPD'));
const CaseLibrary = lazy(() => import('@/pages/CaseLibrary'));
const References = lazy(() => import('@/pages/References'));
const AudioAssessment = lazy(() => import('@/pages/AudioAssessment'));
const ExpressAssessment = lazy(() => import('@/pages/ExpressAssessment'));
const AIDashboard = lazy(() => import('@/pages/AIDashboard'));
const Patients = lazy(() => import('@/pages/Patients'));
const PatientDetail = lazy(() => import('@/pages/PatientDetail'));
const Conta = lazy(() => import('@/pages/Conta'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const SbarHandoffLab = lazy(() => import('@/pages/SbarHandoffLab'));
const ProcedimentosLab = lazy(() => import('@/pages/ProcedimentosLab'));
const Videochamada = lazy(() => import('@/pages/Videochamada'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xs z-50">
    <div className="w-8 h-8 border-4 border-teal-200 dark:border-teal-900 border-t-teal-600 dark:border-t-teal-400 rounded-full animate-spin"></div>
  </div>
);

const SplashPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const query = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const isDemoAuth = query ? (query.get("demo") === "auth" || query.get("auth") === "1") : false;
  const demoUserName = query ? (query.get("user") || "Marcos") : "Marcos";

  const effectiveAuth = isAuthenticated || isDemoAuth;
  const effectiveName = user?.user_metadata?.full_name || user?.full_name || user?.email || (isDemoAuth ? demoUserName : "");

  return (
    <EnfereSplash
      isAuthenticated={effectiveAuth}
      userName={effectiveName}
      onGetStarted={() => {
        if (effectiveAuth) {
          navigate("/");
        } else {
          navigate("/register");
        }
      }}
      onHaveAccount={() => navigate("/login")}
    />
  );
};

const AuthenticatedApp = () => {
  const { user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const navigate = useNavigate();
  const [showInitialSplash, setShowInitialSplash] = React.useState(() => {
    if (typeof window === "undefined") return false;
    const path = window.location.pathname;
    const hash = window.location.hash || "";
    const search = new URLSearchParams(window.location.search);
    if (
      search.get("nosplash") === "1" ||
      sessionStorage.getItem("enfere_splash_passed") ||
      hash.includes("access_token=") ||
      search.has("code")
    ) {
      sessionStorage.setItem("enfere_splash_passed", "true");
      return false;
    }
    // Se o usuário estiver acessando rotas de login ou registro, não sobrepõe a animação de splash
    if (
      path.startsWith("/login") ||
      path.startsWith("/register") ||
      path.startsWith("/forgot-password") ||
      path.startsWith("/reset-password") ||
      path.startsWith("/splash")
    ) {
      return false;
    }
    // Ao iniciar o site na raiz ou outras rotas, exibe a abertura
    return true;
  });

  if (showInitialSplash) {
    return (
      <EnfereSplash
        isAuthenticated={isAuthenticated}
        userName={user?.user_metadata?.full_name || user?.full_name || user?.email}
        onGetStarted={() => {
          sessionStorage.setItem("enfere_splash_passed", "true");
          setShowInitialSplash(false);
          if (isAuthenticated) {
            navigate("/");
          } else {
            navigate("/register");
          }
        }}
        onHaveAccount={() => {
          sessionStorage.setItem("enfere_splash_passed", "true");
          setShowInitialSplash(false);
          navigate("/login");
        }}
      />
    );
  }

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <PageLoader />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/splash" element={<SplashPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacidade-lgpd" element={<PrivacyPolicyLGPD />} />
        <Route path="/faq" element={<PrivacyPolicyLGPD />} />
        <Route path="/ajuda" element={<PrivacyPolicyLGPD />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<SplashPage />} />}>
          {/* Hub Principal do Estudante e Módulos Educacionais */}
          <Route path="/" element={<StudentDashboard />} />
          <Route path="/montar-caso" element={<CaseStudio />} />
          <Route path="/case-studio" element={<CaseStudio />} />
          <Route path="/simulador-casos" element={<CaseStudySimulator />} />
          <Route path="/case-study" element={<CaseStudySimulator />} />
          <Route path="/laboratorio-calculos" element={<MedicationDosageLab />} />
          <Route path="/calculo-doses" element={<MedicationDosageLab />} />
          <Route path="/dosage-lab" element={<MedicationDosageLab />} />
          <Route path="/sistemas-organicos" element={<Navigate to="/" replace />} />
          <Route path="/systems-assessment" element={<Navigate to="/" replace />} />
          <Route path="/banco-casos" element={<CaseLibrary />} />
          <Route path="/referencias" element={<References />} />
          <Route path="/turmas" element={<Navigate to="/" replace />} />
          <Route path="/turma/:id" element={<Navigate to="/" replace />} />
          <Route path="/turma/:id/nova-atividade" element={<Navigate to="/" replace />} />
          <Route path="/assignment/:id" element={<Navigate to="/" replace />} />
          <Route path="/passagem-plantao" element={<SbarHandoffLab />} />
          <Route path="/passagem-plantao-sbar" element={<SbarHandoffLab />} />
          <Route path="/sbar" element={<SbarHandoffLab />} />
          <Route path="/sbar-lab" element={<SbarHandoffLab />} />
          <Route path="/procedimentos" element={<ProcedimentosLab />} />
          <Route path="/procedimentos-lab" element={<ProcedimentosLab />} />
          <Route path="/skills-lab" element={<ProcedimentosLab />} />
          <Route path="/videoteca" element={<ProcedimentosLab />} />
          <Route path="/videochamada" element={<Videochamada />} />
          <Route path="/atendimento-voz" element={<Videochamada />} />

          {/* Rotas de Áudio e Avaliação Assistencial Hospitalar */}
          <Route path="/avaliacao-audio" element={<AudioAssessment />} />
          <Route path="/audio-assessment" element={<AudioAssessment />} />
          <Route path="/patient/:id/audio-assessment" element={<AudioAssessment />} />
          <Route path="/patient/:id/assessment" element={<ExpressAssessment />} />
          <Route path="/patient/:id" element={<PatientDetail />} />
          <Route path="/assessment/:id/ai" element={<AIDashboard />} />
          <Route path="/ai-dashboard" element={<AIDashboard />} />
          <Route path="/pacientes" element={<Patients />} />

          <Route path="/conta" element={<Conta />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ScrollToTop />
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
