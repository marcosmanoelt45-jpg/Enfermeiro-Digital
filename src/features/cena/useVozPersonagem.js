// Fila de falas de um personagem: resolve a origem do áudio (mp3 fixo, voz ao vivo ou navegador),
// toca em sequência e expõe a palavra atual para o karaokê. Falha de voz nunca aparece como erro.
import { useCallback, useEffect, useRef, useState } from "react";
import { buscarPersonagem } from "./dados/personagens.js";
import { dividirEmFrases, resolverFala } from "./logica/falas.js";
import { carregarManifesto } from "./voz/manifestos.js";
import { obterReprodutor } from "./voz/reprodutor.js";
import { gerarVoz } from "./servidor.js";

export default function useVozPersonagem(personagemId) {
  const reprodutorRef = useRef(null);
  const geracaoRef = useRef(0);
  const [falando, setFalando] = useState(false);
  const [falaAtual, setFalaAtual] = useState(null);
  const [palavraAtual, setPalavraAtual] = useState(-1);

  const reprodutor = useCallback(() => {
    if (!reprodutorRef.current) reprodutorRef.current = obterReprodutor();
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
          // Falas fixas também usam a voz do Gemini (a mesma do resto da conversa; o servidor guarda em cache,
          // então cada frase fixa é gerada uma vez só). O mp3 antigo vira reserva.
          if (resolvida.tipo === "aovivo" || fala.origem === "fixa") {
            // Voz ao vivo frase a frase: pede todas ao mesmo tempo e toca a 1ª assim que chega
            // (a resposta inteira de uma vez levava mais de 10 s para começar a tocar).
            const frases = dividirEmFrases(fala.texto);
            const pedidos = frases.map((frase) => gerarVoz({ texto: frase, personagemId }).catch(() => null));
            const primeira = await pedidos[0];
            if (gen !== geracaoRef.current) return false;
            if (!primeira && resolvida.tipo === "mp3") {
              await player.tocar(resolvida, { texto: fala.texto, personagem, onPalavra: (i) => gen === geracaoRef.current && setPalavraAtual(i) });
              continue;
            }
            let deslocamento = 0;
            for (let i = 0; i < frases.length; i++) {
              const blob = i === 0 ? primeira : await pedidos[i];
              if (gen !== geracaoRef.current) return false;
              const base = deslocamento;
              await player.tocar(blob ? { tipo: "blob", blob } : { tipo: "navegador" }, {
                texto: frases[i],
                personagem,
                onPalavra: (p) => gen === geracaoRef.current && setPalavraAtual(base + p),
              });
              deslocamento += frases[i].split(/\s+/).filter(Boolean).length;
            }
            continue;
          }
          const fonte = resolvida.tipo === "mp3" ? resolvida : { tipo: "navegador" };
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
