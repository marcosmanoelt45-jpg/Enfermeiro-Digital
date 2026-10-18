import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentFooter from "@/components/StudentFooter";

export default function PrivacyPolicyLGPD() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("faq"); // "faq" | "lgpd" | "cofen"

  const faqItems = [
    {
      q: "O que é o Enfere e qual o seu objetivo?",
      a: "O Enfere é um ambiente educacional e simulador clínico projetado para estudantes de enfermagem. O objetivo é desenvolver o raciocínio diagnóstico, a semiologia e a segurança na administração de medicamentos com base em cenários práticos e na Resolução COFEN nº 736/2024."
    },
    {
      q: "Os casos clínicos utilizam dados de pacientes reais?",
      a: "Não. Todos os casos clínicos são 100% sintéticos e simulados. Nenhum dado de paciente real é utilizado na plataforma, em estrita conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e com o Código de Ética dos Profissionais de Enfermagem."
    },
    {
      q: "Como funciona a navegação pelas 5 etapas do Processo de Enfermagem?",
      a: "No Simulador de Casos Clínicos, você progride sequencialmente pelas etapas estabelecidas pelo COFEN: 1. Avaliação (coleta de dados e sinais vitais), 2. Diagnóstico (formulação da resposta humana e etiologia), 3. Planejamento (metas mensuráveis), 4. Implementação (prescrição de cuidados) e 5. Evolução (resposta fisiológica após intervenções)."
    },
    {
      q: "O que é o Radar de Parâmetros Clínicos?",
      a: "É uma ferramenta pedagógica que indica quais dados essenciais do paciente já foram coletados e quais parâmetros complementares ainda não foram investigados, prevenindo o fechamento prematuro do diagnóstico e permitindo adicionar novos achados com 1 clique."
    },
    {
      q: "Como o sistema protege contra a inserção acidental de dados sensíveis?",
      a: "A plataforma possui um sistema ativo de DLP (Data Loss Prevention) no navegador. Se qualquer usuário tentar digitar dados identificadores (como CPF, CNS, RG ou nomes completos), o sistema detecta o padrão e mascara a informação antes de qualquer processamento."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-800 dark:text-slate-100 transition-colors">
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Central de Ajuda, FAQ & Governança LGPD
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Diretrizes Pedagógicas, Lei nº 13.709/2018 e Resolução COFEN nº 736/2024
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-teal-800 dark:text-teal-300 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" /> Ambiente Didático Seguro
          </span>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Navegação por Abas */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("faq")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "faq"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Perguntas Frequentes (FAQ)
          </button>
          <button
            onClick={() => setActiveTab("lgpd")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "lgpd"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Governança & LGPD em Saúde
          </button>
          <button
            onClick={() => setActiveTab("cofen")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "cofen"
                ? "bg-teal-700 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Diretrizes COFEN 736/2024
          </button>
          <button
            onClick={() => setActiveTab("autoria")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "autoria"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Autoria & Propriedade Intelectual
          </button>
        </div>

        {/* ABA 1: PERGUNTAS FREQUENTES (FAQ) */}
        {activeTab === "faq" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Dúvidas Comuns sobre o Ambiente de Aprendizagem
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Orientações sobre simulação clínica, casos práticos e resolução de desafios.
              </p>
            </div>

            <div className="space-y-3">
              {faqItems.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-teal-800 dark:text-teal-400 text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    {item.q}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-7">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 2: GOVERNANÇA & LGPD */}
        {activeTab === "lgpd" && (
          <div className="space-y-5 animate-in fade-in">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-2">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider block">
                Privacidade & Proteção de Dados
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Compromisso com a Segurança e Dados Sintéticos (Lei nº 13.709/2018)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                O Enfere foi concebido sob a premissa de <em>Privacy by Design</em>. Por operar como um laboratório de simulação didática, todos os dados clínicos são exclusivamente sintéticos, garantindo que nenhum prontuário de paciente real seja trafegado ou persistido.
              </p>
            </div>

            <div className="space-y-4">
              <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
                  <FileText className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                  <h3>1. Natureza do Ambiente e Dados Sintéticos (Art. 12 da LGPD)</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Conforme o Artigo 12 da Lei nº 13.709/2018, dados anonimizados e dados sintéticos criados para fins de aprendizagem não são considerados dados pessoais, estando fora do escopo de identificabilidade de pessoa natural.
                </p>
              </section>

              <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
                  <ShieldCheck className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                  <h3>2. Sistema Ativo de DLP (Data Loss Prevention)</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Implementamos inspeção algorítmica no navegador do usuário para evitar vazamento inadvertido de CPFs, números de prontuários, CNS ou leitos de campos de estágio prático. Caso detectado, o dado é mascarado imediatamente antes do envio.
                </p>
              </section>

              <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
                  <Building2 className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                  <h3>3. Incubação & Parcerias Institucionais (NIT Starts-HCPA)</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  O projeto está estruturado com conformidade jurídica para integração e incubação em ecossistemas de inovação em saúde, garantindo aderência às normas éticas do Conselho Federal de Enfermagem (COFEN nº 564/2017) e do Hospital de Clínicas de Porto Alegre.
                </p>
              </section>
            </div>
          </div>
        )}

        {/* ABA 3: DIRETRIZES COFEN 736/2024 */}
        {activeTab === "cofen" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider block">
                Regulamentação Profissional
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                As 5 Etapas do Processo de Enfermagem (Resolução COFEN nº 736/2024)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                A Resolução COFEN nº 736/2024 atualizou a Sistematização da Assistência de Enfermagem (SAE) e o Processo de Enfermagem (PE), organizando o método científico em cinco etapas interdependentes e contínuas:
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">1. Avaliação de Enfermagem</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Coleta metódica, deliberada e contínua de dados subjetivos e objetivos (anamnese, exame físico e dados complementares).
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">2. Diagnóstico de Enfermagem</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Julgamento clínico sobre as respostas humanas e vulnerabilidades da pessoa, família ou comunidade.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">3. Planejamento de Enfermagem</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Determinação das metas e resultados esperados mensuráveis a serem alcançados pela pessoa.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">4. Implementação de Enfermagem</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Execução e realização das intervenções e cuidados prescritos pelo enfermeiro com rigor e aprazamento.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 sm:col-span-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">5. Evolução de Enfermagem</span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Avaliação contínua dos resultados obtidos, resposta terapêutica e adequação do plano de cuidados.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: AUTORIA & PROPRIEDADE INTELECTUAL */}
        {activeTab === "autoria" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Titularidade e Direitos Exclusivos
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Criador e Detentor dos Direitos Autorais
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Declaração formal de autoria, concepção e titularidade de propriedade intelectual e patrimonial sobre o ecossistema <strong>Enfere</strong>.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                    Marcos Manoel Tavares Neumann
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                    Criador, idealizador, desenvolvedor e detentor exclusivo de todos os direitos autorais, patrimoniais e morais de autor da plataforma Enfere.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wide">
                  Proteção Legal (Lei Federal nº 9.610/1998 e Lei nº 9.609/1998):
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <li>
                    <strong>Código-Fonte e Arquitetura:</strong> Toda a base de código, estrutura de dados, interfaces e serviços são obras intelectuais protegidas de titularidade de Marcos Manoel Tavares Neumann.
                  </li>
                  <li>
                    <strong>Algoritmos de Tutoria Clínica e SBAR:</strong> O sistema de inteligência formativa, debriefing socrático (Preceptor Clínico IA) e reconhecimento fonético são propriedades intelectuais exclusivas.
                  </li>
                  <li>
                    <strong>Identidade e Design System:</strong> A identidade visual, organização de módulos, fluxos de simulação e montador de casos clínicos são de titularidade reservada.
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Registro & Copyright © 2026 Enfere</span>
                <span>Todos os direitos reservados</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <StudentFooter />
    </div>
  );
}
