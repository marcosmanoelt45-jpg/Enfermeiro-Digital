import React from "react";
import PropTypes from "prop-types";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const TITULOS = {
  cota: "Limite de hoje atingido",
  demo: "Crie sua conta para conversar",
  ia: "Conversa indisponível",
};

// Cartão para cota esgotada, conta demonstração ou IA fora do ar. `acao` = { rotulo, onClick }.
export default function EstadoBloqueado({ tipo, mensagem, acao }) {
  return (
    <div className="rounded-2xl border border-[#27394B] bg-[#131F2E] p-5 text-center space-y-3" role="alert">
      <Lock className="mx-auto text-[#FFC247]" size={28} aria-hidden="true" />
      <h2 className="text-lg font-extrabold">{TITULOS[tipo] ?? TITULOS.ia}</h2>
      {mensagem && <p className="text-sm font-semibold text-[#9FB3C6]">{mensagem}</p>}
      {acao && (
        <Button variant="primary" onClick={acao.onClick}>
          {acao.rotulo}
        </Button>
      )}
    </div>
  );
}

EstadoBloqueado.propTypes = {
  tipo: PropTypes.oneOf(["cota", "demo", "ia"]).isRequired,
  mensagem: PropTypes.string,
  acao: PropTypes.shape({ rotulo: PropTypes.string, onClick: PropTypes.func }),
};
