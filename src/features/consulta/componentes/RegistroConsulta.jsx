import React, { useState } from "react";
import PropTypes from "prop-types";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Panel } from "@/components/ui/surface";
import PageShell from "@/components/layout/PageShell";
import GotiAnimated from "@/components/mascot/GotiAnimated";
import BuscaDiagnostico from "./BuscaDiagnostico.jsx";

// Sugestões genéricas (não as esperadas do caso, para não entregar a resposta).
const SUGESTOES = ["Monitorar os sinais vitais", "Orientar o paciente e a família", "Registrar as informações no prontuário"];
const MAX_ACHADOS = 1500;

/** Registro de enfermagem ao fechar a consulta: achados, diagnósticos (NANDA-I) e intervenções. */
export default function RegistroConsulta({ onEnviar, enviando = false, erro = null, onVoltar }) {
  const [achados, setAchados] = useState("");
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [intervencoes, setIntervencoes] = useState([]);
  const [nova, setNova] = useState("");

  const adicionar = (texto) => {
    const t = texto.trim();
    if (!t || intervencoes.length >= 8 || intervencoes.includes(t)) return;
    setIntervencoes([...intervencoes, t.slice(0, 160)]);
    setNova("");
  };

  if (enviando) {
    return (
      <PageShell semDock>
        <Panel className="flex flex-col items-center gap-3 py-10 text-center" role="status">
          <GotiAnimated animation="thinking" size="md" />
          <p className="font-extrabold">Montando o seu relatório…</p>
          <p className="text-sm font-semibold text-[#9FB3C6]">Pode levar até meio minuto.</p>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell semDock>
      <header className="space-y-1">
        <h1 className="text-xl font-extrabold">Registro de enfermagem</h1>
        <p className="text-sm font-semibold text-[#9FB3C6]">Anote o que você descobriu na consulta.</p>
      </header>

      <Panel className="space-y-5">
        <section className="space-y-2">
          <label htmlFor="achados" className="text-sm font-bold">O que você encontrou</label>
          <Textarea
            id="achados"
            value={achados}
            maxLength={MAX_ACHADOS}
            onChange={(e) => setAchados(e.target.value)}
            rows={5}
            placeholder="Queixa, sintomas, medicações, alergias, hábitos…"
            className="bg-[#131F2E] border-[#27394B] text-[#EAF2F8]"
          />
          <p className="text-right text-xs font-semibold text-[#9FB3C6]">{achados.length}/{MAX_ACHADOS}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold">Diagnósticos de enfermagem</h2>
          <BuscaDiagnostico selecionados={diagnosticos} onChange={setDiagnosticos} />
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold">Intervenções</h2>
          <ul className="space-y-1">
            {intervencoes.map((i) => (
              <li key={i} className="flex items-center justify-between rounded-xl border border-[#27394B] px-3 py-2 text-sm font-semibold">
                <span>{i}</span>
                <button type="button" onClick={() => setIntervencoes(intervencoes.filter((x) => x !== i))} aria-label={`Remover ${i}`}>
                  <X size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input value={nova} onChange={(e) => setNova(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), adicionar(nova))} placeholder="Adicionar intervenção" aria-label="Adicionar intervenção" className="bg-[#131F2E] border-[#27394B] text-[#EAF2F8]" />
            <Button variant="outline" size="icon" onClick={() => adicionar(nova)} aria-label="Adicionar"><Plus size={18} aria-hidden="true" /></Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGESTOES.filter((s) => !intervencoes.includes(s)).map((s) => (
              <button key={s} type="button" onClick={() => adicionar(s)} className="rounded-full border border-[#27394B] px-3 py-1 text-xs font-bold text-[#9FB3C6]">+ {s}</button>
            ))}
          </div>
        </section>

        {erro && <p className="text-sm font-bold text-[#FF6B6B]" role="alert">{erro}</p>}

        <div className="flex gap-2">
          <Button variant="outline" onClick={onVoltar}>Voltar à conversa</Button>
          <Button variant="primary" size="xl" className="flex-1" onClick={() => onEnviar({ achados: achados.trim(), diagnosticos, intervencoes })}>Ver relatório</Button>
        </div>
      </Panel>
    </PageShell>
  );
}

RegistroConsulta.propTypes = {
  onEnviar: PropTypes.func.isRequired,
  enviando: PropTypes.bool,
  erro: PropTypes.string,
  onVoltar: PropTypes.func,
};
