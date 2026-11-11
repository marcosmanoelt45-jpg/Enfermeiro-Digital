// Quem pode ser o paciente de cada caso da Consulta. Os pacientes têm rosto e voz fixos (Sr. Marcus e Dona
// Teresinha, os dois idosos), então o caso precisa caber no sexo e na idade deles: gestação nunca, e casos de
// gente jovem só quando a doença ainda é plausível alguns anos acima da faixa do arquétipo.
// JS puro: o app usa para mostrar só os assuntos possíveis, e o servidor para sortear o caso e a idade.
import { ARQUETIPOS } from "./arquetipos.js";
import { TEMAS } from "./temas.js";

export const PACIENTES_CONSULTA = {
  marcus: { nome: "Marcus", sexo: "M", idadeMin: 62, idadeMax: 80 },
  teresinha: { nome: "Teresinha", sexo: "F", idadeMin: 62, idadeMax: 82 },
};

// Quantos anos acima da faixa do arquétipo a doença ainda é plausível.
const FOLGA_IDADE = 15;

export const pacienteDaConsulta = (personagemId) => PACIENTES_CONSULTA[personagemId] ?? null;

/** Faixa de idade [min, max] em que o paciente cabe no caso, ou null se o caso não serve para ele. */
export function faixaCompativel(arq, paciente) {
  if (!arq || !paciente) return null;
  // Gestação: só mulher em idade fértil.
  if (arq.specialty === "obstetricia" && (paciente.sexo !== "F" || paciente.idadeMin > 45)) return null;
  const [a, b] = Array.isArray(arq.ageRange) ? arq.ageRange : [18, 99];
  const min = Math.max(a, paciente.idadeMin);
  const max = Math.min(b + FOLGA_IDADE, paciente.idadeMax);
  return min <= max ? [min, max] : null;
}

export const arquetipoCompativel = (arq, paciente) => Boolean(faixaCompativel(arq, paciente));

/** Arquétipos que servem para o paciente (opcionalmente só os de um tema). */
export function arquetiposDoPaciente(paciente, tema = null) {
  const ids = tema ? new Set(tema.arquetipos) : null;
  return ARQUETIPOS.filter((a) => (!ids || ids.has(a.id)) && arquetipoCompativel(a, paciente));
}

/** Temas que têm pelo menos um caso possível para o paciente. */
export function temasDoPaciente(personagemId) {
  const p = pacienteDaConsulta(personagemId);
  if (!p) return TEMAS;
  return TEMAS.filter((t) => arquetiposDoPaciente(p, t).length > 0);
}

/** Idade sorteada dentro do que é plausível para o paciente e o caso. */
export function idadeParaCaso(arq, paciente, sorteio = Math.random) {
  const faixa = faixaCompativel(arq, paciente) ?? [paciente.idadeMin, paciente.idadeMax];
  return faixa[0] + Math.floor(sorteio() * (faixa[1] - faixa[0] + 1));
}
