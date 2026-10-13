import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Lock, FileText, CheckCircle2, UserCheck, AlertCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyLGPD() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  Governança & Política de Privacidade LGPD
                </h1>
                <p className="text-xs text-slate-500">
                  Lei Geral de Proteção de Dados (Lei nº 13.709/2018) & Segurança Acadêmica
                </p>
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> Em Conformidade
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Banner Institucional */}
        <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-sky-50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-600 text-white rounded-2xl shadow-sm">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                Compromisso com a Privacidade e Segurança da Informação em Saúde
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                O <strong>Enfermeiro Digital</strong> foi projetado segundo os princípios de <em>Privacy by Design</em> e <em>Privacy by Default</em>. Como plataforma educacional de simulação clínica, adotamos padrões estritos para garantir que nenhum dado pessoal sensível de pacientes reais seja tratado ou armazenado, resguardando os estudantes, docentes e instituições de saúde parceiras.
              </p>
            </div>
          </div>
        </div>

        {/* Seções da LGPD */}
        <div className="space-y-6">
          {/* Seção 1 */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-base">
              <FileText className="h-5 w-5" />
              <h3>1. Natureza do Ambiente e Dados Sintéticos (Art. 12 da LGPD)</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              O Enfermeiro Digital opera <strong>exclusivamente com casos clínicos didáticos simulados</strong>. Todos os cenários apresentados contêm dados sintéticos criados para fins de aprendizagem e raciocínio clínico. Conforme o Artigo 12 da Lei nº 13.709/2018, dados anonimizados não são considerados dados pessoais, estando fora do escopo de identificabilidade de pessoa natural.
            </p>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500">
              <strong>Regra Operacional:</strong> É expressamente proibido a qualquer usuário inserir dados identificadores de pacientes reais de seus campos de estágio, hospitais ou unidades básicas de saúde.
            </div>
          </section>

          {/* Seção 2 */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-base">
              <ShieldCheck className="h-5 w-5" />
              <h3>2. Sistema Ativo de DLP (Data Loss Prevention)</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Implementamos uma camada algorítmica de inspeção e prevenção de vazamento de dados no cliente (front-end). Antes que qualquer texto livre inserido por um aluno seja submetido aos modelos de inteligência artificial ou persistido, o sistema verifica automaticamente a existência de:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 pl-2">
              <li>Padrões de CPF (Cadastro de Pessoas Físicas);</li>
              <li>Cartão Nacional de Saúde (CNS - 15 dígitos);</li>
              <li>Números de RG, telefones e endereços residenciais;</li>
              <li>Padrões de prontuários hospitalares e leitos específicos.</li>
            </ul>
            <p className="text-sm text-slate-600 leading-relaxed">
              Caso seja identificado algum desses padrões, o usuário é alertado imediatamente e o dado é mascarado de forma irreversível.
            </p>
          </section>

          {/* Seção 3 */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-base">
              <UserCheck className="h-5 w-5" />
              <h3>3. Dados Pessoais dos Estudantes e Professores</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tratamos apenas os dados cadastrais mínimos necessários para autenticação e gestão acadêmica (Princípio da Necessidade - Art. 6º, III):
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block">Dados Coletados</span>
                <span className="text-xs text-slate-500">Nome de exibição, e-mail institucional e perfil de acesso (estudante/docente).</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block">Finalidade</span>
                <span className="text-xs text-slate-500">Acompanhamento do progresso acadêmico nas turmas e personalização da tutoria.</span>
              </div>
            </div>
          </section>

          {/* Seção 4 */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-base">
              <Building2 className="h-5 w-5" />
              <h3>4. Conformidade com Ecossistemas de Inovação em Saúde (NIT HCPA)</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Em consonância com as diretrizes do Núcleo de Inovação Tecnológica e Transferência de Tecnologia (NIT) do <strong>Hospital de Clínicas de Porto Alegre (Starts-HCPA)</strong> e as normas do Conselho Federal de Enfermagem (COFEN nº 564/2017 e nº 736/2024), a plataforma assegura segurança jurídica plena para incubação tecnológica e adoção institucional.
            </p>
          </section>

          {/* Seção 5 */}
          <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-base">
              <AlertCircle className="h-5 w-5" />
              <h3>5. Direitos do Titular (Art. 18 da LGPD)</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              O estudante ou professor tem o direito garantido de solicitar a qualquer momento a confirmação da existência de tratamento, o acesso aos seus dados de perfil, a retificação de informações incompletas ou a exclusão definitiva de sua conta acadêmica.
            </p>
          </section>
        </div>

        <div className="text-center pt-4 pb-8 text-xs text-slate-400">
          Enfermeiro Digital EdTech • Última revisão de conformidade: Outubro de 2026 • Versão 2.0
        </div>
      </main>
    </div>
  );
}
