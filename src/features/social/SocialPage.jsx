import React from "react";
import { Trophy } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import SocialConteudo from "./SocialConteudo.jsx";

/** Social (rota /social): pódio e amigos. O conteúdo é o mesmo da aba Social do Perfil (SocialConteudo). */
export default function SocialPage() {
  return (
    <PageShell activeTab="social">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFC247]/15 text-[#FFC247]">
          <Trophy className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-black">Social</h1>
          <p className="text-sm font-semibold text-[#9FB3C6]">Estude junto, compare ofensivas e suba no pódio.</p>
        </div>
      </div>
      <SocialConteudo />
    </PageShell>
  );
}
