// Junta as mensagens "Turn" da AssemblyAI (streaming v3) em texto final + parcial.
// Turn com end_of_turn=false traz o texto parcial do turno em andamento; com true, o turno fechou.
export function criarAcumulador() {
  let finais = [];
  let parcial = "";

  return {
    // Devolve true quando a mensagem fechou um turno.
    aplicar(msg) {
      if (msg?.type !== "Turn") return false;
      const texto = String(msg.transcript ?? "").trim();
      if (msg.end_of_turn) {
        if (texto) finais.push(texto);
        parcial = "";
        return true;
      }
      parcial = texto;
      return false;
    },
    textoFinal: () => finais.join(" "),
    textoParcial: () => parcial,
    // Texto completo para mostrar na caixa: o que já fechou + o que ainda está sendo dito.
    texto: () => [...finais, parcial].filter(Boolean).join(" "),
    limpar() {
      finais = [];
      parcial = "";
    },
  };
}
