import React, { useState } from 'react';
import { Sparkles, Send, Loader2, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { procedureService } from '@/services/procedureService';

export default function ProcedureAIChat({ procedure }) {
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'florence',
      text: `Olá! Sou a Tutora Florence AI. Estou acompanhando seu estudo de "${procedure.title}". Tem alguma dúvida sobre variações anatômicas, complicações ou condutas deste procedimento?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const suggestedQuestions = [
    'Quais são os erros mais comuns na prática hospitalar?',
    'E se houver resistência mecânica durante o procedimento?',
    'Como orientar o paciente ansioso antes de iniciar?',
  ];

  const handleSend = async (questionText = null) => {
    const textToSend = questionText || input.trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await procedureService.askFlorenceAI(procedure, textToSend);
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'florence',
        text: response,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errMsg = {
        id: `err-${Date.now()}`,
        sender: 'florence',
        text: 'Desculpe, tive uma instabilidade momentânea. Verifique os passos técnicos do POP acima.',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white shadow-2xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Tutora Florence AI · Dúvidas de Beira-Leito
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Raciocínio clínico sobre variações e dilemas deste procedimento
            </p>
          </div>
        </div>
      </div>

      {/* Histórico de Mensagens */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto no-scrollbar pr-1 mb-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2 text-xs ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'florence' && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-[10px]">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}

            <div
              className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none'
              }`}
            >
              {m.text}
            </div>

            {m.sender === 'user' && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px]">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
            <span>Florence AI está formulando a conduta clínica...</span>
          </div>
        )}
      </div>

      {/* Chips com Perguntas Sugeridas */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={loading}
            onClick={() => handleSend(q)}
            className="text-[10px] px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100 transition-colors text-left"
          >
            💡 {q}
          </button>
        ))}
      </div>

      {/* Input de Pergunta */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Tire uma dúvida sobre este procedimento..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="text-xs rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
          disabled={loading}
        />
        <Button
          type="button"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
