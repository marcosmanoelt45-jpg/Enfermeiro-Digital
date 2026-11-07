import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/surface";
import PageShell from "@/components/layout/PageShell";
import { obterRelatorioDaConsulta } from "@/features/cena/servidor.js";
import RelatorioConsulta from "./componentes/RelatorioConsulta.jsx";

// Reabre o relatório de uma consulta encerrada (vem do Histórico do Perfil), buscando no servidor.
export default function RelatorioPage() {
  const { sessaoId } = useParams();
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let vivo = true;
    obterRelatorioDaConsulta(sessaoId)
      .then((d) => vivo && setDados(d))
      .catch((e) => vivo && setErro(e?.message || "Não foi possível abrir o relatório."));
    return () => {
      vivo = false;
    };
  }, [sessaoId]);

  if (erro) {
    return (
      <PageShell>
        <Panel className="space-y-3 text-center" role="alert">
          <p className="font-extrabold">Relatório indisponível</p>
          <p className="text-sm font-semibold text-[#9FB3C6]">{erro}</p>
          <Button variant="primary" onClick={() => navigate("/conta")}>Voltar ao Perfil</Button>
        </Panel>
      </PageShell>
    );
  }
  if (!dados) {
    return (
      <PageShell>
        <p className="py-10 text-center text-sm font-bold text-[#9FB3C6]" role="status">Abrindo o relatório…</p>
      </PageShell>
    );
  }
  return <RelatorioConsulta relatorio={dados.sessao.relatorio} turnos={dados.turnos} onNova={() => navigate("/consulta")} onInicio={() => navigate("/")} />;
}
