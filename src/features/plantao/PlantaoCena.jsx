import React, { useCallback, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { AnimatePresence, m as motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sheetVariants, scrimVariants } from "@/lib/motion";
import CenaAoVivo from "@/features/cena/CenaAoVivo.jsx";
import { ErroServidor, plantao as servidor } from "@/features/cena/servidor.js";
import MinijogoRunner from "@/features/minijogos/componentes/MinijogoRunner.jsx";
import { MINIJOGOS_ESTATICOS } from "@/features/minijogos/dados/index.js";
import falasAna from "@/data/falas/enfermeira-ana.json";
import Prontuario from "./componentes/Prontuario.jsx";
import { minijogoDaLacuna } from "./logica/lacunaMinijogo.js";
import { criarRoteiro, falaDaEnfermeira, lacunasAbertas, lacunasParaAvaliacao, perguntaAtual, preencherLacuna, responder, respostasParaAvaliacao } from "./logica/roteiro.js";

const FALAS = falasAna.falas;
const TEXTO = new Map(FALAS.map((f) => [f.id, f.texto]));
const perguntaFala = (p) => ({ id: p.id, texto: TEXTO.get(p.id) ?? p.texto, origem: "fixa" });

// Cena do Plantão: a enfermeira pergunta em ordem SBAR (falas fixas), o aluno responde consultando o prontuário.
export default function PlantaoCena({ cenario, onFinalizado, onSair }) {
  const roteiro = useRef(criarRoteiro(cenario));
  const ultimas = useRef({});
  const [lacunas, setLacunas] = useState({});
  const [prontuario, setProntuario] = useState(false);
  const [lacunaAberta, setLacunaAberta] = useState(null);
  const [avaliando, setAvaliando] = useState(false);
  const [erro, setErro] = useState(null);

  // A abertura usa o prefixo plt.abertura.N (não plt.r.): busca à parte.
  const abertura = useMemo(() => {
    const a = FALAS.filter((f) => f.id.startsWith("plt.abertura."));
    const f = a[Math.floor(Math.random() * a.length)];
    return f ? [{ id: f.id, texto: f.texto, origem: "fixa" }, perguntaFala(cenario.perguntas[0])] : [perguntaFala(cenario.perguntas[0])];
  }, [cenario]);

  const avaliar = useCallback(async () => {
    setErro(null);
    setAvaliando(true);
    try {
      const { relatorio } = await servidor.avaliar({
        cenarioId: cenario.id,
        respostas: respostasParaAvaliacao(roteiro.current),
        lacunas: lacunasParaAvaliacao(roteiro.current),
      });
      onFinalizado(relatorio, lacunasParaAvaliacao(roteiro.current));
    } catch (e) {
      setErro(e instanceof ErroServidor ? e.message : "Não foi possível montar o relatório. Tente de novo.");
    } finally {
      setAvaliando(false);
    }
  }, [cenario.id, onFinalizado]);

  const onEnviar = useCallback(
    async (texto) => {
      const r = responder(roteiro.current, texto);
      if (!r.reacao) return [];
      roteiro.current = r.estado;
      const falas = [];
      const reacao = falaDaEnfermeira(r.reacao, FALAS, Math.random, ultimas.current);
      if (reacao) {
        ultimas.current[r.reacao] = reacao.id;
        falas.push(reacao);
      }
      if (r.concluida) setTimeout(avaliar, 0);
      else if (r.reacao !== "faltou_numero") falas.push(perguntaFala(perguntaAtual(r.estado)));
      return falas;
    },
    [avaliar]
  );

  const preencher = (lacuna, resultado) => {
    const valor = resultado?.achado?.valor ?? lacuna.valorEsperado;
    roteiro.current = preencherLacuna(roteiro.current, lacuna.campo, valor);
    setLacunas({ ...roteiro.current.lacunas });
    setLacunaAberta(null);
  };

  const abertas = lacunasAbertas({ ...roteiro.current, lacunas }).length;
  const definicao = lacunaAberta ? minijogoDaLacuna(lacunaAberta, cenario.id, MINIJOGOS_ESTATICOS) : null;

  return (
    <>
      <CenaAoVivo
        personagemId="enfermeira-ana"
        titulo={`Enfermeira Ana · ${cenario.bed}`}
        progresso={{ atual: Math.min(roteiro.current.indice + 1, cenario.perguntas.length), total: cenario.perguntas.length }}
        falasIniciais={abertura}
        onEnviar={onEnviar}
        onEncerrar={onSair}
        placeholderFala="Responda por voz ou texto"
        acoes={[{ id: "prontuario", rotulo: abertas ? `Prontuário (${abertas} para examinar)` : "Prontuário", onClick: () => setProntuario(true) }]}
      />

      <AnimatePresence>
        {prontuario && (
          <div className="fixed inset-0 z-40 flex items-end" role="dialog" aria-modal="true" aria-label="Prontuário do paciente">
            <motion.div className="absolute inset-0 bg-black/70" variants={scrimVariants} initial="hidden" animate="show" exit="exit" onClick={() => setProntuario(false)} />
            <motion.div className="relative max-h-[85vh] w-full space-y-3 overflow-y-auto rounded-t-3xl border border-[#27394B] bg-[#0B131D] p-4 pb-8" variants={sheetVariants} initial="hidden" animate="show" exit="exit">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold">Prontuário</h2>
                <Button variant="ghost" size="icon" onClick={() => setProntuario(false)} aria-label="Fechar prontuário"><X size={20} aria-hidden="true" /></Button>
              </div>
              <Prontuario cenario={cenario} lacunasPreenchidas={lacunas} onAbrirLacuna={setLacunaAberta} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {definicao && <MinijogoRunner key={definicao.id} definicao={definicao} modo="plantao" onConcluir={(res) => preencher(lacunaAberta, res)} onFechar={() => setLacunaAberta(null)} />}

      {(avaliando || erro) && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#27394B] bg-[#131F2E] p-4 text-center" role={erro ? "alert" : "status"}>
          {erro ? (
            <div className="space-y-2">
              <p className="text-sm font-bold">{erro}</p>
              <Button variant="warning" size="sm" onClick={avaliar}>Tentar de novo</Button>
            </div>
          ) : (
            <p className="text-sm font-bold">A enfermeira está conferindo a passagem…</p>
          )}
        </div>
      )}
    </>
  );
}

PlantaoCena.propTypes = {
  cenario: PropTypes.object.isRequired,
  onFinalizado: PropTypes.func.isRequired,
  onSair: PropTypes.func.isRequired,
};
