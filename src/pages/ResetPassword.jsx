import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import PasswordChecklist from "@/components/auth/PasswordChecklist";
import { passwordPolicyError } from "@/lib/passwordPolicy";

/**
 * O link de recuperação do Supabase chega aqui com ?code= (PKCE) ou #access_token=.
 * O AuthContext troca isso por uma sessão de recuperação; esta tela só precisa dessa sessão.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoadingAuth } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const policyError = passwordPolicyError(newPassword);
    if (policyError) {
      setError(policyError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas digitadas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await authService.updatePassword(newPassword);
      setDone(true);
      setTimeout(() => navigate("/", { replace: true }), 1500);
    } catch (err) {
      setError(err.message || "Não foi possível atualizar a senha.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoadingAuth && !isAuthenticated) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Link inválido ou expirado"
        subtitle="Este link de redefinição não é mais válido"
        footer={
          <Link to="/forgot-password" className="text-[#20D5B5] font-bold hover:underline">
            Pedir um novo link
          </Link>
        }
      >
        <p className="text-sm text-[#9FB3C6] text-center">
          Os links de redefinição valem por pouco tempo e só podem ser usados uma vez. Peça um novo pelo e-mail cadastrado.
        </p>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout icon={CheckCircle2} title="Senha atualizada" subtitle="Tudo certo! Entrando no Enfere…">
        <p className="text-sm text-[#9FB3C6] text-center">Use a nova senha nos próximos acessos.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={Lock} title="Nova senha" subtitle="Escolha uma senha forte para sua conta">
      {error && (
        <div role="alert" className="mb-4 p-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF8F8F] text-sm font-semibold">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="Crie uma senha forte"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              aria-describedby="password-rules"
              className="pl-10 h-12"
              required
            />
          </div>
          {newPassword.length > 0 && <PasswordChecklist id="password-rules" password={newPassword} />}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirmar nova senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {loading ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </form>
    </AuthLayout>
  );
}
