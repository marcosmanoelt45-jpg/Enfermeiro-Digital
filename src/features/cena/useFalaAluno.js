// Fala do aluno por "segurar para falar". Ordem de preferência:
//   1. streaming pelo servidor (token temporário da AssemblyAI);
//   2. reconhecimento do navegador (COTA_EXCEDIDA, falha de socket ou sem sessão);
//   3. gravação + transcrição por arquivo (useAudioRecorder + transcrever da F1);
//   4. só teclado.
// O microfone é reaproveitado durante a cena e liberado em liberar(), no unmount ou com o app em segundo plano.
import { useCallback, useEffect, useRef, useState } from "react";
import useAudioRecorder from "@/hooks/useAudioRecorder";
import { sttToken, temSessaoDoServidor, transcrever } from "./servidor.js";
import { abrirMicrofone } from "./stt/capturaPcm.js";
import { abrirStream } from "./stt/assemblyStream.js";
import { criarReconhecimento, suportaReconhecimentoNavegador } from "./stt/reconhecimentoNavegador.js";
import usePermissaoMicrofone from "./usePermissaoMicrofone.js";

const MARGEM_TOKEN_MS = 60_000;

export default function useFalaAluno({ ativo = true } = {}) {
  const permissao = usePermissaoMicrofone();
  const gravador = useAudioRecorder();
  const gravadorRef = useRef(gravador);
  gravadorRef.current = gravador;

  const [segurando, setSegurando] = useState(false);
  const [nivel, setNivel] = useState(0);
  const [textoParcial, setTextoParcial] = useState("");
  const [modo, setModo] = useState("servidor");

  const microfoneRef = useRef(null);
  const credencialRef = useRef(null);
  const streamRef = useRef(null);
  const reconhecimentoRef = useRef(null);
  const sessaoRef = useRef(0);
  const modoAtualRef = useRef("servidor");
  const semCotaRef = useRef(false);
  const nivelTimerRef = useRef(null);

  const suportaVoz = permissao.estado !== "negado" && permissao.estado !== "indisponivel";

  const pararNivel = useCallback(() => {
    clearInterval(nivelTimerRef.current);
    nivelTimerRef.current = null;
    setNivel(0);
  }, []);

  const liberar = useCallback(() => {
    sessaoRef.current++;
    pararNivel();
    streamRef.current?.fechar();
    streamRef.current = null;
    reconhecimentoRef.current?.cancelar();
    reconhecimentoRef.current = null;
    microfoneRef.current?.liberar();
    microfoneRef.current = null;
    setSegurando(false);
    setTextoParcial("");
  }, [pararNivel]);

  // Pré-busca o token quando a cena passa a esperar o aluno (cada token custa 1 min de cota).
  const garantirCredencial = useCallback(async () => {
    const c = credencialRef.current;
    if (c && c.expiraEm - Date.now() > MARGEM_TOKEN_MS) return c;
    credencialRef.current = await sttToken();
    return credencialRef.current;
  }, []);

  useEffect(() => {
    if (!ativo || !suportaVoz || semCotaRef.current || !temSessaoDoServidor()) return;
    const c = credencialRef.current;
    if (c && c.expiraEm - Date.now() > MARGEM_TOKEN_MS) return;
    garantirCredencial().catch((e) => {
      credencialRef.current = null;
      if (e?.codigo === "COTA_EXCEDIDA") semCotaRef.current = true;
    });
  }, [ativo, suportaVoz, garantirCredencial]);

  // App em segundo plano: solta o microfone (o indicador laranja do iOS some).
  useEffect(() => {
    const aoMudar = () => document.visibilityState === "hidden" && liberar();
    document.addEventListener("visibilitychange", aoMudar);
    return () => {
      document.removeEventListener("visibilitychange", aoMudar);
      liberar();
    };
  }, [liberar]);

  const iniciarNivel = useCallback(() => {
    pararNivel();
    nivelTimerRef.current = setInterval(() => setNivel(microfoneRef.current?.nivel() ?? 0), 80);
  }, [pararNivel]);

  const iniciarNavegador = useCallback((sessao) => {
    const rec = criarReconhecimento({
      onTexto: ({ texto }) => sessao === sessaoRef.current && setTextoParcial(texto),
    });
    reconhecimentoRef.current = rec;
    rec.iniciar();
    modoAtualRef.current = "navegador";
    setModo("navegador");
  }, []);

  const iniciarGravacao = useCallback(() => {
    gravadorRef.current.reset();
    gravadorRef.current.start();
    modoAtualRef.current = "gravacao";
    setModo("gravacao");
  }, []);

  const segurar = useCallback(async () => {
    if (!suportaVoz || segurando) return false;
    const sessao = ++sessaoRef.current;
    setSegurando(true);
    setTextoParcial("");

    if (temSessaoDoServidor() && !semCotaRef.current) {
      try {
        const credencial = await garantirCredencial();
        if (sessao !== sessaoRef.current) return false;
        const stream = abrirStream({ credencial, onTexto: ({ texto }) => sessao === sessaoRef.current && setTextoParcial(texto) });
        streamRef.current = stream;
        if (!microfoneRef.current) microfoneRef.current = await abrirMicrofone();
        if (sessao !== sessaoRef.current) {
          stream.fechar();
          return false;
        }
        await microfoneRef.current.iniciar((quadro) => stream.enviar(quadro));
        await stream.pronto;
        if (sessao !== sessaoRef.current) return false;
        modoAtualRef.current = "servidor";
        setModo("servidor");
        iniciarNivel();
        return true;
      } catch (e) {
        streamRef.current?.fechar();
        streamRef.current = null;
        microfoneRef.current?.pausar();
        credencialRef.current = null;
        if (e?.codigo === "COTA_EXCEDIDA") semCotaRef.current = true;
        if (sessao !== sessaoRef.current) return false;
        // segue para as reservas
      }
    }

    if (suportaReconhecimentoNavegador()) {
      iniciarNavegador(sessao);
      return true;
    }
    iniciarGravacao();
    return true;
  }, [suportaVoz, segurando, garantirCredencial, iniciarNavegador, iniciarGravacao, iniciarNivel, permissao]);

  // Espera o Blob aparecer depois de stop() (o MediaRecorder entrega no onstop).
  const aguardarBlob = useCallback(async () => {
    for (let i = 0; i < 30; i++) {
      if (gravadorRef.current.blob) return gravadorRef.current.blob;
      await new Promise((r) => setTimeout(r, 100));
    }
    return null;
  }, []);

  const soltar = useCallback(async () => {
    if (!segurando) return "";
    const sessao = sessaoRef.current;
    const modoUsado = modoAtualRef.current;
    const duracao = gravadorRef.current.seconds;
    pararNivel();
    setSegurando(false);
    let texto = "";
    try {
      if (modoUsado === "servidor" && streamRef.current) {
        microfoneRef.current?.pausar();
        texto = await streamRef.current.concluir();
        streamRef.current = null;
      } else if (modoUsado === "navegador" && reconhecimentoRef.current) {
        texto = await reconhecimentoRef.current.concluir();
        reconhecimentoRef.current = null;
      } else if (modoUsado === "gravacao") {
        gravadorRef.current.stop();
        const blob = await aguardarBlob();
        if (blob && blob.size > 1500) texto = await transcrever(blob, { duracaoSeg: Math.max(1, duracao) });
        gravadorRef.current.reset();
      }
    } catch (e) {
      if (e?.codigo === "COTA_EXCEDIDA") semCotaRef.current = true;
      texto = "";
    }
    if (sessao === sessaoRef.current) setTextoParcial("");
    return String(texto ?? "").trim();
  }, [segurando, pararNivel, aguardarBlob]);

  const cancelar = useCallback(() => {
    if (modoAtualRef.current === "gravacao") gravadorRef.current.reset();
    liberar();
  }, [liberar]);

  return { suportaVoz, permissao: permissao.estado, pedirPermissao: permissao.pedir, segurando, nivel, textoParcial, modo, segurar, soltar, cancelar, liberar };
}
