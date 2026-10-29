import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import GoogleIcon from "@/components/GoogleIcon";
import {
  X,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
} from "lucide-react";

export default function GoogleOAuthModal({
  isOpen,
  onClose,
  onRetry = null,
}) {
  const [copiedCallback, setCopiedCallback] = useState(false);

  if (!isOpen) return null;

  const callbackUrl = "https://xwqgyvqofxdqdbhltdzf.supabase.co/auth/v1/callback";

  const handleCopyCallback = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopiedCallback(true);
    setTimeout(() => setCopiedCallback(false), 2500);
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
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3
              id="google-modal-title"
              className="font-bold text-base text-slate-900 dark:text-slate-100 leading-tight"
            >
              Configuração do Google OAuth (Supabase)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Instruções de autenticação direta com o Google Cloud
            </p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl text-xs space-y-2.5 text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200 dark:border-slate-700/60">
          <p>
            Para que o login com o <strong>Google</strong> funcione automaticamente com seleção de contas no navegador, o provedor precisa estar habilitado no painel do Supabase:
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
              Insira o <strong>Client ID</strong> e <strong>Client Secret</strong> gerados no console do Google Cloud.
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

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs rounded-xl"
          >
            Fechar
          </Button>
          {onRetry && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onClose();
                onRetry();
              }}
              className="text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
            >
              <GoogleIcon className="w-3.5 h-3.5 mr-1.5" />
              Tentar Novamente com Google
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
