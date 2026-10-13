import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';

// Páginas Principais da Plataforma do Estudante de Enfermagem
import StudentDashboard from '@/pages/StudentDashboard';
import CaseStudySimulator from '@/pages/CaseStudySimulator';
import MedicationDosageLab from '@/pages/MedicationDosageLab';
import SystemsAssessmentLab from '@/pages/SystemsAssessmentLab';
import PrivacyPolicyLGPD from '@/pages/PrivacyPolicyLGPD';
import CaseLibrary from '@/pages/CaseLibrary';
import References from '@/pages/References';
import Turmas from '@/pages/Turmas';
import TurmaDetail from '@/pages/TurmaDetail';
import AssignmentAnswer from '@/pages/AssignmentAnswer';
import CaseBuilder from '@/pages/CaseBuilder';
import Conta from '@/pages/Conta';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacidade-lgpd" element={<PrivacyPolicyLGPD />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        {/* Hub Principal do Estudante e Módulos Educacionais */}
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/simulador-casos" element={<CaseStudySimulator />} />
        <Route path="/laboratorio-calculos" element={<MedicationDosageLab />} />
        <Route path="/sistemas-organicos" element={<SystemsAssessmentLab />} />
        <Route path="/banco-casos" element={<CaseLibrary />} />
        <Route path="/referencias" element={<References />} />
        <Route path="/turmas" element={<Turmas />} />
        <Route path="/turma/:id" element={<TurmaDetail />} />
        <Route path="/turma/:id/nova-atividade" element={<CaseBuilder />} />
        <Route path="/assignment/:id" element={<AssignmentAnswer />} />
        <Route path="/conta" element={<Conta />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
