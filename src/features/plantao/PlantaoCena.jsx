import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { ClipboardList, NotebookPen } from "lucide-react";
import JanelaFolha from "@/components/prontuario/JanelaFolha.jsx";
import { MODELO_SBAR } from "@/components/prontuario/modelosAnotacao.js";
import { ICONE_ANOTACAO, ICONE_PRONTUARIO } from "@/components/prontuario/icones.js";
import FolhaEvolucao from "@/features/consulta/componentes/FolhaEvolucao.jsx";
import { useAuth } from "@/lib/AuthContext";
import CenaAoVivo from "@/features/cena/CenaAoVivo.jsx";
import { ErroServidor, plantao as servidor, preCarregarVoz } from "@/features/cena/servidor.js";
import MinijogoRunner from "@/features/minijogos/componentes/MinijogoRunner.jsx";
import { MINIJOGOS_ESTATICOS } from "@/features/minijogos/dados/index.js";
import falasAna from "@/data/falas/enfermeira-ana.json";
import { paginasPlantao } from "./componentes/Prontuario.jsx";
import FolhaResposta from "@/components/feedback/FolhaResposta.jsx";

const CORPO_DA_AUSCULTA = { dpoc: "dpoc", choque_anafilatico: "mulher" };

const RETORNO = {
  incompleto: { titulo: "Faltou um pedaço.", texto: "Responda de novo completando o que a Ana pediu." },
  nao_sabe: { titulo: "Sem problema.", texto: "Olhe o prontuário e tente responder com o que encontrar." },
  fora_do_tema: { titulo: "Vamos voltar ao paciente.", texto: "Responda o que a Ana perguntou." },
  faltou_numero: { titulo: "Faltou o número.", texto: "Diga o valor com a unidade, como no prontuário." },
};
import { minijogoDaLacuna } from "./logica/lacunaMinijogo.js";
import { exameDoTexto } from "./logica/exameDoTexto.js";
import { sexoDoCenario } from "./dados/prontuarioPlantao.js";
import { criarRoteiro, falaDaEnfermeira, lacunasParaAvaliacao, perguntaAtual, preencherLacuna, responder, respostasParaAvaliacao } from "./logica/roteiro.js";

const FALAS = falasAna.falas;
const TEXTO = new Map(FALAS.map((f) => [f.id, f.texto]));
const perguntaFala = (p) => ({ id: p.id, texto: TEXTO.get(p.id) ?? p.texto, origem: "fixa" });

const PERSONAGEM = "enfermeira-ana";


// Cena do Plantão: a enfermeira pergunta em ordem SBAR (falas fixas), o aluno responde consultando o prontuário.
// A cada resposta de texto, a IA da Ana entende o que o aluno disse (turno_plantao): se ele não soube ou fugiu do
// assunto, ela orienta e pergunta de novo (uma vez); se respondeu, ela reage ao conteúdo e segue. Sem servidor,
// cai nas reações fixas de antes. Perguntas de números seguem conferidas só por código.
export default function PlantaoCena({ cenario, onFinalizado, onSair, onProgresso }) {
  const roteiro = useRef(criarRoteiro(cenario));
  const ultimas = useRef({});
  const tentativas = useRef({}); // perguntaId -> respostas já recusadas pela Ana
  const recusadas = useRef([]); // respostas que a Ana pediu para completar: também contam como "já dito"
  // A conversa inteira (falas da Ana e do aluno), mandada à IA a cada resposta: ela relê tudo antes de falar.
  const conversa = useRef(null);

  // A próxima pergunta já é conhecida: pede a voz dela enquanto o aluno responde, para não esperar a geração.
  useEffect(() => {
    const p = roteiro.current.cenario.perguntas[1];
    if (p) preCarregarVoz({ texto: perguntaFala(p).texto, personagemId: PERSONAGEM });
  }, []);
  const [lacunas, setLacunas] = useState({});
  const [prontuario, setProntuario] = useState(false);
  const [paginaProntuario, setPaginaProntuario] = useState(0);
  // Anotação da passagem (rascunho do aluno): já vem com o modelo SBAR e fica guardada por caso.
  const { user } = useAuth();
  const chaveNotas = `enfere_notas_plantao_${user?.id ?? "anon"}_${cenario.id}`;
  const [notas, setNotas] = useState(() => {
    try {
      return localStorage.getItem(chaveNotas) ?? MODELO_SBAR;
    } catch {
      return MODELO_SBAR;
    }
  });
  const [notasAbertas, setNotasAbertas] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(chaveNotas, notas);
    } catch {
      /* sem armazenamento: vale só nesta tela */
    }
  }, [chaveNotas, notas]);
  const [lacunaAberta, setLacunaAberta] = useState(null);
  // Exame pedido na conversa ("vou avaliar o dreno"): aparece o botão para examinar.
  const [examePendente, setExamePendente] = useState(null);
  // Retorno visual quando a resposta não fecha (a Ana também fala; aqui fica escrito para o aluno completar).
  const [retorno, setRetorno] = useState(null);
  // Paciente do minijogo de ausculta: o do mesmo sexo do caso.
  // Corpo do paciente no minijogo de ausculta, igual à foto do prontuário: casos com desenho próprio (DPOC e
  // choque anafilático); nos outros, mulher jovem, Dona Teresinha (idosa) ou Sr. Marcus.
  const pacienteDoCaso = CORPO_DA_AUSCULTA[cenario.id] ?? (sexoDoCenario(cenario.id) === "F" ? (cenario.age < 60 ? "mulher" : "teresinha") : "marcus");
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
      setRetorno(null);
      if (!conversa.current) conversa.current = abertura.map((f) => ({ autor: "ana", texto: f.texto }));
      conversa.current.push({ autor: "aluno", texto: String(texto).trim() });
      const anotar = (lista) => {
        for (const f of lista) if (f?.texto) conversa.current.push({ autor: "ana", texto: f.texto });
        return lista;
      };
      // Qualquer fala já conta para o histórico (salva sozinho em andamento).
      onProgresso?.({ respondidas: roteiro.current.indice, total: cenario.perguntas.length });

      // IA da Ana (só nas perguntas de texto; números são conferidos por código).
      let ia = null;
      if (pergunta.espera.tipo === "texto") {
        const tentativa = tentativas.current[pergunta.id] ?? 0;
        // O que o aluno já disse (respostas aceitas e as que ela pediu para completar): a Ana não pede de novo.
        const historico = [...roteiro.current.respostas.map((r) => ({ perguntaId: r.perguntaId, texto: r.texto })), ...recusadas.current].slice(-10);
        ia = await servidor.turno({ cenarioId: cenario.id, perguntaId: pergunta.id, texto, tentativa, historico, conversa: conversa.current.slice(-80, -1) }).catch(() => null);
        const pedido = ia?.examinar ? cenario.lacunas.find((l) => l.campo === ia.examinar) : exameDoTexto(texto, cenario.lacunas);
        if (pedido && !roteiro.current.lacunas[pedido.campo]) {
          // Disse que vai examinar: não conta como tentativa; a Ana concorda e aparece o botão.
          setExamePendente(pedido);
          return anotar([{ id: `${pergunta.id}.ex.${Date.now()}`, texto: ia?.fala || "Pode examinar, eu espero. Depois me conta o que achou.", origem: ia?.fala ? "aovivo" : "fixa" }]);
        }
        if (ia?.fala && ia.situacao !== "respondeu" && tentativa === 0) {
          // Não soube, fugiu do assunto ou ficou incompleto: a Ana orienta e pergunta de novo, sem avançar.
          tentativas.current[pergunta.id] = 1;
          recusadas.current.push({ perguntaId: pergunta.id, texto });
          setRetorno(RETORNO[ia.situacao] ?? RETORNO.incompleto);
          return anotar([{ id: `${pergunta.id}.ia.${Date.now()}`, texto: ia.fala, origem: "aovivo" }]);
        }
      }

      let r = responder(roteiro.current, texto);
      if (!r.reacao) return [];
      roteiro.current = r.estado;
      // O aluno já respondeu o que as próximas perguntas pediriam: ela não pergunta de novo, registra e segue
      // (uma ou várias seguidas, enquanto estiverem cobertas pela mensagem dele).
      const cobertas = new Set(ia?.cobertas ?? []);
      const anteriores = [...recusadas.current.filter((x) => x.perguntaId === pergunta.id).map((x) => x.texto), texto].join(" ");
      for (let guarda = 0; guarda < 8 && !r.concluida && r.reacao === "ok"; guarda++) {
        const seguinte = perguntaAtual(r.estado);
        const coberta = seguinte && (cobertas.has(seguinte.id) || (guarda === 0 && ia?.cobreProxima));
        if (!coberta || seguinte.dependeDe) break;
        // Pergunta de número também é aceita se o texto trouxer os números (o roteiro confere por código).
        const r2 = responder(r.estado, anteriores);
        if (!r2.reacao || r2.reacao !== "ok") break;
        r = { ...r2, reacao: "ok" };
        roteiro.current = r2.estado;
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
      if (r.reacao === "faltou_numero") setRetorno(RETORNO.faltou_numero);
      if (r.concluida) setTimeout(avaliar, 0);
      else if (r.reacao !== "faltou_numero") {
        falas.push(perguntaFala(perguntaAtual(r.estado)));
        // E já pede a voz da pergunta seguinte a esta.
        const seguinte = r.estado.cenario.perguntas[r.estado.indice + 1];
        if (seguinte) preCarregarVoz({ texto: perguntaFala(seguinte).texto, personagemId: PERSONAGEM });
      }
      return anotar(falas);
    },
    [abertura, avaliar, cenario.id, cenario.perguntas.length, onProgresso]
  );

  const preencher = (lacuna, resultado) => {
    const valor = resultado?.achado?.valor ?? lacuna.valorEsperado;
    roteiro.current = preencherLacuna(roteiro.current, lacuna.campo, valor);
    setLacunas({ ...roteiro.current.lacunas });
    setLacunaAberta(null);
  };

  // Examinar: lacuna com minijogo abre o minijogo; as demais revelam o achado direto no prontuário
  // (o aluno examina e encontra; antes era uma escolha sem dado nenhum para basear).
  const examinar = (lacuna) => {
    setExamePendente(null);
    if (minijogoDaLacuna(lacuna, cenario.id, MINIJOGOS_ESTATICOS, { paciente: pacienteDoCaso })) setLacunaAberta(lacuna);
    else preencher(lacuna, null);
  };

  const definicao = lacunaAberta ? minijogoDaLacuna(lacunaAberta, cenario.id, MINIJOGOS_ESTATICOS, { paciente: pacienteDoCaso }) : null;

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
        acoes={[
          { id: "prontuario", rotulo: "Prontuário", icone: ClipboardList, imagem: ICONE_PRONTUARIO, cor: "#20D5B5", ativo: prontuario, onClick: () => setProntuario((v) => !v) },
          { id: "notas", rotulo: "Anotação", icone: NotebookPen, imagem: ICONE_ANOTACAO, cor: "#FFC247", ativo: notasAbertas, onClick: () => setNotasAbertas((v) => !v) },
        ]}
        slotAbaixoPalco={
          examePendente ? (
            <div className="flex items-center gap-2 rounded-2xl border border-[#20D5B5]/40 bg-[#20D5B5]/10 p-2 pl-3">
              <span className="min-w-0 flex-1 text-sm font-bold">Examinar: {examePendente.rotulo}</span>
              <button type="button" onClick={() => setExamePendente(null)} className="rounded-xl px-2 py-1.5 text-xs font-bold text-[#9FB3C6]">Agora não</button>
              <button type="button" onClick={() => examinar(examePendente)} className="btn-3d-teal rounded-xl px-3 py-1.5 text-xs font-extrabold">Examinar</button>
            </div>
          ) : retorno ? (
            <FolhaResposta embutida tom="alerta" quem="ana" titulo={retorno.titulo} texto={retorno.texto} />
          ) : null
        }
      />

      <JanelaFolha
        id="plantao-prontuario"
        aberta={prontuario}
        titulo="Prontuário"
        icone={ClipboardList}
        cor="#20D5B5"
        lado="esquerda"
        paginas={paginasPlantao({ cenario, lacunasPreenchidas: lacunas })}
        pagina={paginaProntuario}
        onPagina={setPaginaProntuario}
        onFechar={() => setProntuario(false)}
      />
      <JanelaFolha
        id="plantao-anotacao"
        aberta={notasAbertas}
        titulo="Anotação"
        icone={NotebookPen}
        cor="#FFC247"
        lado="direita"
        paginas={[
          {
            titulo: "Passagem (SBAR)",
            conteudo: (
              <div className="h-full min-h-[420px]">
                <FolhaEvolucao
                  titulo="ANOTAÇÃO DA PASSAGEM DE PLANTÃO"
                  texto={notas}
                  onMudar={setNotas}
                  briefing={{ nome: cenario.name, idade: cenario.age, setor: cenario.sector }}
                  modelo={MODELO_SBAR}
                  preencher
                  idCampo="folha-plantao"
                  semAjuda
                  placeholder="Organize aqui o que vai passar para a Ana."
                />
              </div>
            ),
          },
        ]}
        onFechar={() => setNotasAbertas(false)}
      />

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
  onProgresso: PropTypes.func,
};
