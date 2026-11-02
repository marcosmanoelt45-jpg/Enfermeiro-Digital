import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, MailCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.resetPasswordRequest(email.trim().toLowerCase());
    } catch {
      // Sempre mostra a mesma mensagem: não revela se o e-mail tem conta.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={sent ? MailCheck : Mail}
      title={sent ? "Confira seu e-mail" : "Redefinir senha"}
      subtitle={sent ? "Enviamos um link, se o e-mail tiver conta" : "Vamos enviar um link para você criar uma nova senha"}
      footer={
        <Link to="/login" className="text-[#20D5B5] font-bold hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />
          Voltar para o login
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-[#9FB3C6] text-center">
          Se existir uma conta com <strong className="text-[#EAF2F8]">{email}</strong>, o link chega em alguns minutos. Olhe também a caixa de spam.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail cadastrado</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            {loading ? "Enviando…" : "Enviar link"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
