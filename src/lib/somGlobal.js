// "Mutar sons" do perfil: desliga todo áudio do site de uma vez, sem cada tela precisar saber.
// - <audio>/<video>: mutados ao tocar (e os que nós mutamos voltam ao desmutar; os que já eram mudos ficam mudos).
// - Voz do navegador (speechSynthesis): não fala.
// - Web Audio: tudo que vai para os alto-falantes passa por um volume geral por contexto (0 quando mutado).
//   A captura do microfone continua funcionando (ela não depende do que sai no alto-falante).
// A escolha fica no aparelho (preferência de interface, não é dado da conta).

const CHAVE = "enfere_sons_mutados_v1";
export const EVENTO_SOM = "enfere:som-alterado";

let mudo = false;
try {
  mudo = typeof localStorage !== "undefined" && localStorage.getItem(CHAVE) === "1";
} catch {
  /* sem armazenamento: começa com som */
}

const mutadosPorNos = new WeakSet();
const volumes = new Set(); // GainNode geral de cada AudioContext

function mutarMidia(el) {
  if (!mudo || !el || el.muted) return;
  el.muted = true;
  mutadosPorNos.add(el);
}

let instalado = false;
/** Instala os ganchos uma vez (no início do app). */
export function instalarSomGlobal() {
  if (instalado || typeof window === "undefined") return;
  instalado = true;

  // mídia: antes de tocar e no evento de play (pega também autoplay)
  const tocar = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...args) {
    mutarMidia(this);
    return tocar.apply(this, args);
  };
  document.addEventListener("play", (e) => mutarMidia(e.target), true);

  // voz do navegador
  if (window.speechSynthesis && typeof window.speechSynthesis.speak === "function") {
    const falar = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = (u) => {
      if (mudo) return undefined;
      return falar(u);
    };
  }

  // Web Audio: ligações para a saída passam por um volume geral do contexto
  if (typeof AudioNode !== "undefined" && typeof AudioDestinationNode !== "undefined") {
    const ligar = AudioNode.prototype.connect;
    const geral = new WeakMap();
    AudioNode.prototype.connect = function (destino, ...resto) {
      if (destino instanceof AudioDestinationNode) {
        const ctx = destino.context;
        let g = geral.get(ctx);
        if (!g) {
          g = ctx.createGain();
          g.gain.value = mudo ? 0 : 1;
          ligar.call(g, destino);
          geral.set(ctx, g);
          volumes.add(g);
        }
        if (this === g) return ligar.call(this, destino, ...resto);
        return ligar.call(this, g, ...resto);
      }
      return ligar.call(this, destino, ...resto);
    };
  }
}

export function sonsMutados() {
  return mudo;
}

/** Liga ou desliga todos os sons do site. */
export function mutarSons(valor) {
  mudo = Boolean(valor);
  try {
    localStorage.setItem(CHAVE, mudo ? "1" : "0");
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
  if (typeof document !== "undefined") {
    document.querySelectorAll("audio, video").forEach((el) => {
      if (mudo) {
        if (!el.paused) mutarMidia(el);
      } else if (mutadosPorNos.has(el)) {
        el.muted = false;
        mutadosPorNos.delete(el);
      }
    });
  }
  if (mudo && typeof window !== "undefined") window.speechSynthesis?.cancel?.();
  volumes.forEach((g) => {
    try {
      g.gain.value = mudo ? 0 : 1;
    } catch {
      volumes.delete(g);
    }
  });
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENTO_SOM, { detail: { mudo } }));
}
