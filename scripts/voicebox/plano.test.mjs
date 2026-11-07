import test from "node:test";
import assert from "node:assert/strict";
import { planejar, hashDaFala, nomeDoArquivo, semMp3, duracaoDoWav, aplicarPronuncia, agruparFalas } from "./plano.mjs";

const falar = (t) => aplicarPronuncia(t);
const falas = [{ id: "a.b.1", texto: "Faça 500 mL EV." }, { id: "a.b.2", texto: "Bom dia." }];

function wav(ms, taxa = 8000) {
  const dados = (taxa * 2 * ms) / 1000;
  const b = Buffer.alloc(44 + dados);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + dados, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(taxa, 24);
  b.writeUInt32LE(taxa * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(dados, 40);
  return b;
}

test("hash depende do perfil e do texto falado (depois da pronúncia)", () => {
  assert.equal(hashDaFala("Marcus", "oi"), hashDaFala("Marcus", "oi"));
  assert.notEqual(hashDaFala("Marcus", "oi"), hashDaFala("Rui", "oi"));
  assert.notEqual(hashDaFala("Marcus", "oi"), hashDaFala("Marcus", "oi!"));
  assert.equal(nomeDoArquivo("a.b.1", "0123456789abcdef"), "a.b.1.01234567.mp3");
});

test("primeira rodada gera tudo; com manifesto e arquivos, a segunda não gera nada", () => {
  const p1 = planejar({ perfil: "Marcus", falas, manifesto: { falas: {} }, arquivosNoDisco: new Set(), falar });
  assert.equal(p1.gerar.length, 2);
  assert.equal(p1.pular.length, 0);

  const manifesto = { falas: Object.fromEntries(p1.gerar.map((g) => [g.id, { arquivo: g.arquivo, hash: g.hash, duracaoMs: 1000 }])) };
  const arquivosNoDisco = new Set(p1.gerar.map((g) => g.arquivo));
  const p2 = planejar({ perfil: "Marcus", falas, manifesto, arquivosNoDisco, falar });
  assert.equal(p2.gerar.length, 0);
  assert.deepEqual(p2.pular.sort(), ["a.b.1", "a.b.2"]);
  assert.deepEqual(p2.orfaos, []);
});

test("mudou o texto, o perfil ou o dicionário: regera só o afetado e o mp3 antigo vira órfão", () => {
  const base = planejar({ perfil: "Marcus", falas, manifesto: { falas: {} }, arquivosNoDisco: new Set(), falar });
  const manifesto = { falas: Object.fromEntries(base.gerar.map((g) => [g.id, { arquivo: g.arquivo, hash: g.hash, duracaoMs: 1 }])) };
  const arquivosNoDisco = new Set(base.gerar.map((g) => g.arquivo));

  const editado = [falas[0], { id: "a.b.2", texto: "Boa tarde." }];
  const p = planejar({ perfil: "Marcus", falas: editado, manifesto, arquivosNoDisco, falar });
  assert.deepEqual(p.gerar.map((g) => g.id), ["a.b.2"]);
  assert.deepEqual(p.pular, ["a.b.1"]);
  assert.deepEqual(p.orfaos, [manifesto.falas["a.b.2"].arquivo]);

  const outroDicionario = (t) => aplicarPronuncia(t, { EV: "na veia", mL: "mililitros" });
  const p2 = planejar({ perfil: "Marcus", falas, manifesto, arquivosNoDisco, falar: outroDicionario });
  assert.deepEqual(p2.gerar.map((g) => g.id), ["a.b.1"]);

  const p3 = planejar({ perfil: "Rui", falas, manifesto, arquivosNoDisco, falar });
  assert.equal(p3.gerar.length, 2);
});

test("arquivo sumido do disco é regerado; id removido do JSON aparece em idsRemovidos", () => {
  const base = planejar({ perfil: "M", falas, manifesto: { falas: {} }, arquivosNoDisco: new Set(), falar });
  const manifesto = { falas: Object.fromEntries(base.gerar.map((g) => [g.id, { arquivo: g.arquivo, hash: g.hash, duracaoMs: 1 }])) };
  const p = planejar({ perfil: "M", falas: [falas[0]], manifesto, arquivosNoDisco: new Set([base.gerar[0].arquivo]), falar });
  assert.equal(p.gerar.length, 0);
  assert.deepEqual(p.idsRemovidos, ["a.b.2"]);
  const sumiu = planejar({ perfil: "M", falas, manifesto, arquivosNoDisco: new Set(), falar });
  assert.equal(sumiu.gerar.length, 2);
});

test("id repetido é erro; semMp3 lista as falas sem arquivo", () => {
  assert.throws(() => planejar({ perfil: "M", falas: [falas[0], falas[0]], manifesto: { falas: {} }, arquivosNoDisco: new Set(), falar }), /repetido/);
  assert.deepEqual(semMp3({ falas, manifesto: { falas: { "a.b.1": { arquivo: "x.mp3" } } }, arquivosNoDisco: new Set(["x.mp3"]) }), ["a.b.2"]);
});

test("duracaoDoWav lê a duração do cabeçalho", () => {
  assert.equal(duracaoDoWav(wav(1500)), 1500);
  assert.throws(() => duracaoDoWav(Buffer.from("nada")), /inválido/);
});

test("agruparFalas junta arquivos do mesmo personagem e recusa perfis diferentes", () => {
  const g = agruparFalas([
    { personagem: "marcus", perfilVoicebox: "Marcus", falas: [{ id: "a", texto: "1" }] },
    { personagem: "rui", perfilVoicebox: "Rui", falas: [{ id: "b", texto: "2" }] },
    { personagem: "marcus", perfilVoicebox: "Marcus", falas: [{ id: "c", texto: "3" }] },
    { sem: "personagem" },
  ]);
  assert.deepEqual(g.map((x) => [x.personagem, x.falas.map((f) => f.id)]), [["marcus", ["a", "c"]], ["rui", ["b"]]]);
  assert.throws(() => agruparFalas([{ personagem: "m", perfilVoicebox: "A", falas: [] }, { personagem: "m", perfilVoicebox: "B", falas: [] }]), /Perfis diferentes/);
});
