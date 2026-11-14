import { test } from "node:test";
import assert from "node:assert/strict";
import { PLANTAO_EXTRAS } from "../../../data/sbarPlantaoDados.js";
import { exameDoTexto } from "./exameDoTexto.js";

// Uma frase do jeito que o aluno fala, para cada exame de cada caso. Todas têm que abrir o exame certo
// mesmo sem a IA (a reserva), para nenhum exame ficar "inalcançável" pelo chat.
const FRASES = {
  "pos_op.ferida_dreno": "vou olhar o curativo e o dreno",
  "pos_op.abdome": "deixa eu palpar a barriga dele",
  "icc.ausculta_pulmonar": "vou auscultar os pulmões",
  "icc.edema_mmii": "vou ver se as pernas estão inchadas",
  "icc.turgencia_jugular": "vou olhar o pescoço, as jugulares",
  "bronquiolite_lactente.tiragem": "vou observar como ele está respirando",
  "bronquiolite_lactente.alimentacao_diurese": "vou checar as fraldas e se ele mamou",
  "pre_eclampsia_grave.reflexo_patelar": "vou testar o reflexo dela",
  "pre_eclampsia_grave.diurese": "vou ver quanto de urina tem na bolsa",
  "pre_eclampsia_grave.bcf": "vou ouvir e checar o coração do bebê com o sonar",
  "avc_isquemico.glasgow": "vou avaliar o Glasgow dele",
  "avc_isquemico.forca_motora": "vou testar a força do braço",
  "avc_isquemico.sangramento": "vou ver se tem algum sangramento",
  "delirium.cam": "vou avaliar se ele está confuso, a atenção",
  "delirium.acesso_venoso": "vou olhar o acesso no braço",
  "delirium.seguranca_leito": "vou verificar as grades da cama",
  "dpoc.ausculta": "vou auscultar o pulmão dele",
  "dpoc.esforco_resp": "vou observar o esforço pra respirar",
  "dpoc.oxigenoterapia": "vou checar a saturação e o oxigênio",
  "sepse_urinaria.perfusao": "vou avaliar a perfusão, o enchimento capilar",
  "sepse_urinaria.diurese": "vou ver a diurese na bolsa",
  "sepse_urinaria.nivel_consciencia": "vou ver se ela está acordada e orientada",
  "iam_st.sitio_puncao": "vou olhar a virilha onde foi a punção",
  "iam_st.pulso_pedioso": "vou palpar o pulso do pé",
  "iam_st.dor_toracica": "vou olhar o monitor e perguntar da dor no peito",
  "trauma_cranio.glasgow": "vou aplicar a escala de Glasgow",
  "trauma_cranio.pupilas": "vou avaliar as pupilas",
  "trauma_cranio.cefaleia_vomito": "vou ver se ele está com dor de cabeça ou vômito",
  "cetoacidose_pediatrica.freq_resp": "vou contar a frequência respiratória",
  "cetoacidose_pediatrica.glicemia": "vou medir a glicemia",
  "cetoacidose_pediatrica.potassio": "vou conferir o potássio no laboratório",
  "pancreatite_aguda.abdome": "vou palpar o abdome",
  "pancreatite_aguda.sng": "vou olhar o débito da sonda",
  "pancreatite_aguda.diurese": "vou verificar a diurese",
  "choque_anafilatico.via_aerea": "vou avaliar a via aérea e auscultar",
  "choque_anafilatico.pele": "vou olhar a pele dela",
  "choque_anafilatico.alergia_registro": "vou conferir a pulseira de alergia",
  "queimado_agudo.diurese_horaria": "vou medir a diurese da última hora",
  "queimado_agudo.extremidades": "vou ver as mãos e os pés",
  "queimado_agudo.face_via_aerea": "vou olhar o rosto e ver se tem rouquidão",
  "politrauma_bacia.contencao_pelvica": "vou conferir a cinta pélvica",
  "politrauma_bacia.pulsos": "vou palpar os pulsos femorais",
  "politrauma_bacia.hematocrito": "vou ver o resultado do hematócrito",
  "hemorragia_digestiva.sangramento": "vou ver se ele voltou a sangrar",
  "hemorragia_digestiva.nivel_consciencia": "vou avaliar o nível de consciência",
  "hemorragia_digestiva.acesso_central": "vou olhar o cateter central",
  "tep_pos_op.panturrilha": "vou examinar a panturrilha",
  "tep_pos_op.oxigenacao": "vou ver a saturação",
  "tep_pos_op.sangramento": "vou checar se tem sangramento",
  "falciforme_toracica.oxigenacao": "vou medir a saturação dele",
  "falciforme_toracica.dor": "vou avaliar a dor",
  "falciforme_toracica.radiografia": "vou olhar o raio x",
  "paliativos_terminal.conforto": "vou avaliar se ela está confortável, sem desconforto",
  "paliativos_terminal.hipodermoclise": "vou olhar a hipodermóclise no ombro",
  "paliativos_terminal.respiracao": "vou observar a respiração dela",
  "crise_tireotoxica.temperatura_pele": "vou medir a temperatura",
  "crise_tireotoxica.ritmo_cardiaco": "vou olhar o monitor",
  "crise_tireotoxica.neuro_pulmao": "vou ver se ela tem tremor e auscultar",
  "srpa_colectomia.via_aerea_respiracao": "vou ver a respiração e o oxímetro",
  "srpa_colectomia.consciencia_aldrete": "vou pontuar o Aldrete dele",
  "caso2_apendicectomia_dm.glicemia": "vou fazer a glicemia capilar",
  "caso2_apendicectomia_dm.abdome": "deixa eu examinar a barriga dele",
};

test("cada exame abre pelo chat com uma frase natural (sem IA)", () => {
  const errados = [];
  for (const [id, c] of Object.entries(PLANTAO_EXTRAS)) {
    for (const l of c.lacunas) {
      const chave = `${id}.${l.campo}`;
      const frase = FRASES[chave];
      assert.ok(frase, `falta frase de teste para ${chave}`);
      const achado = exameDoTexto(frase, c.lacunas);
      if (achado?.campo !== l.campo) errados.push(`${chave}: "${frase}" -> ${achado?.campo ?? "nada"}`);
    }
  }
  assert.deepEqual(errados, []);
});

test("conversa comum não abre exame", () => {
  const c = PLANTAO_EXTRAS.trauma_cranio;
  assert.equal(exameDoTexto("ele tem 29 anos e caiu de bicicleta", c.lacunas), null);
  assert.equal(exameDoTexto("tudo bem, pode falar", c.lacunas), null);
});
