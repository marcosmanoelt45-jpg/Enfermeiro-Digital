// Fila de falas de um personagem: resolve a origem do áudio (mp3 fixo, voz ao vivo ou navegador),
// toca em sequência e expõe a palavra atual para o karaokê. Falha de voz nunca aparece como erro.
//
// Uma voz só por cena: antes cada fala escolhia a sua origem (Gemini em cache, mp3 do VoiceBox ou navegador) e a
// voz do personagem trocava de uma fala para a outra. Agora o modo é decidido para a cena inteira:
// - "mp3": personagem só de falas fixas com mp3 (o Dr. Rui) usa sempre o mp3.
// - "gemini": tenta a voz do Gemini; na primeira falha (cota do dia acabou), passa para "navegador" e fica nele
//   até o fim da cena. A voz troca no máximo uma vez, e nunca volta.
// - Se a cota do dia já acabou antes de a cena começar (estadoVoz), a cena inteira já nasce no "navegador".
// A voz do navegador é sempre a mesma por personagem e do mesmo sexo (reprodutor.js).
import { useCallback, useEffect, useRef, useState } from "react";
import { buscarPersonagem } from "./dados/personagens.js";
import { resolverFala } from "./logica/falas.js";
import { carregarManifesto } from "./voz/manifestos.js";
import { obterReprodutor } from "./voz/reprodutor.js";
import { estadoVoz, gerarVoz } from "./servidor.js";

export function modoInicialDaVoz(personagem) {
  return personagem?.voz?.modo === "mp3" ? "mp3" : "gemini";
}

export default function useVozPersonagem(personagemId) {
  const reprodutorRef = useRef(null);
  const geracaoRef = useRef(0);
  const modoRef = useRef(null); // "mp3" | "gemini" | "navegador", para a cena inteira
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
      if (!modoRef.current) {
        let modo = modoInicialDaVoz(personagem);
        // Cota grátis do Gemini já acabou hoje: a cena inteira na voz do navegador (sem começar numa e trocar).
        if (modo === "gemini") {
          const estado = await estadoVoz();
          if (!estado.gemini) modo = "navegador";
        }
        if (!modoRef.current) modoRef.current = modo;
      }
      const manifesto = await carregarManifesto(personagemId);
      const player = reprodutor();
      // "falando" (a animação) liga quando o áudio começa a sair, não quando a voz é pedida.
      const comecou = () => gen === geracaoRef.current && setFalando(true);
      const palavra = (base) => (i) => gen === geracaoRef.current && setPalavraAtual(base + i);
      try {
        for (const fala of falas) {
          if (gen !== geracaoRef.current) return false;
          setFalaAtual(fala);
          setPalavraAtual(-1);
          const resolvida = resolverFala(fala, manifesto, `/vozes/${personagemId}`);

          if (modoRef.current === "mp3") {
            await player.tocar(resolvida.tipo === "mp3" ? resolvida : { tipo: "navegador" }, { texto: fala.texto, personagem, onInicio: comecou, onPalavra: palavra(0) });
            continue;
          }

          if (modoRef.current === "gemini") {
            // Um pedido por fala, inteira: o mesmo jeito e volume do começo ao fim (dois pedidos davam entonações
            // diferentes na mesma fala) e metade do gasto da cota grátis, que é pequena.
            const frases = [fala.texto];
            const pedidos = frases.map((frase) => gerarVoz({ texto: frase, personagemId }).catch(() => null));
            const primeira = await pedidos[0];
            if (gen !== geracaoRef.current) return false;
            if (primeira) {
              let deslocamento = 0;
              for (let i = 0; i < frases.length; i++) {
                const blob = i === 0 ? primeira : await pedidos[i];
                if (gen !== geracaoRef.current) return false;
                if (!blob) modoRef.current = "navegador";
                await player.tocar(blob ? { tipo: "blob", blob } : { tipo: "navegador" }, { texto: frases[i], personagem, onInicio: comecou, onPalavra: palavra(deslocamento) });
                deslocamento += frases[i].split(/\s+/).filter(Boolean).length;
              }
              continue;
            }
            // Sem voz do Gemini: o resto da cena fica na voz do navegador.
            modoRef.current = "navegador";
          }

          if (gen !== geracaoRef.current) return false;
          await player.tocar({ tipo: "navegador" }, { texto: fala.texto, personagem, onInicio: comecou, onPalavra: palavra(0) });
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
