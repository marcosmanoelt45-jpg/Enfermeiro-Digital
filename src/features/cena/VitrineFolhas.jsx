import React, { useState } from "react";
import { ClipboardList, NotebookPen } from "lucide-react";
import JanelaFolha from "@/components/prontuario/JanelaFolha.jsx";
import DicaExame from "@/components/prontuario/DicaExame.jsx";
import { MODELO_SBAR, MODELO_SOAP } from "@/components/prontuario/modelosAnotacao.js";
import FolhaEvolucao from "@/features/consulta/componentes/FolhaEvolucao.jsx";
import { paginasConsulta } from "@/features/consulta/componentes/ProntuarioConsulta.jsx";
import { paginasPlantao } from "@/features/plantao/componentes/Prontuario.jsx";
import { PLANTAO_CENARIOS } from "@/data/sbarPlantaoDados";

// Só em desenvolvimento (/dev/folhas): os botões e as janelas de prontuário/anotação com um caso de exemplo,
// para conferir arrastar, tamanho e páginas sem precisar entrar numa consulta.
const SESSAO = {
  sessaoId: "vitrine",
  personagemId: "marcus",
  briefing: { nome: "Marcus Vinícius", idade: 58, sexo: "M", setor: "Pronto atendimento", queixa: "Dor no peito há 2 horas", sinaisVitais: { pa_sistolica: 162, pa_diastolica: 98, fc: 112, fr: 22, sat: 93, tax: 36.9 } },
};

function Botao({ rotulo, icone: Icone, imagem, cor, ativo, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className="flex min-h-12 flex-1 basis-[9.5rem] items-center gap-2.5 rounded-2xl border-2 bg-[#131F2E] px-3 py-2 text-left transition-[transform,box-shadow] duration-100 active:translate-y-[3px]"
      style={{ borderColor: ativo ? cor : "#27394B", boxShadow: `0 3px 0 ${ativo ? cor : "#0A1118"}` }}
    >
      <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl" style={{ backgroundColor: `${cor}22` }}>
        {imagem ? <img src={imagem} alt="" className="h-10 w-10 object-contain" /> : <Icone className="h-5 w-5 text-[#0B131D]" aria-hidden="true" />}
      </span>
      <span className="text-sm font-black text-[#EAF2F8]">{rotulo}</span>
    </button>
  );
}

export default function VitrineFolhas() {
  const [modo, setModo] = useState("consulta");
  const [pront, setPront] = useState(true);
  const [anot, setAnot] = useState(true);
  const [notas, setNotas] = useState(MODELO_SOAP);
  const cenario = PLANTAO_CENARIOS[0];
  const paginas = modo === "consulta" ? paginasConsulta({ sessao: SESSAO, exames: [{ exameId: "glicemia", rotulo: "Glicemia capilar", resultado: "112 mg/dL" }] }) : paginasPlantao({ cenario, lacunasPreenchidas: {} });
  return (
    <div className="min-h-screen space-y-4 bg-[#0B131D] p-4 text-[#EAF2F8]">
      <DicaExame key={modo} exemplo={modo === "consulta" ? '"Vou medir sua glicemia" ou "vou auscultar seus pulmões".' : '"Vou avaliar o curativo" ou "vou auscultar o pulmão".'} />
      <div className="flex gap-2">
        {["consulta", "plantao"].map((m) => (
          <button key={m} type="button" onClick={() => { setModo(m); setNotas(m === "consulta" ? MODELO_SOAP : MODELO_SBAR); }} className={`rounded-xl px-3 py-1.5 text-sm font-bold ${modo === m ? "bg-[#20D5B5] text-[#0B131D]" : "bg-[#131F2E]"}`}>
            {m}
          </button>
        ))}
      </div>
      <div className="flex max-w-md flex-wrap gap-2">
        <Botao rotulo="Prontuário" icone={ClipboardList} imagem="/ui/icone-prontuario.webp" cor="#20D5B5" ativo={pront} onClick={() => setPront((v) => !v)} />
        <Botao rotulo="Anotação" icone={NotebookPen} imagem="/ui/icone-anotacao.webp" cor="#FFC247" ativo={anot} onClick={() => setAnot((v) => !v)} />
      </div>
      <JanelaFolha id={`vitrine-p-${modo}`} aberta={pront} titulo="Prontuário" icone={ClipboardList} tipo="prancheta" lado="esquerda" paginas={paginas} onFechar={() => setPront(false)} />
      <JanelaFolha
        id={`vitrine-a-${modo}`}
        aberta={anot}
        titulo="Anotação"
        icone={NotebookPen}
        tipo="bloco"
        lado="direita"
        paginas={[{ titulo: modo === "consulta" ? "Evolução (SOAP)" : "Passagem (SBAR)", conteudo: <div className="h-full min-h-[420px]"><FolhaEvolucao texto={notas} onMudar={setNotas} briefing={SESSAO.briefing} modelo={modo === "consulta" ? MODELO_SOAP : MODELO_SBAR} preencher semAjuda /></div> }]}
        onFechar={() => setAnot(false)}
      />
    </div>
  );
}
