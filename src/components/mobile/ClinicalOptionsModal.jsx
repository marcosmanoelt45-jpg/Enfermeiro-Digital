import React from 'react';
import {
  X,
  Type,
  Vibrate,
  Eye,
  Sliders,
  Check,
  Sparkles
} from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

export default function ClinicalOptionsModal({ isOpen, onClose }) {
  const {
    fontSize,
    setFontSize,
    nightShiftMode,
    setNightShiftMode,
    hapticFeedback,
    setHapticFeedback,
    triggerHaptic
  } = useTheme();


  if (!isOpen) return null;

  const fontOptions = [
    { id: 'normal', label: 'Padrão', size: '14px' },
    { id: 'large', label: 'Confortável', size: '16px' },
    { id: 'xlarge', label: 'Ampla', size: '18px' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div
        className="w-full sm:max-w-lg bg-[#131F2E] border border-[#1F3045] rounded-t-[32px] sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Painel */}
        <div className="flex items-center justify-between p-5 border-b border-[#1F3045]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/60">
              <Sliders className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Ajustes & Preferências
              </h3>
              <p className="text-xs text-[#9FB3C6]">
                Personalização da experiência clínica móvel
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic(20);
              onClose();
            }}
            className="p-2 rounded-xl text-[#9FB3C6] hover:text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-5 space-y-6 overflow-y-auto no-scrollbar">


          {/* Seção 2: Modo Plantão Noturno (Anti-Ofuscamento) */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-[#1F3045]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-100 block">
                  Modo Plantão Noturno
                </span>
                <span className="text-[11px] text-[#9FB3C6] block">
                  Reduz brilho em rounds noturnos de leitos
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setNightShiftMode(!nightShiftMode);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                nightShiftMode ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-[#131F2E] shadow-sm transform transition-transform ${
                  nightShiftMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Seção 3: Acessibilidade e Tamanho da Fonte */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" /> Tamanho da Fonte de Leitura
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-[#3DD68C] border border-emerald-800">
                {fontSize === 'normal' ? '14px Ativo' : fontSize === 'large' ? '16px Ativo' : '18px Ativo'}
              </span>
            </div>
            <p className="text-[11px] text-[#9FB3C6]">
              Escalona instantaneamente o tamanho de textos, prescrições e anotações em todo o app.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {fontOptions.map((opt) => {
                const isActive = fontSize === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic(30);
                      setFontSize(opt.id);
                    }}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm ring-2 ring-emerald-500/30'
                        : 'bg-slate-800/70 border-[#1F3045] text-slate-300 hover:border-emerald-300'
                    }`}
                  >
                    <span className="text-xs block">{opt.label}</span>
                    <span className="text-[10px] opacity-80 block">{opt.size}</span>
                  </button>
                );
              })}
            </div>

            {/* Amostra em Tempo Real do Tamanho da Fonte */}
            <div className="p-3 rounded-2xl bg-slate-800/70 border border-[#1F3045] transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#9FB3C6]">
                  Prévia em Tempo Real
                </span>
                <span className="text-[10px] font-semibold text-emerald-400">
                  Exemplo de Prescrição Médica
                </span>
              </div>
              <p
                className="text-slate-100 font-medium transition-all leading-snug"
                style={{
                  fontSize: fontSize === 'normal' ? '14px' : fontSize === 'large' ? '16.5px' : '19px'
                }}
              >
                “Paciente em repouso no leito. Prescrito Ceftriaxona 1g EV 12/12h e controle rigoroso de SSVV.”
              </p>
            </div>
          </div>

          {/* Seção 4: Retorno Tátil e Vibração */}
          <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-[#1F3045] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  hapticFeedback
                    ? 'bg-emerald-950/80 text-emerald-400'
                    : 'bg-slate-800 text-[#9FB3C6]'
                }`}>
                  <Vibrate className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-100 block">
                    Feedback tátil (vibração)
                  </span>
                  <span className="text-[11px] text-[#9FB3C6] block">
                    Vibração e retorno audível em ações e gravações
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = !hapticFeedback;
                    setHapticFeedback(next);
                    if (next) triggerHaptic(40);
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                    hapticFeedback ? 'bg-emerald-600' : 'bg-slate-700'
                  }`}
                  aria-label="Alternar Feedback Tátil"
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-[#131F2E] shadow-sm transform transition-transform ${
                      hapticFeedback ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Teste Imediato de Feedback */}
            <div className="pt-1 flex items-center justify-between border-t border-slate-700/60 text-xs">
              <span className={`text-[11px] font-medium ${
                hapticFeedback ? 'text-emerald-400' : 'text-[#9FB3C6]'
              }`}>
                {hapticFeedback ? '✓ Vibração ativada (Android)' : '✕ Feedback desativado'}
              </span>

              {hapticFeedback && (
                <button
                  type="button"
                  onClick={() => triggerHaptic(50)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800 text-[#3DD68C] text-[10px] font-bold hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Testar Toque
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Rodapé do Modal com Direitos e Autoria */}
        <div className="p-4 bg-[#0E1722] border-t border-[#1F3045] space-y-2">
          <button
            onClick={() => {
              triggerHaptic(20);
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border-b-4 border-b-emerald-800 text-white text-xs sm:text-sm font-extrabold shadow-md active:translate-y-1 active:border-b-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Salvar & Concluir</span>
          </button>
          <p className="text-[10px] text-center text-[#9FB3C6] font-medium">
            Criador e Detentor dos Direitos: <strong className="text-slate-300">Marcos Manoel Tavares Neumann</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
