import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import Comemoracoes from "@/components/feedback/Comemoracoes.jsx";
import SincronizacaoConta from "@/features/conta/SincronizacaoConta.jsx";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LazyMotion, MotionConfig } from 'framer-motion';

// Os componentes usam `m` (leve); o motor de animação, arraste e layout chega num chunk à parte.
const loadMotionFeatures = () => import('@/lib/motionFeatures').then((mod) => mod.default);
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import EnfereSplash, { removerAberturaEstatica } from '@/components/EnfereSplash';

// Páginas Principais Carregadas sob Demanda (Code-Splitting)
const StudentDashboard = lazy(() => import('@/pages/StudentDashboard'));
const CaseStudySimulator = lazy(() => import('@/pages/CaseStudySimulator'));
const CalculoPage = lazy(() => import('@/features/calculo/CalculoPage'));
const PrivacyPolicyLGPD = lazy(() => import('@/pages/PrivacyPolicyLGPD'));
const CaseLibrary = lazy(() => import('@/pages/CaseLibrary'));
const References = lazy(() => import('@/pages/References'));
const AudioAssessment = lazy(() => import('@/pages/AudioAssessment'));
const ExpressAssessment = lazy(() => import('@/pages/ExpressAssessment'));
const AIDashboard = lazy(() => import('@/pages/AIDashboard'));
const Patients = lazy(() => import('@/pages/Patients'));
const PatientDetail = lazy(() => import('@/pages/PatientDetail'));
const Conta = lazy(() => import('@/pages/Conta'));
// Vitrine das comemorações de ofensiva: só no `npm run dev` (o build de produção descarta o import).
const VitrineOfensivas = import.meta.env.DEV ? lazy(() => import('@/features/amigos/VitrineOfensivas.jsx')) : null;
const EditorAvatar = lazy(() => import('@/features/avatar/EditorAvatar.jsx'));
const SocialPage = lazy(() => import('@/features/social/SocialPage.jsx'));
const AdminPage = lazy(() => import('@/features/admin/AdminPage.jsx'));
const ConvitePage = lazy(() => import('@/features/social/ConvitePage.jsx'));
const PerfilAmigoPage = lazy(() => import('@/features/social/PerfilAmigoPage.jsx'));
const VitrineAvatar = import.meta.env.DEV ? lazy(() => import('@/features/avatar/VitrineAvatar.jsx')) : null;
const VitrineFolhas = import.meta.env.DEV ? lazy(() => import('@/features/cena/VitrineFolhas.jsx')) : null;
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const SbarHandoffLab = lazy(() => import('@/pages/SbarHandoffLab'));
const PlantaoPage = lazy(() => import('@/features/plantao/PlantaoPage'));
const RevisaoPage = lazy(() => import('@/features/revisao/RevisaoPage'));
// Só em desenvolvimento: no build de produção o import é descartado.
const ConsultaPage = lazy(() => import('@/features/consulta/ConsultaPage'));
const TecnicasPage = lazy(() => import('@/features/tecnicas/TecnicasPage'));
const QuestoesPage = lazy(() => import('@/features/questoes/QuestoesPage'));
const RelatorioPage = lazy(() => import('@/features/consulta/RelatorioPage'));
const DevCenaPage = import.meta.env.DEV ? lazy(() => import('@/features/cena/DevCenaPage')) : null;

// Rota antiga: leva à nova mantendo a query (ex.: ?procedimento= abre o vídeo direto). `aba` entra se a query não tiver.
function Redirecionar({ para, aba }) {
  const { search } = useLocation();
  const q = new URLSearchParams(search);
  if (aba && !q.has('aba')) q.set('aba', aba);
  const busca = q.toString();
  return <Navigate to={{ pathname: para, search: busca ? `?${busca}` : '' }} replace />;
}

// Carregando uma tela: só aparece se demorar mais de 0,3 s (antes o véu escuro com spinner piscava em toda
// troca rápida de tela) e com o fundo do app, sem véu translúcido.
const PageLoader = () => (
  <div className="enfere-page-loader fixed inset-0 z-50 flex items-center justify-center bg-[#0B131D]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#27394B] border-t-[#20D5B5]"></div>
  </div>
);

const SplashPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const query = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  // Modo de demonstração por URL só existe no ambiente de desenvolvimento.
  const isDemoAuth = import.meta.env.DEV && query ? (query.get("demo") === "auth" || query.get("auth") === "1") : false;
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
  const { user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
      path.startsWith("/convite") ||
      path.startsWith("/splash")
    ) {
      return false;
    }
    // Ao iniciar o site na raiz ou outras rotas, exibe a abertura
    return true;
  });

  // Sem abertura nesta visita: tira a logo estática do index.html (ela só aparece quando a abertura vai rodar,
  // mas fica a garantia).
  React.useEffect(() => {
    if (!showInitialSplash) removerAberturaEstatica();
  }, [showInitialSplash]);

  if (showInitialSplash) {
    // A abertura entra já durante a conferência do login (é ela que disfarça o carregamento). Os botões esperam
    // o login terminar (`aguardando`), para não mostrar "Começar" a quem já está logado.
    // Link direto para uma tela (ex.: /calculo-doses) mantém o destino depois do splash.
    const destino = `${location.pathname}${location.search}`;
    const returnTo = destino !== "/" ? `?returnTo=${encodeURIComponent(destino)}` : "";
    return (
      <EnfereSplash
        aguardando={isLoadingPublicSettings || isLoadingAuth}
        isAuthenticated={isAuthenticated}
        userName={user?.user_metadata?.full_name || user?.full_name || user?.email}
        onGetStarted={() => {
          sessionStorage.setItem("enfere_splash_passed", "true");
          setShowInitialSplash(false);
          if (!isAuthenticated) navigate(`/register${returnTo}`);
        }}
        onHaveAccount={() => {
          sessionStorage.setItem("enfere_splash_passed", "true");
          setShowInitialSplash(false);
          navigate(`/login${returnTo}`);
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
      return <Navigate to={`/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
    }
  }

  return (
    <Suspense fallback={<PageLoader />}>
      {/* A tela troca na hora: a página nova começando apagada (opacidade 0) piscava a cada troca de tela.
          Sem transform num ancestral (quebraria os elementos position:fixed: dock, folhas inferiores). */}
      <div key={location.pathname}>
      <Routes>
        <Route path="/splash" element={<SplashPage />} />
        {/* Link de convite de amigo: abre sem login (mostra quem convidou e leva para entrar/criar conta). */}
        <Route path="/convite/:codigo" element={<ConvitePage />} />
        {VitrineOfensivas && <Route path="/dev/ofensivas" element={<VitrineOfensivas />} />}
        {VitrineAvatar && <Route path="/dev/avatar" element={<VitrineAvatar />} />}
        {VitrineFolhas && <Route path="/dev/folhas" element={<VitrineFolhas />} />}
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
          <Route path="/montar-caso" element={<Redirecionar para="/consulta" />} />
          <Route path="/case-studio" element={<Redirecionar para="/consulta" />} />
          <Route path="/simulador-casos" element={<CaseStudySimulator />} />
          <Route path="/case-study" element={<CaseStudySimulator />} />
          <Route path="/laboratorio-calculos" element={<CalculoPage />} />
          <Route path="/calculo-doses" element={<Redirecionar para="/laboratorio-calculos" />} />
          <Route path="/dosage-lab" element={<Redirecionar para="/laboratorio-calculos" />} />
          <Route path="/sistemas-organicos" element={<Navigate to="/" replace />} />
          <Route path="/systems-assessment" element={<Navigate to="/" replace />} />
          <Route path="/banco-casos" element={<CaseLibrary />} />
          <Route path="/referencias" element={<References />} />
          <Route path="/turmas" element={<Navigate to="/" replace />} />
          <Route path="/turma/:id" element={<Navigate to="/" replace />} />
          <Route path="/turma/:id/nova-atividade" element={<Navigate to="/" replace />} />
          <Route path="/assignment/:id" element={<Navigate to="/" replace />} />
          {DevCenaPage && <Route path="/dev/cena" element={<DevCenaPage />} />}
          <Route path="/tecnicas" element={<TecnicasPage secao="videos" />} />
          <Route path="/minijogos" element={<TecnicasPage secao="minijogos" />} />
          <Route path="/questoes" element={<QuestoesPage />} />
          <Route path="/consulta" element={<ConsultaPage />} />
          <Route path="/consulta/relatorio/:sessaoId" element={<RelatorioPage />} />
          <Route path="/passagem-plantao" element={<PlantaoPage />} />
          <Route path="/plantao/gravacao" element={<SbarHandoffLab />} />
          <Route path="/passagem-plantao-sbar" element={<Redirecionar para="/passagem-plantao" />} />
          <Route path="/sbar" element={<Redirecionar para="/passagem-plantao" />} />
          <Route path="/sbar-lab" element={<Redirecionar para="/passagem-plantao" />} />
          <Route path="/procedimentos" element={<Redirecionar para="/tecnicas" />} />
          <Route path="/procedimentos-lab" element={<Redirecionar para="/tecnicas" />} />
          <Route path="/skills-lab" element={<Redirecionar para="/tecnicas" />} />
          <Route path="/videoteca" element={<Redirecionar para="/tecnicas" />} />
          <Route path="/videochamada" element={<Redirecionar para="/consulta" />} />
          <Route path="/atendimento-voz" element={<Redirecionar para="/consulta" />} />
          <Route path="/revisao" element={<RevisaoPage />} />

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
          <Route path="/avatar" element={<EditorAvatar />} />
          <Route path="/social" element={<SocialPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/perfil/:id" element={<PerfilAmigoPage />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      </div>
    </Suspense>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <LazyMotion features={loadMotionFeatures}>
      <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ScrollToTop />
              <AuthenticatedApp />
            </Router>
            <Toaster />
            <Comemoracoes />
            <SincronizacaoConta />
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
      </MotionConfig>
      </LazyMotion>
    </ErrorBoundary>
  );
}

export default App;
