import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import PageShell from "@/components/layout/PageShell";
import PersonagemStage from "./componentes/PersonagemStage.jsx";
import LegendaFala from "./componentes/LegendaFala.jsx";
import HistoricoFalas from "./componentes/HistoricoFalas.jsx";
import ControleFala from "./componentes/ControleFala.jsx";
import BarraCena from "./componentes/BarraCena.jsx";
import EstadoBloqueado from "./componentes/EstadoBloqueado.jsx";
import { cenaReducer, criarEstado } from "./logica/cenaReducer.js";
import { ErroServidor, MENSAGENS_PADRAO } from "./logica/erroServidor.js";
import useVozPersonagem from "./useVozPersonagem.js";
import useFalaAluno from "./useFalaAluno.js";

const novoId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `t-${Date.now()}-${Math.random().toString(16).slice(2)}`);

/**
 * Motor "Cena ao Vivo": um personagem fala, o aluno responde (voz ou texto) e a área decide a resposta.
 * A área só transforma o texto do aluno em falas (`onEnviar`); tudo o mais é daqui.
 */
export default function CenaAoVivo({
  personagemId,
  titulo,
  progresso,
  slotTopo,
  acoes = [],
  onEnviar,
  falasIniciais = [],
  onEncerrar,
  bloqueio = null,
  permitirVoz = true,
}) {
  const [estado, dispatch] = useReducer(cenaReducer, undefined, () => criarEstado());
  const voz = useVozPersonagem(personagemId);
  const aluno = useFalaAluno({ ativo: permitirVoz && estado.status === "aguardando_aluno" });
  const [reacao, setReacao] = useState(null);
  const canalRef = useRef("texto");
  const textoDaVozRef = useRef("");
  const enviarRef = useRef(onEnviar);
  useEffect(() => {
    enviarRef.current = onEnviar;
  });

  const suportaVoz = permitirVoz && aluno.suportaVoz;
  const bloqueado = bloqueio || (estado.status === "bloqueada" ? { tipo: "cota", mensagem: estado.erro?.mensagem || MENSAGENS_PADRAO.COTA_EXCEDIDA } : null);

  // Começar: o gesto libera áudio e microfone no iOS.
  const comecar = useCallback(async () => {
    await voz.desbloquear();
    dispatch({ tipo: "INICIAR", falas: falasIniciais });
  }, [voz, falasIniciais]);

  // Cada fala do personagem toca e, ao terminar, a fila avança.
  useEffect(() => {
    if (estado.status !== "personagem_falando" || !estado.falaAtual) return;
    let vivo = true;
    voz.falar([estado.falaAtual]).then((completou) => {
      if (vivo && completou) dispatch({ tipo: "FALA_TERMINOU" });
    });
    return () => {
      vivo = false;
    };
    // voz.falar muda só com o personagem; a fala atual é a dependência real.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.falaAtual, estado.status]);

  // Reação de acerto/erro quando a fala traz essa emoção.
  useEffect(() => {
    const e = estado.falaAtual?.emocao;
    setReacao(e === "acerto" || e === "erro" ? e : null);
  }, [estado.falaAtual]);

  const enviarAoServidor = useCallback(async (texto, turnoId) => {
    try {
      const falas = await enviarRef.current(texto, canalRef.current, turnoId);
      dispatch({ tipo: "RESPOSTA", falas: Array.isArray(falas) ? falas : [] });
    } catch (e) {
      const codigo = e instanceof ErroServidor ? e.codigo : "ERRO_INTERNO";
      if (codigo === "COTA_EXCEDIDA") dispatch({ tipo: "COTA_EXCEDIDA", mensagem: e.message });
      else if (codigo === "SESSAO_ENCERRADA") onEncerrar?.();
      else dispatch({ tipo: "FALHOU", erro: { codigo, mensagem: e?.message } });
    }
  }, [onEncerrar]);

  const enviarTexto = useCallback(
    (texto) => {
      const turnoId = novoId();
      canalRef.current = textoDaVozRef.current && textoDaVozRef.current === texto ? "voz" : "texto";
      textoDaVozRef.current = "";
      dispatch({ tipo: "ENVIOU_TEXTO", texto, canal: canalRef.current, turnoId });
      enviarAoServidor(texto, turnoId);
    },
    [enviarAoServidor]
  );

  const tentarDeNovo = useCallback(() => {
    dispatch({ tipo: "REENVIAR" });
    enviarAoServidor(estado.rascunhoAluno, estado.turnoPendenteId);
  }, [enviarAoServidor, estado.rascunhoAluno, estado.turnoPendenteId]);

  const segurar = useCallback(() => {
    voz.parar(); // evita que o microfone capte a voz do personagem
    dispatch({ tipo: "ALUNO_SEGUROU" });
    aluno.segurar();
  }, [voz, aluno]);

  const soltar = useCallback(async () => {
    const texto = await aluno.soltar();
    textoDaVozRef.current = texto;
    dispatch({ tipo: "SOLTOU", texto });
  }, [aluno]);

  const sair = useCallback(() => {
    voz.parar();
    aluno.liberar();
    dispatch({ tipo: "ENCERRAR" });
    onEncerrar?.();
  }, [voz, aluno, onEncerrar]);

  const emocao = reacao ?? (estado.status === "processando" ? "pensando" : estado.falaAtual?.emocao ?? "parado");
  const ultimoPersonagem = [...estado.turnos].reverse().find((t) => t.autor === "personagem");
  const textoLegenda = estado.falaAtual?.texto ?? (estado.status === "aguardando_aluno" ? ultimoPersonagem?.texto : "");

  return (
    <PageShell semDock>
      <BarraCena titulo={titulo} progresso={progresso} slotTopo={slotTopo} onSair={sair} rodando={estado.status !== "ocioso" && estado.status !== "encerrada"} />

      <PersonagemStage personagemId={personagemId} emocao={emocao} falando={voz.falando} onReacaoTerminou={() => setReacao(null)} />

      {acoes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {acoes.map((a) => (
            <Button key={a.id} variant="outline" size="sm" onClick={a.onClick}>
              {a.rotulo}
            </Button>
          ))}
        </div>
      )}

      {estado.status === "ocioso" ? (
        <Button variant="primary" size="lg" className="w-full" onClick={comecar}>
          Começar
        </Button>
      ) : (
        <>
          <LegendaFala texto={textoLegenda} palavraAtual={voz.palavraAtual} falando={voz.falando} />
          <HistoricoFalas turnos={estado.turnos} className="max-h-48" />
          {estado.status === "processando" && <p className="text-center text-sm font-bold text-[#9FB3C6]" role="status">Aguardando resposta…</p>}
          {estado.status === "erro_recuperavel" && (
            <div className="rounded-2xl border border-[#FF6B6B]/40 bg-[#131F2E] p-3 text-center space-y-2" role="alert">
              <p className="text-sm font-bold">{estado.erro?.codigo === "IA_INDISPONIVEL" ? "O paciente ficou em silêncio… tente de novo." : estado.erro?.mensagem || MENSAGENS_PADRAO.ERRO_INTERNO}</p>
              <Button variant="warning" size="sm" onClick={tentarDeNovo}>Tentar de novo</Button>
            </div>
          )}
          {bloqueado ? (
            <EstadoBloqueado tipo={bloqueado.tipo} mensagem={bloqueado.mensagem} acao={bloqueado.acao} />
          ) : (
            <ControleFala
              status={estado.status}
              suportaVoz={suportaVoz}
              segurando={aluno.segurando}
              nivel={aluno.nivel}
              textoParcial={aluno.textoParcial}
              rascunho={estado.rascunhoAluno}
              permissao={aluno.permissao}
              onPedirPermissao={aluno.pedirPermissao}
              onSegurar={segurar}
              onSoltar={soltar}
              onEnviar={enviarTexto}
              onDescartar={() => dispatch({ tipo: "SOLTOU", texto: "" })}
              desabilitado={estado.status === "encerrada" || estado.status === "ocioso"}
            />
          )}
        </>
      )}
    </PageShell>
  );
}

CenaAoVivo.propTypes = {
  personagemId: PropTypes.string.isRequired,
  titulo: PropTypes.string.isRequired,
  progresso: PropTypes.shape({ atual: PropTypes.number, total: PropTypes.number }),
  slotTopo: PropTypes.node,
  acoes: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, rotulo: PropTypes.string, onClick: PropTypes.func })),
  onEnviar: PropTypes.func.isRequired,
  falasIniciais: PropTypes.array,
  onEncerrar: PropTypes.func,
  bloqueio: PropTypes.shape({ tipo: PropTypes.string, mensagem: PropTypes.string, acao: PropTypes.object }),
  permitirVoz: PropTypes.bool,
};
