// GERADO por scripts/consulta/exportar-arquetipos.mjs. Não edite à mão.
// Temas de consulta: agrupam os arquétipos por especialidade.
export const TEMAS = [
  {
    "id": "cardiovascular",
    "rotulo": "Coração e circulação",
    "arquetipos": [
      "sc_iam",
      "sc_icc_perfil_b"
    ]
  },
  {
    "id": "respiratorio",
    "rotulo": "Respiração",
    "arquetipos": [
      "sc_dpoc",
      "sc_tep",
      "sc_anafilaxia"
    ]
  },
  {
    "id": "neurologia",
    "rotulo": "Cérebro e nervos",
    "arquetipos": [
      "sc_ave_trombolise",
      "sc_delirium_idoso"
    ]
  },
  {
    "id": "sepse",
    "rotulo": "Infecção grave",
    "arquetipos": [
      "sc_sepse_urinaria"
    ]
  },
  {
    "id": "metabolico_endocrino",
    "rotulo": "Diabetes e metabolismo",
    "arquetipos": [
      "sc_cad"
    ]
  },
  {
    "id": "cirurgico_abdome",
    "rotulo": "Abdome cirúrgico",
    "arquetipos": [
      "sc_peritonite",
      "sc_pancreatite",
      "sc_pos_apendicectomia_dm"
    ]
  },
  {
    "id": "nefrologia",
    "rotulo": "Rins",
    "arquetipos": [
      "sc_ira_rabdo"
    ]
  },
  {
    "id": "obstetricia",
    "rotulo": "Gestação",
    "arquetipos": [
      "sc_preeclampsia"
    ]
  },
  {
    "id": "trauma",
    "rotulo": "Trauma e queimaduras",
    "arquetipos": [
      "sc_trauma_hemorragico",
      "sc_queimadura"
    ]
  }
];

export const buscarTema = (id) => TEMAS.find((t) => t.id === id) ?? null;
