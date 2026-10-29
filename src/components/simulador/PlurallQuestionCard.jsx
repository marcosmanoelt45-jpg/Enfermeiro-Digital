import React, { useState } from "react";
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
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
  isLastQuestion = false
}) {
  const [revisaoAberta, setRevisaoAberta] = useState(false);

  // A questão é finalizada se a prop for true, se acertou/errou de vez (verde/vermelha), se completou 2 tentativas ou está em leitura
  const isFinalizada = Boolean(propIsFinalizada || status === "verde" || status === "vermelha" || tentativas >= 2 || isReadOnly);
  const isPrimeiroErro = status === "amarela" && !isFinalizada;

  const letras = LETRAS;

  return (
    <article
      className={`rounded-3xl border transition-all duration-300 p-4 sm:p-5 flex flex-col gap-4 shadow-lg ${
        status === "verde"
          ? "bg-[#0E1722] border-[#20D5B5]/60 shadow-[#20D5B5]/5"
          : status === "vermelha"
          ? "bg-[#0E1722] border-[#F25F5C]/60 shadow-[#F25F5C]/5"
          : status === "amarela"
          ? "bg-[#0E1722] border-[#FFC247]/60 shadow-[#FFC247]/5"
          : "bg-[#0E1722] border-[#1F3045]"
      }`}
    >
      {/* Topo do Card: Número da Questão, Badges e Status */}
      <div className="flex items-center justify-between gap-2 border-b border-[#1F3045]/60 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold text-white bg-[#16222E] border border-[#27394B] px-2.5 py-1 rounded-lg">
            Questão {numQuestao}
          </span>
          {questao.tema && (
            <span className="text-[11px] font-bold text-[#20D5B5] bg-[#20D5B5]/10 border border-[#20D5B5]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {questao.tema}
            </span>
          )}
        </div>

        {/* Badge de Situação da Questão */}
        <div>
          {status === "verde" && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#20D5B5] bg-[#20D5B5]/15 border border-[#20D5B5]/30 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Acerto
            </span>
          )}
          {status === "amarela" && !isFinalizada && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#FFC247] bg-[#FFC247]/15 border border-[#FFC247]/30 px-2.5 py-0.5 rounded-full animate-pulse">
              <Lightbulb className="w-3.5 h-3.5" /> 1º Erro (Dica Ativa)
            </span>
          )}
          {status === "amarela" && isFinalizada && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#FFC247] bg-[#FFC247]/15 border border-[#FFC247]/30 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Acerto na 2ª Tentativa
            </span>
          )}
          {status === "vermelha" && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#F25F5C] bg-[#F25F5C]/15 border border-[#F25F5C]/30 px-2.5 py-0.5 rounded-full">
              <XCircle className="w-3.5 h-3.5" /> Revisão
            </span>
          )}
          {status === "aberta" && (
            <span className="text-[11px] font-mono font-semibold text-[#9FB3C6] bg-[#16222E] px-2 py-0.5 rounded-full">
              Pendente
            </span>
          )}
        </div>
      </div>

      {/* Enunciado da Questão (Stem) */}
      <div className="text-sm sm:text-base font-medium text-[#EAF2F8] leading-relaxed">
        {questao.pergunta}
      </div>

      {/* Banner de Dica Clínica no 1º Erro (Amarela) */}
      {isPrimeiroErro && (
        <div className="rounded-2xl border border-[#FFC247]/50 bg-[#FFC247]/10 p-3.5 sm:p-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 text-xs font-bold text-[#FFC247] uppercase tracking-wide mb-1">
            <Lightbulb className="w-4 h-4 fill-[#FFC247]" />
            Dica do Preceptor Goti
          </div>
          <p className="text-xs sm:text-sm text-[#EAF2F8] font-normal leading-relaxed">
            {questao.dica || "Analise com atenção as alternativas: pense nas prioridades de biossegurança e farmacocinética antes de responder novamente."}
          </p>
          <div className="text-[11px] text-[#FFC247]/90 mt-2 font-mono font-semibold">
            Selecione outra alternativa para confirmar sua 2ª tentativa.
          </div>
        </div>
      )}

      {/* Lista das 5 Alternativas (A a E) */}
      <ul className="space-y-2.5 pt-1" role="radiogroup" aria-label="Alternativas">
        {questao.opcoes.map((opcaoTexto, idx) => {
          const isSelected = selectedChoice === idx;
          const isGabarito = idx === questao.correta;
          const jaTentouIncorreta = opcoesIncorretasTentadas.includes(idx);

          // Estilização condicional baseada no status
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
            // Opção tentada no 1º erro: desabilitada e marcada
            optStyle = "bg-[#F25F5C]/10 border-[#F25F5C]/30 text-[#9FB3C6] opacity-60 cursor-not-allowed";
            letterStyle = "bg-[#F25F5C]/20 border-[#F25F5C]/40 text-[#F25F5C] font-black line-through";
          } else if (isSelected) {
            optStyle = "bg-[#20D5B5]/15 border-[#20D5B5] text-white shadow-xs ring-1 ring-[#20D5B5]";
            letterStyle = "bg-[#20D5B5] border-[#20D5B5] text-[#0E1722] font-black";
          }

          const isDisabled = isFinalizada || jaTentouIncorreta;

          return (
            <li key={idx}>
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => onSelectChoice(idx)}
                className={`w-full text-left p-3 sm:p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer disabled:cursor-not-allowed ${optStyle}`}
                aria-checked={isSelected}
                role="radio"
              >
                {/* Badge com a Letra da Alternativa */}
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

      {/* Ações Inferiores (Verificar / Continuar / Revisar) */}
      <div className="pt-2 flex flex-col gap-3">
        {/* Caso ainda não tenha finalizado a questão */}
        {!isFinalizada && (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={selectedChoice === null || opcoesIncorretasTentadas.includes(selectedChoice)}
              onClick={onVerificar}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#20D5B5] hover:bg-[#20D5B5]/90 text-[#0E1722] font-black text-sm transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isPrimeiroErro ? (
                <>
                  <RotateCcw className="w-4 h-4" /> Confirmar 2ª Tentativa
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Verificar Resposta
                </>
              )}
            </button>
          </div>
        )}

        {/* Caso já tenha finalizado a questão */}
        {isFinalizada && (
          <div className="space-y-3">
            {/* Linha com Botão Revisar e Botão Próxima */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1F3045]/60">
              <button
                type="button"
                onClick={() => setRevisaoAberta((prev) => !prev)}
                className="px-4 py-2.5 rounded-xl border border-[#27394B] bg-[#16222E] hover:bg-[#1A293D] text-xs font-bold text-[#EAF2F8] hover:text-[#20D5B5] transition flex items-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-[#20D5B5]" />
                {revisaoAberta ? "Ocultar Revisão" : "Revisar Alternativas"}
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

            {/* Gaveta de Revisão Alternativa por Alternativa (com Letras Vermelhas e Verdes) */}
            {revisaoAberta && (
              <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-4 space-y-3 animate-in fade-in duration-200">
                <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1F3045] pb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#20D5B5]" />
                  Comentário Clínico Manual Alternativa por Alternativa
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

                      {/* Texto da Justificativa com Letras Coloridas para Erros e Acertos */}
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
