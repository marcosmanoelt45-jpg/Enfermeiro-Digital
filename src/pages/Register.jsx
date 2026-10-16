import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, User, Loader2, GraduationCap, Users } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Register() {
  const returnTo = safeReturnTo();
  const roleParam = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("role")
    : null;

  const [userType, setUserType] = useState(roleParam === "professor" ? "professor" : "aluno");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        full_name: fullName.trim() || (userType === "professor" ? "Professor" : "Aluno"),
        user_type: userType,
      });
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Falha no cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await authService.loginWithProvider("google", returnTo, { user_type: userType });
    } catch (err) {
      setError(err.message || "Falha ao autenticar com Google");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title="Criar sua Conta"
      subtitle="Cadastre-se para acessar simuladores e turmas"
      footer={
        <>
          Já tem conta?{" "}
          <Link
            to={
              "/login?role=" +
              userType +
              (returnTo !== "/" ? "&returnTo=" + encodeURIComponent(returnTo) : "")
            }
            className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
          >
            Entrar como {userType === "professor" ? "Professor" : "Aluno"}
          </Link>
        </>
      }
    >
      {/* SELETOR DE PERFIL: ALUNO vs PROFESSOR */}
      <div className="mb-5 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Você é Aluno ou Professor?
          </Label>
          <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
            {userType === "professor" ? "Docente" : "Estudante"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setUserType("aluno")}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all text-center relative ${
              userType === "aluno"
                ? "border-teal-600 bg-teal-50/90 dark:bg-teal-950/50 shadow-xs ring-1 ring-teal-600/30"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition ${
                userType === "aluno"
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
            <span
              className={`text-sm font-bold block leading-tight ${
                userType === "aluno"
                  ? "text-teal-900 dark:text-teal-200"
                  : "text-slate-700 dark:text-slate-300"
              }`}
            >
              Sou Aluno
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
              Entrar em turmas e responder
            </span>
          </button>

          <button
            type="button"
            onClick={() => setUserType("professor")}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all text-center relative ${
              userType === "professor"
                ? "border-teal-600 bg-teal-50/90 dark:bg-teal-950/50 shadow-xs ring-1 ring-teal-600/30"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition ${
                userType === "professor"
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <span
              className={`text-sm font-bold block leading-tight ${
                userType === "professor"
                  ? "text-teal-900 dark:text-teal-200"
                  : "text-slate-700 dark:text-slate-300"
              }`}
            >
              Sou Professor
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
              Gerenciar turmas e criar casos
            </span>
          </button>
        </div>
      </div>

      {/* BOTÃO GOOGLE */}
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-sm font-semibold mb-5 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition shadow-2xs"
        onClick={handleGoogle}
        disabled={loading}
      >
        <GoogleIcon className="w-5 h-5 mr-2 shrink-0" />
        Cadastrar com Google como {userType === "professor" ? "Professor" : "Aluno"}
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
              placeholder={userType === "professor" ? "Prof. Dr. Marcos Silva" : "Ana Clara Rodrigues"}
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
              placeholder="seu-email@universidade.edu.br"
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
            `Criar conta como ${userType === "professor" ? "Professor" : "Aluno"}`
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
