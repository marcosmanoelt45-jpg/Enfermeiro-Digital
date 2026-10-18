import React from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary capturou uma exceção:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 text-slate-800 dark:text-slate-100">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Ops! Ocorreu um imprevisto
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Detectamos uma falha temporária ao carregar este conteúdo clínico. Você pode tentar recarregar ou retornar com segurança para o início.
              </p>
            </div>

            {import.meta.env?.DEV && this.state.error && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-left overflow-auto max-h-32 text-[11px] font-mono text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                onClick={this.handleReload}
                className="flex-1 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold h-11 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Recarregar
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1 rounded-2xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold h-11 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> Ir para Início
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
