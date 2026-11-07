// WebSocket da AssemblyAI (streaming v3) com token temporário. Aberto só enquanto o aluno segura o botão:
// a conexão aberta cobra por tempo. Fechar manda ForceEndpoint (fecha o turno atual), espera o último
// final por até 1,5 s e então Terminate.
import { criarAcumulador } from "../logica/acumuladorTurnos.js";

export function montarUrl({ wsUrl, parametros, token }) {
  const q = new URLSearchParams({ ...parametros, token });
  return `${wsUrl}?${q.toString()}`;
}

export function abrirStream({ credencial, onTexto = () => {}, onErro = () => {}, criarWebSocket = (u) => new WebSocket(u), esperaFinalMs = 1500 }) {
  const acumulador = criarAcumulador();
  const ws = criarWebSocket(montarUrl(credencial));
  let aberto = false;
  let encerrado = false;
  let fila = []; // quadros enviados antes de abrir
  let resolverFim = null;
  let falhou = false;

  const pronto = new Promise((resolve, reject) => {
    ws.onopen = () => {
      aberto = true;
      for (const q of fila) ws.send(q);
      fila = [];
      resolve();
    };
    ws.onerror = () => {
      falhou = true;
      reject(new Error("Falha no WebSocket da transcrição."));
    };
  });
  pronto.catch(() => {}); // o chamador decide; evita aviso de rejeição solta

  ws.onmessage = (e) => {
    let msg;
    try {
      msg = JSON.parse(e.data);
    } catch {
      return;
    }
    if (msg.type === "Turn") {
      const fechou = acumulador.aplicar(msg);
      onTexto({ parcial: acumulador.textoParcial(), final: acumulador.textoFinal(), texto: acumulador.texto() });
      if (fechou && resolverFim) resolverFim();
    }
    if (msg.type === "Termination" && resolverFim) resolverFim();
  };
  ws.onclose = () => {
    encerrado = true;
    resolverFim?.();
  };
  ws.addEventListener?.("error", () => onErro(new Error("Falha no WebSocket da transcrição.")));

  return {
    pronto,
    falhou: () => falhou,
    // Quadro PCM16 (ArrayBuffer).
    enviar(buffer) {
      if (encerrado) return;
      if (aberto) ws.send(buffer);
      else fila.push(buffer);
    },
    // Devolve o texto completo depois de fechar o turno em andamento.
    async concluir() {
      if (!encerrado && aberto) {
        const ultimo = new Promise((r) => (resolverFim = r));
        try {
          ws.send(JSON.stringify({ type: "ForceEndpoint" }));
        } catch {
          // socket já caiu
        }
        await Promise.race([ultimo, new Promise((r) => setTimeout(r, esperaFinalMs))]);
        try {
          ws.send(JSON.stringify({ type: "Terminate" }));
        } catch {
          // socket já caiu
        }
      }
      this.fechar();
      return acumulador.texto();
    },
    fechar() {
      encerrado = true;
      try {
        ws.close();
      } catch {
        // já fechado
      }
    },
  };
}
