import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Chip, Panel } from "@/components/ui/surface";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import PageShell from "@/components/layout/PageShell";
import { celebrate } from "@/lib/celebrate";
import { tituloDoDiagnostico } from "./DiagnosticosRegistro.jsx";
import { frasePontoDeMelhoria, ROTULO_PERSONALIDADE, tomDaNota } from "../logica/relatorioView.js";


const BARRAS = [
  ["anamnese", "Anamnese"],
  ["comunicacao", "Comunicação"],
  ["seguranca", "Segurança"],
  ["raciocinio", "Raciocínio"],
];

/** Relatório da consulta: notas, quem era o paciente, o que escondeu, comunicação e raciocínio. */
export default function RelatorioConsulta({ relatorio, turnos = [], onNova, onInicio }) {
  const [verConversa, setVerConversa] = useState(false);
  const { notas } = relatorio;

  useEffect(() => {
    if (notas.geral >= 70) celebrate();
    // só quando o relatório abre
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const escondidos = relatorio.cobertura.escondidos;
  const revelados = relatorio.cobertura.revelados;
  return (
    <PageShell larguraMax="6xl">
      <h1 className="text-xl font-extrabold">Relatório da consulta</h1>
      {relatorio.aviso && <p className="rounded-xl border border-[#FFC247]/40 px-3 py-2 text-center text-sm font-bold text-[#FFC247]" role="status">{relatorio.aviso}</p>}

      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        {/* Coluna 1: notas */}
        <Panel className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <AnimatedNumber value={notas.geral} className="text-5xl font-black text-[#20D5B5]" />
              <p className="text-xs font-bold text-[#9FB3C6]">nota geral</p>
            </div>
            <p className="text-sm font-semibold">
              Paciente: <b>{ROTULO_PERSONALIDADE[relatorio.personalidadeRevelada] ?? relatorio.personalidadeRevelada}</b>
            </p>
          </div>
          <div className="space-y-2.5">
            {BARRAS.map(([chave, rotulo]) => (
              <div key={chave} className="space-y-1">
                <div className="flex justify-between text-sm font-bold">
                  <span>{rotulo}</span>
                  <span className="tabular-nums">{notas[chave] === null ? "indisponível" : notas[chave]}</span>
                </div>
                {notas[chave] !== null && <AnimatedProgress value={notas[chave]} tone={tomDaNota(notas[chave])} label={`${rotulo}: ${notas[chave]}`} />}
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-[#27394B] pt-3">
            <h2 className="text-sm font-extrabold">Diagnósticos</h2>
            {[["diagnosticosCertos", "Certos", "success"], ["diagnosticosFaltando", "Faltando", "warning"], ["extras", "Extras", "brand"]].map(([chave, rotulo, tom]) =>
              relatorio.raciocinio[chave].length > 0 ? (
                <div key={chave} className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-[#9FB3C6]">{rotulo}:</span>
                  {relatorio.raciocinio[chave].map((d) => <Chip key={d.codigo} tone={tom}>{d.nome && d.nome !== d.codigo ? d.nome : tituloDoDiagnostico(d.codigo)}</Chip>)}
                </div>
              ) : null
            )}
            {relatorio.raciocinio.comentario && <p className="text-sm font-semibold text-[#9FB3C6]">{relatorio.raciocinio.comentario}</p>}
          </div>
        </Panel>

        {/* Coluna 2: anamnese */}
        <Panel className="space-y-3">
          <h2 className="text-base font-extrabold">O que ficou escondido</h2>
          {escondidos.length === 0 && <p className="text-sm font-semibold text-[#3DD68C]">Você descobriu tudo. Excelente!</p>}
          <ul className="space-y-2">
            {escondidos.map((f) => (
              <li key={f.id} className="space-y-0.5 border-l-2 border-[#FFC247] pl-2.5">
                <p className="text-sm font-bold">
                  {f.texto} {f.peso === 3 && <Chip tone="danger">Crítico</Chip>}
                </p>
                <p className="text-xs font-bold text-[#20D5B5]">Pergunte: “{f.perguntaQueRevela}”</p>
              </li>
            ))}
          </ul>
          <h2 className="pt-1 text-base font-extrabold">O que você descobriu</h2>
          {revelados.length === 0 ? (
            <p className="text-sm font-semibold text-[#9FB3C6]">Nada ainda. Da próxima vez, comece perguntando o que trouxe o paciente.</p>
          ) : (
            <ul className="space-y-1 text-sm font-semibold">
              {revelados.map((f) => <li key={f.id} className="border-l-2 border-[#3DD68C] pl-2.5">{f.texto}</li>)}
            </ul>
          )}
        </Panel>

        {/* Coluna 3: comunicação */}
        {relatorio.comunicacao && (
          <Panel className="space-y-3">
            <h2 className="text-base font-extrabold">Comunicação</h2>
            <ul className="space-y-2">
              {relatorio.comunicacao.pontosFortes.map((p, i) => (
                <li key={`f${i}`} className="border-l-2 border-[#3DD68C] pl-2.5 text-sm font-semibold">
                  {frasePontoDeMelhoria(p) && <span className="block text-xs font-bold text-[#3DD68C]">{frasePontoDeMelhoria(p)}</span>}
                  {p.porque}
                </li>
              ))}
              {relatorio.comunicacao.melhorar.map((p, i) => (
                <li key={`m${i}`} className="border-l-2 border-[#FFC247] pl-2.5 text-sm font-semibold">
                  {frasePontoDeMelhoria(p) && <span className="block text-xs font-bold text-[#FFC247]">{frasePontoDeMelhoria(p)}</span>}
                  {p.porque}
                  {p.sugestao && <span className="block text-xs font-bold text-[#20D5B5]">Você poderia dizer: “{p.sugestao}”</span>}
                </li>
              ))}
            </ul>
            {relatorio.comunicacao.comentarioGeral && <p className="text-sm font-semibold text-[#9FB3C6]">{relatorio.comunicacao.comentarioGeral}</p>}
          </Panel>
        )}
      </div>

      {verConversa && (
        <Panel className="max-h-[50vh] space-y-2 overflow-y-auto">
          {turnos.map((t) => (
            <p key={t.ordem} className={`text-sm font-semibold ${t.autor === "aluno" ? "text-[#20D5B5]" : "text-[#EAF2F8]"}`}>
              <b>{t.autor === "aluno" ? "Você: " : "Paciente: "}</b>{t.texto}
            </p>
          ))}
        </Panel>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button variant="primary" size="lg" className="sm:min-w-[220px]" onClick={onNova}>Nova consulta</Button>
        {turnos.length > 0 && <Button variant="outline" size="lg" onClick={() => setVerConversa((v) => !v)}>{verConversa ? "Esconder a conversa" : "Rever conversa"}</Button>}
        <Button variant="ghost" size="lg" onClick={onInicio}>Voltar ao início</Button>
      </div>
    </PageShell>
  );
}

RelatorioConsulta.propTypes = {
  relatorio: PropTypes.object.isRequired,
  turnos: PropTypes.array,
  onNova: PropTypes.func,
  onInicio: PropTypes.func,
};
