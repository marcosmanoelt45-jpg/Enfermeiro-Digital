import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { m as motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { shake, vibrate } from "@/lib/motion";
import { celebrate } from "@/lib/celebrate";
import CenaAoVivo from "@/features/cena/CenaAoVivo.jsx";
import falasRui from "@/data/falas/medico-rui.json";
import Receita from "./componentes/Receita.jsx";
import TecladoCalculo from "./componentes/TecladoCalculo.jsx";
import FolhaMotivos from "./componentes/FolhaMotivos.jsx";
import MemoriaCalculo from "./componentes/MemoriaCalculo.jsx";
import { lerNumeroFalado } from "./logica/numerosFalados.js";
import { aplicar, falaDaReacao, novoEstadoItem, resumirRodada, sequenciaDePrimeira } from "./logica/rodada.js";

const FALAS = falasRui.falas;
const TEXTO_DA_FALA = new Map(FALAS.map((f) => [f.id, f.texto]));
const enunciadoDe = (item) => ({ id: item.falas.enunciado, texto: TEXTO_DA_FALA.get(item.falas.enunciado) ?? "", origem: "fixa" });

const AVISOS = {
  quase: "Quase! Esse valor é inteiro: arredonde para o inteiro mais próximo.",
  invalido: "Não entendi o número. Use dígitos, com vírgula se precisar.",
  unidade_errada: "A unidade que você falou não é a pedida nesta prescrição.",
};

// Contagem de tempo do item (modo corrido): pressa aos 60 s e fim aos 90 s. Só conta com a cena esperando o aluno.
function Temporizador({ modo, ativo, onTempo }) {
  const [seg, setSeg] = useState(0);
  const pressaFeita = useRef(false);
  const fim = useRef(false);
  const pressaTexto = useMemo(() => falaDaReacao("pressa", FALAS)?.texto ?? "", []);

  useEffect(() => {
    if (!ativo) return undefined;
    const t = setInterval(() => setSeg((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [ativo]);

  useEffect(() => {
    if (modo.pressaAoS && seg >= modo.pressaAoS && !pressaFeita.current) {
      pressaFeita.current = true;
      vibrate([20, 30, 20]);
    }
    if (seg >= modo.tempoPorItemS && !fim.current) {
      fim.current = true;
      onTempo();
    }
  }, [seg, modo, onTempo]);

  const restante = Math.max(0, modo.tempoPorItemS - seg);
  const apressado = modo.pressaAoS && seg >= modo.pressaAoS;
  return (
    <div className="space-y-1" role="timer" aria-live="off">
      <p className={`text-center text-sm font-black tabular-nums ${apressado ? "text-[#FFC247]" : "text-[#9FB3C6]"}`}>{restante} s</p>
      {apressado && <p className="text-center text-xs font-bold text-[#FFC247]" role="status">Dr. Rui: “{pressaTexto}”</p>}
    </div>
  );
}
Temporizador.propTypes = { modo: PropTypes.object.isRequired, ativo: PropTypes.bool, onTempo: PropTypes.func.isRequired };

// Controle de um item: teclado (e voz, pelo controle da cena) enquanto não fecha; depois a memória e "Próxima".
function ControleItem({ item, estado, aviso, modo, ultimo, enviar, podeEnviar, acaoRef, onAbrirFolha }) {
  const proxima = () => {
    acaoRef.current = { tipo: "proxima" };
    enviar(ultimo ? "Terminei." : "Pode passar a próxima.");
  };
  const tempo = useCallback(() => {
    acaoRef.current = { tipo: "tempo" };
    enviar("Não deu tempo.");
  }, [acaoRef, enviar]);

  if (estado.finalizado) {
    const acertou = estado.resultado === "acerto";
    return (
      <div className="space-y-3">
        {(estado.mostrarMemoria || item.erroProposital) && <MemoriaCalculo item={item} />}
        {acertou && !item.erroProposital && (
          <details className="rounded-2xl border border-[#1F3045] bg-[#0E1722] p-3">
            <summary className="cursor-pointer text-sm font-bold">Ver a conta</summary>
            <div className="pt-2"><MemoriaCalculo item={item} /></div>
          </details>
        )}
        <Button variant={acertou ? "success" : "danger"} size="xl" className="w-full" onClick={proxima} disabled={!podeEnviar}>
          {ultimo ? "Ver resultado" : "Próxima prescrição"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {modo.tempoPorItemS && <Temporizador modo={modo} ativo={podeEnviar} onTempo={tempo} />}
      {aviso && <p className="text-center text-sm font-bold text-[#FFC247]" role="status">{AVISOS[aviso]}</p>}
      <TecladoCalculo
        key={item.id}
        unidade={item.unidade ?? "mL"}
        inteiro={item.casas === 0}
        desabilitado={!podeEnviar}
        onConferir={(valor) => {
          acaoRef.current = null;
          enviar(valor);
        }}
        onQuestionar={onAbrirFolha}
      />
    </div>
  );
}
ControleItem.propTypes = {
  item: PropTypes.object.isRequired,
  estado: PropTypes.object.isRequired,
  aviso: PropTypes.string,
  modo: PropTypes.object.isRequired,
  ultimo: PropTypes.bool,
  enviar: PropTypes.func.isRequired,
  podeEnviar: PropTypes.bool,
  acaoRef: PropTypes.object.isRequired,
  onAbrirFolha: PropTypes.func.isRequired,
};

export default function CalculoCena({ rodada, modo, onFinalizar, onSair }) {
  const [indice, setIndice] = useState(0);
  const [estado, setEstado] = useState(() => novoEstadoItem(rodada[0]));
  const [aviso, setAviso] = useState(null);
  const [folha, setFolha] = useState(false);
  const [erroTick, setErroTick] = useState(0);
  const acaoRef = useRef(null);
  const enviarRef = useRef(null);
  // Estado lógico da rodada (lido dentro do onEnviar, que a cena chama de forma assíncrona).
  const s = useRef({ indice: 0, estado: novoEstadoItem(rodada[0]), finalizados: [], tempos: [], inicioItem: Date.now(), ultimas: {}, confeteFeito: false });

  const falasIniciais = useMemo(() => [falaDaReacao("abertura", FALAS), enunciadoDe(rodada[0])].filter(Boolean), [rodada]);

  const onEnviar = useCallback(
    async (texto) => {
      const r = s.current;
      const acao = acaoRef.current;
      acaoRef.current = null;

      if (acao?.tipo === "proxima") {
        const prox = r.indice + 1;
        if (prox >= rodada.length) {
          const resumo = resumirRodada(r.finalizados, r.tempos);
          setTimeout(() => onFinalizar(resumo, r.finalizados), 0);
          return [];
        }
        r.indice = prox;
        r.estado = novoEstadoItem(rodada[prox]);
        r.inicioItem = Date.now();
        setIndice(prox);
        setEstado(r.estado);
        setAviso(null);
        return [enunciadoDe(rodada[prox])];
      }

      let evento;
      if (acao?.tipo === "questionar") evento = { tipo: "questionar", motivo: acao.motivo };
      else if (acao?.tipo === "tempo") evento = { tipo: "tempo" };
      else {
        const lido = lerNumeroFalado(texto);
        evento = { tipo: "resposta", valor: lido?.valor ?? null, unidadeDita: lido?.unidade ?? null };
      }

      const { estado: novo, reacao, aviso: av } = aplicar(r.estado, evento);
      r.estado = novo;
      setEstado(novo);
      setAviso(av ?? null);

      if (novo.finalizado) {
        r.finalizados.push(novo);
        r.tempos.push(Date.now() - r.inicioItem);
        if (novo.resultado === "acerto") {
          vibrate(15);
          if (!r.confeteFeito && novo.primeira && sequenciaDePrimeira(r.finalizados) >= 5) {
            r.confeteFeito = true;
            celebrate();
          }
        } else {
          vibrate([30, 40, 30]);
          setErroTick((n) => n + 1);
        }
      } else if (reacao === "erro1") {
        vibrate([30, 40, 30]);
        setErroTick((n) => n + 1);
      }

      const fala = reacao ? falaDaReacao(reacao, FALAS, Math.random, r.ultimas) : null;
      if (fala) r.ultimas[reacao] = fala.id;
      return fala ? [fala] : [];
    },
    [rodada, onFinalizar]
  );

  const item = rodada[indice];
  const ultimo = indice === rodada.length - 1;

  return (
    <>
      <CenaAoVivo
        personagemId="medico-rui"
        titulo={`Dr. Rui · ${modo.rotulo}`}
        progresso={{ atual: indice + 1, total: rodada.length }}
        falasIniciais={falasIniciais}
        onEnviar={onEnviar}
        onEncerrar={onSair}
        placeholderFala="Fale o valor ou digite"
        slotAbaixoPalco={
          <motion.div key={`${item.id}-${erroTick}`} animate={erroTick > 0 ? shake : undefined}>
            <Receita item={item} />
          </motion.div>
        }
        slotControle={({ enviar, podeEnviar }) => {
          enviarRef.current = enviar;
          return (
            <ControleItem
              item={item}
              estado={estado}
              aviso={aviso}
              modo={modo}
              ultimo={ultimo}
              enviar={enviar}
              podeEnviar={podeEnviar}
              acaoRef={acaoRef}
              onAbrirFolha={() => setFolha(true)}
            />
          );
        }}
      />
      <FolhaMotivos
        aberta={folha}
        onFechar={() => setFolha(false)}
        onEscolher={(motivo) => {
          setFolha(false);
          acaoRef.current = { tipo: "questionar", motivo: motivo.id };
          enviarRef.current?.(`Questiono a prescrição: ${motivo.rotulo.toLowerCase()}.`);
        }}
      />
    </>
  );
}

CalculoCena.propTypes = {
  rodada: PropTypes.array.isRequired,
  modo: PropTypes.object.isRequired,
  onFinalizar: PropTypes.func.isRequired,
  onSair: PropTypes.func.isRequired,
};
