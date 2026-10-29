import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, User, Loader2, Sparkles } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import GoogleOAuthModal from "@/components/auth/GoogleOAuthModal";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Register() {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const returnTo = safeReturnTo();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleSetupModal, setShowGoogleSetupModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("As senhas digitadas não coincidem");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    setLoading(true);
    try {
      await authService.register(email, password, {
        full_name: fullName.trim() || "Estudante de Enfermagem",
        user_type: "aluno",
      });
      // Direciona para a área de login com mensagem de sucesso
      navigate(`/login?registered=true&email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err.message || "Falha no cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("enfermeiro_digital_local_user");
      }
      await authService.loginWithProvider("google", returnTo, { user_type: "aluno" });
    } catch (err) {
      if (err.code === "PROVIDER_DISABLED" || err.message?.includes("ativado no painel do Supabase")) {
        setShowGoogleSetupModal(true);
      } else {
        setError(err.message || "Falha ao autenticar com Google");
      }
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await authService.loginDemo();
      if (checkUserAuth) await checkUserAuth();
      navigate(returnTo || "/");
    } catch (err) {
      setError(err.message || "Erro no acesso demonstrativo");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title="Criar sua Conta"
      subtitle="Cadastre-se para acessar os simuladores e módulos clínicos"
      footer={
        <>
          Já tem conta?{" "}
          <Link
            to={"/login" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
          >
            Acessar minha conta
          </Link>
        </>
      }
    >
      {/* BOTÃO GOOGLE */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-sm font-semibold mb-5 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition shadow-2xs"
        onClick={handleGoogle}
        disabled={loading || googleLoading}
      >
        {googleLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin text-teal-600" />
            Conectando com o Google...
          </>
        ) : (
          <>
            <GoogleIcon className="w-5 h-5 mr-2 shrink-0" />
            Cadastrar com o Google
          </>
        )}
      </Button>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-400 font-semibold tracking-wider">
            ou preencha os dados
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm leading-relaxed border border-destructive/20 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="fullname" className="text-slate-700 dark:text-slate-200 font-medium">
            Nome Completo
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <Input
              id="fullname"
              type="text"
              placeholder="Ana Clara Rodrigues"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="pl-10 h-11 rounded-xl dark:bg-slate-800/90 dark:border-slate-700 dark:text-slate-100"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-700 dark:text-slate-200 font-medium">
            E-mail
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11 rounded-xl dark:bg-slate-800/90 dark:border-slate-700 dark:text-slate-100"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-slate-700 dark:text-slate-200 font-medium">
            Senha
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-11 rounded-xl dark:bg-slate-800/90 dark:border-slate-700 dark:text-slate-100"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-slate-700 dark:text-slate-200 font-medium">
            Confirmar senha
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-11 rounded-xl dark:bg-slate-800/90 dark:border-slate-700 dark:text-slate-100"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition mt-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar Minha Conta no Enfere"
          )}
        </Button>
      </form>

      {/* ACESSO DE DEMONSTRAÇÃO IMEDIATA */}
      <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          Quer testar a plataforma agora?
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full text-xs rounded-xl h-11 border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-bold shadow-2xs transition"
          onClick={handleDemoLogin}
          disabled={loading}
        >
          <Sparkles className="w-4 h-4 mr-2 text-teal-600 dark:text-teal-400" />
          Acessar Modo Demonstrativo Imediato
        </Button>
      </div>

      <GoogleOAuthModal
        isOpen={showGoogleSetupModal}
        onClose={() => setShowGoogleSetupModal(false)}
        onRetry={handleGoogle}
      />
    </AuthLayout>
  );
}
