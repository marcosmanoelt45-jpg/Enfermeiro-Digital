import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Chip, Panel, Inset } from "@/components/ui/surface";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedProgress } from "@/components/ui/animated-progress";
import PageShell from "@/components/layout/PageShell";
import { celebrate } from "@/lib/celebrate";
import { frasePontoDeMelhoria, pontosDaLinha, ROTULO_PERSONALIDADE, tomDaNota } from "../logica/relatorioView.js";

function LinhaConfianca({ linha }) {
  if (!linha || linha.length < 2) return null;
  return (
    <svg viewBox="0 0 280 80" className="w-full" role="img" aria-label={`Confiança do paciente ao longo da conversa: ${linha.join(", ")}`}>
      <line x1="6" y1="40" x2="274" y2="40" stroke="#27394B" strokeDasharray="4 4" />
      <polyline points={pontosDaLinha(linha)} fill="none" stroke="#20D5B5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
LinhaConfianca.propTypes = { linha: PropTypes.array };

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

  return (
    <PageShell>
      <header className="space-y-3 text-center">
        <h1 className="text-xl font-extrabold">Relatório da consulta</h1>
        <div>
          <AnimatedNumber value={notas.geral} className="text-6xl font-black text-[#20D5B5]" />
          <p className="text-sm font-bold text-[#9FB3C6]">nota geral</p>
        </div>
      </header>

      {relatorio.aviso && <p className="rounded-xl border border-[#FFC247]/40 px-3 py-2 text-center text-sm font-bold text-[#FFC247]" role="status">{relatorio.aviso}</p>}

      <Panel className="space-y-3">
        {BARRAS.map(([chave, rotulo]) => (
          <div key={chave} className="space-y-1">
            <div className="flex justify-between text-sm font-bold">
              <span>{rotulo}</span>
              <span>{notas[chave] === null ? "indisponível" : notas[chave]}</span>
            </div>
            {notas[chave] !== null && <AnimatedProgress value={notas[chave]} tone={tomDaNota(notas[chave])} label={`${rotulo}: ${notas[chave]}`} />}
          </div>
        ))}
      </Panel>

      <Panel className="space-y-3">
        <h2 className="text-base font-extrabold">Quem era o paciente</h2>
        <p className="text-sm font-semibold">Personalidade: <b>{ROTULO_PERSONALIDADE[relatorio.personalidadeRevelada] ?? relatorio.personalidadeRevelada}</b></p>
        <LinhaConfianca linha={relatorio.linhaConfianca} />
      </Panel>

      <Panel className="space-y-3">
        <h2 className="text-base font-extrabold">O que o paciente escondeu</h2>
        {relatorio.cobertura.escondidos.length === 0 && <p className="text-sm font-semibold text-[#3DD68C]">Você descobriu tudo. Excelente!</p>}
        {relatorio.cobertura.escondidos.map((f) => (
          <Inset key={f.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold">{f.texto}</p>
              {f.peso === 3 && <Chip tone="danger">Crítico</Chip>}
            </div>
            <p className="text-xs font-semibold text-[#9FB3C6]">{f.porque}</p>
            <p className="text-xs font-bold text-[#20D5B5]">Pergunta que funcionaria: “{f.perguntaQueRevela}”</p>
          </Inset>
        ))}
      </Panel>

      <Panel className="space-y-2">
        <h2 className="text-base font-extrabold">O que você descobriu</h2>
        {relatorio.cobertura.revelados.length === 0 ? (
          <p className="text-sm font-semibold text-[#9FB3C6]">Nada ainda. Da próxima vez, comece perguntando o que trouxe o paciente.</p>
        ) : (
          <ul className="space-y-1 text-sm font-semibold">
            {relatorio.cobertura.revelados.map((f) => <li key={f.id}>• {f.texto}</li>)}
          </ul>
        )}
      </Panel>

      {relatorio.comunicacao && (
        <Panel className="space-y-3">
          <h2 className="text-base font-extrabold">Comunicação</h2>
          {relatorio.comunicacao.pontosFortes.map((p, i) => (
            <Inset key={`f${i}`} className="space-y-1">
              <Chip tone="success">Ponto forte</Chip>
              {frasePontoDeMelhoria(p) && <p className="text-xs font-semibold text-[#9FB3C6]">{frasePontoDeMelhoria(p)}</p>}
              <p className="text-sm font-semibold">{p.porque}</p>
            </Inset>
          ))}
          {relatorio.comunicacao.melhorar.map((p, i) => (
            <Inset key={`m${i}`} className="space-y-1">
              <Chip tone="warning">Para melhorar</Chip>
              {frasePontoDeMelhoria(p) && <p className="text-xs font-semibold text-[#9FB3C6]">{frasePontoDeMelhoria(p)}</p>}
              <p className="text-sm font-semibold">{p.porque}</p>
              <p className="text-xs font-bold text-[#20D5B5]">Você poderia dizer: “{p.sugestao}”</p>
            </Inset>
          ))}
          {relatorio.comunicacao.comentarioGeral && <p className="text-sm font-semibold text-[#9FB3C6]">{relatorio.comunicacao.comentarioGeral}</p>}
        </Panel>
      )}

      <Panel className="space-y-2">
        <h2 className="text-base font-extrabold">Raciocínio</h2>
        {[["diagnosticosCertos", "Certos", "success"], ["diagnosticosFaltando", "Faltando", "warning"], ["extras", "Extras", "brand"]].map(([chave, rotulo, tom]) =>
          relatorio.raciocinio[chave].length > 0 ? (
            <div key={chave} className="space-y-1">
              <p className="text-xs font-bold text-[#9FB3C6]">{rotulo}</p>
              <div className="flex flex-wrap gap-2">
                {relatorio.raciocinio[chave].map((d) => <Chip key={d.codigo} tone={tom}>{d.nome}</Chip>)}
              </div>
            </div>
          ) : null
        )}
        {relatorio.raciocinio.comentario && <p className="text-sm font-semibold text-[#9FB3C6]">{relatorio.raciocinio.comentario}</p>}
      </Panel>

      <div className="flex flex-col gap-2">
        {turnos.length > 0 && <Button variant="outline" onClick={() => setVerConversa((v) => !v)}>{verConversa ? "Esconder a conversa" : "Rever conversa"}</Button>}
        {verConversa && (
          <Panel className="space-y-2">
            {turnos.map((t) => (
              <p key={t.ordem} className={`text-sm font-semibold ${t.autor === "aluno" ? "text-[#20D5B5]" : "text-[#EAF2F8]"}`}>
                <b>{t.autor === "aluno" ? "Você: " : "Paciente: "}</b>{t.texto}
              </p>
            ))}
          </Panel>
        )}
        <Button variant="primary" size="lg" onClick={onNova}>Nova consulta</Button>
        <Button variant="ghost" onClick={onInicio}>Voltar ao início</Button>
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
