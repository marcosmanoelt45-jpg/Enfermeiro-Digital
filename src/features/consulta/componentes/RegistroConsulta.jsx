import React, { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/surface";
import PageShell from "@/components/layout/PageShell";
import GotiAnimated from "@/components/mascot/GotiAnimated";
import FolhaEvolucao from "./FolhaEvolucao.jsx";
import DiagnosticosRegistro, { tituloDoDiagnostico } from "./DiagnosticosRegistro.jsx";

const MAX_ACHADOS = 1500;
const MAX_INTERVENCOES = 8;

// Intervenções escritas livremente: cada linha (ou item com marcador) vira uma intervenção para o servidor.
export function separarIntervencoes(texto) {
  return String(texto ?? "")
    .split(/\n|;/)
    .map((l) => l.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim())
    .filter((l) => l.length > 1)
    .slice(0, MAX_INTERVENCOES)
    .map((l) => l.slice(0, 160));
}

/** Registro de enfermagem ao fechar a consulta: evolução, diagnósticos (NANDA-I com fatores e características) e intervenções. */
export default function RegistroConsulta({ onEnviar, enviando = false, erro = null, onVoltar, achadosIniciais = "", briefing = null, turnos = [] }) {
  // A evolução escrita durante a conversa já entra aqui, para o aluno revisar.
  const [achados, setAchados] = useState(String(achadosIniciais ?? "").slice(0, MAX_ACHADOS));
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [intervencoes, setIntervencoes] = useState("");

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

  const enviar = () =>
    onEnviar({
      achados: achados.trim(),
      diagnosticos: diagnosticos.map((d) => d.codigo),
      intervencoes: separarIntervencoes(intervencoes),
      indicadores: diagnosticos.map((d) => ({ codigo: d.codigo, fatores: d.fatores, caracteristicas: d.caracteristicas })),
    });

  const nomesDx = diagnosticos.map((d) => tituloDoDiagnostico(d.codigo));

  return (
    <PageShell semDock larguraMax="6xl">
      <header className="space-y-1">
        <h1 className="text-xl font-extrabold">Registro de enfermagem</h1>
        <p className="text-sm font-semibold text-[#9FB3C6]">Revise a evolução, escolha os diagnósticos e escreva as intervenções.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <section className="space-y-2">
          <h2 className="text-sm font-bold">Evolução</h2>
          <FolhaEvolucao texto={achados} onMudar={setAchados} briefing={briefing} turnos={turnos} linhas={14} idCampo="registro-evolucao" />
        </section>

        <div className="space-y-5">
          <Panel className="space-y-2">
            <h2 className="text-sm font-bold">Diagnósticos de enfermagem (NANDA-I)</h2>
            <DiagnosticosRegistro valor={diagnosticos} onMudar={setDiagnosticos} />
          </Panel>

          <section className="space-y-2">
            <h2 className="text-sm font-bold">Intervenções</h2>
            <FolhaEvolucao
              titulo="INTERVENÇÕES DE ENFERMAGEM"
              etapa="intervencoes"
              texto={intervencoes}
              onMudar={setIntervencoes}
              briefing={briefing}
              turnos={turnos}
              diagnosticos={nomesDx}
              linhas={8}
              placeholder="Uma intervenção por linha (até 8). Ex.: verbo no infinitivo e a frequência."
              idCampo="registro-intervencoes"
            />
          </section>
        </div>
      </div>

      {erro && <p className="text-sm font-bold text-[#FF6B6B]" role="alert">{erro}</p>}

      <div className="flex gap-2 lg:mx-auto lg:max-w-xl">
        <Button variant="outline" onClick={onVoltar}>Voltar à conversa</Button>
        <Button variant="primary" size="xl" className="flex-1" onClick={enviar}>Ver relatório</Button>
      </div>
    </PageShell>
  );
}

RegistroConsulta.propTypes = {
  onEnviar: PropTypes.func.isRequired,
  enviando: PropTypes.bool,
  erro: PropTypes.string,
  onVoltar: PropTypes.func,
  achadosIniciais: PropTypes.string,
  briefing: PropTypes.object,
  turnos: PropTypes.array,
};
