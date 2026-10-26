import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/authService";
import GoogleIcon from "@/components/GoogleIcon";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function GoogleOAuthModal({
  isOpen,
  onClose,
  userType = "aluno",
  returnTo = "/",
  initialEmail = "",
}) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const callbackUrl = "https://xwqgyvqofxdqdbhltdzf.supabase.co/auth/v1/callback";

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2500);
  };

  const handleSendMagicLink = async () => {
    if (!email || !email.includes("@")) {
      setError("Digite um e-mail válido para receber o link de acesso.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.loginWithMagicLink(email, {
        user_type: userType,
        redirectTo: returnTo,
      });
      setMagicLinkSent(true);
    } catch (err) {
      setError(err.message || "Falha ao enviar link de acesso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <GoogleIcon className="w-6 h-6" />
          </div>
          <div>
            <h3
              id="google-modal-title"
              className="font-bold text-base text-slate-900 dark:text-slate-100 leading-tight"
            >
              Como Exibir as Contas Google do Navegador
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Conexão segura direta com a API do Google Cloud
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-xs space-y-2.5 text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-slate-700/60">
          <p>
            Para que a janela do Google apareça com{" "}
            <strong>todas as suas contas atualmente conectadas no navegador</strong>{" "}
            e você possa escolher com qual entrar, o provedor Google precisa estar
            ativado no seu painel do Supabase com as credenciais do Google Cloud:
          </p>
          <ol className="list-decimal pl-4 space-y-1.5 font-medium">
            <li>
              Acesse o painel do Supabase:{" "}
              <a
                href="https://supabase.com/dashboard/project/xwqgyvqofxdqdbhltdzf/auth/providers"
                target="_blank"
                rel="noreferrer"
                className="text-teal-600 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1"
              >
                Painel de Provedores <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Ative a chave <strong>Google</strong> (Enable Google).</li>
            <li>
              Cole o <strong>Client ID</strong> e <strong>Client Secret</strong>{" "}
              obtidos no Google Cloud Console.
            </li>
            <li>
              URL de redirecionamento autorizada do seu projeto:
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-slate-200 dark:bg-slate-900 rounded font-mono text-[11px] select-all break-all text-teal-800 dark:text-teal-300">
                  {callbackUrl}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCallback}
                  className="h-8 px-2.5 text-xs shrink-0 font-medium"
                >
                  {copiedCallback ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-600 mr-1" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </li>
          </ol>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ou acesse agora com seu próprio e-mail real (Link de Acesso):
          </p>
          {error && (
            <div className="p-2 rounded bg-destructive/10 text-destructive text-xs">
              {error}
            </div>
          )}
          {magicLinkSent ? (
            <div className="p-3 bg-teal-50 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-700 rounded-xl text-xs text-teal-900 dark:text-teal-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              Link de login enviado para {email}! Verifique sua caixa de entrada.
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="seu.email.real@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-xs rounded-xl dark:bg-slate-800"
              />
              <Button
                type="button"
                onClick={handleSendMagicLink}
                disabled={loading || !email}
                className="h-10 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shrink-0"
              >
                {loading ? (
                  "Enviando..."
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Enviar Link
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs rounded-xl"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
