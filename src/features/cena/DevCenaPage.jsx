// /dev/cena: só em desenvolvimento. Demonstra o motor com o Sr. Marcus, eco do que o aluno diz e
// botões que simulam cada erro do contrato C5.
import React, { useRef, useState } from "react";
import CenaAoVivo from "./CenaAoVivo.jsx";
import { ErroServidor } from "./logica/erroServidor.js";
import dev from "../../data/falas/dev.json";

const ERROS = ["NAO_AUTENTICADO", "SESSAO_DEMO", "COTA_EXCEDIDA", "ENTRADA_INVALIDA", "SESSAO_ENCERRADA", "IA_INDISPONIVEL", "ERRO_INTERNO", "REDE"];

export default function DevCenaPage() {
  const [proximoErro, setProximoErro] = useState(null);
  const [demo, setDemo] = useState(false);
  const erroRef = useRef(null);
  erroRef.current = proximoErro;

  const onEnviar = async (texto) => {
    await new Promise((r) => setTimeout(r, 400));
    if (erroRef.current) {
      const codigo = erroRef.current;
      setProximoErro(null);
      throw new ErroServidor(codigo);
    }
    return [{ texto: `Você disse: ${texto}`, origem: "aovivo" }];
  };

  return (
    <>
      <CenaAoVivo
        personagemId="marcus"
        titulo="Sr. Marcus · Leito 7"
        progresso={{ atual: 3, total: 10 }}
        falasIniciais={dev.falas.map((f) => ({ ...f, origem: "fixa" }))}
        onEnviar={onEnviar}
        onEncerrar={() => {}}
        bloqueio={demo ? { tipo: "demo", mensagem: "Crie sua conta para conversar com pacientes." } : null}
        acoes={[{ id: "prontuario", rotulo: "Prontuário", onClick: () => {} }]}
      />
      <div className="mx-auto max-w-xl px-4 pb-8 space-y-2">
        <p className="text-xs font-bold text-[#9FB3C6]">DEV: o próximo envio falha com…</p>
        <div className="flex flex-wrap gap-2">
          {ERROS.map((c) => (
            <button key={c} type="button" onClick={() => setProximoErro(c)} className={`rounded-full border px-3 py-1 text-xs font-bold ${proximoErro === c ? "border-[#FFC247] text-[#FFC247]" : "border-[#27394B] text-[#EAF2F8]"}`}>
              {c}
            </button>
          ))}
          <button type="button" onClick={() => setDemo((d) => !d)} className="rounded-full border border-[#27394B] px-3 py-1 text-xs font-bold text-[#EAF2F8]">
            {demo ? "Tirar bloqueio" : "Mostrar bloqueio demo"}
          </button>
        </div>
      </div>
    </>
  );
}
