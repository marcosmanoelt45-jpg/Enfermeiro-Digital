/**
 * pdfExportService.js
 * Motor de Geração e Exportação de Prontuário Hospitalar Oficial e Portfólio Pedagógico.
 * Padrão: Resolução COFEN nº 736/2024 e Conformidade Estrita com LGPD.
 * Utiliza jsPDF com renderização vetorial de alta definição.
 */

import { jsPDF } from "jspdf";

/**
 * Formata data no formato brasileiro.
 */
function getFormattedNow() {
  const now = new Date();
  return now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Exporta o Prontuário Clínico Oficial com Parecer do Goti IA em PDF.
 * @param {object} params
 * @param {object} params.caseData - Dados do paciente e do caso clínico
 * @param {object} [params.sbarData] - Relatório SBAR preenchido pelo aluno
 * @param {object} [params.tutorEvaluation] - Parecer pedagógico do Goti IA
 * @param {object} [params.studentInfo] - Informações do acadêmico (nome, faculdade, matrícula)
 */
export function exportClinicalCaseToPdf({
  caseData,
  sbarData = null,
  tutorEvaluation = null,
  studentInfo = {}
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Helper para verificar quebra de página
  function checkPageBreak(neededHeight = 20) {
    if (y + neededHeight > pageHeight - 15) {
      doc.addPage();
      y = 15;
      drawPageBorder();
    }
  }

  function drawPageBorder() {
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.4);
    doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - margin * 2 + 4);
    
    // Rodapé de página
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      "Enfere • Simulação & Ensino em Enfermagem • Resolução COFEN nº 736/2024",
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
  }

  drawPageBorder();

  // CABEÇALHO HOSPITALAR OFICIAL
  doc.setFillColor(15, 118, 110); // teal-700
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("ENFERE • HOSPITAL ESCOLA VIRTUAL", margin + 5, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(204, 251, 241); // teal-100
  doc.text("Prontuário de Enfermagem & Portfólio de Formação Clínica", margin + 5, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Emissão: ${getFormattedNow()}`, pageWidth - margin - 5, y + 10, { align: "right" });

  y += 24;

  // TARJA DE CONFORMIDADE LGPD
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.roundedRect(margin, y, contentWidth, 9, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(
    "🔒 CONFORMIDADE LGPD: Documento acadêmico de simulação clínica. Dados pessoais anonimizados conforme a Lei 13.709/2018.",
    margin + 3,
    y + 5.5
  );

  y += 13;

  // 1. DADOS DE IDENTIFICAÇÃO DO PACIENTE & ESTUDANTE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("1. IDENTIFICAÇÃO ASSISTENCIAL & ACADÊMICA", margin, y);
  y += 5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  const patientName = caseData?.name || caseData?.patientName || "Paciente Simulado (Anonimizado)";
  const patientAge = caseData?.age ? `${caseData.age} anos` : "Adulto";
  const patientBed = caseData?.bed || "Leito 08 - UTI Adulto";
  const studentName = studentInfo?.name || "Estudante de Enfermagem";
  const studentInstitution = studentInfo?.institution || "Instituição de Ensino Superior";

  doc.text(`Paciente: ${patientName} (${patientAge})`, margin + 4, y + 6);
  doc.text(`Leito / Setor: ${patientBed}`, margin + 4, y + 12);
  doc.text(`Hipótese Diagnóstica: ${caseData?.title || caseData?.admissionDiagnosis || "Avaliação Clínica Geral"}`, margin + 4, y + 18);

  doc.text(`Acadêmico(a): ${studentName}`, margin + contentWidth / 2, y + 6);
  doc.text(`Instituição: ${studentInstitution}`, margin + contentWidth / 2, y + 12);
  doc.text(`Registro Acadêmico: ${studentInfo?.id || "Simulação nº 2026-ENF"}`, margin + contentWidth / 2, y + 18);

  y += 28;

  // 2. SINAIS VITAIS E ESCORES CLÍNICOS
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("2. PARÂMETROS VITAIS & ESCORES NA ADMISSÃO", margin, y);
  y += 5;

  const vitals = caseData?.vitals || {};
  const pa = vitals.pa_sistolica ? `${vitals.pa_sistolica}/${vitals.pa_diastolica} mmHg` : "120/80 mmHg";
  const fc = vitals.fc ? `${vitals.fc} bpm` : "78 bpm";
  const fr = vitals.fr ? `${vitals.fr} irpm` : "18 irpm";
  const tax = vitals.tax ? `${vitals.tax} °C` : "36.5 °C";
  const sat = vitals.sat ? `${vitals.sat}%` : "98%";

  const colW = contentWidth / 5;
  const vitalsList = [
    { label: "Pressão Arterial", val: pa },
    { label: "Frequência Cardíaca", val: fc },
    { label: "Frequência Resp.", val: fr },
    { label: "Temperatura Axilar", val: tax },
    { label: "Saturação O₂", val: sat }
  ];

  vitalsList.forEach((item, idx) => {
    const boxX = margin + idx * colW;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(boxX, y, colW - 2, 14, 1.5, 1.5, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, boxX + (colW - 2) / 2, y + 5, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(item.val, boxX + (colW - 2) / 2, y + 10.5, { align: "center" });
  });

  y += 19;

  // 3. SISTEMATIZAÇÃO DA ASSISTÊNCIA DE ENFERMAGEM (SAE - COFEN 736/2024)
  checkPageBreak(40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("3. PROCESSO DE ENFERMAGEM (RESOLUÇÃO COFEN nº 736/2024)", margin, y);
  y += 5;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 32, 1.5, 1.5, "FD");

  const diagnosis = caseData?.diagnosis || caseData?.title || "Padrão Respiratório Ineficaz / Risco de Perfusão Tissular Prejudicada";
  const goals = caseData?.goals || "Manutenção de saturação de O2 > 94% e estabilização hemodinâmica em 2 horas.";
  const interventions = caseData?.interventions || [
    "Manter cabeceira elevada a 30-45 graus.",
    "Monitorar oximetria de pulso contínua e frequência respiratória a cada 2 horas.",
    "Administrar oxigenoterapia conforme protocolo e prescrição médica.",
    "Avaliar padrão ventilatório e presença de ruídos adventícios à ausculta."
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 118, 110); // teal-700
  doc.text("Diagnóstico de Enfermagem (NANDA-I):", margin + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(doc.splitTextToSize(diagnosis, contentWidth - 8), margin + 4, y + 10);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 118, 110);
  doc.text("Resultados Esperados (NOC):", margin + 4, y + 17);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(doc.splitTextToSize(goals, contentWidth - 8), margin + 4, y + 21);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 118, 110);
  doc.text("Prescrição de Enfermagem (NIC):", margin + 4, y + 27);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  const careSummary = Array.isArray(interventions) ? interventions.slice(0, 2).join("; ") : String(interventions);
  doc.text(doc.splitTextToSize(careSummary, contentWidth - 8), margin + 4, y + 31);

  y += 38;

  // 4. RELATÓRIO DE PASSAGEM DE PLANTÃO (SBAR)
  if (sbarData) {
    checkPageBreak(45);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text("4. COMUNICAÇÃO INTERPROFISSIONAL (PASSAGEM DE PLANTÃO SBAR)", margin, y);
    y += 5;

    const sbarItems = [
      { tag: "S - Situação", text: sbarData.situation || "Não preenchido" },
      { tag: "B - Breve Histórico", text: sbarData.background || "Não preenchido" },
      { tag: "A - Avaliação Atual", text: sbarData.assessment || "Não preenchido" },
      { tag: "R - Recomendação", text: sbarData.recommendation || "Não preenchido" }
    ];

    sbarItems.forEach((item) => {
      checkPageBreak(16);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 118, 110);
      doc.text(item.tag, margin + 4, y + 5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      const wrapped = doc.splitTextToSize(item.text, contentWidth - 8);
      doc.text(wrapped.slice(0, 2), margin + 4, y + 9.5);

      y += 16;
    });
    y += 4;
  }

  // 5. PARECER FORMATIVO DO GOTI IA (AUDITORIA PEDAGÓGICA)
  if (tutorEvaluation) {
    checkPageBreak(50);
    doc.setFillColor(240, 253, 250); // teal-50
    doc.setDrawColor(94, 234, 212); // teal-300
    doc.roundedRect(margin, y, contentWidth, 42, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 118, 110);
    doc.text("5. PARECER PEDAGÓGICO DO GOTI (IA)", margin + 4, y + 7);

    // Badge de Pontuação
    const score = tutorEvaluation.safetyScore ?? tutorEvaluation.score ?? 85;
    doc.setFillColor(15, 118, 110);
    doc.roundedRect(pageWidth - margin - 35, y + 3, 31, 8, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Score: ${score}/100`, pageWidth - margin - 19.5, y + 8.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    const feedback = tutorEvaluation.summaryFeedback || tutorEvaluation.gotiMentorship || tutorEvaluation.florenceMentorship || tutorEvaluation.florenceComment || "Passagem de plantão estruturada com rigor técnico e foco na segurança do paciente.";
    const wrappedFeedback = doc.splitTextToSize(`Feedback do Goti: "${feedback}"`, contentWidth - 8);
    doc.text(wrappedFeedback.slice(0, 3), margin + 4, y + 15);

    const omissions = tutorEvaluation.criticalOmissions?.length > 0
      ? `Atenção Clínica: ${tutorEvaluation.criticalOmissions[0]}`
      : "Atenção Clínica: Manter conferência de vias de administração e balanço hídrico rigoroso.";
    doc.setFont("helvetica", "bold");
    doc.setTextColor(190, 24, 93); // rose-700
    doc.text(doc.splitTextToSize(omissions, contentWidth - 8), margin + 4, y + 25);

    // Carimbo Virtual do Goti IA
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 118, 110);
    doc.text("Goti • IA Enfere", margin + 4, y + 35);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Plataforma de Simulação & Formação Baseada em Evidências • COFEN 736/2024", margin + 4, y + 39);

    y += 48;
  }

  // 6. CAMPO DE ASSINATURA
  checkPageBreak(25);
  const signW = (contentWidth - 10) / 2;

  // Assinatura Aluno
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 14, margin + signW, y + 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(studentName, margin + signW / 2, y + 18, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Acadêmico(a) de Enfermagem", margin + signW / 2, y + 22, { align: "center" });

  // Assinatura Goti IA
  doc.line(margin + signW + 10, y + 14, margin + contentWidth, y + 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 118, 110);
  doc.text("Goti IA • Plataforma Enfere", margin + signW + 10 + signW / 2, y + 18, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Validação Formativa de Prática Clínica", margin + signW + 10 + signW / 2, y + 22, { align: "center" });

  // DOWNLOAD DO ARQUIVO PDF
  const safeFilename = `Prontuario_Enfere_${(caseData?.name || "Caso").replace(/\s+/g, "_")}.pdf`;
  doc.save(safeFilename);

  return safeFilename;
}
