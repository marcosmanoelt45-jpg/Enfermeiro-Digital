import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EVENTO_COMEMORACAO } from "@/components/feedback/comemoracoes.js";
import SecaoOfensivasAmigos from "./SecaoOfensivasAmigos.jsx";
import TelaCompromisso from "./TelaCompromisso.jsx";
import { EXEMPLOS_AMIGOS } from "./ofensivaAmigos.js";

// Vitrine só de desenvolvimento (rota /dev/ofensivas, fora do build de produção): dispara cada comemoração de
// ofensiva para ver e ajustar a animação sem precisar esperar o dia seguinte.
const EU = { nome: "Você", cor: "#20D5B5" };
const LETRAS = ["D", "S", "T", "Q", "Q", "S", "S"];

function semana(ativos, congelados = []) {
  const hoje = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (6 - i));
    const congelado = congelados.includes(i);
    return { dia: `d${i}`, letra: LETRAS[d.getDay()], ativo: ativos.includes(i) || congelado, congelado, hoje: i === 6 };
  });
}

const avisar = (detalhe) => window.dispatchEvent(new CustomEvent(EVENTO_COMEMORACAO, { detail: detalhe }));

export default function VitrineOfensivas() {
  const [compromisso, setCompromisso] = useState(false);
  const casos = [
    ["1º dia", () => avisar({ tipo: "ofensiva", de: 0, para: 1, semana: semana([6]) })],
    ["4 → 5 dias", () => avisar({ tipo: "ofensiva", de: 4, para: 5, semana: semana([2, 3, 4, 5, 6]) })],
    ["Com congelamento", () => avisar({ tipo: "ofensiva", de: 11, para: 12, semana: semana([0, 1, 2, 4, 5, 6], [3]) })],
    ["9 → 10 (dezena)", () => avisar({ tipo: "ofensiva", de: 9, para: 10, semana: semana([1, 2, 3, 4, 5, 6]) })],
    ["Semana perfeita", () => avisar({ tipo: "ofensiva", de: 20, para: 21, semana: semana([0, 1, 2, 3, 4, 5, 6]) })],
    ["Marco 30 dias", () => avisar({ tipo: "ofensiva", de: 29, para: 30, semana: semana([0, 1, 2, 3, 4, 5, 6]) })],
    ["Amigo: os dois", () => avisar({ tipo: "ofensiva_amigo", dados: { eu: EU, amigo: EXEMPLOS_AMIGOS[0], de: 22, para: 23, amigoFez: true, meta: 30 } })],
    ["Amigo: falta ele", () => avisar({ tipo: "ofensiva_amigo", dados: { eu: EU, amigo: EXEMPLOS_AMIGOS[1], de: 6, para: 7, amigoFez: false, meta: 7 } })],
    ["Amigo: meta 7", () => avisar({ tipo: "ofensiva_amigo", dados: { eu: EU, amigo: EXEMPLOS_AMIGOS[1], de: 6, para: 7, amigoFez: true, meta: 7 } })],
    ["Combinar meta", () => setCompromisso(true)],
    ["5 acertos", () => avisar({ tipo: "sequencia", n: 5 })],
  ];
  return (
    <div className="mx-auto min-h-screen max-w-md bg-[#0B131D] px-4 py-6">
      <h1 className="text-xl font-black text-[#EAF2F8]">Vitrine das ofensivas</h1>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {casos.map(([rotulo, fn]) => (
          <Button key={rotulo} variant="outline" size="sm" onClick={fn}>
            {rotulo}
          </Button>
        ))}
      </div>
      <div className="mt-6">
        <SecaoOfensivasAmigos itens={EXEMPLOS_AMIGOS} />
      </div>
      <AnimatePresence>
        {compromisso && (
          <TelaCompromisso eu={EU} amigo={EXEMPLOS_AMIGOS[2]} onConfirmar={() => setCompromisso(false)} onFechar={() => setCompromisso(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
