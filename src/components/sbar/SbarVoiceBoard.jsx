import React from "react";
import { Loader2, Mic, MicOff, Radio, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import QuickSimCountdown from "./QuickSimCountdown";

function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// Aba 2 do SBAR: os quatro pilares ditados por voz, com a contagem da Simulação Rápida.
export default function SbarVoiceBoard({
  sbarData,
  setSbarData,
  checklists,
  isListening,
  voiceStarting,
  activeListeningField,
  isProcessingAudio,
  isTranscribingWithAi,
  processingField,
  recordingSeconds,
  interimTranscript,
  isEvaluating,
  prazoRapido,
  toggleVoiceInput,
  handleEvaluateSbar,
  handleQuickSimExpire,
}) {
  return (
          <div className="bg-[#131F2E] rounded-2xl border border-[#1F3045] p-6 sm:p-7 shadow-sm space-y-6">
            {prazoRapido && <QuickSimCountdown deadline={prazoRapido} total={120000} onExpire={handleQuickSimExpire} />}
            <div className="border-b border-[#1F3045] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Simulação em Tempo Real (Troca de Turno Contínua)
                </h3>
                <p className="text-xs text-[#9FB3C6] mt-0.5">
                  Dite a passagem de plantão por voz em cada pilar com seu microfone. Fale com clareza e ritmo pausado.
                </p>
              </div>

              {isListening && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-900 text-rose-300 text-xs font-bold animate-pulse">
                  <Radio className="h-3.5 w-3.5 text-[#F0645F]" />
                  <span>Microfone Ligado no Pilar {activeListeningField?.toUpperCase()}</span>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { key: "situation", letter: "S", title: "Situação", color: "bg-indigo-950/60 text-indigo-300", ph: "Ex.: Paciente M.S.L., 58 anos, no Leito 12-A, no 1º DPO de colectomia..." },
                { key: "background", letter: "B", title: "Histórico", color: "bg-amber-950/60 text-amber-300", ph: "Ex.: Hipertenso controlado com Losartana. Nega alergias..." },
                { key: "assessment", letter: "A", title: "Avaliação", color: "bg-rose-950/60 text-rose-300", ph: "Ex.: PA 115/72, FC 84, SatO2 98%. Dor EVA 4/10 em incisão..." },
                { key: "recommendation", letter: "R", title: "Recomendação", color: "bg-emerald-950/60 text-[#3DD68C]", ph: "Ex.: Vigiar dreno a cada 4h; analgesia às 20h; checar hematócrito..." }
              ].map((pilar) => (
                <div key={pilar.key} className="p-4 rounded-xl border border-[#1F3045] bg-slate-800/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-md font-bold text-xs ${pilar.color}`}>
                        {pilar.letter}
                      </span>
                      <span className="text-xs font-bold text-white">{pilar.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#3DD68C] bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800">
                        {Object.values(checklists[pilar.key] || {}).filter(Boolean).length}/3 itens
                      </span>

                      <Button
                        size="sm"
                        disabled={(isProcessingAudio || isTranscribingWithAi) && processingField === pilar.key}
                        variant={isListening && activeListeningField === pilar.key ? "destructive" : "outline"}
                        onClick={() => toggleVoiceInput(pilar.key)}
                        aria-pressed={isListening && activeListeningField === pilar.key}
                        className={`rounded-lg h-10 px-3 text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isListening && activeListeningField === pilar.key
                            ? "bg-[#F0645F] hover:bg-[#F0645F] text-white shadow-sm motion-safe:animate-pulse"
                            : (isProcessingAudio || isTranscribingWithAi) && processingField === pilar.key
                            ? "bg-[#20D5B5]/10 border-[#20D5B5]/50 text-[#20D5B5]"
                            : "border-[#27394B] bg-[#16222E] text-[#EAF2F8] hover:bg-[#1C2C3C]"
                        }`}
                      >
                        {isListening && activeListeningField === pilar.key ? (
                          voiceStarting ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin text-white" />
                              <span>Ligando...</span>
                            </>
                          ) : (
                            <>
                              <MicOff className="h-3 w-3 animate-pulse text-white" />
                              <span>Parar ({formatSeconds(recordingSeconds)})</span>
                            </>
                          )
                        ) : (isProcessingAudio || isTranscribingWithAi) && processingField === pilar.key ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin text-teal-400" />
                            <span>Transcrevendo...</span>
                          </>
                        ) : (
                          <>
                            <Mic className="h-3 w-3 text-teal-400" />
                            <span>Ditar</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {(isProcessingAudio || isTranscribingWithAi) && processingField === pilar.key && (
                    <div className="p-2 rounded-lg bg-teal-950/40 border border-teal-800 text-[#20D5B5] text-[11px] flex items-center gap-2 animate-pulse">
                      <Loader2 className="h-3.5 w-3.5 text-teal-400 animate-spin shrink-0" />
                      <span className="font-medium">Áudio recebido! Transcrevendo...</span>
                    </div>
                  )}

                  {isListening && activeListeningField === pilar.key && interimTranscript && (
                    <div className="p-2 rounded-lg bg-teal-950/40 border border-teal-800 text-[#20D5B5] text-[11px] italic">
                      "{interimTranscript}"
                    </div>
                  )}

                  <Textarea
                    rows={3}
                    value={sbarData[pilar.key]}
                    onChange={(e) => setSbarData({ ...sbarData, [pilar.key]: e.target.value })}
                    placeholder={pilar.ph}
                    className="text-xs rounded-lg border-slate-700 resize-none bg-slate-800 text-white leading-relaxed"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                size="lg"
                disabled={isEvaluating}
                onClick={handleEvaluateSbar}
                className="rounded-xl bg-[#20D5B5] text-[#06302E] hover:brightness-105 font-bold text-xs px-6 h-11 flex items-center gap-2 shadow-sm"
              >
                {isEvaluating ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin text-[#20D5B5]" />
                    <span>Goti está auditando a passagem de plantão...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Submeter Passagem de Plantão para o Goti IA</span>
                  </>
                )}
              </Button>
            </div>
          </div>
  );
}
