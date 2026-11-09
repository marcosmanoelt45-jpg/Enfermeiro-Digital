import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import PainelFlutuante from "@/components/prontuario/PainelFlutuante.jsx";
import CenaAoVivo from "@/features/cena/CenaAoVivo.jsx";
import { ErroServidor, plantao as servidor, preCarregarVoz } from "@/features/cena/servidor.js";
import MinijogoRunner from "@/features/minijogos/componentes/MinijogoRunner.jsx";
import { MINIJOGOS_ESTATICOS } from "@/features/minijogos/dados/index.js";
import falasAna from "@/data/falas/enfermeira-ana.json";
import Prontuario from "./componentes/Prontuario.jsx";
import { minijogoDaLacuna } from "./logica/lacunaMinijogo.js";
import { criarRoteiro, falaDaEnfermeira, lacunasAbertas, lacunasParaAvaliacao, perguntaAtual, preencherLacuna, responder, respostasParaAvaliacao } from "./logica/roteiro.js";

const FALAS = falasAna.falas;
const TEXTO = new Map(FALAS.map((f) => [f.id, f.texto]));
const perguntaFala = (p) => ({ id: p.id, texto: TEXTO.get(p.id) ?? p.texto, origem: "fixa" });

const PERSONAGEM = "enfermeira-ana";

// Cena do Plantão: a enfermeira pergunta em ordem SBAR (falas fixas), o aluno responde consultando o prontuário.
// A cada resposta de texto, a IA da Ana entende o que o aluno disse (turno_plantao): se ele não soube ou fugiu do
// assunto, ela orienta e pergunta de novo (uma vez); se respondeu, ela reage ao conteúdo e segue. Sem servidor,
// cai nas reações fixas de antes. Perguntas de números seguem conferidas só por código.
export default function PlantaoCena({ cenario, onFinalizado, onSair }) {
  const roteiro = useRef(criarRoteiro(cenario));
  const ultimas = useRef({});
  const tentativas = useRef({}); // perguntaId -> respostas já recusadas pela Ana
  const recusadas = useRef([]); // respostas que a Ana pediu para completar: também contam como "já dito"

  // A próxima pergunta já é conhecida: pede a voz dela enquanto o aluno responde, para não esperar a geração.
  useEffect(() => {
    const p = roteiro.current.cenario.perguntas[1];
    if (p) preCarregarVoz({ texto: perguntaFala(p).texto, personagemId: PERSONAGEM });
  }, []);
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
      const pergunta = perguntaAtual(roteiro.current);
      if (!pergunta || !String(texto ?? "").trim()) return [];

      // IA da Ana (só nas perguntas de texto; números são conferidos por código).
      let ia = null;
      if (pergunta.espera.tipo === "texto") {
        const tentativa = tentativas.current[pergunta.id] ?? 0;
        // O que o aluno já disse (respostas aceitas e as que ela pediu para completar): a Ana não pede de novo.
        const historico = [...roteiro.current.respostas.map((r) => ({ perguntaId: r.perguntaId, texto: r.texto })), ...recusadas.current].slice(-10);
        ia = await servidor.turno({ cenarioId: cenario.id, perguntaId: pergunta.id, texto, tentativa, historico }).catch(() => null);
        if (ia?.fala && ia.situacao !== "respondeu" && tentativa === 0) {
          // Não soube, fugiu do assunto ou ficou incompleto: a Ana orienta e pergunta de novo, sem avançar.
          tentativas.current[pergunta.id] = 1;
          recusadas.current.push({ perguntaId: pergunta.id, texto });
          return [{ id: `${pergunta.id}.ia.${Date.now()}`, texto: ia.fala, origem: "aovivo" }];
        }
      }

      let r = responder(roteiro.current, texto);
      if (!r.reacao) return [];
      roteiro.current = r.estado;
      // O aluno já respondeu o que a próxima pergunta pediria: ela não pergunta de novo, registra e segue.
      const seguinteJa = perguntaAtual(r.estado);
      if (ia?.cobreProxima && !r.concluida && r.reacao === "ok" && seguinteJa?.espera.tipo === "texto" && !seguinteJa.dependeDe) {
        const anteriores = [...recusadas.current.filter((x) => x.perguntaId === pergunta.id).map((x) => x.texto), texto].join(" ");
        const r2 = responder(r.estado, anteriores);
        if (r2.reacao) {
          r = { ...r2, reacao: "ok" };
          roteiro.current = r2.estado;
        }
      }
      const falas = [];
      if (ia?.fala && r.reacao === "ok") {
        falas.push({ id: `${pergunta.id}.ia.${Date.now()}`, texto: ia.fala, origem: "aovivo" });
      } else {
        const reacao = falaDaEnfermeira(r.reacao, FALAS, Math.random, ultimas.current);
        if (reacao) {
          ultimas.current[r.reacao] = reacao.id;
          falas.push(reacao);
        }
      }
      if (r.concluida) setTimeout(avaliar, 0);
      else if (r.reacao !== "faltou_numero") {
        falas.push(perguntaFala(perguntaAtual(r.estado)));
        // E já pede a voz da pergunta seguinte a esta.
        const seguinte = r.estado.cenario.perguntas[r.estado.indice + 1];
        if (seguinte) preCarregarVoz({ texto: perguntaFala(seguinte).texto, personagemId: PERSONAGEM });
      }
      return falas;
    },
    [avaliar, cenario.id]
  );

  const preencher = (lacuna, resultado) => {
    const valor = resultado?.achado?.valor ?? lacuna.valorEsperado;
    roteiro.current = preencherLacuna(roteiro.current, lacuna.campo, valor);
    setLacunas({ ...roteiro.current.lacunas });
    setLacunaAberta(null);
  };

  // Examinar: lacuna com minijogo abre o minijogo; as demais revelam o achado direto no prontuário
  // (o aluno examina e encontra; antes era uma escolha sem dado nenhum para basear).
  const examinar = (lacuna) => (lacuna.minijogo ? setLacunaAberta(lacuna) : preencher(lacuna, null));

  const abertas = lacunasAbertas({ ...roteiro.current, lacunas }).length;
  const definicao = lacunaAberta ? minijogoDaLacuna(lacunaAberta, cenario.id, MINIJOGOS_ESTATICOS) : null;

  return (
    <>
      <CenaAoVivo
        personagemId={PERSONAGEM}
        titulo={`Enfermeira Ana · ${cenario.bed}`}
        progresso={{ atual: Math.min(roteiro.current.indice + 1, cenario.perguntas.length), total: cenario.perguntas.length }}
        falasIniciais={abertura}
        onEnviar={onEnviar}
        onEncerrar={onSair}
        placeholderFala="Responda por voz ou texto"
        acoes={[{ id: "prontuario", rotulo: abertas ? `Prontuário (${abertas} para examinar)` : "Prontuário", onClick: () => setProntuario((v) => !v), soCelular: true }]}
        slotLateral={<Prontuario cenario={cenario} lacunasPreenchidas={lacunas} onAbrirLacuna={examinar} compacto />}
      />

      <PainelFlutuante aberto={prontuario} titulo="Prontuário" onFechar={() => setProntuario(false)}>
        <Prontuario cenario={cenario} lacunasPreenchidas={lacunas} onAbrirLacuna={examinar} compacto />
      </PainelFlutuante>

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
