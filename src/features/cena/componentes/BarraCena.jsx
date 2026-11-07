import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AnimatedProgress } from "@/components/ui/animated-progress";

function formatar(seg) {
  const m = Math.floor(seg / 60);
  return `${String(m).padStart(2, "0")}:${String(seg % 60).padStart(2, "0")}`;
}

// Voltar (com confirmação), título, cronômetro, progresso e um espaço para o rapport.
export default function BarraCena({ titulo, progresso, slotTopo, onSair, rodando = true }) {
  const [aberto, setAberto] = useState(false);
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (!rodando) return undefined;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rodando]);

  return (
    <header className="space-y-2">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setAberto(true)} aria-label="Voltar">
          <ArrowLeft size={20} aria-hidden="true" />
        </Button>
        <h1 className="flex-1 truncate text-base font-extrabold">{titulo}</h1>
        <span className="text-sm font-bold tabular-nums text-[#9FB3C6]" aria-label="Tempo de conversa">
          {formatar(segundos)}
        </span>
      </div>
      {progresso && (
        <AnimatedProgress value={Math.round((progresso.atual / Math.max(1, progresso.total)) * 100)} label={`Passo ${progresso.atual} de ${progresso.total}`} />
      )}
      {slotTopo}
      <AlertDialog open={aberto} onOpenChange={setAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da consulta?</AlertDialogTitle>
            <AlertDialogDescription>O progresso desta conversa será perdido.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar</AlertDialogCancel>
            <AlertDialogAction onClick={onSair}>Sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}

BarraCena.propTypes = {
  titulo: PropTypes.string.isRequired,
  progresso: PropTypes.shape({ atual: PropTypes.number, total: PropTypes.number }),
  slotTopo: PropTypes.node,
  onSair: PropTypes.func,
  rodando: PropTypes.bool,
};
