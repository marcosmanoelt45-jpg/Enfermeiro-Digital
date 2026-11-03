import React from "react";
import { ArrowLeft, BookmarkPlus, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ElapsedClock from "./ElapsedClock";

// Aba 3 do SBAR: resumo dos quatro pilares antes de enviar ao Goti.
export default function SbarConfirm({
  currentCase,
  sbarData,
  elapsedSeconds,
  isEvaluating,
  submissionSuccess,
  setActiveTab,
  handleSaveDraft,
  handleEvaluateSbar,
}) {
  return (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-[#131F2E] rounded-2xl border border-[#1F3045] p-6 sm:p-7 shadow-sm space-y-6">
              {/* Topo da Confirmação */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F3045] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-emerald-950/80 text-[#3DD68C]">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Confirmação de Envio da Passagem de Plantão SBAR
                    </h3>
                  </div>
                  <p className="text-xs text-[#9FB3C6] mt-1">
                    Revise os 4 pilares do relatório clínico antes de confirmar a entrega final e receber o parecer do Goti.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700">
                    <Clock className="h-3.5 w-3.5 text-teal-400" />
                    <span>Tempo de Prática: <ElapsedClock getSeconds={elapsedSeconds} /></span>
                  </span>
                </div>
              </div>

              {submissionSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider">Passagem de Plantão 100% Concluída</h4>
                    <p className="text-xs text-[#3DD68C] mt-0.5">
                      Esta atividade foi finalizada e registrada no seu histórico com sucesso. Você pode consultar debriefings e métricas a qualquer momento no menu de Histórico.
                    </p>
                  </div>
                </div>
              )}

              {/* Dados do Paciente em Transição */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#9FB3C6] block">Paciente em Passagem de Plantão</span>
                  <strong className="text-white text-sm font-bold">
                    {currentCase.name} ({currentCase.age}a) • {currentCase.bed}
                  </strong>
                  <span className="text-[#9FB3C6] block mt-0.5">{currentCase.diagnosis}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-xl bg-[#131F2E] border border-slate-700 font-semibold text-slate-200">
                    PA: {currentCase.vitals?.pa_sistolica}/{currentCase.vitals?.pa_diastolica}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-[#131F2E] border border-slate-700 font-semibold text-slate-200">
                    SatO₂: {currentCase.vitals?.sat}%
                  </span>
                </div>
              </div>

              {/* Os 4 Pilares Estruturados do SBAR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pilar S */}
                <div className="p-4 rounded-2xl bg-[#0E1722] border border-indigo-900/60 space-y-2">
                  <div className="flex items-center justify-between border-b border-indigo-900/40 pb-2">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-sky-600 text-white flex items-center justify-center text-[11px] font-bold">S</span>
                      Situação (Situation)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sbarData.situation ? "bg-emerald-950 text-[#3DD68C]" : "bg-[#FFC247]/15 text-[#FFC247]"}`}>
                      {sbarData.situation ? "Preenchido" : "Pendente"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 italic min-h-[48px] leading-relaxed">
                    {sbarData.situation || "Pilar ainda vazio."}
                  </p>
                </div>

                {/* Pilar B */}
                <div className="p-4 rounded-2xl bg-[#0E1722] border border-amber-900/60 space-y-2">
                  <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-[#FFC247] text-[#3A2A05] flex items-center justify-center text-[11px] font-bold">B</span>
                      Breve Histórico (Background)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sbarData.background ? "bg-emerald-950 text-[#3DD68C]" : "bg-[#FFC247]/15 text-[#FFC247]"}`}>
                      {sbarData.background ? "Preenchido" : "Pendente"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 italic min-h-[48px] leading-relaxed">
                    {sbarData.background || "Pilar ainda vazio."}
                  </p>
                </div>

                {/* Pilar A */}
                <div className="p-4 rounded-2xl bg-[#0E1722] border border-emerald-900/60 space-y-2">
                  <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
                    <span className="text-xs font-bold text-[#3DD68C] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-[11px] font-bold">A</span>
                      Avaliação Clínica (Assessment)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sbarData.assessment ? "bg-emerald-950 text-[#3DD68C]" : "bg-[#FFC247]/15 text-[#FFC247]"}`}>
                      {sbarData.assessment ? "Preenchido" : "Pendente"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 italic min-h-[48px] leading-relaxed">
                    {sbarData.assessment || "Pilar ainda vazio."}
                  </p>
                </div>

                {/* Pilar R */}
                <div className="p-4 rounded-2xl bg-[#0E1722] border border-teal-900/60 space-y-2">
                  <div className="flex items-center justify-between border-b border-teal-900/40 pb-2">
                    <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-[#20D5B5] text-[#06302E] flex items-center justify-center text-[11px] font-bold">R</span>
                      Recomendação (Recommendation)
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sbarData.recommendation ? "bg-emerald-950 text-[#3DD68C]" : "bg-[#FFC247]/15 text-[#FFC247]"}`}>
                      {sbarData.recommendation ? "Preenchido" : "Pendente"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 italic min-h-[48px] leading-relaxed">
                    {sbarData.recommendation || "Pilar ainda vazio."}
                  </p>
                </div>
              </div>

              {/* Botões Oficiais da Aba de Confirmação */}
              <div className="pt-4 border-t border-[#1F3045] flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("guided")}
                  className="rounded-xl border-slate-700 text-slate-200 text-xs font-semibold"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar para Edição Guiada
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    className="rounded-xl border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <BookmarkPlus className="h-3.5 w-3.5 text-[#FFC247]" />
                    <span>Salvar Rascunho</span>
                  </Button>

                  <Button
                    onClick={handleEvaluateSbar}
                    disabled={isEvaluating}
                    className="rounded-xl bg-[#20D5B5] text-[#06302E] hover:brightness-105 text-xs px-6 h-10 font-bold flex items-center gap-2 shadow-sm"
                  >
                    {isEvaluating ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-spin text-[#20D5B5]" />
                        <span>Auditando com IA...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-[#3DD68C]" />
                        <span>Confirmar Envio Oficial (100%) & Avaliar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
  );
}
