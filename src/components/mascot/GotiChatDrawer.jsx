import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Send,
  Sparkles,
  RotateCcw,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { gotiPreceptorService } from "@/services/gotiPreceptorService";
import { useTheme } from "@/lib/ThemeContext";
import { useDragScroll } from "@/hooks/useDragScroll";

const GOTI_NAVIGATION_PROMPTS = [
  "Como funciona a videochamada por voz?",
  "O que você achou do meu atendimento?",
  "Onde treino o cálculo de dosagens?",
  "Onde posso aprender a puncionar?",
  "Como inicio uma simulação de caso clínico?",
  "Onde treino passagem de plantão SBAR?",
  "Onde monto um caso clínico do zero?"
];

/**
 * Renderizador de Markdown elegante e seguro para mensagens do Goti
 * Transforma marcadores (* e -) em listas visuais limpas com bolinhas teal,
 * negritos em tags semânticas e remove asteriscos crus.
 */
function GotiMarkdownRenderer({ content = "", isUser = false }) {
  if (!content) return null;

  function parseInline(text) {
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const inner = part.slice(2, -2);
        return (
          <strong key={index} className={`font-extrabold ${isUser ? "text-white" : "text-slate-950 dark:text-white"}`}>
            {inner}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        const inner = part.slice(1, -1);
        return (
          <em key={index} className={`italic ${isUser ? "text-teal-100" : "text-teal-900 dark:text-teal-200"}`}>
            {inner}
          </em>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        const inner = part.slice(1, -1);
        return (
          <code key={index} className="px-1.5 py-0.5 rounded bg-black/15 dark:bg-white/10 font-mono text-[11px]">
            {inner}
          </code>
        );
      }
      return part;
    });
  }

  const lines = content.split("\n");
  const blocks = [];
  let currentList = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ");
    const isNumbered = /^\d+\.\s+/.test(trimmed);

    if (isBullet || isNumbered) {
      const cleanLine = trimmed.replace(/^(\*|-|•|\d+\.)\s+/, "");
      if (!currentList) {
        currentList = { type: isNumbered ? "ol" : "ul", items: [] };
        blocks.push(currentList);
      }
      currentList.items.push(cleanLine);
    } else {
      currentList = null;
      if (trimmed.length > 0) {
        blocks.push({ type: "p", text: trimmed });
      }
    }
  });

  return (
    <div className="space-y-2 leading-relaxed">
      {blocks.map((block, bIdx) => {
        if (block.type === "ul" || block.type === "ol") {
          return (
            <ul key={bIdx} className="space-y-1.5 my-2 pl-0.5">
              {block.items.map((item, iIdx) => (
                <li key={iIdx} className="flex items-start gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${isUser ? "bg-white" : "bg-teal-600 dark:bg-teal-400"}`} />
                  <span className="flex-1">{parseInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.text.startsWith("### ")) {
          return (
            <h4 key={bIdx} className={`font-black text-sm mt-2 mb-1 ${isUser ? "text-white" : "text-teal-900 dark:text-teal-200"}`}>
              {parseInline(block.text.replace(/^###\s+/, ""))}
            </h4>
          );
        }

        return (
          <p key={bIdx}>
            {parseInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

export default function GotiChatDrawer({ isOpen, onClose, initialQuery = null }) {
  const { triggerHaptic } = useTheme();
  const [messages, setMessages] = useState(() => gotiPreceptorService.getHistory());
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [gotiState, setGotiState] = useState("idle"); // "idle" | "speaking" | "celebrating" | "thinking"
  const [thinkingStep, setThinkingStep] = useState(0);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const promptsScrollRef = useDragScroll();

  const thinkingMessages = [
    "Localizando os módulos e simuladores do Enfere...",
    "Identificando o melhor laboratório prático para você...",
    "Preparando o seu roteiro de estudo no site..."
  ];

  // Alterna dinamicamente as fases de localização do Goti durante o processamento
  useEffect(() => {
    if (!isLoading) {
      setThinkingStep(0);
      return;
    }
    const t1 = setTimeout(() => setThinkingStep(1), 1000);
    const t2 = setTimeout(() => setThinkingStep(2), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isLoading]);

  // Fechar com tecla Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setMessages(gotiPreceptorService.getHistory());
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 100);

      if (initialQuery) {
        handleSend(initialQuery);
      }
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    function handleCustomOpen(e) {
      if (e.detail?.prompt) {
        handleSend(e.detail.prompt);
      }
    }
    window.addEventListener("open-goti-chat", handleCustomOpen);
    return () => window.removeEventListener("open-goti-chat", handleCustomOpen);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  function scrollToBottom() {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }

  async function handleSend(textToSend) {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    triggerHaptic(20);
    setInputText("");
    setIsLoading(true);
    setGotiState("thinking");

    // Adiciona temporariamente a mensagem do usuário na tela
    const updatedHistory = [...messages, { role: "user", sender: "user", text, timestamp: new Date().toISOString() }];
    setMessages(updatedHistory);

    // Timeout visual de segurança irredutível: nunca deixa a UI presa em loading
    const visualSafetyTimer = setTimeout(() => {
      setIsLoading(false);
      setGotiState("idle");
    }, 13000);

    try {
      const sendPromise = gotiPreceptorService.sendMessage(text);
      // Intervalo breve para animação visual do Goti guiando (900ms)
      const minDeliberationPromise = new Promise((resolve) => setTimeout(resolve, 900));
      await Promise.all([sendPromise, minDeliberationPromise]);
      setMessages(gotiPreceptorService.getHistory());
      setGotiState("speaking");
      setTimeout(() => setGotiState("idle"), 2500);
    } catch (err) {
      console.error("Erro no chat do Goti:", err);
      // Fallback gracioso imediato em caso de anomalia
      const fallbackReply = gotiPreceptorService.generateEducationalFallback(text);
      const safeHistory = [
        ...updatedHistory,
        { role: "assistant", sender: "goti", text: fallbackReply, timestamp: new Date().toISOString() }
      ];
      setMessages(safeHistory);
      gotiPreceptorService.saveHistory(safeHistory);
      setGotiState("idle");
    } finally {
      clearTimeout(visualSafetyTimer);
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

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg h-[90dvh] sm:h-[650px] max-h-[92dvh] bg-slate-900 border border-slate-800 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho Fixo do Chat: SEMPRE visível com botão de fechar proeminente */}
        <div className="sticky top-0 z-20 shrink-0 p-4 sm:p-5 border-b border-slate-800/90 bg-slate-900/95 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative flex-shrink-0">
              {/* Ícone oficial do Goti sem margens brancas */}
              <img
                src="/goti/goti-icone.jpg"
                alt="Goti"
                className="w-12 h-12 rounded-2xl object-cover filter drop-shadow-md border border-teal-500/30 transition-transform hover:scale-105"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 pointer-events-none">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-slate-900"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  Goti IA
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {gotiState === "thinking" ? "Buscando no site..." : gotiState === "speaking" ? "Guiando..." : "Online"}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Guia Oficial da Plataforma Enfere
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearHistory}
              title="Reiniciar Conversa"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition tap-press"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                triggerHaptic(20);
                onClose();
              }}
              title="Fechar chat"
              aria-label="Fechar chat"
              className="p-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition tap-press"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Área de Mensagens com Rolagem Interna Isolada */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm bg-slate-900/60"
        >
          {/* Card de Boas-Vindas */}
          <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-800/80 flex items-start gap-3.5 shadow-2xs">
            <img
              src="/goti/goti-icone.jpg"
              alt="Goti"
              className="w-11 h-11 rounded-xl object-cover shrink-0 filter drop-shadow-xs border border-teal-500/30"
            />
            <div className="space-y-1">
              <p className="font-extrabold text-slate-100 text-sm">
                Guia da Plataforma com o Goti 💧
              </p>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Pergunte onde encontrar qualquer simulador, videoteca de procedimentos, laboratório de cálculo de dosagens ou casos clínicos no Enfere!
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
                  <img
                    src="/goti/goti-icone.jpg"
                    alt="Goti"
                    className="w-8 h-8 rounded-full object-cover shrink-0 self-end mb-1 filter drop-shadow-xs border border-teal-500/30"
                  />
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs leading-relaxed ${
                    isUser
                      ? "bg-teal-700 text-white rounded-br-xs font-medium"
                      : "bg-slate-800/90 text-slate-100 rounded-bl-xs border border-slate-700/80"
                  }`}
                >
                  <GotiMarkdownRenderer content={msg.text} isUser={isUser} />
                </div>
              </div>
            );
          })}

          {/* Indicador de Localização do Goti IA */}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center shrink-0 self-end mb-1 shadow-xs">
                <Sparkles className="w-4 h-4 text-emerald-100 animate-spin" />
              </div>
              <div className="bg-slate-800 rounded-2xl rounded-bl-xs p-3.5 border border-slate-700 flex items-center gap-2.5 text-slate-300">
                <span className="flex space-x-1 shrink-0">
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></span>
                </span>
                <span className="text-[11px] font-medium text-teal-200 transition-all duration-300">
                  {thinkingMessages[thinkingStep] || thinkingMessages[0]}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sugestões de Navegação & Treino no Site */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/70 shrink-0">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-500" /> Sugestões de Navegação & Treino no Site
          </p>
          <div ref={promptsScrollRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 select-none">
            {GOTI_NAVIGATION_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-medium bg-slate-800/90 border border-slate-700 text-slate-200 hover:border-teal-400 hover:text-teal-300 transition-all shrink-0 active:scale-95 disabled:opacity-50"
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
          className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Pergunte ao Goti onde encontrar ou treinar algo no site..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
          />

          <Button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="rounded-2xl bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 h-auto font-bold shadow-xs active:scale-95 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
}
