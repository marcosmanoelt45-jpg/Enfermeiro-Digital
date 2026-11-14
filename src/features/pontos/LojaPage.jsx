import React from "react";
import PageShell from "@/components/layout/PageShell";
import { useAuth } from "@/lib/AuthContext";
import LojaPE from "./LojaPE.jsx";

/** Loja (rota /loja): gastar PE em bloqueio de ofensiva e PE em dobro. */
export default function LojaPage() {
  const { user } = useAuth();
  return (
    <PageShell activeTab="loja" larguraMax="4xl">
      <div>
        <h1 className="text-2xl font-black">Loja</h1>
        <p className="text-sm font-semibold text-[#9FB3C6]">Troque seus PE por proteção e bônus.</p>
      </div>
      <LojaPE userId={user?.id} />
    </PageShell>
  );
}
