// Chaves de liga/desliga dos módulos novos do plano Cenas ao Vivo. Ligados na F8; desligar um aqui esconde o módulo (chave de emergência).
export const FLAGS = { consulta: true, calculoMedico: true, plantaoVivo: true, tecnicas: true, amigos: false };

// Para testar em produção sem expor ao aluno: no console, `localStorage.setItem("enfere_flag_consulta", "1")`.
export function flagAtiva(nome) {
  if (FLAGS[nome]) return true;
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(`enfere_flag_${nome}`) === "1";
  } catch {
    return false;
  }
}
