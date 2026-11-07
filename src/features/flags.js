// Chaves de liga/desliga dos módulos novos do plano Cenas ao Vivo. Todo módulo entra desligado.
export const FLAGS = { consulta: false, calculoMedico: false, plantaoVivo: false, tecnicas: false };

// Para testar em produção sem expor ao aluno: no console, `localStorage.setItem("enfere_flag_consulta", "1")`.
export function flagAtiva(nome) {
  if (FLAGS[nome]) return true;
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(`enfere_flag_${nome}`) === "1";
  } catch {
    return false;
  }
}
