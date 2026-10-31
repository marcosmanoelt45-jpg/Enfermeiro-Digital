import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const navigate = useNavigate();
  const { checkUserAuth, isAuthenticated } = useAuth();
  const returnTo = safeReturnTo();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(returnTo || "/", { replace: true });
    }
  }, [isAuthenticated, navigate, returnTo]);
  const urlParams = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : null;
  const hashParams = typeof window !== "undefined" && window.location.hash
    ? new URLSearchParams(window.location.hash.replace(/^#/, ""))
    : null;
  const isRegistered = urlParams?.get("registered") === "true";
  const initialEmail = urlParams?.get("email") || "";
  const oauthErrorMsg =
    urlParams?.get("error_description") ||
    hashParams?.get("error_description") ||
    "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(oauthErrorMsg ? decodeURIComponent(oauthErrorMsg.replace(/\+/g, " ")) : "");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.login(email, password, { user_type: "aluno" });
      if (checkUserAuth) await checkUserAuth();
      navigate(returnTo || "/");
    } catch (err) {
      setError(err.message || "E-mail ou senha inválidos");
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
      setError(err.message || "Falha ao autenticar com o Google. Tente novamente.");
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
      icon={LogIn}
      title="Acessar Plataforma"
      subtitle="Entre com suas credenciais ou teste o modo demonstrativo"
      footer={
        <>
          Não tem uma conta?{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
          >
            Cadastre-se gratuitamente
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
            Continuar com o Google
          </>
        )}
      </Button>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-400 font-semibold tracking-wider">
            ou com seu e-mail
          </span>
        </div>
      </div>

      {isRegistered && !error && (
        <div className="mb-4 p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700/60 text-teal-900 dark:text-teal-200 text-sm flex items-start gap-2.5 shadow-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Conta criada com sucesso!</p>
            <p className="text-xs text-teal-800 dark:text-teal-300/90 mt-0.5">
              Digite suas credenciais para acessar sua conta no Enfere.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm leading-relaxed border border-destructive/20 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
              className="pl-10 h-12 rounded-xl dark:bg-slate-800/90 dark:border-slate-700 dark:text-slate-100"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-slate-700 dark:text-slate-200 font-medium">
              Senha
            </Label>
            <Link
              to="/forgot-password"
              className="text-xs text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl dark:bg-slate-800/90 dark:border-slate-700 dark:text-slate-100"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Acessando...
            </>
          ) : (
            "Entrar na Plataforma"
          )}
        </Button>
      </form>

      {/* ACESSO DE DEMONSTRAÇÃO IMEDIATA */}
      <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          Deseja experimentar sem cadastro?
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
    </AuthLayout>
  );
}
