import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { m as motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import PageShell from "@/components/layout/PageShell";
import { celebrate } from "@/lib/celebrate";
import { fadeUp, listStagger } from "@/lib/motion";
import { tituloDoDiagnostico } from "./DiagnosticosRegistro.jsx";
import { frasePontoDeMelhoria, ROTULO_PERSONALIDADE } from "../logica/relatorioView.js";

// Relatório da consulta: uma cor de destaque só (a da marca), superfícies neutras e detalhes que abrem ao tocar.

const BARRAS = [
  ["anamnese", "Anamnese"],
  ["comunicacao", "Comunicação"],
  ["seguranca", "Segurança"],
  ["raciocinio", "Raciocínio"],
];

function Anel({ valor }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, valor ?? 0));
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1F3045" strokeWidth="7" />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="#20D5B5"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v / 100) }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedNumber value={valor} className="text-3xl font-black" />
        <span className="text-[10px] font-bold text-[#6F859A]">nota</span>
      </div>
    </div>
  );
}
Anel.propTypes = { valor: PropTypes.number };

function Barra({ rotulo, valor }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-[#9FB3C6]">{rotulo}</span>
        <span className="tabular-nums">{valor === null ? "—" : valor}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#1F3045]">
        <motion.div className="h-full origin-left rounded-full bg-[#20D5B5]" initial={{ scaleX: 0 }} animate={{ scaleX: (valor ?? 0) / 100 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
      </div>
    </div>
  );
}
Barra.propTypes = { rotulo: PropTypes.string.isRequired, valor: PropTypes.number };

// Item que abre ao tocar: o texto fica visível e o detalhe (pergunta sugerida, sugestão de fala) só ao abrir.
function ItemAbre({ titulo, detalhe, marca = null }) {
  const [aberto, setAberto] = useState(false);
  return (
    <li className="border-b border-[#1F3045] last:border-0">
      <button type="button" onClick={() => detalhe && setAberto((v) => !v)} className="flex w-full items-start gap-2 py-2.5 text-left" aria-expanded={detalhe ? aberto : undefined}>
        <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">
          {titulo}
          {marca && <span className="ml-1.5 align-middle text-[11px] font-bold text-[#9FB3C6]">· {marca}</span>}
        </span>
        {detalhe && <ChevronDown size={16} className={`mt-0.5 shrink-0 text-[#6F859A] transition-transform duration-200 ${aberto ? "rotate-180" : ""}`} aria-hidden="true" />}
      </button>
      {aberto && detalhe && (
        <motion.p className="pb-3 text-sm font-semibold text-[#20D5B5]" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          {detalhe}
        </motion.p>
      )}
    </li>
  );
}
ItemAbre.propTypes = { titulo: PropTypes.node.isRequired, detalhe: PropTypes.node, marca: PropTypes.string };

function Cartao({ titulo, children, contagem = null }) {
  return (
    <motion.section variants={fadeUp} className="rounded-3xl border border-[#1F3045] bg-[#121D2A] p-4">
      <h2 className="mb-1 flex items-baseline justify-between text-sm font-extrabold">
        {titulo}
        {contagem !== null && <span className="text-xs font-bold text-[#6F859A]">{contagem}</span>}
      </h2>
      {children}
    </motion.section>
  );
}
Cartao.propTypes = { titulo: PropTypes.string.isRequired, children: PropTypes.node, contagem: PropTypes.node };

const nomeDx = (d) => (d.nome && d.nome !== d.codigo ? d.nome : tituloDoDiagnostico(d.codigo));

/** Relatório da consulta: notas, diagnósticos, o que ficou escondido e comunicação. */
export default function RelatorioConsulta({ relatorio, turnos = [], onNova, onInicio }) {
  const [verConversa, setVerConversa] = useState(false);
  const { notas } = relatorio;
  const escondidos = relatorio.cobertura.escondidos;
  const revelados = relatorio.cobertura.revelados;
  const rac = relatorio.raciocinio;
  const com = relatorio.comunicacao;

  useEffect(() => {
    if (notas.geral >= 70) celebrate();
    // só quando o relatório abre
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageShell larguraMax="6xl">
      <motion.div className="space-y-4" variants={listStagger} initial="hidden" animate="show">
        <motion.header variants={fadeUp} className="flex flex-wrap items-center gap-5 rounded-3xl border border-[#1F3045] bg-[#121D2A] p-4">
          <Anel valor={notas.geral} />
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-lg font-extrabold">Relatório da consulta</h1>
            <p className="text-sm font-semibold text-[#9FB3C6]">
              O paciente era <b className="text-[#EAF2F8]">{ROTULO_PERSONALIDADE[relatorio.personalidadeRevelada] ?? relatorio.personalidadeRevelada}</b>. Você descobriu {revelados.length} de {revelados.length + escondidos.length} informações.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-x-5 gap-y-2 sm:w-auto sm:min-w-[340px] sm:grid-cols-4">
            {BARRAS.map(([chave, rotulo]) => (
              <Barra key={chave} rotulo={rotulo} valor={notas[chave]} />
            ))}
          </div>
        </motion.header>

        {relatorio.aviso && <p className="rounded-2xl border border-[#27394B] px-3 py-2 text-center text-sm font-bold text-[#9FB3C6]" role="status">{relatorio.aviso}</p>}

        <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
          <Cartao titulo="Diagnósticos">
            <ul>
              {rac.diagnosticosCertos.map((d) => <ItemAbre key={`c${d.codigo}`} titulo={nomeDx(d)} marca="certo" />)}
              {rac.diagnosticosFaltando.map((d) => <ItemAbre key={`f${d.codigo}`} titulo={<span className="text-[#9FB3C6]">{nomeDx(d)}</span>} marca="faltou" />)}
              {rac.extras.map((d) => <ItemAbre key={`e${d.codigo}`} titulo={<span className="text-[#9FB3C6]">{nomeDx(d)}</span>} marca="a mais" />)}
            </ul>
            {rac.comentario && <p className="pt-2 text-sm font-semibold text-[#9FB3C6]">{rac.comentario}</p>}
          </Cartao>

          <Cartao titulo="O que ficou sem perguntar" contagem={escondidos.length ? `${escondidos.length}` : null}>
            {escondidos.length === 0 ? (
              <p className="py-2 text-sm font-semibold">Você descobriu tudo.</p>
            ) : (
              <ul>
                {escondidos.map((f) => (
                  <ItemAbre key={f.id} titulo={f.texto} marca={f.peso === 3 ? "importante" : null} detalhe={`Pergunta que revelaria: “${f.perguntaQueRevela}”`} />
                ))}
              </ul>
            )}
            <p className="pt-2 text-xs font-semibold text-[#6F859A]">Toque num item para ver a pergunta.</p>
          </Cartao>

          {com && (
            <Cartao titulo="Comunicação">
              <ul>
                {com.pontosFortes.map((p, i) => (
                  <ItemAbre key={`f${i}`} titulo={p.porque} marca="mandou bem" detalhe={frasePontoDeMelhoria(p)} />
                ))}
                {com.melhorar.map((p, i) => (
                  <ItemAbre key={`m${i}`} titulo={p.porque} marca="para melhorar" detalhe={p.sugestao ? `Você poderia dizer: “${p.sugestao}”` : frasePontoDeMelhoria(p)} />
                ))}
              </ul>
            </Cartao>
          )}
        </div>

        {verConversa && (
          <motion.section variants={fadeUp} className="max-h-[50vh] space-y-2 overflow-y-auto rounded-3xl border border-[#1F3045] bg-[#121D2A] p-4">
            {turnos.map((t) => (
              <p key={t.ordem} className="text-sm font-semibold">
                <b className={t.autor === "aluno" ? "text-[#20D5B5]" : "text-[#9FB3C6]"}>{t.autor === "aluno" ? "Você: " : "Paciente: "}</b>
                {t.texto}
              </p>
            ))}
          </motion.section>
        )}

        <motion.div variants={fadeUp} className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="primary" size="lg" className="sm:min-w-[220px]" onClick={onNova}>Nova consulta</Button>
          {turnos.length > 0 && <Button variant="outline" size="lg" onClick={() => setVerConversa((v) => !v)}>{verConversa ? "Esconder a conversa" : "Rever conversa"}</Button>}
          <Button variant="ghost" size="lg" onClick={onInicio}>Voltar ao início</Button>
        </motion.div>
      </motion.div>
    </PageShell>
  );
}

RelatorioConsulta.propTypes = {
  relatorio: PropTypes.object.isRequired,
  turnos: PropTypes.array,
  onNova: PropTypes.func,
  onInicio: PropTypes.func,
};
