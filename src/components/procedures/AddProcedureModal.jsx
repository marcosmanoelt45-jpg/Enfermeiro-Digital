import React, { useState } from 'react';
import { X, Sparkles, Video, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { procedureService } from '@/services/procedureService';

export default function AddProcedureModal({ isOpen, onClose, onCreated }) {
  const [mode, setMode] = useState('ai'); // 'ai' | 'manual'

  // Estado para criação com IA
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Estado para cadastro manual
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState('vasculares');
  const [manualVideoUrl, setManualVideoUrl] = useState('');
  const [manualDuration, setManualDuration] = useState('8 min');
  const [manualDescription, setManualDescription] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  if (!isOpen) return null;

  const handleGenerateWithAI = async () => {
    if (!aiTopic.trim()) {
      toast({ title: 'Digite o nome do procedimento', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const created = await procedureService.generateProcedureWithAI(aiTopic.trim());
      toast({
        title: '✨ Procedimento Gerado com Sucesso!',
        description: `O guia didático de "${created.title}" foi criado com materiais e técnica asséptica.`,
      });
      if (onCreated) onCreated(created);
      onClose();
    } catch (err) {
      toast({
        title: 'Erro ao gerar procedimento com IA',
        description: err.message || 'Verifique sua chave de API do Gemini em Minha Conta.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveManual = () => {
    if (!manualTitle.trim() || !manualVideoUrl.trim()) {
      toast({ title: 'Preencha ao menos o título e o link do vídeo', variant: 'destructive' });
      return;
    }

    setIsSavingManual(true);
    try {
      const categoryLabels = {
        vasculares: 'Acessos Vasculares',
        eliminacoes: 'Cateterismos & Eliminações',
        medicamentos: 'Terapia Medicamentosa',
        respiratorio: 'Vias Aéreas & Ventilação',
        curativos: 'Curativos & Lesões',
        urgencia: 'Urgência & Emergência',
      };

      const newProc = procedureService.saveCustom({
        title: manualTitle.trim(),
        category: manualCategory,
        categoryLabel: categoryLabels[manualCategory] || 'Geral',
        duration: manualDuration.trim() || '5 min',
        difficulty: 'Fundamental',
        levelBadge: 'Docente / Turma',
        cofenNorm: 'Resolução COFEN nº 736/2024',
        videoUrl: manualVideoUrl.trim(),
        videoSource: 'Canal de Ensino / Docente',
        description: manualDescription.trim() || 'Procedimento didático cadastrado para treinamento clínico.',
        materials: [
          { id: 'm1', name: 'Material estéril para o procedimento', checked: false },
          { id: 'm2', name: 'EPIs completos (luvas, máscara e avental)', checked: false },
        ],
        timestamps: [
          { time: '00:00', label: 'Início & Materiais', seconds: 0 },
          { time: '01:30', label: 'Técnica Principal', seconds: 90 },
        ],
        steps: [
          { id: 's1', stepNumber: 1, title: 'Paramentação e higienização', desc: 'Lavar as mãos e calçar luvas conforme técnica asséptica.', checked: false },
          { id: 's2', stepNumber: 2, title: 'Execução do procedimento', desc: 'Seguir o protocolo operacional padrão da instituição.', checked: false },
        ],
        safetyAlerts: [
          { type: 'warning', title: 'Atenção aos princípios assépticos', text: 'Não contamine os materiais durante a abertura dos pacotes estéreis.' },
        ],
      });

      toast({
        title: 'Vídeo Cadastrado!',
        description: `O procedimento "${newProc.title}" já está disponível na Videoteca.`,
      });
      if (onCreated) onCreated(newProc);
      onClose();
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Adicionar Novo Procedimento à Videoteca
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gere um guia completo com Inteligência Artificial ou cadastre um vídeo gravado próprio.
          </p>
        </div>

        {/* Alternador de Modo */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'ai'
                ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            <span>Gerar com IA (Google Gemini)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'manual'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            <Video className="h-3.5 w-3.5 text-emerald-600" />
            <span>Cadastrar Vídeo Próprio</span>
          </button>
        </div>

        {/* Modo IA */}
        {mode === 'ai' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-xs text-teal-900 dark:text-teal-200 leading-relaxed">
              <strong className="block font-bold mb-1">Como funciona a geração com IA?</strong>
              A Inteligência Artificial construirá o Procedimento Operacional Padrão (POP) completo, lista de materiais de bandeja, técnica passo a passo em ordem lógica e alertas críticos de iatrogenia baseados no COFEN.
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nome ou Tema do Procedimento Clínico:
              </label>
              <Input
                placeholder="Ex: Gasometria Arterial, Curativo em PICC, Eletrocardiograma..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateWithAI()}
                className="text-xs rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                disabled={isGenerating}
              />
            </div>

            <Button
              type="button"
              onClick={handleGenerateWithAI}
              disabled={isGenerating || !aiTopic.trim()}
              className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 shadow-xs"
            >
              {isGenerating ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" /> Estruturando POP com Inteligência Artificial...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Gerar Procedimento & Checklist com IA
                </span>
              )}
            </Button>
          </div>
        )}

        {/* Modo Manual */}
        {mode === 'manual' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Título do Procedimento:
              </label>
              <Input
                placeholder="Ex: Punção Venosa em Pediatria com Jelco 24G"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="text-xs rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Área / Categoria:
                </label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                >
                  <option value="vasculares">Acessos Vasculares</option>
                  <option value="eliminacoes">Cateterismos & Eliminações</option>
                  <option value="medicamentos">Terapia Medicamentosa</option>
                  <option value="respiratorio">Vias Aéreas & Ventilação</option>
                  <option value="curativos">Curativos & Lesões</option>
                  <option value="urgencia">Urgência & Emergência</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Duração Estimada:
                </label>
                <Input
                  placeholder="Ex: 6 min"
                  value={manualDuration}
                  onChange={(e) => setManualDuration(e.target.value)}
                  className="text-xs rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Link do Vídeo (YouTube, Google Drive ou MP4):
              </label>
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={manualVideoUrl}
                onChange={(e) => setManualVideoUrl(e.target.value)}
                className="text-xs rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Descrição ou Observações do Professor:
              </label>
              <textarea
                rows={3}
                placeholder="Indicações do procedimento, cuidados práticos em laboratório..."
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>

            <Button
              type="button"
              onClick={handleSaveManual}
              disabled={isSavingManual || !manualTitle.trim() || !manualVideoUrl.trim()}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 shadow-xs"
            >
              <Plus className="h-4 w-4" /> Salvar Vídeo na Videoteca
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
