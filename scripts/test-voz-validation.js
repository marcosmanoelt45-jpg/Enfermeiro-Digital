import { validarRespostaFalada } from "../src/services/simuladorVozService.js";

console.log("--- TESTANDO VALIDACAO DE RESPOSTA FALADA ---");

const aceitasBiosseguranca = [
  "higienizar as maos",
  "higienizar maos",
  "higiene das maos",
  "higiene de maos",
  "lavar as maos",
  "lavar maos",
  "lavagem das maos",
  "lavagem de maos",
  "friccao alcoolica",
  "higienizacao com alcool"
];

const testes = [
  { entrada: "lavagem de mãos", esperado: true, desc: "Caso real do usuário ('lavagem de mãos' vs 'lavagem das mãos')" },
  { entrada: "lavagem das mãos", esperado: true, desc: "Variação com artigo 'das'" },
  { entrada: "lavar as mãos", esperado: true, desc: "Verbo infinitivo lavar" },
  { entrada: "higienizar as mãos com água e sabão", esperado: true, desc: "Higienizar as mãos com complemento" },
  { entrada: "higiene das mãos", esperado: true, desc: "Substantivo higiene" },
  { entrada: "limpeza das mãos", esperado: true, desc: "Exemplo explícito do usuário: limpeza + mãos" },
  { entrada: "limpar as mãos", esperado: true, desc: "Exemplo explícito do usuário: limpar + mãos" },
  { entrada: "limpar a pele", esperado: true, desc: "Exemplo explícito do usuário: limpar + pele" },
  { entrada: "higienizar os dedos", esperado: true, desc: "Exemplo explícito do usuário: higienizar + dedos" },
  { entrada: "passar álcool em gel", esperado: true, desc: "Passar álcool em gel" },
  { entrada: "higienização", esperado: true, desc: "Apenas palavra-chave forte higienização" },
  { entrada: "colocar as luvas direto", esperado: false, desc: "Resposta incorreta sem higiene" },
  { entrada: "aplicar injeção", esperado: false, desc: "Resposta completamente fora" },
  { entrada: "passar álcool 70 no conector", esperado: true, desc: "Desinfecção de conector com álcool 70" },
  { entrada: "antissepsia do hub com álcool a setenta", esperado: true, desc: "Antissepsia do hub com setenta por extenso" },
  { entrada: "fricção alcoólica no conector", esperado: true, desc: "Fricção alcoólica no conector" },
  { entrada: "limpar o hub com álcool", esperado: true, desc: "Limpar o hub com álcool" },
  { entrada: "desinfecção do conector", esperado: true, desc: "Desinfecção do conector" },
  { entrada: "passar álcool no hub", esperado: true, desc: "Passar álcool no hub" }
];

const aceitasTeresinha = [
  "antissepsia do hub",
  "antissepsia de hub",
  "antissepsia do conector",
  "desinfeccao com alcool 70",
  "desinfeccao do hub",
  "limpar conector com alcool"
];

let falhas = 0;
for (const t of testes) {
  const lista = t.desc.includes("hub") || t.desc.includes("conector") ? aceitasTeresinha : aceitasBiosseguranca;
  const obtido = validarRespostaFalada(t.entrada, lista);
  if (obtido === t.esperado) {
    console.log(`✅ SUCESSO: "${t.entrada}" => ${obtido} (${t.desc})`);
  } else {
    console.error(`❌ FALHA: "${t.entrada}" esperado ${t.esperado}, obtido ${obtido} (${t.desc})`);
    falhas++;
  }
}

if (falhas === 0) {
  console.log("🎉 TODOS OS TESTES DE VALIDAÇÃO DE VOZ PASSARAM COM SUCESSO!");
  process.exit(0);
} else {
  console.error(`❌ ${falhas} teste(s) falharam.`);
  process.exit(1);
}
