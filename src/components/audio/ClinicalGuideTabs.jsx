import React, { useState } from "react";
import {
  BrainCircuit,
  HeartPulse,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Zap,
} from "lucide-react";

export default function ClinicalGuideTabs({ onSelectSnippet: _onSelectSnippet = null }) {
  const [activeTab, setActiveTab] = useState("sinais");

  const TABS = [
    {
      id: "sinais",
      label: "Sinais Vitais",
      icon: HeartPulse,
      badge: "Essencial",
    },
    {
      id: "dor",
      label: "Dor & Sintomas",
      icon: Zap,
      badge: "EVA 0-10",
    },
    {
      id: "glasgow",
      label: "Sensório & Glasgow",
      icon: BrainCircuit,
      badge: "Escala 3-15",
    },
    {
      id: "identificacao",
      label: "Identificação",
      icon: UserCheck,
      badge: "Admissão",
    },
    {
      id: "historico",
      label: "Histórico & Risco",
      icon: ShieldAlert,
      badge: "Segurança",
    },
  ];

  const CONTENT = {
    sinais: {
      title: "Parâmetros e Sinais Vitais Essenciais",
      description: "Dite os valores com clareza. O sistema reconhece siglas e números colados:",
      items: [
        { label: "PA (Pressão Arterial)", example: "PA 130 por 90 mmHg (ou 130x90)", snippet: ", PA 130x90 mmHg" },
        { label: "FC (Frequência Cardíaca)", example: "FC 78 bpm (ou frequência cardíaca 30)", snippet: ", FC 78 bpm" },
        { label: "FR (Frequência Respiratória)", example: "FR 23 irpm (ou respiração 18)", snippet: ", FR 18 irpm" },
        { label: "SatO₂ (Oximetria de Pulso)", example: "Sat 95% (ou saturação de 95)", snippet: ", SatO2 96%" },
        { label: "Tax (Temperatura Axilar)", example: "Temperatura 37,5 (ou Tax 36,8)", snippet: ", Tax 36.8 °C" },
        { label: "HGT (Glicemia Capilar)", example: "Glicemia 300 (ou HGT 110 mg/dL)", snippet: ", HGT 110 mg/dL" },
      ],
      tip: "💡 Exemplo de fala contínua: 'PA 130 por 90, frequência cardíaca 30, respiração 23, saturação 95, temperatura 37,5, glicemia 300.'",
    },
    dor: {
      title: "Avaliação Completa da Dor (Escala EVA)",
      description: "Informe o local anatômico, a intensidade de 0 a 10 e o tipo de dor:",
      items: [
        { label: "Local da Dor", example: "Dor abdominal, dor torácica, cefaleia, lombar", snippet: " dor abdominal" },
        { label: "Intensidade (0 a 10)", example: "Intensidade 9, nota 8 de 10, dor 7", snippet: ", intensidade 8 de 10" },
        { label: "Características", example: "Em pontadas, em queimação, em aperto, cólica", snippet: " em pontadas" },
        { label: "Sem Dor", example: "Nega dor, indolor, sem queixas álgicas", snippet: ", sem queixas de dor" },
      ],
      tip: "💡 Exemplo de fala contínua: 'Relata dor abdominal intensa, intensidade 9 de 10, em pontadas, piora à palpação.'",
    },
    glasgow: {
      title: "Nível de Consciência e Escala de Glasgow",
      description: "Descreva a resposta neurológica do paciente ou a pontuação de Glasgow (3 a 15):",
      items: [
        { label: "Pontuação de Glasgow", example: "Glasgow 14, ECG 15, escala de Glasgow 12", snippet: ", Glasgow 14" },
        { label: "Lúcido / Orientado", example: "Lúcido e orientado, contactuando bem (LOTE)", snippet: ", lúcido e orientado" },
        { label: "Confuso / Desorientado", example: "Confuso, dificuldade para formular frases", snippet: ", confuso e desorientado" },
        { label: "Sonolento / Torporoso", example: "Sonolento, responde apenas a estímulo verbal", snippet: ", sonolento" },
        { label: "Desacordado / Inconsciente", example: "Desacordado, rebaixado, não responsivo", snippet: ", desacordado e não responsivo" },
      ],
      tip: "💡 Exemplo de fala contínua: 'Paciente encontra-se confuso, não formula frases direito, Glasgow 14, pupilas isocóricas.'",
    },
    identificacao: {
      title: "Dados de Identificação do Paciente",
      description: "Dite o nome, idade e o motivo principal da admissão:",
      items: [
        { label: "Nome do Paciente", example: "José Carlos da Silva, Maria de Fátima", snippet: "Paciente José Carlos, " },
        { label: "Idade", example: "35 anos, idade de 62 anos", snippet: "35 anos, " },
        { label: "Sexo / Gênero", example: "Masculino, feminino, paciente idoso", snippet: "masculino, " },
        { label: "Queixa Principal", example: "Chega dispneico com dor na barriga há 3 horas", snippet: "chega com queixa de dor súbita " },
      ],
      tip: "💡 Exemplo de fala contínua: 'José Carlos, 35 anos, chega ao pronto-atendimento dispneico e com dor forte.'",
    },
    historico: {
      title: "Histórico Clínico, Quedas e Acompanhamento",
      description: "Fale comorbidades, remédios e circunstâncias que influenciam o plano:",
      items: [
        { label: "Quedas & Marcha", example: "Quase caiu, dificuldade para deambular, marcha instável", snippet: ", dificuldade para deambular, quase caiu" },
        { label: "Acompanhante", example: "Está desacompanhado (ou veio com a esposa)", snippet: ", sem acompanhante" },
        { label: "Comorbidades", example: "Hipertenso, diabético, cardiopata", snippet: ", histórico de diabetes e hipertensão" },
        { label: "Medicamentos / Alergias", example: "Em uso de insulina, nega alergias", snippet: ", nega alergias" },
      ],
      tip: "💡 Exemplo de fala: 'Está desacompanhado, com dificuldade para deambular, quase caiu há pouco tempo, sem quedas prévias.'",
    },
  };

  const current = CONTENT[activeTab];

  return (
    <div className="rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 uppercase tracking-wide">
          <Sparkles className="h-4 w-4 text-teal-600" /> Guia Rápido: O que Falar no Relato
        </p>
        <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
          Dicas para não esquecer
        </span>
      </div>

      {/* TABS HEADER */}
      <div className="mt-3 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      <div className="mt-3 space-y-2.5">
        <div>
          <h4 className="text-xs font-bold text-slate-800">{current.title}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">{current.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {current.items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-100 bg-slate-50/70 p-2.5 transition-colors"
            >
              <p className="text-[11px] font-semibold text-slate-800">{item.label}</p>
              <p className="text-[11px] text-teal-800/90 mt-0.5 leading-snug">{item.example}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-teal-50/80 p-2.5 text-[11px] text-teal-900 border border-teal-100 leading-relaxed">
          {current.tip}
        </div>
      </div>
    </div>
  );
}
