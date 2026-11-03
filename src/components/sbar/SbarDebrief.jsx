import React from "react";
import { AlertTriangle, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import GotiAnimated from "@/components/mascot/GotiAnimated";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import { AnimatedNumber } from "@/components/ui/animated-number";

// Aba 4 do SBAR: parecer do Goti com índice de segurança, notas por pilar e omissões.
export default function SbarDebrief({ tutorEvaluation, onOpenEvaluation }) {
  return (
          <div className="bg-[#131F2E] rounded-2xl border border-teal-900/60 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
            {/* Topo do Feedback com Score e Grade */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F3045] pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-teal-400" />
                  <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">
                    Parecer de Comunicação • Goti IA
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Auditoria da Comunicação & Segurança do Paciente
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  {tutorEvaluation.summaryFeedback}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-teal-950/40 border border-teal-800 rounded-2xl p-3 shrink-0">
                <div
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  onClick={() => onOpenEvaluation()}
                  title="Clique para ver a comemoração e parecer do Goti!"
                >
                  <GotiAnimated
                    animation={tutorEvaluation.safetyScore >= 80 ? "jumping" : tutorEvaluation.safetyScore >= 50 ? "pointing" : "angry"}
                    size="feedback"
                    className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 shrink-0"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-teal-300 uppercase block">Índice de Segurança</span>
                  <span className="text-2xl font-extrabold text-[#20D5B5] block leading-none">
                    <AnimatedNumber value={Number(tutorEvaluation.safetyScore) || 0} duration={0.8} />/100
                  </span>
                </div>
                <div className="h-10 w-px bg-[#149F86]" />
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#20D5B5] text-[#06302E]">
                  {tutorEvaluation.grade}
                </span>
              </div>
            </div>

            {/* SIMULADOR DE CONSEQUÊNCIA DE EVENTO SENTINELA (APRENDIZAGEM VIVA) */}
            {tutorEvaluation.sentinelConsequence && (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wide">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Simulador de Consequências no Hospital Real (O que aconteceria se você omitisse esses dados?):</span>
                </div>
                <p className="text-xs text-amber-200 leading-relaxed font-medium">
                  {tutorEvaluation.sentinelConsequence}
                </p>
              </div>
            )}

            {/* Desdobramento dos 4 Pilares SBAR */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                Desempenho por Eixo da Metodologia:
              </h4>

              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { key: "situation", label: "S - Situação", letter: "S" },
                  { key: "background", label: "B - Histórico", letter: "B" },
                  { key: "assessment", label: "A - Avaliação", letter: "A" },
                  { key: "recommendation", label: "R - Recomendação", letter: "R" }
                ].map((pillar) => {
                  const data = tutorEvaluation.pillarScores?.[pillar.key] || { score: 0, feedback: "Pilar não avaliado." };
                  return (
                    <div key={pillar.key} className="p-3.5 rounded-xl border border-[#1F3045] bg-slate-800/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{pillar.label}</span>
                        <span className={`text-xs font-extrabold ${data.score >= 80 ? 'text-teal-400' : 'text-amber-400'}`}>
                          {data.score} pts
                        </span>
                      </div>
                      <AnimatedProgress
                        value={data.score}
                        tone={data.score >= 80 ? "success" : data.score >= 50 ? "warning" : "danger"}
                        className="h-2"
                        label={`Nota de ${pillar.label}`}
                      />
                      <p className="text-[11px] text-slate-300 leading-normal">
                        {data.feedback}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Omissões Críticas e Pontos Fortes */}
            <div className="grid sm:grid-cols-2 gap-4 text-xs pt-1">
              {tutorEvaluation.criticalOmissions?.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-rose-300">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Omissões Críticas que Devem ser Corrigidas:</span>
                  </div>
                  <ul className="space-y-1.5 text-rose-200">
                    {tutorEvaluation.criticalOmissions.map((om, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold">•</span>
                        <span>{om}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tutorEvaluation.strengths?.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[#3DD68C]">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Pontos Fortes da Sua Comunicação:</span>
                  </div>
                  <ul className="space-y-1.5 text-emerald-200">
                    {tutorEvaluation.strengths.map((st, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="font-bold">•</span>
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Mensagem de Mentoria & Exportação em PDF com Goti */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[#1F3045]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-950/80 border border-teal-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-xs text-[#9FB3C6] italic">
                  "{tutorEvaluation.gotiMentorship || tutorEvaluation.florenceMentorship || 'A comunicação assertiva é a maior ferramenta de proteção da enfermagem.'}"
                </div>
              </div>
            </div>
          </div>
  );
}
