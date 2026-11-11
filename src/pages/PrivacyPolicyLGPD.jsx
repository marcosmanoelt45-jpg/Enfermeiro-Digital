import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Building2,
  ExternalLink,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentFooter from "@/components/StudentFooter";

export default function PrivacyPolicyLGPD() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("faq"); // "faq" | "quem" | "lgpd" | "cofen" | "autoria"

  const LINKEDIN_URL = "https://www.linkedin.com/in/marcos-manoel-958345435/";
  // O número fica só no link do botão; na tela aparece apenas "Fale conosco".
  const FALE_CONOSCO_URL = `https://wa.me/5551992187301?text=${encodeURIComponent("Olá! Vim pelo Enfere.")}`;

  const faqItems = [
    {
      q: "O que é o Enfere?",
      a: "O Enfere é um simulador de prática clínica para estudantes de enfermagem. Você conversa com pacientes, recebe plantão, faz cálculos de dose, treina técnicas e responde questões, e recebe nota e comentários no fim de cada atividade."
    },
    {
      q: "Os pacientes e os casos são reais?",
      a: "Não. Todos os pacientes e casos são sintéticos e simulados. Nenhum dado de paciente real é usado na plataforma, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e com o Código de Ética dos Profissionais de Enfermagem."
    },
    {
      q: "Como funciona a Consulta ao Vivo?",
      a: "Você escolhe o assunto e o paciente, conversa por voz ou texto (são até 40 falas) e anota o que descobriu na folha de evolução. Quando quiser examinar, diga na conversa (por exemplo, \"vou medir sua glicemia\"): se o paciente concordar, aparece uma janela para fazer o exame. Ao encerrar, você registra os achados, os diagnósticos e as intervenções e recebe o relatório."
    },
    {
      q: "Como funciona o Plantão?",
      a: "No Menu, ao tocar em Plantão você escolhe como fazer. Com a enfermeira Ana, ela pergunta e você responde por voz ou texto, e pode examinar o paciente pelo prontuário. Por voz ou preenchimento, você grava a passagem completa ou preenche o SBAR (Situação, Histórico, Avaliação e Recomendação)."
    },
    {
      q: "Como funciona o Cálculo com o Dr. Rui?",
      a: "O Dr. Rui passa prescrições e você responde o valor pelo teclado ou por voz. Em algumas prescrições o erro está na própria receita: nesses casos o certo é questionar a prescrição antes de preparar. No fim de cada item você vê a conta passo a passo."
    },
    {
      q: "Como funcionam as Questões?",
      a: "Cada questão dá duas chances. Se você errar a primeira, pode tocar em \"Ver dica\" quando quiser, e a dica não aparece sozinha. Se errar a segunda, o app mostra a resposta certa e explica cada alternativa. As questões erradas vão para a Revisão."
    },
    {
      q: "Onde ficam os minijogos e os vídeos?",
      a: "Os minijogos ficam no Menu (ícone de baixo, à esquerda do Cálculo), separados dos vídeos. A aba Vídeos reúne os procedimentos com vídeo, checklist e fonte indicada."
    },
    {
      q: "O que são PE e ofensiva?",
      a: "PE são os pontos de estudo que você ganha ao concluir atividades. Todo mundo começa com 0. A ofensiva conta os dias seguidos em que você concluiu pelo menos uma atividade."
    },
    {
      q: "Meu progresso fica salvo?",
      a: "Sim. Questões, consultas, plantões e cálculos são salvos sozinhos a cada resposta ou fala e aparecem nos históricos como \"em andamento\" até você terminar. O histórico fica salvo neste aparelho, na sua conta."
    },
    {
      q: "Como falo por voz?",
      a: "Toque no microfone para começar a falar e toque de novo para enviar (no computador, também vale a tecla Espaço). Se o navegador bloquear o microfone, libere no cadeado ao lado do endereço ou escreva a resposta."
    },
    {
      q: "O sistema protege dados sensíveis que eu digitar sem querer?",
      a: "Sim. O app tem uma proteção que procura padrões de dados que identificam pessoas, como CPF, CNS, RG e nomes completos, e mascara a informação antes de qualquer processamento."
    },
    {
      q: "Não achei a resposta. E agora?",
      a: "Toque em \"Quem somos?\" aqui em cima e use o botão \"Fale conosco\"."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0E1722] flex flex-col text-slate-100 transition-colors">
      <header className="sticky top-0 z-20 border-b border-[#1F3045] bg-slate-900/95 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-xl text-[#9FB3C6] hover:text-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base font-bold text-slate-100 leading-tight">
                Central de Ajuda, FAQ & Governança LGPD
              </h1>
              <p className="text-xs text-[#9FB3C6]">
                Diretrizes Pedagógicas, Lei nº 13.709/2018 e Resolução COFEN nº 736/2024
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-teal-300 border border-slate-700">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" /> Ambiente Didático Seguro
          </span>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Navegação por Abas */}
        <div className="flex items-center gap-2 border-b border-[#1F3045] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("faq")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "faq"
                ? "bg-[#20D5B5] text-[#06302E]"
                : "text-[#9FB3C6] hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            Perguntas Frequentes (FAQ)
          </button>
          <button
            onClick={() => setActiveTab("quem")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "quem"
                ? "bg-[#20D5B5] text-[#06302E]"
                : "text-[#9FB3C6] hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            Quem somos?
          </button>
          <button
            onClick={() => setActiveTab("lgpd")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "lgpd"
                ? "bg-[#20D5B5] text-[#06302E]"
                : "text-[#9FB3C6] hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            Governança & LGPD em Saúde
          </button>
          <button
            onClick={() => setActiveTab("cofen")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "cofen"
                ? "bg-[#20D5B5] text-[#06302E]"
                : "text-[#9FB3C6] hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            Diretrizes COFEN 736/2024
          </button>
          <button
            onClick={() => setActiveTab("autoria")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === "autoria"
                ? "bg-[#20D5B5] text-[#06302E]"
                : "text-[#9FB3C6] hover:bg-slate-800 hover:text-slate-100"
            }`}
          >
            Autoria & Propriedade Intelectual
          </button>
        </div>

        {/* ABA 1: PERGUNTAS FREQUENTES (FAQ) */}
        {activeTab === "faq" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-[#131F2E] rounded-2xl p-6 border border-[#1F3045] shadow-sm space-y-1">
              <h2 className="text-base font-bold text-slate-100">
                Dúvidas Comuns sobre o Ambiente de Aprendizagem
              </h2>
              <p className="text-xs text-[#9FB3C6]">
                Orientações sobre simulação clínica, casos práticos e resolução de desafios.
              </p>
            </div>

            <div className="space-y-3">
              {faqItems.map((item, idx) => (
                <div key={idx} className="bg-[#131F2E] rounded-2xl border border-[#1F3045] p-5 shadow-sm space-y-2">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-teal-400 text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    {item.q}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed pl-7">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: QUEM SOMOS */}
        {activeTab === "quem" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-[#131F2E] rounded-2xl p-6 border border-[#1F3045] space-y-4">
              <h2 className="text-xl font-bold text-slate-100">Quem somos</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                O Enfere é uma plataforma de simulação clínica para estudantes de enfermagem, criada por <strong className="text-slate-100">Marcos Manoel Tavares Neumann</strong>.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                Se você achou um erro, tem uma ideia ou quer conversar sobre o projeto, fale com a gente.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <a
                  href={FALE_CONOSCO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-3d-teal inline-flex items-center justify-center gap-2 px-5 h-12 text-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Fale conosco</span>
                </a>
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-3d-outline inline-flex items-center justify-center gap-2 px-5 h-12 text-sm"
                >
                  <ExternalLink className="h-4 w-4 text-[#20D5B5]" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: GOVERNANÇA & LGPD */}
        {activeTab === "lgpd" && (
          <div className="space-y-5 animate-in fade-in">
            <div className="rounded-2xl border border-[#1F3045] bg-[#131F2E] p-6 shadow-sm space-y-2">
              <span className="text-xs font-bold text-teal-400 block">
                Privacidade & Proteção de Dados
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Compromisso com a Segurança e Dados Sintéticos (Lei nº 13.709/2018)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                O Enfere foi concebido sob a premissa de <em>Privacy by Design</em>. Por operar como um laboratório de simulação didática, todos os dados clínicos são exclusivamente sintéticos, garantindo que nenhum prontuário de paciente real seja trafegado ou persistido.
              </p>
            </div>

            <div className="space-y-4">
              <section className="bg-[#131F2E] rounded-2xl p-6 border border-[#1F3045] shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
                  <FileText className="h-4 w-4 text-teal-400" />
                  <h3>1. Natureza do Ambiente e Dados Sintéticos (Art. 12 da LGPD)</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Conforme o Artigo 12 da Lei nº 13.709/2018, dados anonimizados e dados sintéticos criados para fins de aprendizagem não são considerados dados pessoais, estando fora do escopo de identificabilidade de pessoa natural.
                </p>
              </section>

              <section className="bg-[#131F2E] rounded-2xl p-6 border border-[#1F3045] shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
                  <ShieldCheck className="h-4 w-4 text-teal-400" />
                  <h3>2. Sistema Ativo de DLP (Data Loss Prevention)</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Implementamos inspeção algorítmica no navegador do usuário para evitar vazamento inadvertido de CPFs, números de prontuários, CNS ou leitos de campos de estágio prático. Caso detectado, o dado é mascarado imediatamente antes do envio.
                </p>
              </section>

              <section className="bg-[#131F2E] rounded-2xl p-6 border border-[#1F3045] shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
                  <Building2 className="h-4 w-4 text-teal-400" />
                  <h3>3. Incubação & Parcerias Institucionais (NIT Starts-HCPA)</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O projeto está estruturado com conformidade jurídica para integração e incubação em ecossistemas de inovação em saúde, garantindo aderência às normas éticas do Conselho Federal de Enfermagem (COFEN nº 564/2017) e do Hospital de Clínicas de Porto Alegre.
                </p>
              </section>

              <section className="bg-[#131F2E] rounded-2xl p-6 border border-[#1F3045] shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
                  <ShieldCheck className="h-4 w-4 text-teal-400" />
                  <h3>4. Serviços que processam o que você fala e escreve</h3>
                </div>
                <ul className="text-xs text-slate-300 leading-relaxed list-disc pl-4 space-y-1">
                  <li><strong>Supabase</strong>: conta, banco de dados e funções do servidor.</li>
                  <li><strong>Google (Gemini API)</strong>: respostas dos pacientes, do Goti e das avaliações, e a voz dos personagens. No plano gratuito, o Google pode usar o conteúdo enviado para melhorar os produtos dele. Por isso, não escreva nem fale dados reais de pacientes ou seus.</li>
                  <li><strong>AssemblyAI</strong>: transcrição da sua voz. O áudio vai direto para a transcrição e não fica guardado no Enfere; a transcrição é apagada na AssemblyAI logo depois de lida.</li>
                  <li><strong>OpenRouter</strong>: reserva da IA quando o Gemini está indisponível.</li>
                </ul>
              </section>
            </div>
          </div>
        )}

        {/* ABA 3: DIRETRIZES COFEN 736/2024 */}
        {activeTab === "cofen" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-[#131F2E] rounded-2xl p-6 border border-[#1F3045] shadow-sm space-y-2">
              <span className="text-xs font-bold text-teal-400 block">
                Regulamentação Profissional
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                As 5 Etapas do Processo de Enfermagem (Resolução COFEN nº 736/2024)
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                A Resolução COFEN nº 736/2024 atualizou a Sistematização da Assistência de Enfermagem (SAE) e o Processo de Enfermagem (PE), organizando o método científico em cinco etapas interdependentes e contínuas:
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-[#131F2E] p-5 rounded-2xl border border-[#1F3045] shadow-sm space-y-1">
                <span className="font-bold text-slate-100 block text-xs">1. Avaliação de Enfermagem</span>
                <p className="text-slate-300 leading-relaxed">
                  Coleta metódica, deliberada e contínua de dados subjetivos e objetivos (anamnese, exame físico e dados complementares).
                </p>
              </div>
              <div className="bg-[#131F2E] p-5 rounded-2xl border border-[#1F3045] shadow-sm space-y-1">
                <span className="font-bold text-slate-100 block text-xs">2. Diagnóstico de Enfermagem</span>
                <p className="text-slate-300 leading-relaxed">
                  Julgamento clínico sobre as respostas humanas e vulnerabilidades da pessoa, família ou comunidade.
                </p>
              </div>
              <div className="bg-[#131F2E] p-5 rounded-2xl border border-[#1F3045] shadow-sm space-y-1">
                <span className="font-bold text-slate-100 block text-xs">3. Planejamento de Enfermagem</span>
                <p className="text-slate-300 leading-relaxed">
                  Determinação das metas e resultados esperados mensuráveis a serem alcançados pela pessoa.
                </p>
              </div>
              <div className="bg-[#131F2E] p-5 rounded-2xl border border-[#1F3045] shadow-sm space-y-1">
                <span className="font-bold text-slate-100 block text-xs">4. Implementação de Enfermagem</span>
                <p className="text-slate-300 leading-relaxed">
                  Execução e realização das intervenções e cuidados prescritos pelo enfermeiro com rigor e aprazamento.
                </p>
              </div>
              <div className="bg-[#131F2E] p-5 rounded-2xl border border-[#1F3045] shadow-sm space-y-1 sm:col-span-2">
                <span className="font-bold text-slate-100 block text-xs">5. Evolução de Enfermagem</span>
                <p className="text-slate-300 leading-relaxed">
                  Avaliação contínua dos resultados obtidos, resposta terapêutica e adequação do plano de cuidados.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: AUTORIA & PROPRIEDADE INTELECTUAL */}
        {activeTab === "autoria" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-[#131F2E] rounded-2xl p-6 border border-[#1F3045] shadow-sm space-y-2">
              <span className="text-xs font-bold text-emerald-400 block">
                Titularidade e Direitos Exclusivos
              </span>
              <h2 className="text-xl font-bold text-slate-100">
                Criador e Detentor dos Direitos Autorais
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Declaração formal de autoria, concepção e titularidade de propriedade intelectual e patrimonial sobre o ecossistema <strong>Enfere</strong>.
              </p>
            </div>

            <div className="bg-[#131F2E] rounded-2xl p-6 border border-[#1F3045] shadow-sm space-y-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-emerald-200 text-sm">
                    Marcos Manoel Tavares Neumann
                  </h3>
                  <p className="text-xs text-[#3DD68C] mt-0.5">
                    Criador, idealizador, desenvolvedor e detentor exclusivo de todos os direitos autorais, patrimoniais e morais de autor da plataforma Enfere.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-100 text-xs">
                  Proteção Legal (Lei Federal nº 9.610/1998 e Lei nº 9.609/1998):
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
                  <li>
                    <strong>Código-Fonte e Arquitetura:</strong> Toda a base de código, estrutura de dados, interfaces e serviços são obras intelectuais protegidas de titularidade de Marcos Manoel Tavares Neumann.
                  </li>
                  <li>
                    <strong>Algoritmos de Simulação Clínica e SBAR:</strong> O sistema de inteligência formativa, debriefing (Goti IA) e reconhecimento fonético são propriedades intelectuais exclusivas.
                  </li>
                  <li>
                    <strong>Identidade e Design System:</strong> A identidade visual, organização de módulos, fluxos de simulação e montador de casos clínicos são de titularidade reservada.
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-[#1F3045] flex items-center justify-between text-xs text-[#9FB3C6]">
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
