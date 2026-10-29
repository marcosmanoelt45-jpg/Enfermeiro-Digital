import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Coluna 1: Marca & Propósito */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl overflow-hidden shadow-md shadow-emerald-500/20 ring-1 ring-emerald-500/30 shrink-0">
                <img
                  src="/goti/goti-face-transparent.png"
                  alt="Goti"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Enfere
                </span>
                <span className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Raciocínio Clínico & Simulação de Enfermagem
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              Plataforma de ensino e simulação clínica fundamentada no Processo de Enfermagem (Resolução COFEN nº 736/2024), passagens de plantão no modelo SBAR e suporte interativo de alta fidelidade.
            </p>
          </div>

          {/* Coluna 2: Navegação Rápida */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Navegação
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/casos" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                  Casos Clínicos
                </Link>
              </li>
              <li>
                <Link to="/procedimentos-lab" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                  Procedimentos & Habilidades
                </Link>
              </li>
              <li>
                <Link to="/sbar-lab" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                  Laboratório SBAR
                </Link>
              </li>
              <li>
                <Link to="/referencias" className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                  Diretrizes & Referências
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Institucional & Conformidade */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Legal & Ética
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  to="/privacidade-lgpd"
                  className="inline-flex items-center gap-1.5 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Privacidade & LGPD</span>
                </Link>
              </li>
              <li>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Em conformidade com a Resolução COFEN nº 736/2024.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Linha Inferior: Direitos Autorais e Créditos */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>
            © {currentYear} Enfere. Todos os direitos reservados.
          </p>
          <p className="flex items-center gap-1 text-center sm:text-right">
            <span>Criador e Detentor dos Direitos:</span>
            <strong className="text-slate-800 dark:text-slate-200 font-semibold">
              Marcos Manoel Tavares Neumann
            </strong>
          </p>
        </div>
      </div>
    </footer>
  );
}
