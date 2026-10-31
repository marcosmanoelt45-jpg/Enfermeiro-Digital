import React, { useState } from "react";
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight
} from "lucide-react";

const LETRAS = ["A", "B", "C", "D", "E"];

export default function PlurallQuestionCard({
  questao,
  numQuestao = 1,
  totalQuestoes = 8,
  selectedChoice = null,
  onSelectChoice,
  opcoesIncorretasTentadas = [],
  tentativas = 0, // 0 = ainda não verificou, 1 = errou a primeira, 2 = errou a segunda ou acertou
  status = "aberta", // 'aberta' | 'amarela' | 'vermelha' | 'verde'
  isFinalizada: propIsFinalizada = false,
  onVerificar,
  onProxima,
  isReadOnly = false,
  isLastQuestion = false,
  showHintButton = false,
  hintVisible = false,
  onToggleHint = null
}) {
  const [revisaoAberta, setRevisaoAberta] = useState(false);

  // A questão é finalizada se a prop for true, se acertou/errou de vez (verde/vermelha), se completou 2 tentativas ou está em leitura
  const isFinalizada = Boolean(propIsFinalizada || status === "verde" || status === "vermelha" || tentativas >= 2 || isReadOnly);
  const isPrimeiroErro = status === "amarela" && !isFinalizada;

  const letras = LETRAS;

  function handleOptionClick(idx) {
    if (isFinalizada) return;
    if (opcoesIncorretasTentadas.includes(idx)) return;
    if (onSelectChoice) {
      onSelectChoice(idx);
    }
    // Verificação imediata ao clicar na alternativa
    if (onVerificar) {
      onVerificar(idx);
    }
  }

  return (
    <article
      className={`rounded-3xl border transition-colors duration-200 p-4 sm:p-5 flex flex-col gap-4 shadow-lg ${
        status === "verde"
          ? "bg-[#0E1722] border-[#20D5B5]/60 shadow-[#20D5B5]/5"
          : status === "vermelha"
          ? "bg-[#0E1722] border-[#F25F5C]/60 shadow-[#F25F5C]/5"
          : status === "amarela"
          ? "bg-[#0E1722] border-[#FFC247]/60 shadow-[#FFC247]/5"
          : "bg-[#0E1722] border-[#1F3045]"
      }`}
    >
      {/* Topo do Card: Somente o Número da Questão e Badge de Status (sem temas específicos) */}
      <div className="flex items-center justify-between gap-2 border-b border-[#1F3045]/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-white bg-[#16222E] border border-[#27394B] px-2.5 py-1 rounded-lg">
            Questão {numQuestao}
          </span>
        </div>

        {/* Badge de Situação da Questão */}
        <div>
          {status === "verde" && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#20D5B5] bg-[#20D5B5]/15 border border-[#20D5B5]/30 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Acerto de Primeira
            </span>
          )}
          {status === "amarela" && !isFinalizada && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#FFC247] bg-[#FFC247]/15 border border-[#FFC247]/30 px-2.5 py-0.5 rounded-full">
              <Lightbulb className="w-3.5 h-3.5" /> 1ª Tentativa Incorreta
            </span>
          )}
          {status === "amarela" && isFinalizada && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#FFC247] bg-[#FFC247]/15 border border-[#FFC247]/30 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Acertou de Segunda
            </span>
          )}
          {status === "vermelha" && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#F25F5C] bg-[#F25F5C]/15 border border-[#F25F5C]/30 px-2.5 py-0.5 rounded-full">
              <XCircle className="w-3.5 h-3.5" /> Errou
            </span>
          )}
          {status === "aberta" && (
            <span className="text-[11px] font-mono font-semibold text-[#9FB3C6] bg-[#16222E] px-2 py-0.5 rounded-full">
              Pendente
            </span>
          )}
        </div>
      </div>

      {/* Enunciado da Questão */}
      <div className="text-sm sm:text-base font-medium text-[#EAF2F8] leading-relaxed">
        {questao.pergunta}
      </div>

      {/* Banner de Dica Clínica sob Demanda (somente se hintVisible for true) */}
      {isPrimeiroErro && hintVisible && (
        <div className="rounded-2xl border border-[#FFC247]/50 bg-[#FFC247]/10 p-3.5 sm:p-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-bold text-[#FFC247] uppercase tracking-wide mb-1">
            <Lightbulb className="w-4 h-4 fill-[#FFC247]" />
            Dica do Preceptor Goti
          </div>
          <p className="text-xs sm:text-sm text-[#EAF2F8] font-normal leading-relaxed">
            {questao.dica || "Analise com atenção as alternativas: pense nas prioridades de biossegurança e farmacocinética antes de responder novamente."}
          </p>
        </div>
      )}

      {/* Lista das 5 Alternativas (A a E) */}
      <ul className="space-y-2.5 pt-1" role="radiogroup" aria-label="Alternativas">
        {questao.opcoes.map((opcaoTexto, idx) => {
          const isSelected = selectedChoice === idx;
          const isGabarito = idx === questao.correta;
          const jaTentouIncorreta = opcoesIncorretasTentadas.includes(idx);

          let optStyle = "bg-[#131F2E] border-[#1F3045] text-[#EAF2F8] hover:border-[#20D5B5]/60 hover:bg-[#16222E]";
          let letterStyle = "bg-[#1A293D] border-[#27394B] text-[#9FB3C6]";

          if (isFinalizada) {
            if (isGabarito) {
              optStyle = "bg-[#20D5B5]/15 border-[#20D5B5] text-white shadow-sm";
              letterStyle = "bg-[#20D5B5] border-[#20D5B5] text-[#0E1722] font-black";
            } else if (isSelected && !isGabarito) {
              optStyle = "bg-[#F25F5C]/15 border-[#F25F5C] text-white";
              letterStyle = "bg-[#F25F5C] border-[#F25F5C] text-white font-black";
            } else {
              optStyle = "bg-[#131F2E]/60 border-[#1F3045]/60 text-[#9FB3C6] opacity-60";
            }
          } else if (jaTentouIncorreta) {
            optStyle = "bg-[#F25F5C]/10 border-[#F25F5C]/30 text-[#9FB3C6] opacity-60 cursor-not-allowed";
            letterStyle = "bg-[#F25F5C]/20 border-[#F25F5C]/40 text-[#F25F5C] font-black line-through";
          } else if (isSelected) {
            optStyle = "bg-[#20D5B5]/20 border-[#20D5B5] text-white shadow-md ring-2 ring-[#20D5B5]";
            letterStyle = "bg-[#20D5B5] border-[#20D5B5] text-[#0E1722] font-black";
          }

          const isDisabled = isFinalizada || jaTentouIncorreta;

          return (
            <li key={idx}>
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => handleOptionClick(idx)}
                className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border transition-colors duration-150 flex items-start gap-3 cursor-pointer disabled:cursor-not-allowed active:scale-[0.99] ${optStyle}`}
                aria-checked={isSelected}
                role="radio"
              >
                <span
                  className={`w-7 h-7 rounded-xl border flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${letterStyle}`}
                >
                  {letras[idx]}
                </span>
                <span className="text-xs sm:text-sm leading-snug pt-0.5 flex-1">
                  {opcaoTexto}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Ações Inferiores (Botão de Dica sob demanda e Avançar) */}
      <div className="pt-2 flex flex-col gap-3">
        {/* Botão de Dica Sob Demanda no 1º Erro */}
        {isPrimeiroErro && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1F3045]/60">
            <button
              type="button"
              onClick={onToggleHint}
              className="px-4 py-2.5 rounded-xl border border-[#FFC247]/40 bg-[#FFC247]/10 hover:bg-[#FFC247]/20 text-[#FFC247] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Lightbulb className="w-4 h-4 fill-[#FFC247]" />
              {hintVisible ? "Ocultar Dica" : "Ver Dica do Preceptor Goti"}
            </button>
            <span className="text-[11px] text-[#9FB3C6] font-semibold">
              Selecione outra alternativa acima
            </span>
          </div>
        )}

        {/* Caso já tenha finalizado a questão */}
        {isFinalizada && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1F3045]/60">
              <button
                type="button"
                onClick={() => setRevisaoAberta((prev) => !prev)}
                className="px-4 py-2.5 rounded-xl border border-[#27394B] bg-[#16222E] hover:bg-[#1A293D] text-xs font-bold text-[#EAF2F8] hover:text-[#20D5B5] transition flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-[#20D5B5]" />
                {revisaoAberta ? "Ocultar Resolução" : "Ver Resolução Completa"}
                {revisaoAberta ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={onProxima}
                  className="px-5 py-2.5 rounded-xl bg-[#20D5B5] hover:bg-[#20D5B5]/90 text-[#0E1722] font-black text-xs sm:text-sm transition shadow-sm flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  {isLastQuestion ? "Ver Resumo Final" : "Próxima Questão"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {revisaoAberta && (
              <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-3 animate-in fade-in duration-200">
                <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1F3045] pb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#20D5B5]" />
                  Comentário Clínico Alternativa por Alternativa
                </div>

                <div className="space-y-3">
                  {(questao.explicacaoAlternativas || []).map((alt, aIdx) => (
                    <div
                      key={aIdx}
                      className={`p-3 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                        alt.isCorreta
                          ? "bg-[#20D5B5]/10 border-[#20D5B5]/40"
                          : "bg-[#0E1722] border-[#1F3045]"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`font-mono font-bold px-1.5 py-0.5 rounded-sm text-xs ${
                            alt.isCorreta
                              ? "bg-[#20D5B5] text-[#0E1722]"
                              : "bg-[#F25F5C]/20 text-[#F25F5C]"
                          }`}
                        >
                          {alt.letra}
                        </span>
                        {alt.isCorreta ? (
                          <span className="font-black text-[#20D5B5] uppercase text-xs">
                            Correta (Gabarito)
                          </span>
                        ) : (
                          <span className="font-black text-[#F25F5C] uppercase text-xs">
                            Incorreta
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#EAF2F8] pl-0.5">
                        {alt.explicacao}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
