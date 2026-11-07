// Fila de falas de um personagem: resolve a origem do áudio (mp3 fixo, voz ao vivo ou navegador),
// toca em sequência e expõe a palavra atual para o karaokê. Falha de voz nunca aparece como erro.
import { useCallback, useEffect, useRef, useState } from "react";
import { buscarPersonagem } from "./dados/personagens.js";
import { resolverFala } from "./logica/falas.js";
import { carregarManifesto } from "./voz/manifestos.js";
import { criarReprodutor } from "./voz/reprodutor.js";
import { gerarVoz } from "./servidor.js";

export default function useVozPersonagem(personagemId) {
  const reprodutorRef = useRef(null);
  const geracaoRef = useRef(0);
  const [falando, setFalando] = useState(false);
  const [falaAtual, setFalaAtual] = useState(null);
  const [palavraAtual, setPalavraAtual] = useState(-1);

  const reprodutor = useCallback(() => {
    if (!reprodutorRef.current) reprodutorRef.current = criarReprodutor();
    return reprodutorRef.current;
  }, []);

  const parar = useCallback(() => {
    geracaoRef.current++;
    reprodutorRef.current?.parar();
    setFalando(false);
    setFalaAtual(null);
    setPalavraAtual(-1);
  }, []);

  // Chamar dentro do primeiro toque (iOS).
  const desbloquear = useCallback(() => reprodutor().desbloquear(), [reprodutor]);

  const falar = useCallback(
    async (falas) => {
      const gen = ++geracaoRef.current;
      const personagem = buscarPersonagem(personagemId);
      const manifesto = await carregarManifesto(personagemId);
      const player = reprodutor();
      setFalando(true);
      try {
        for (const fala of falas) {
          if (gen !== geracaoRef.current) return false;
          setFalaAtual(fala);
          setPalavraAtual(-1);
          const resolvida = resolverFala(fala, manifesto, `/vozes/${personagemId}`);
          let fonte = { tipo: "navegador" };
          if (resolvida.tipo === "mp3") fonte = resolvida;
          else if (resolvida.tipo === "aovivo") {
            const blob = await gerarVoz({ texto: fala.texto, personagemId });
            if (blob) fonte = { tipo: "blob", blob };
          }
          if (gen !== geracaoRef.current) return false;
          await player.tocar(fonte, { texto: fala.texto, personagem, onPalavra: (i) => gen === geracaoRef.current && setPalavraAtual(i) });
        }
        return gen === geracaoRef.current;
      } finally {
        if (gen === geracaoRef.current) {
          setFalando(false);
          setFalaAtual(null);
          setPalavraAtual(-1);
        }
      }
    },
    [personagemId, reprodutor]
  );

  useEffect(() => () => {
    geracaoRef.current++;
    reprodutorRef.current?.parar();
  }, []);

  return { falar, parar, desbloquear, falando, palavraAtual, falaAtual };
}
