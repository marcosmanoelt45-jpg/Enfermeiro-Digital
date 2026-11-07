import React from 'react';
import StudentHeader from '@/components/StudentHeader';
import StudentFooter from '@/components/StudentFooter';
import VideotecaConteudo from '@/features/tecnicas/VideotecaConteudo.jsx';

export default function ProcedimentosLab() {
  return (
    <div className="min-h-screen bg-[#0B131D] text-[#EAF2F8] pb-28 md:pb-8 flex flex-col">
      <div className="hidden md:block">
        <StudentHeader activeTab="procedimentos" />
      </div>
      <main className="flex-1 mx-auto max-w-xl md:max-w-4xl w-full px-4 sm:px-6 py-4 space-y-5">
        <VideotecaConteudo />
      </main>
      <StudentFooter />
    </div>
  );
}
