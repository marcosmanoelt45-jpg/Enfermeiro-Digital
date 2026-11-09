// Sons de ausculta pulmonar sintetizados no navegador (Web Audio): nada de áudio de terceiros.
// Base: murmúrio vesicular = ruído filtrado (100–600 Hz) que sobe na inspiração e cai na expiração (I:E ≈ 1:1,5).
// Ruídos adventícios (Barros et al., Anamnese e exame físico; aula de exame físico do tórax):
//   - crepitantes finos: estalos curtos e agudos no fim da inspiração;
//   - crepitantes grossos (bolhosos): estalos mais graves e longos, na inspiração e na expiração;
//   - sibilos: contínuos, agudos e musicais, mais na expiração;
//   - roncos: contínuos, graves e ressonantes, nas duas fases.
// `qualidade` (0 a 1) é o quanto o estetoscópio está perto do foco certo: longe, o som fica abafado e com atrito.

export const RUIDOS = {
  normal: "Murmúrio vesicular presente, sem ruídos adventícios",
  crepitantes_finos: "Estertores crepitantes finos",
  crepitantes_grossos: "Estertores crepitantes grossos (bolhosos)",
  sibilos: "Sibilos",
  roncos: "Roncos",
};

const CICLO_S = 3.6; // inspiração 1,4 s + expiração 2,2 s
const INSP_S = 1.4;

function bufferRuido(ctx, segundos = 2) {
  const n = Math.floor(ctx.sampleRate * segundos);
  const b = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = b.getChannelData(0);
  let ultimo = 0;
  for (let i = 0; i < n; i++) {
    // ruído "rosado" aproximado: mais grave, como o fluxo de ar
    ultimo = 0.97 * ultimo + 0.03 * (Math.random() * 2 - 1);
    d[i] = ultimo * 6;
  }
  return b;
}

export function criarSomPulmonar() {
  const AC = typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;
  if (!AC) return { tocar() {}, parar() {}, definir() {}, fechar() {} };
  const ctx = new AC();
  const saida = ctx.createGain();
  saida.gain.value = 0;
  // "Campânula/diafragma" longe do foco: passa-baixa fecha e aparece atrito
  const abafar = ctx.createBiquadFilter();
  abafar.type = "lowpass";
  abafar.frequency.value = 1800;
  abafar.connect(saida);
  saida.connect(ctx.destination);

  // Murmúrio: ruído em loop -> passa-faixa -> ganho com a envoltória da respiração
  const ruido = ctx.createBufferSource();
  ruido.buffer = bufferRuido(ctx, 3);
  ruido.loop = true;
  const banda = ctx.createBiquadFilter();
  banda.type = "bandpass";
  banda.frequency.value = 280;
  banda.Q.value = 0.7;
  const respiracao = ctx.createGain();
  respiracao.gain.value = 0;
  ruido.connect(banda).connect(respiracao).connect(abafar);

  // Atrito do estetoscópio mal posicionado
  const atritoFonte = ctx.createBufferSource();
  atritoFonte.buffer = bufferRuido(ctx, 2);
  atritoFonte.loop = true;
  const atritoFiltro = ctx.createBiquadFilter();
  atritoFiltro.type = "highpass";
  atritoFiltro.frequency.value = 900;
  const atrito = ctx.createGain();
  atrito.gain.value = 0;
  atritoFonte.connect(atritoFiltro).connect(atrito).connect(saida);

  // Contínuos (sibilo/ronco): osciladores com vibrato
  const tom = ctx.createOscillator();
  const tom2 = ctx.createOscillator();
  const vibrato = ctx.createOscillator();
  const vibratoGanho = ctx.createGain();
  const tomFiltro = ctx.createBiquadFilter();
  const tomGanho = ctx.createGain();
  tomGanho.gain.value = 0;
  vibrato.frequency.value = 5;
  vibrato.connect(vibratoGanho);
  vibratoGanho.connect(tom.frequency);
  vibratoGanho.connect(tom2.frequency);
  tom.connect(tomFiltro);
  tom2.connect(tomFiltro);
  tomFiltro.connect(tomGanho).connect(abafar);

  let tipo = "normal";
  let qualidade = 0;
  let ativo = false;
  let timer = null;
  let iniciado = false;

  const configurarTom = () => {
    if (tipo === "sibilos") {
      tom.type = "triangle";
      tom2.type = "sine";
      tom.frequency.value = 620;
      tom2.frequency.value = 880;
      vibratoGanho.gain.value = 18;
      tomFiltro.type = "bandpass";
      tomFiltro.frequency.value = 700;
      tomFiltro.Q.value = 2;
    } else {
      tom.type = "sawtooth";
      tom2.type = "sawtooth";
      tom.frequency.value = 120;
      tom2.frequency.value = 162;
      vibratoGanho.gain.value = 6;
      tomFiltro.type = "lowpass";
      tomFiltro.frequency.value = 380;
      tomFiltro.Q.value = 1;
    }
  };

  // Um estalo (crepitante): rajada curta de ruído com filtro e envoltória rápida.
  const estalo = (quando, grosso) => {
    const dur = grosso ? 0.025 : 0.008;
    const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp((-6 * i) / d.length);
    const f = ctx.createBufferSource();
    f.buffer = b;
    const filtro = ctx.createBiquadFilter();
    filtro.type = grosso ? "bandpass" : "highpass";
    filtro.frequency.value = grosso ? 450 : 1400;
    const g = ctx.createGain();
    g.gain.value = (grosso ? 0.9 : 0.7) * (0.6 + Math.random() * 0.4);
    f.connect(filtro).connect(g).connect(abafar);
    f.start(quando);
  };

  // Agenda um ciclo respiratório a partir de t0.
  const agendarCiclo = (t0) => {
    const g = respiracao.gain;
    g.cancelScheduledValues(t0);
    g.setValueAtTime(0.0001, t0);
    g.linearRampToValueAtTime(0.9, t0 + INSP_S * 0.85); // inspiração: mais intensa
    g.linearRampToValueAtTime(0.35, t0 + INSP_S + 0.2); // expiração: mais suave e curta no normal
    g.linearRampToValueAtTime(0.0001, t0 + INSP_S + 1.0);
    g.setValueAtTime(0.0001, t0 + CICLO_S);

    const tg = tomGanho.gain;
    tg.cancelScheduledValues(t0);
    tg.setValueAtTime(0.0001, t0);
    if (tipo === "sibilos") {
      tg.setValueAtTime(0.0001, t0 + INSP_S);
      tg.linearRampToValueAtTime(0.08, t0 + INSP_S + 0.3);
      tg.linearRampToValueAtTime(0.06, t0 + CICLO_S - 0.6);
      tg.linearRampToValueAtTime(0.0001, t0 + CICLO_S - 0.2);
    } else if (tipo === "roncos") {
      tg.linearRampToValueAtTime(0.07, t0 + 0.4);
      tg.linearRampToValueAtTime(0.03, t0 + INSP_S);
      tg.linearRampToValueAtTime(0.08, t0 + INSP_S + 0.5);
      tg.linearRampToValueAtTime(0.0001, t0 + CICLO_S - 0.4);
    }
    if (tipo === "crepitantes_finos") {
      const n = 9 + Math.floor(Math.random() * 6);
      for (let i = 0; i < n; i++) estalo(t0 + INSP_S * (0.55 + Math.random() * 0.45), false);
    } else if (tipo === "crepitantes_grossos") {
      for (let i = 0; i < 7; i++) estalo(t0 + INSP_S * Math.random(), true);
      for (let i = 0; i < 4; i++) estalo(t0 + INSP_S + 1.4 * Math.random(), true);
    }
  };

  const aplicarQualidade = () => {
    const t = ctx.currentTime;
    const q = Math.max(0, Math.min(1, qualidade));
    // Perto do foco: som aberto e alto; longe: abafado, baixo e com atrito.
    abafar.frequency.setTargetAtTime(220 + q * q * 2600, t, 0.05);
    saida.gain.setTargetAtTime(ativo ? 0.12 + q * 0.75 : 0, t, 0.06);
    atrito.gain.setTargetAtTime(ativo ? (1 - q) * 0.06 : 0, t, 0.05);
  };

  const laco = () => {
    if (!ativo) return;
    agendarCiclo(ctx.currentTime + 0.02);
    timer = setTimeout(laco, CICLO_S * 1000);
  };

  return {
    // tipo: chave de RUIDOS no foco atual (fora das bases o crepitante não aparece: o jogo decide).
    definir({ tipo: t = tipo, qualidade: q = qualidade } = {}) {
      const mudou = t !== tipo;
      tipo = t;
      qualidade = q;
      if (mudou) configurarTom();
      aplicarQualidade();
    },
    async tocar() {
      if (ctx.state === "suspended") await ctx.resume();
      if (!iniciado) {
        configurarTom();
        ruido.start();
        atritoFonte.start();
        tom.start();
        tom2.start();
        vibrato.start();
        iniciado = true;
      }
      if (ativo) return;
      ativo = true;
      aplicarQualidade();
      laco();
    },
    parar() {
      ativo = false;
      clearTimeout(timer);
      aplicarQualidade();
    },
    fechar() {
      ativo = false;
      clearTimeout(timer);
      ctx.close().catch(() => {});
    },
  };
}
