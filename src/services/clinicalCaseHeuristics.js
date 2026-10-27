/**
 * clinicalCaseHeuristics.js
 * Motor Clínico Heurístico & Contextual para Casos Montados pelo Estudante.
 * Em conformidade com o Processo de Enfermagem (COFEN nº 736/2024) e Lei 7.498/86.
 *
 * Gera baterias de 4 desafios com alta profundidade clínica, personalizadas
 * com base na patologia, anamnese, sinais vitais, medicações informadas e escores.
 */

import { normalizeAndShuffleOptions } from "./diagnosticChallengeService.js";
import { getClinicalQuestionPair } from "./clinicalQuestionVariants.js";

/**
 * Classifica o caso em uma especialidade clínica predominante
 * através de análise semântica abrangente dos dados inseridos pelo estudante.
 */
export function detectClinicalCategory(profile, assessmentData) {
  const combined = `
    ${profile?.previous_diseases || ""} 
    ${profile?.previous_anamnesis || ""} 
    ${profile?.medical_history || ""} 
    ${profile?.notes || ""} 
    ${profile?.current_medications || ""}
    ${profile?.condition || ""}
    ${assessmentData?.notes || ""}
  `.toLowerCase();

  if (/gesta|gravid|parto|eclamp|puerp|feto|cesar|uter|uterin|hellp|proteinúri/i.test(combined)) {
    return "obstetricia";
  }
  if (/avc|acidente vascular|ave|derrame|isquemi|glasgow|convuls|epilep|neurol|afasia|paresia|hemipleg|delirium|confus|agit|alzheimer|sensório|trombol/i.test(combined)) {
    return "neurologia";
  }
  if (/trauma|fratur|queimadur|hemorr|choque hipovol|tce|politrauma|acidente|fêmur|atls|phtls|torniquet/i.test(combined)) {
    return "trauma";
  }
  if (/apendic|colecist|pancreat|abdome|cirurg|laparo|obstru|periton|blumberg|eviscera|amilase|lipase|biliar/i.test(combined)) {
    return "cirurgico_abdome";
  }
  if (/seps|sépt|choque sépt|infecç|febre|bacter|sirs|leucocit|lactat|bacterem|uroseps/i.test(combined)) {
    return "sepse";
  }
  if (/cad|cetoacid|diabet|glicem|insulin|hipoglicem|hiperglicem|ceton|kussmaul|hgt/i.test(combined)) {
    return "metabolico_endocrino";
  }
  if (/renal|ira|irc|anúri|oligúri|creatinin|hemodiál|diális|fístula|potássio|rabdo|uremi/i.test(combined)) {
    return "nefrologia";
  }
  if (/asma|dpoc|pneumon|dispne|respirat|enfisem|hipox|sat|oxigên|tosse|estertor|sibilo|tep|embolia|broncoespas|estridor|anafilax/i.test(combined) ||
      (assessmentData?.sat && Number(assessmentData.sat) < 92) || (assessmentData?.fr && Number(assessmentData.fr) > 24)) {
    return "respiratorio";
  }
  if (/iam|infart|coronar|sca|dor torác|precord|hipertens|cardiopat|icc|arritmi|taquicard|troponin|stent|angioplast|edema agudo de pulm|congest/i.test(combined) ||
      (assessmentData?.pa_sistolica && Number(assessmentData.pa_sistolica) >= 160) || (assessmentData?.fc && Number(assessmentData.fc) > 115)) {
    return "cardiovascular";
  }

  return "clinica_geral";
}

/**
 * Gera as 4 questões de alta complexidade adaptadas estritamente aos dados do caso.
 * Suporta o parâmetro attemptIndex para garantir rotação e variabilidade dinâmica
 * a cada clique em "Nova Bateria de Questões".
 */
export function generateContextualHeuristicBattery(patientInitials, profile, assessmentData, scores, attemptIndex = 0) {
  const { bradenTotal, camPositive, caloiTotal, sakTotal } = scores;
  const category = detectClinicalCategory(profile, assessmentData);
  const paSis = assessmentData.pa_sistolica || assessmentData?.vitals?.bloodPressure?.split("/")?.[0] || "120";
  const paDia = assessmentData.pa_diastolica || assessmentData?.vitals?.bloodPressure?.split("/")?.[1] || "80";
  const fc = assessmentData.fc || assessmentData?.vitals?.heartRate || "80";
  const fr = assessmentData.fr || assessmentData?.vitals?.respiratoryRate || "18";
  const tax = assessmentData.tax || assessmentData?.vitals?.temperature || "36.5";
  const sat = assessmentData.sat || assessmentData?.vitals?.oxygenSaturation || "97";

  const userMeds = (Array.isArray(profile.medications) ? profile.medications.join(", ") : (profile.current_medications || "")).trim();
  const userDiagnosis = (profile.condition || profile.previous_diseases || profile.previous_anamnesis || profile.medical_history || "Quadro clínico agudo").trim();
  const cycle = Number(attemptIndex) || 0;

  const vitalsText = `PA ${paSis}/${paDia} mmHg, FC ${fc} bpm, FR ${fr} irpm, Tax ${tax}°C, SatO₂ ${sat}%`;

  let q1Raw, q2Raw, q3Raw, q4Raw;

  // -------------------------------------------------------------
  // EIXOS 1 e 2: PRIORIZAÇÃO (5 MIN) & FISIOPATOLOGIA CRÍTICA
  // Variantes dinâmicas selecionadas por especialidade + hash clínico + ciclo
  // -------------------------------------------------------------
  const profileHash = (patientInitials + userDiagnosis).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variantIndex = cycle + profileHash;
  const pair = getClinicalQuestionPair(
    category,
    patientInitials,
    userDiagnosis,
    vitalsText,
    { paSis, paDia, fc, fr, tax, sat },
    variantIndex
  );
  q1Raw = pair.q1;
  q2Raw = pair.q2;

  // EIXO 3: FARMACOLOGIA CLÍNICA, ELETRÓLITOS & IATROGENIA
  // Adaptado aos medicamentos informados pelo estudante no caso!
  // -------------------------------------------------------------
  const medsLower = userMeds.toLowerCase();

  if (/insulina|glicem|nph|regular|lantus|metformin/i.test(medsLower) || category === "metabolico_endocrino") {
    q3Raw = {
      id: 3,
      category: "Farmacologia Clínica, Eletrólitos & Iatrogenia",
      questionStem: `O Paciente ${patientInitials} tem prescrição de terapia insulínica (${userMeds || "Insulina Regular / NPH"}). Durante a ronda de enfermagem, o paciente apresenta sudorese fria, tremores e confusão mental com glicemia capilar de 46 mg/dL. Qual é a conduta farmacológica prioritária do enfermeiro?`,
      attendingTip: "A neuroglicopenia aguda causa lesão cerebral isquêmica e convulsão; a correção imediata com carboidrato de ação rápida ou glicose IV precede qualquer outra intervenção.",
      options: [
        {
          title: "Administrar glicose hipertônica a 50% intravenosa imediatamente se paciente com rebaixamento do sensório (ou carboidrato oral rápido se consciente) e suspender a dose de insulina do horário.",
          isCorrect: true,
          whyCorrect: "Correto! A hipoglicemia severa (< 54 mg/dL) com sinais neuroglicopênicos exige reposição rápida de glicose IV para restaurar o aporte cerebral imediato e reavaliação da glicemia em 15 minutos.",
          whyDistractor: null
        },
        {
          title: "Infundir solução glicosada a 5% em velocidade lenta de 20 mL/h e manter a administração da insulina prescrita para evitar efeito rebote hiperglicêmico tardio.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Iatrogenia Crítica: SG 5% lenta não corrige a neuroglicopenia emergencial, e manter a insulina agrava a hipoglicemia, levando a coma hipoglicêmico e parada cardíaca."
        },
        {
          title: "Oferecer refeição com alimentos ricos em lipídios e fibras para retardar a absorção intestinal e assegurar estabilidade glicêmica contínua pelas próximas horas.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Conhecimento Incorreto: Alimentos gordurosos retardam o esvaziamento gástrico e atrasam a absorção da glicose; na crise aguda a glicose deve ser de ação imediata."
        },
        {
          title: "Aguardar a coleta de glicemia sérica laboratorial venosa antes de intervir terapeuticamente para evitar divergência de calibração do glicosímetro portátil.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Atraso Assistencial Perigoso: A hipoglicemia sintomática exige intervenção emergencial imediata à beira-leito guiada pela glicemia capilar rápida."
        }
      ]
    };
  } else if (/heparina|enoxaparina|clexane|varfarina|xarelto|eliquis|anticoagulante/i.test(medsLower)) {
    q3Raw = {
      id: 3,
      category: "Farmacologia Clínica, Eletrólitos & Iatrogenia",
      questionStem: `O Paciente ${patientInitials} está em uso de anticoagulante prescrito (${userMeds || "Enoxaparina / Heparina"}). Durante a passagem de plantão, você observa hematúria macroscópica na bolsa coletora e petéquias em tronco. Qual conduta de farmacovigilância e segurança deve ser tomada de imediato?`,
      attendingTip: "Sinais de sangramento ativo em uso de anticoagulantes exigem interrupção precoce da droga, avaliação de coagulograma/plaquetas e preparo de antídotos (ex: Protamina).",
      options: [
        {
          title: "Pausar a administração do anticoagulante, comunicar imediatamente a equipe médica, solicitar hemograma com plaquetas e coagulograma urgente e manter o antídoto protamina disponível.",
          isCorrect: true,
          whyCorrect: "Correto! A hematúria e petéquias sinalizam sangramento ativo ou trombocitopenia induzida por heparina (HIT). A interrupção da droga e a checagem laboratorial impedem hemorragias com risco de morte.",
          whyDistractor: null
        },
        {
          title: "Administrar dose de ácido acetilsalicílico por via oral para prevenir oclusão intraluminal do cateter vesical por fibrina e manter a anticoagulação prescrita.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Iatrogenia Hemorrágica Grave: Associar antiagregante plaquetário a paciente com sangramento ativo por anticoagulante deflagra hemorragia maciça incontrolável."
        },
        {
          title: "Administrar anti-inflamatório não esteroidal (AINE) intravenoso para analgesia vesical e aumentar o calibre do cateter urinário sem suspender o anticoagulante.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Iatrogenia Farmacológica: AINEs inibem a hemostasia primária e causam erosão de mucosa, potencializando exponencialmente o risco de choque hemorrágico."
        },
        {
          title: "Realizar massagem vigorosa no sítio da injeção subcutânea para acelerar a drenagem capilar do fármaco residual e manter a aplicação nos horários previstos.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Prática Iatrogênica: Friccionar o sítio de injeção subcutânea de heparina lesiona capilares, formando hematomas musculares extensos e necrose tecidual."
        }
      ]
    };
  } else if (/morfina|fentanil|tramadol|opioide|dipidolor|metadona/i.test(medsLower)) {
    q3Raw = {
      id: 3,
      category: "Farmacologia Clínica, Eletrólitos & Iatrogenia",
      questionStem: `O Paciente ${patientInitials} tem prescrição de opioide para manejo de dor (${userMeds || "Morfina / Tramadol"}). Na reavaliação, o enfermeiro constata FR de 8 irpm, miose puntiforme e sonolência profunda sem resposta verbal. Qual é a conduta farmacológica prioritária?`,
      attendingTip: "A tríade de intoxicação por opioides (depressão respiratória, miose e coma) é uma emergência reversível com o antagonista competitivo Naloxona.",
      options: [
        {
          title: "Interromper a infusão do opioide, prestar suporte ventilatório com oxigênio sob máscara e preparar a administração de Naloxona titulada conforme protocolo institucional de reversão.",
          isCorrect: true,
          whyCorrect: "Correto! A depressão respiratória (FR < 10) é o principal risco fatal da terapia com opioides. O Naloxona é o antagonista específico e deve ser titulado para restabelecer o drive respiratório.",
          whyDistractor: null
        },
        {
          title: "Administrar infusão contínua de sedativo benzodiazepínico para reduzir o estresse respiratório e aguardar o despertar espontâneo do paciente nas horas seguintes.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "ERRO CRÍTICO FATAL: A associação de opioides e benzodiazepínicos produz colapso sinérgico do centro respiratório bulbar, culminando em apneia e assistolia."
        },
        {
          title: "Infundir solução salina fisiológica a 0,9% aquecida em alta velocidade (1.000 mL em 15 minutos) como medida de depuração renal primária do opioide sérico.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Conduta Equivocada: Sobrecarga volêmica rápida não reverte receptores mu-opioides centrais e pode precipitar edema agudo de pulmão em paciente hipoventilando."
        },
        {
          title: "Instalar máscara de nebulização com broncodilatador beta-2 agonista e aguardar sessenta minutos pela normalização do padrão respiratório antes de notificar o médico.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Atraso Fatal: A depressão respiratória central por opioide não responde a broncodilatadores periféricos e exige antagonismo específico imediato com Naloxona."
        }
      ]
    };
  } else if (/furosemida|enalapril|losartana|hidroclorotiazida|espironolactona/i.test(medsLower) || category === "cardiovascular") {
    q3Raw = {
      id: 3,
      category: "Farmacologia Clínica, Eletrólitos & Iatrogenia",
      questionStem: `O Paciente ${patientInitials} está em uso de diurético e vasodilatador (${userMeds || "Furosemida e IECA/BRA"}). O laboratório informa Potássio sérico (K⁺) de 3,0 mEq/L (VR: 3,5 a 5,0) e PA ${paSis}/${paDia} mmHg. Qual intervenção de enfermagem e risco eletrolítico crítico devem ser priorizados?`,
      attendingTip: "A hipocalemia severa predispõe a arritmias ventriculares fatais e potencializa toxicidade miocárdica; reposição de potássio IV NUNCA pode ser feita em bolus.",
      options: [
        {
          title: "Identificar o risco iminente de arritmias ventriculares por hipocalemia, suspender temporariamente o diurético espoliador, notificar a equipe médica e monitorar o traçado eletrocardiográfico continuamente.",
          isCorrect: true,
          whyCorrect: "Correto! Níveis baixos de potássio diminuem o limiar de excitabilidade ventricular gerando extrassístoles e fibrilação ventricular. A reposição orientada e a pausa no diurético de alça são fundamentais.",
          whyDistractor: null
        },
        {
          title: "Infundir cloreto de potássio concentrado a 19,1% em bolus direto na veia periférica para rápida correção do déficit eletrolítico antes do próximo turno.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "ERRO CRÍTICO FATAL: Potássio concentrado IV em bolus causa parada cardíaca fulminante em assistolia imediata. Deve ser SEMPRE diluído e infundido lentamente em bomba."
        },
        {
          title: "Administrar dose dobrada do diurético para estimular filtração glomerular e eliminar o excesso de solutos acumulados na circulação do paciente.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Iatrogenia Severa: Administrar furosemida em paciente hipocalêmico acentua a espoliação de potássio na urina, agravando a alcalose metabólica e o risco arritmogênico."
        },
        {
          title: "Interromper abruptamente todos os vasodilatadores venosos e administrar gluconato de cálcio a 10% intravenoso sem monitorização eletrocardiográfica prévia.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Erro Farmacológico: O gluconato de cálcio é estabilizador de membrana na HIPERcalemia (K+ alto), não estando indicado na hipocalemia, e a suspensão súbita de vasodilatadores causa rebote hipertensivo."
        }
      ]
    };
  } else if (/antibiotico|ceftriaxona|vancomicina|meropenem|piperacilina|ciprofloxacino/i.test(medsLower) || category === "sepse") {
    q3Raw = {
      id: 3,
      category: "Farmacologia Clínica, Eletrólitos & Iatrogenia",
      questionStem: `O Paciente ${patientInitials} tem prescrição de antibioticoterapia intravenosa de amplo espectro (${userMeds || "Antimicrobiano IV"}). Quais cuidados de enfermagem no preparo, tempo de infusão e vigilância de reações adversas são essenciais para evitar toxicidade e resistência bacteriana?`,
      attendingTip: "Infusões rápidas de glicopeptídeos/cefalosporinas causam flebite, hipotensão e reações anafilactoides (ex: Síndrome do Homem Vermelho); o aprazamento estrito mantém o nível sérico terapêutico.",
      options: [
        {
          title: "Respeitar rigorosamente o aprazamento de horário para garantir concentração inibitória mínima, diluir conforme padronização e infundir lentamente inspecionando o sítio vascular para flebite.",
          isCorrect: true,
          whyCorrect: "Correto! A eficácia antimicrobiana depende do tempo acima da MIC (tempo-dependentes). A infusão na velocidade correta previne reações histaminérgicas graves e lesão endotelial venosa.",
          whyDistractor: null
        },
        {
          title: "Concentrar a dose diária total em volume reduzido de 50 mL e infundir em alta velocidade (10 minutos) para assegurar pico plasmático precoce no tecido infectado.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Iatrogenia Grave: A infusão ultrarrápida de antimicrobianos (ex: vancomicina) deflagra liberação histamínica maciça, hipotensão severa e flebite química irreversível."
        },
        {
          title: "Misturar o antibiótico no mesmo frasco de nutrição parenteral total ou soluções ricas em cálcio para facilitar a administração concomitante pelo cateter.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Incompatibilidade Farmacotécnica: Misturar antibióticos com NPT ou ceftriaxona com soluções contendo cálcio causa precipitação microcristalina com embolia pulmonar e obstrução do cateter."
        },
        {
          title: "Suspender temporariamente a antibioticoterapia a cada pico febril isolado sem prescrição médica por presumir falência imediata da droga administrada.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Conduta Equivocada: A lise bacteriana inicial pode liberar endotoxinas e manter picos febris nas primeiras 48h; suspender precocemente gera seleção de cepas resistentes."
        }
      ]
    };
  } else {
    // Farmacologia Geral: Droga prescrita ou de suporte clínico
    // CORREÇÃO CRÍTICA: Interpolação correta com crase e distratores de padrão concurso/residência!
    q3Raw = {
      id: 3,
      category: "Farmacologia Clínica, Eletrólitos & Iatrogenia",
      questionStem: `Considerando o plano terapêutico do Paciente ${patientInitials} (${userMeds ? `com medicações: ${userMeds}` : `no manejo de ${userDiagnosis}`}), qual princípio de farmacovigilância e administração segura de medicamentos da enfermagem é mandatório?`,
      attendingTip: "A aplicação dos 9 Certos da medicação e a checagem dupla em medicamentos de alta vigilância previnem eventos adversos iatrogênicos.",
      options: [
        {
          title: `Conferir rigorosamente os 'Nove Certos' da medicação, verificar histórico de alergias referidas (${profile.allergies || "nega alergias conhecidas"}), monitorar interações farmacológicas e registrar reações adversas imediatamente.`,
          isCorrect: true,
          whyCorrect: "Correto! A checagem multiprofissional dos certos da administração medicamentosa associada à farmacovigilância ativa é barreira de segurança essencial para prevenir danos iatrogênicos ao paciente.",
          whyDistractor: null
        },
        {
          title: "Administrar a medicação prescrita imediatamente no início do turno e postergar o registro da checagem no prontuário para o final do plantão a fim de agilizar o fluxo assistencial.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Falha de Rastreabilidade e Segurança: Checar medicações tardiamente é fator de risco primário para duplicidade de administração por outros profissionais e erros graves de aprazamento."
        },
        {
          title: "Realizar a checagem dupla privativa apenas em medicamentos administrados por via subcutânea, dispensando-a em eletrólitos concentrados, heparinas e sedativos intravenosos.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Inversão de Segurança: Eletrólitos concentrados e heparinas são medicamentos de alta vigilância (High-Alert Medications) e exigem checagem dupla obrigatória por dois profissionais."
        },
        {
          title: "Antecipar a infusão de antimicrobianos tempo-dependentes em mais de 3 horas para compensar atrasos acumulados de horários de turnos anteriores.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Erro de Farmacocinética: Alterar bruscamente o intervalo de drogas tempo-dependentes reduz o tempo em que a concentração sérica excede a MIC, gerando falha terapêutica e toxicidade."
        }
      ]
    };
  }

  // -------------------------------------------------------------
  // EIXO 4: SEGURANÇA DO PACIENTE & LEGISLAÇÃO ÉTICA (COFEN 736/2024)
  // Distratores refinados: sem clichês óbvios, baseados em dilemas reais de estomaterapia e normas COFEN!
  // -------------------------------------------------------------
  if (bradenTotal <= 14) {
    if (cycle % 2 === 1) {
      // Variante B: Foco em Estadiamento Tecidual, Coberturas e Prescrição do Enfermeiro
      q4Raw = {
        id: 4,
        category: "Segurança do Paciente & Legislação Ética (COFEN)",
        questionStem: `Durante o curativo no Paciente ${patientInitials} (Braden ${bradenTotal} pts), nota-se área sacral com perda parcial da espessura dérmica, leito avermelhado sem esfacelo e flictena intacta. Conforme o COFEN nº 736/2024, qual é a conduta diagnóstica e terapêutica privativa do enfermeiro?`,
        attendingTip: "O estadiamento de Lesão por Pressão (neste caso, Estágio 2) e a indicação de coberturas bioativas são competências privativas inalienáveis do enfermeiro.",
        options: [
          {
            title: "Diagnosticar Lesão por Pressão Estágio 2, prescrever limpeza com SF 0,9% em jatos mornos, cobertura com hidrocoloide ou espuma de poliuretano e registrar evolução diária.",
            isCorrect: true,
            whyCorrect: "Correto! O diagnóstico diferencial do estadiamento de LPP e a prescrição da cobertura ideal (hidrocoloide para exsudato leve ou espuma) são atos privativos do enfermeiro segundo o COFEN.",
            whyDistractor: null
          },
          {
            title: "Romper propositalmente a flictena íntegra com agulha para drenar o líquido seroso e aplicar solução alcoólica secativa diretamente no leito desnudado da lesão.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Prática Iatrogênica: A flictena fechada atua como barreira biológica estéril natural contra infecções; rompê-la e aplicar álcool causa dor intensa e contaminação bacteriana profunda."
          },
          {
            title: "Prescrever a aplicação de pomada com antibiótico tópico e cobrir com gaze seca simples sem necessidade de avaliar a quantidade de exsudato ou profundidade da lesão.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Conduta Inadequada: O uso indiscriminado de antibióticos tópicos induz resistência bacteriana local, e gaze seca adere ao leito da ferida arrancando tecido de granulação na troca."
          },
          {
            title: "Solicitar que o técnico de enfermagem defina livremente a cobertura diária conforme a disponibilidade no carrinho de curativos sem necessidade de prescrição formal.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Delegação Ilegal: O planejamento do tratamento de feridas e a prescrição de coberturas terapêuticas são privativos do enfermeiro conforme a Lei 7.498/86 e Resolução COFEN nº 736/2024."
          }
        ]
      };
    } else {
      // Foco em Lesão por Pressão (LPP) - Prevenção Primária e Decúbito
      q4Raw = {
        id: 4,
        category: "Segurança do Paciente & Legislação Ética (COFEN)",
        questionStem: `O Paciente ${patientInitials} apresenta escore de Braden de ${bradenTotal} pontos (alto risco para Lesão por Pressão) e mobilidade reduzida no leito. Conforme a Resolução COFEN nº 736/2024 e as boas práticas de estomaterapia, qual conduta assistencial é privativa do enfermeiro?`,
        attendingTip: "A avaliação de risco, estadiamento tecidual e prescrição de coberturas curativas tecnológicas são atos privativos do enfermeiro.",
        options: [
          {
            title: "Prescrever protocolo de mudança de decúbito a cada duas horas em ângulo de 30 graus, aplicação de colchão pneumático dinâmico e hidratação cutânea com ácidos graxos essenciais.",
            isCorrect: true,
            whyCorrect: "Correto! Conforme o COFEN nº 736/2024, a prescrição de cuidados preventivos de enfermagem para LPP e o estadiamento tecidual são atos privativos do enfermeiro, fundamentais para a segurança do paciente.",
            whyDistractor: null
          },
          {
            title: "Realizar fricção e massagem circular vigorosa com álcool a 70% sobre proeminências ósseas hiperemiadas para reativar o fluxo capilar isquêmico e endurecer a pele.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Iatrogenia Tecidual Clássica: A massagem em áreas de hiperemia não reativa rompe a microcirculação isquêmica fragilizada e acelera a necrose profunda, precipitando LPP estágio 3 ou 4."
          },
          {
            title: "Posicionar o paciente rotineiramente em decúbito lateral estrito a 90 graus com calços rígidos para garantir a descompressão sacral completa durante todo o repouso.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Erro Biomecânico: O decúbito lateral a 90° concentra toda a pressão hidrostática sobre o trocanter maior do fêmur, provocando necrose tecidual rápida. A recomendação internacional é o decúbito a 30°."
          },
          {
            title: "Instalar almofada em formato de anel ou roda d'água sob a região sacrococcígea para suspender a pressão de contato com a superfície da cama hospitalar.",
            isCorrect: false,
            whyCorrect: null,
            whyDistractor: "Dispositivo Contraindicado: Dispositivos tipo anel produzem uma área circular de constrição que obstrui o retorno venoso e capilar periférico, aumentando o edema e a isquemia central."
          }
        ]
      };
    }
  } else if (camPositive) {
    // Foco em Delirium e Contenção Mecânica
    q4Raw = {
      id: 4,
      category: "Segurança do Paciente & Legislação Ética (COFEN)",
      questionStem: `O Paciente ${patientInitials} apresentou CAM Positivo (Delirium agudo) com agitação psicomotora e tentativa de retirada de dispositivos invasivos. Conforme a Resolução COFEN nº 736/2024 e diretrizes de contenção mecânica, qual é a decisão técnica e ética do enfermeiro?`,
      attendingTip: "A contenção mecânica é medida de última instância excepcional, exigindo prescrição privativa do enfermeiro, checagem contínua de perfusão e priorização de medidas ambientais.",
      options: [
        {
          title: "Priorizar manejo não farmacológico de reorientação espaço-temporal com presença familiar e, se imprescindível para segurança, aplicar contenção padronizada mediante prescrição privativa com checagem de pulsos.",
          isCorrect: true,
          whyCorrect: "Correto! O COFEN regulamenta que a contenção física é ato excepcional de emergência sob responsabilidade privativa do enfermeiro. Ataduras improvisadas causam garroteamento e lesão neurológica periférica.",
          whyDistractor: null
        },
        {
          title: "Administrar benzodiazepínico de meia-vida longa por via intravenosa imediatamente para induzir sedação ansiolítica contínua e cessar os episódios de agitação psicomotora.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Contraindicação Farmacológica: Benzodiazepínicos no delirium agudo senil prolongam o estado confusional, suprimem o drive respiratório e elevam a mortalidade hospitalar."
        },
        {
          title: "Manter o quarto em isolamento luminoso completo com persianas e portas fechadas ininterruptamente para eliminar quaisquer estímulos sensoriais externos durante a internação.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Agravamento da Desorientação: A privação luminosa e de pistas temporais impede a sincronização circadiana do cérebro, acentuando a agitação noturna (Sundowning)."
        },
        {
          title: "Realizar contenção mecânica profilática precoce dos quatro membros no início do plantão antes de interações com o paciente para assegurar os dispositivos invasivos.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Violação Ética e Legal: A contenção mecânica jamais pode ser profilática ou punitiva. Exige falha prévia de medidas não restritivas e avaliação contínua de circulação distal."
        }
      ]
    };
  } else if (sakTotal >= 5) {
    // Foco em Quedas (SAK elevado)
    q4Raw = {
      id: 4,
      category: "Segurança do Paciente & Legislação Ética (COFEN)",
      questionStem: `O Paciente ${patientInitials} possui escore de risco de quedas (SAK) de ${sakTotal} pontos (alto risco de queda). Durante a assistência noturna, quais intervenções de enfermagem sistematizadas devem constar obrigatoriamente na Prescrição de Enfermagem (COFEN nº 736/2024)?`,
      attendingTip: "A prevenção de quedas integra as 6 Metas Internacionais de Segurança do Paciente e exige medidas ambientais, sinalização visual e vigilância.",
      options: [
        {
          title: "Identificar o paciente com pulseira de risco de quedas, manter cama em posição baixa com freios travados e grades elevadas, manter campainha acessível e auxiliar toda mobilização.",
          isCorrect: true,
          whyCorrect: "Correto! O protocolo de prevenção de quedas multiprofissional reduz fraturas e hematomas subdurais em pacientes internados, sendo prescrição privativa do enfermeiro alinhada às metas de segurança.",
          whyDistractor: null
        },
        {
          title: "Manter o paciente em contenção mecânica leito-poltrona contínua durante o turno para assegurar a impossibilidade física de qualquer tentativa de deambulação.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Iatrogenia de Imobilidade: A imobilização física prolongada em poltrona gera hipotensão ortostática, atrofia muscular e agitação paradoxal, elevando o risco futuro de quedas graves."
        },
        {
          title: "Elevar todas as quatro grades laterais e manter o leito na altura máxima de transporte para facilitar a visualização do paciente a partir do posto assistencial.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Aumento da Gravidade do Trauma: Caso o paciente confuso tente transpor grades totais em um leito na altura máxima, a queda ocorre de grande altura com impacto cefálico potencialmente fatal."
        },
        {
          title: "Orientar o paciente a utilizar suportes de soro com rodízios como apoio de marcha para manter a independência funcional durante deslocamentos noturnos ao banheiro.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Aumento Crítico de Risco: Suportes de soro móveis não possuem estabilidade mecânica nem freios para marcha, atuando como alavanca de desequilíbrio e provocando quedas com fratura."
        }
      ]
    };
  } else {
    // Segurança do Paciente / Legislação Geral COFEN
    q4Raw = {
      id: 4,
      category: "Segurança do Paciente & Legislação Ética (COFEN)",
      questionStem: `Conforme a Lei do Exercício Profissional da Enfermagem (Lei nº 7.498/86) e a Resolução COFEN nº 736/2024, qual das seguintes atribuições no cuidado ao Paciente ${patientInitials} é PRIVATIVA do enfermeiro, não podendo ser delegada ao técnico de enfermagem?`,
      attendingTip: "O diagnóstico de enfermagem, a prescrição da assistência e a consulta de enfermagem são competências privativas inalienáveis do enfermeiro.",
      options: [
        {
          title: "Realização do Diagnóstico de Enfermagem, elaboração da Prescrição da Assistência de Enfermagem privativa e prestação de cuidados diretos a pacientes graves com risco iminente de morte.",
          isCorrect: true,
          whyCorrect: "Correto! A Lei Federal 7.498/86 e a Resolução COFEN 736/2024 estipulam que o diagnóstico de enfermagem, a prescrição assistencial e o cuidado a pacientes graves são privativos do enfermeiro.",
          whyDistractor: null
        },
        {
          title: "Supervisionar a administração de hemocomponentes e quimioterápicos antineoplásicos delegando a punção e infusão inicial ao técnico de enfermagem da enfermaria.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Infração Legal: A administração de quimioterápicos antineoplásicos e o início da infusão de hemocomponentes são procedimentos privativos do enfermeiro devido ao risco de anafilaxia e extravasamento."
        },
        {
          title: "Validar a evolução clínica do paciente após o término do turno mediante assinatura e carimbo em formulário padronizado pré-preenchido pelo assistente de apoio da unidade.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Violação Deontológica: A evolução de enfermagem no Processo de Enfermagem exige avaliação presencial e raciocínio clínico próprio do enfermeiro, não podendo ser endossada por terceiros."
        },
        {
          title: "Delegar a sondagem vesical de demora e a sondagem nasoentérica ao técnico de enfermagem nos casos em que o paciente apresentar estabilidade nos parâmetros hemodinâmicos.",
          isCorrect: false,
          whyCorrect: null,
          whyDistractor: "Exercício Ilegal da Profissão: Conforme resoluções do COFEN e pareceres técnicos, a cateterização nasoentérica e a sondagem vesical de demora são privativas do enfermeiro pela complexidade técnica."
        }
      ]
    };
  }

  // Aplica Fisher-Yates shuffle nas 4 questões para balanceamento uniforme
  const q1 = { ...q1Raw, options: normalizeAndShuffleOptions(q1Raw) };
  const q2 = { ...q2Raw, options: normalizeAndShuffleOptions(q2Raw) };
  const q3 = { ...q3Raw, options: normalizeAndShuffleOptions(q3Raw) };
  const q4 = { ...q4Raw, options: normalizeAndShuffleOptions(q4Raw) };

  const questions = [q1, q2, q3, q4];

  const vignette = `Paciente ${patientInitials}, ${profile.age || 65} anos, sexo ${profile.gender === "M" ? "masculino" : "feminino"}, atendido com quadro de ${userDiagnosis}. Sinais vitais: ${vitalsText}. Escores clínicos: Braden ${bradenTotal} pts, CAM ${camPositive ? "Positivo (Delirium)" : "Negativo"}, Dor ${caloiTotal}/10, Risco de Queda (SAK) ${sakTotal} pts. Medicações ativas: ${userMeds || "Conforme prescrição médica da patologia"}. Alergias: ${profile.allergies || "Nenhuma conhecida"}. Anamnese/Admissão: ${profile.previous_anamnesis || profile.notes || "Avaliação clínica no leito"}.`;

  return {
    questionTitle: `Bateria de Julgamento Clínico: ${category.toUpperCase().replace("_", " ")} (${patientInitials})`,
    clinicalVignette: vignette,
    patientInitials,
    options: q1.options,
    attendingTip: q1.attendingTip,
    questions,
    recommendedInterventions: [
      `Monitorização sequencial dos parâmetros hemodinâmicos para o quadro de ${userDiagnosis};`,
      `Farmacovigilância ativa para os medicamentos em uso (${userMeds || "terapia prescrita"});`,
      bradenTotal <= 14 ? "Mudança de decúbito de 2 em 2 horas em 30° e colchão pneumático (Braden crítico);" : "Inspeção diária da integridade cutânea e hidratação;",
      camPositive ? "Medidas não farmacológicas para reorientação de delirium agudo (evitar contenção punitiva);" : "Estimular mobilização precoce e deambulação assistida;",
      sakTotal >= 5 ? "Protocolo institucional rigoroso de prevenção de quedas (pulseira e grades elevadas);" : "Manter campainha ao alcance e leito em nível baixo."
    ]
  };
}
