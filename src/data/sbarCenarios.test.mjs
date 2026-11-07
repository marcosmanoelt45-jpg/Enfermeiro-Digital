import test from "node:test";
import assert from "node:assert/strict";
import { PRESET_HANDOFF_SCENARIOS } from "./sbarHandoffScenarios.js";
import { PLANTAO_EXTRAS, PLANTAO_CENARIOS, cenarioDoPlantao } from "./sbarPlantaoDados.js";
import { SEMIOLOGY_KNOWLEDGE_BASE } from "./semiologyFindings.js";
import { MINIJOGOS_ESTATICOS } from "../features/minijogos/dados/index.js";

const IDS_DOS_CENARIOS = PRESET_HANDOFF_SCENARIOS.map((c) => c.id);
const CAMPOS_VITAIS = ["pa_sistolica", "pa_diastolica", "fc", "fr", "sat", "tax"];
const LETRAS = ["S", "B", "A", "R"];
const MINIJOGOS = new Map(MINIJOGOS_ESTATICOS.map((m) => [m.id, m]));

test("os 20 cenários têm os dados do Plantão (e só cenários que existem)", () => {
  assert.equal(IDS_DOS_CENARIOS.length, 20);
  assert.deepEqual(Object.keys(PLANTAO_EXTRAS).sort(), [...IDS_DOS_CENARIOS].sort());
  assert.equal(PLANTAO_CENARIOS.length, 20);
});

test("o cenário do Plantão só acrescenta campos: nada do original some ou muda", () => {
  for (const base of PRESET_HANDOFF_SCENARIOS) {
    const c = cenarioDoPlantao(base.id);
    for (const [k, v] of Object.entries(base)) assert.deepEqual(c[k], v, `${base.id}.${k}`);
    for (const k of ["lacunas", "perguntas", "elementosChave"]) assert.ok(c[k], `${base.id} sem ${k}`);
  }
});

for (const cenario of PLANTAO_CENARIOS) {
  test(`${cenario.id}: perguntas, lacunas e elementos-chave coerentes`, () => {
    const { id, perguntas, lacunas, elementosChave, vitals } = cenario;

    // perguntas
    assert.ok(perguntas.length >= 6 && perguntas.length <= 9, `${perguntas.length} perguntas`);
    assert.equal(new Set(perguntas.map((p) => p.id)).size, perguntas.length, "ids de pergunta repetidos");
    for (const letra of LETRAS) assert.ok(perguntas.some((p) => p.letra === letra), `sem pergunta da letra ${letra}`);
    for (const p of perguntas) {
      assert.match(p.id, new RegExp(`^plt\\.${id}\\.[a-z0-9_]+$`), `id ${p.id}`);
      assert.ok(LETRAS.includes(p.letra), `${p.id}: letra`);
      assert.ok(p.texto.endsWith("?") && p.texto.length >= 12 && p.texto.length <= 90, `${p.id}: texto "${p.texto}"`);
      assert.ok(p.espera?.tipo === "texto" || p.espera?.tipo === "numero", `${p.id}: espera`);
      if (p.espera.tipo === "numero") {
        assert.ok(p.espera.campos?.length, `${p.id}: numero sem campos`);
        for (const c of p.espera.campos) {
          assert.ok(CAMPOS_VITAIS.includes(c), `${p.id}: campo ${c}`);
          assert.ok(Number.isFinite(vitals[c]), `${p.id}: o cenário não tem ${c}`);
        }
      }
    }
    // a ordem segue o SBAR
    const ordem = perguntas.map((p) => LETRAS.indexOf(p.letra));
    assert.deepEqual(ordem, [...ordem].sort((a, b) => a - b), "perguntas fora da ordem S-B-A-R");

    // lacunas
    assert.ok(lacunas.length >= 2 && lacunas.length <= 3, `${lacunas.length} lacunas`);
    assert.equal(new Set(lacunas.map((l) => l.campo)).size, lacunas.length, "campos de lacuna repetidos");
    for (const l of lacunas) {
      assert.ok(perguntas.some((p) => p.dependeDe === l.campo), `lacuna ${l.campo} sem pergunta que dependa dela`);
      assert.ok(l.rotulo && l.valorEsperado, `${l.campo}: rotulo e valorEsperado`);
      if (l.minijogo) {
        const m = MINIJOGOS.get(l.minijogo);
        assert.ok(m, `${l.campo}: minijogo ${l.minijogo} não existe no registro`);
        assert.equal(m.achado?.valor, l.valorEsperado, `${l.campo}: valorEsperado difere do achado do minijogo`);
      } else if (l.gapKey) {
        assert.ok(SEMIOLOGY_KNOWLEDGE_BASE[l.gapKey], `${l.campo}: gapKey ${l.gapKey} não existe na semiologia`);
      } else {
        const o = l.exame?.opcoes ?? [];
        assert.ok(l.exame?.pergunta?.endsWith("?"), `${l.campo}: exame sem pergunta`);
        assert.equal(o.length, 4, `${l.campo}: precisa de 4 opções`);
        assert.equal(o.filter((x) => x.correta).length, 1, `${l.campo}: precisa de 1 opção correta`);
        assert.equal(o.find((x) => x.correta).texto, l.valorEsperado, `${l.campo}: a opção correta deve ser o valorEsperado`);
        for (const x of o) assert.ok(x.texto && x.feedback, `${l.campo}: opção sem texto ou feedback`);
        assert.equal(new Set(o.map((x) => x.texto)).size, 4, `${l.campo}: opções repetidas`);
      }
    }
    for (const p of perguntas) if (p.dependeDe) assert.ok(lacunas.some((l) => l.campo === p.dependeDe), `${p.id}: dependeDe ${p.dependeDe} inexistente`);

    // elementos-chave
    for (const letra of LETRAS) {
      const e = elementosChave[letra];
      assert.ok(Array.isArray(e) && e.length >= 3 && e.length <= 6, `${letra}: ${e?.length} elementos`);
      for (const item of e) assert.ok(item.length >= 4 && item.length <= 80, `${letra}: "${item}"`);
    }
  });
}

test("ids de pergunta são únicos em todos os cenários", () => {
  const todos = PLANTAO_CENARIOS.flatMap((c) => c.perguntas.map((p) => p.id));
  assert.equal(new Set(todos).size, todos.length);
});

test("minijogos usados em lacunas são coerentes com o cenário (ausculta só em quadro de crepitações)", () => {
  for (const c of PLANTAO_CENARIOS) {
    for (const l of c.lacunas.filter((x) => x.minijogo === "ausculta-pulmonar")) {
      assert.match(c.goldenSbar.assessment, /crepita|estertor/i, `${c.id}: ausculta sem crepitações no golden`);
    }
    for (const l of c.lacunas.filter((x) => x.minijogo === "contar-fr")) {
      assert.ok(Math.abs(c.vitals.fr - 28) <= 2, `${c.id}: contar-fr (28 irpm) incoerente com FR ${c.vitals.fr}`);
    }
  }
});
