import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Send,
  Sparkles,
  Bot,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  MessageCircle,
  Stethoscope,
  Lightbulb,
  ExternalLink,
  Flame,
  Award
} from "lucide-react";
import { gotiPreceptorService } from "@/services/gotiPreceptorService";
import { useTheme } from "@/lib/ThemeContext";

const CLINICAL_PROMPTS = [
  "Como calcular gotejamento em macrogotas/h?",
  "Quando usar a técnica em Z na injeção IM?",
  "Etapas do PE pela Resolução COFEN 736/2024?",
  "Como passar plantão no método SBAR sem ruídos?"
];

export default function GotiChatDrawer({ isOpen, onClose }) {
  const { triggerHaptic } = useTheme();
  const [messages, setMessages] = useState(() => gotiPreceptorService.getHistory());
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gotiState, setGotiState] = useState("idle"); // "idle" | "speaking" | "celebrating" | "thinking"
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 150);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleSend(textToSend) {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    triggerHaptic(20);
    setInputText("");
    setIsLoading(true);
    setGotiState("thinking");

    // Adiciona temporariamente a mensagem do usuário na tela
    const updatedHistory = [...messages, { role: "user", text, timestamp: new Date().toISOString() }];
    setMessages(updatedHistory);

    try {
      const response = await gotiPreceptorService.sendMessage(text);
      setMessages(gotiPreceptorService.getHistory());
      setGotiState("speaking");
      setTimeout(() => setGotiState("idle"), 2500);
    } catch (err) {
      console.error("Erro no chat do Goti:", err);
      setGotiState("idle");
    } finally {
      setIsLoading(false);
    }
  }

  function handleClearHistory() {
    triggerHaptic(30);
    gotiPreceptorService.clearHistory();
    setMessages(gotiPreceptorService.getHistory());
    setGotiState("idle");
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div
        className="w-full sm:max-w-lg h-[92vh] sm:h-[650px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Chat com o Preceptor Clínico IA */}
        <div className="relative p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-teal-50 via-white to-emerald-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white p-1 flex items-center justify-center shadow-xs">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  Preceptor Clínico IA
                </h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Enfere IA
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Resoluções COFEN 736/2024 • NANDA-I • Farmacologia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearHistory}
              title="Reiniciar Conversa"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                triggerHaptic(20);
                onClose();
              }}
              title="Fechar"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Área de Mensagens com Rolagem */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
          {/* Card de Boas-Vindas & Diretriz Clínica */}
          <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Espaço Seguro de Aprendizagem de Enfermagem
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Tire dúvidas sobre prescrição de enfermagem, técnicas assépticas, dosagens e raciocínio diagnóstico sem julgamentos.
              </p>
            </div>
          </div>

          {/* Histórico de Mensagens */}
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center shrink-0 self-end mb-1 shadow-xs">
                    <Sparkles className="w-4 h-4 text-emerald-100" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs leading-relaxed ${
                    isUser
                      ? "bg-teal-700 text-white rounded-br-xs font-medium"
                      : "bg-slate-100/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-700/80"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })}

          {/* Indicador de Digitação do Preceptor IA */}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center shrink-0 self-end mb-1 shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-100 animate-spin" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-xs p-3.5 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <span className="flex space-x-1">
                  <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce"></span>
                </span>
                <span className="text-[11px] font-medium">Preceptor IA está fundamentando a resposta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sugestões de Perguntas Rápidas */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-500" /> Dúvidas Clínicas Rápidas
          </p>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {CLINICAL_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-medium bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-teal-400 dark:hover:border-teal-500 hover:text-teal-700 dark:hover:text-teal-300 transition-all shrink-0 active:scale-95 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input & Botão de Envio */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Pergunte ao Preceptor IA sobre condutas, doses ou PE..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
          />

          <Button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="rounded-2xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white px-4 py-2.5 h-auto font-bold shadow-xs active:scale-95 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
