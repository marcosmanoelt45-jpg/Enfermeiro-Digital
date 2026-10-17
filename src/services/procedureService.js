/**
 * procedureService.js
 * Serviço de Videoteca Didática & Laboratório de Habilidades Clínicas de Enfermagem (Skills Lab).
 * Reúne procedimentos fundamentais e avançados com vídeos de alta definição,
 * checklists de materiais e técnica asséptica, pontos críticos de iatrogenia e gerador com IA (Gemini).
 */

import { clinicalGamificationService } from './clinicalGamificationService';

const STORAGE_KEY = 'enfermeiro_digital_custom_procedures';

// Chave da API do Google Gemini
function getGeminiApiKey() {
  if (typeof localStorage !== 'undefined') {
    const key = localStorage.getItem('enfermeiro_gemini_api_key');
    if (key && key.trim()) return key.trim();
  }
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

// Catálogo Mestre Pré-Carregado de Procedimentos de Enfermagem
export const MASTER_PROCEDURES = [
  {
    id: 'puncao-venosa',
    title: 'Punção Venosa Periférica (Cateter sobre Agulha - Jelco)',
    category: 'vasculares',
    categoryLabel: 'Acessos Vasculares',
    duration: '6 min',
    difficulty: 'Fundamental',
    levelBadge: 'Iniciante ao Avançado',
    cofenNorm: 'Resolução COFEN nº 736/2024 e Lei nº 7.498/86',
    videoUrl: 'https://www.youtube.com/embed/6cxkjHMU__E', // Vídeo real: Procedimento de Punção Venosa (Venes Escola de Saúde)
    videoSource: 'Venes - Escola de Saúde & Simulação Prática',
    description: 'Técnica asséptica de cateterização venosa periférica para infusão de fármacos, hidratação venosa e hemocomponentes, com escolha correta de calibre e prevenção de flebite.',
    materials: [
      { id: 'm1', name: 'Cateter periférico de calibre adequado (18G, 20G ou 22G)', checked: false },
      { id: 'm2', name: 'Garrote de látex ou silicone descartável', checked: false },
      { id: 'm3', name: 'Algodão ou gaze estéril com álcool a 70%', checked: false },
      { id: 'm4', name: 'Luvas de procedimento não estéreis', checked: false },
      { id: 'm5', name: 'Extensor multivias com clamp e solução de salina a 0,9%', checked: false },
      { id: 'm6', name: 'Curativo estéril transparente com borda reforçada', checked: false },
      { id: 'm7', name: 'Fita adesiva hipoalergênica para identificação (data, hora, calibre e profissional)', checked: false },
      { id: 'm8', name: 'Caixa coletora para perfurocortantes (Descarpack)', checked: false },
    ],
    timestamps: [
      { time: '00:00', label: 'Indicação clínica & Higienização das mãos', seconds: 0 },
      { time: '01:10', label: 'Seleção do sítio venoso & Garroteamento', seconds: 70 },
      { time: '02:15', label: 'Antissepsia da pele com fricção por 30s', seconds: 135 },
      { time: '03:00', label: 'Inserção a 15°-30° com bisel voltado para cima', seconds: 180 },
      { time: '04:10', label: 'Recuo do mandril após refluxo de sangue no canhão', seconds: 250 },
      { time: '05:00', label: 'Conexão do extensor, flush salino e fixação estéril', seconds: 300 },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Checagem de prescrição & Consentimento', desc: 'Identificar o paciente com dois identificadores (nome completo e data de nascimento) e orientar sobre o procedimento.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Avaliação da rede venosa', desc: 'Priorizar veias distais do membro superior não dominante (cefálica, basílica ou intermediária do antebraço). Evitar articulações e membros com fístula arteriovenosa.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Garroteamento correto', desc: 'Aplicar o garrote 10 a 15 cm acima do sítio escolhido por no máximo 1 a 2 minutos para evitar hemoconcentração e hematomas.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Antissepsia asséptica', desc: 'Friccionar álcool a 70% ou clorexidina alcoólica por 30 segundos em movimentos circulares ou unidirecionais e aguardar secagem espontânea.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Punção com bisel superior', desc: 'Esticar a pele abaixo do sítio e introduzir o cateter com ângulo de 15 a 30 graus até observar o refluxo de sangue na câmara de refluxo.', checked: false },
      { id: 's6', stepNumber: 6, title: 'Avanço da cânula plástica e recuo do mandril', desc: 'Abaixar o ângulo rente à pele, avançar a cânula de teflon/poliuretano na veia enquanto recua o mandril metálico com firmeza.', checked: false },
      { id: 's7', stepNumber: 7, title: 'Soltar garrote & Conexão do extensor', desc: 'Desgarrotear o membro, ocluir a veia distal à ponta da cânula, acoplar o extensor previamente preenchido com salina e realizar flush suave sem dor.', checked: false },
      { id: 's8', stepNumber: 8, title: 'Fixação e identificação legível', desc: 'Cobrir o sítio de punção com película transparente estéril. Identificar com data, hora, calibre e assinatura/COREN do profissional.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'NUNCA reintroduza o mandril metálico', text: 'Se o cateter sair da veia ou falhar, jamais reintroduza a agulha dentro da cânula plástica. Risco iminente de cisalhamento do cateter e embolia por corpo estranho!' },
      { type: 'warning', title: 'Aguarde a secagem completa do antisséptico', text: 'Puncionar a pele úmida de álcool causa dor em queimação intensa ao paciente e inativa a ação germicida residual.' },
      { type: 'tip', title: 'Veias frágeis em idosos', text: 'Em pacientes idosos com fragilidade capilar, evite garrotear com muita pressão para não estourar o vaso; utilize tração leve da pele.' },
    ],
  },
  {
    id: 'sondagem-vesical-demora',
    title: 'Cateterismo Vesical de Demora (SVD Masculino & Feminino)',
    category: 'eliminacoes',
    categoryLabel: 'Cateterismos & Eliminações',
    duration: '9 min',
    difficulty: 'Avançado',
    levelBadge: 'Privativo do Enfermeiro',
    cofenNorm: 'Resolução COFEN nº 450/2013 & Parecer COFEN 03/2021 (Atividade Privativa)',
    videoUrl: 'https://www.youtube.com/embed/O12BBzZ4ERQ', // Vídeo real: Aula Prática de Cateterismo Vesical (Descomplica Enfermagem)
    videoSource: 'Descomplica Enfermagem & Simulação Prática',
    description: 'Inserção de sonda Foley com balão de retenção para drenagem contínua de urina em sistema fechado, com ênfase máxima em assepsia e prevenção de ITU associada a cateter (ITU-AC).',
    materials: [
      { id: 'm1', name: 'Sonda Foley de 2 ou 3 vias (calibre 12, 14 ou 16 Fr)', checked: false },
      { id: 'm2', name: 'Bolsa coletora de sistema fechado com válvula antirrefluxo', checked: false },
      { id: 'm3', name: 'Kit de cateterismo estéril (cúpula, cuba rim, pinça Cheron e gaze estéril)', checked: false },
      { id: 'm4', name: 'Dois pares de luvas estéreis de procedimento', checked: false },
      { id: 'm5', name: 'Ampola de água destilada (10 a 20 mL) - NUNCA use soro fisiológico!', checked: false },
      { id: 'm6', name: 'Seringa de 10 ou 20 mL e agulha 40x12 para aspiração da água destilada', checked: false },
      { id: 'm7', name: 'Gel lubrificante anestésico (Xilocaína gel a 2% em seringa esterilizada)', checked: false },
      { id: 'm8', name: 'Antisséptico aquoso (Clorexidina aquosa a 0,2% ou Povidona aquosa)', checked: false },
      { id: 'm9', name: 'Campo fenestrado estéril e fita para fixação (asa de borboleta)', checked: false },
    ],
    timestamps: [
      { time: '00:00', label: 'Indicação legal privativa & Higiene íntima prévia', seconds: 0 },
      { time: '01:30', label: 'Abertura do campo estéril e paramentação', seconds: 90 },
      { time: '02:45', label: 'Antissepsia genital criteriosa (meato e mucosa)', seconds: 165 },
      { time: '04:15', label: 'Lubrificação uretral estéril com lidocaína gel', seconds: 255 },
      { time: '05:30', label: 'Inserção da sonda até a bifurcação e saída de urina', seconds: 330 },
      { time: '07:00', label: 'Insuflação do cuff com água destilada e tracionamento suave', seconds: 420 },
      { time: '08:15', label: 'Fixação correta (raiz da coxa/abdome) e posicionamento da bolsa', seconds: 495 },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Privativo do Enfermeiro', desc: 'Conforme Resolução COFEN nº 450/2013, o cateterismo vesical é procedimento privativo do enfermeiro em virtude da complexidade e riscos de trauma uretral.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Higiene perineal prévia', desc: 'Realizar higiene íntima com água e sabão antes de iniciar a paramentação estéril para reduzir a carga bacteriana perineal.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Campo cirúrgico estéril', desc: 'Calçar luva estéril, dispor campo fenestrado e testar o balão da sonda Foley com água destilada para verificar integridade antes da inserção.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Antissepsia específica', desc: 'No homem: retrair o prepúcio e limpar glande e meato em espiral. Na mulher: afastar grandes e pequenos lábios e limpar no sentido clitóris-ânus (trocar gaze a cada passada).', checked: false },
      { id: 's5', stepNumber: 5, title: 'Injeção de anestésico gel', desc: 'No homem: injetar 10 a 15 mL de lidocaína 2% gel diretamente na uretra e ocluir o meato por 3 minutos. Na mulher: lubrificar abundantemente a ponta da sonda.', checked: false },
      { id: 's6', stepNumber: 6, title: 'Inserção até o retorno de urina', desc: 'Introduzir a sonda com suavidade. No homem, tracionar o pênis a 90° e depois a 60°. Inserir ATÉ A BIFURCAÇÃO DA SONDA para garantir que o balão está totalmente na bexiga!', checked: false },
      { id: 's7', stepNumber: 7, title: 'Insuflação com Água Destilada', desc: 'Após a visualização franca de urina, injetar o volume recomendado de água destilada no balão e tracionar delicadamente até sentir a resistência do trígono vesical.', checked: false },
      { id: 's8', stepNumber: 8, title: 'Fixação e posição da bolsa', desc: 'Fixar na face anterolateral da coxa (mulheres) ou hipogástrio/raiz da coxa (homens) sem tração. Manter a bolsa SEMPRE abaixo do nível da bexiga para evitar refluxo.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'JAMAIS insufle o cuff com Soro Fisiológico (SF 0,9%)', text: 'O cloreto de sódio cristaliza dentro da via do balão ao longo dos dias, bloqueando a válvula e impedindo o esvaziamento para a retirada da sonda (requer desinsuflação cirúrgica).' },
      { type: 'danger', title: 'NUNCA insufle o balão antes de ver urina ou sentir resistência', text: 'Insuflar o balonete dentro da uretra prostática causa laceração uretral grave com hemorragia e estenose definitiva!' },
      { type: 'warning', title: 'Nunca eleve a bolsa coletora acima do leito', text: 'A elevação da bolsa provoca refluxo de urina colonizada para o interior da bexiga, sendo a principal causa de bacteremia e choque séptico hospitalar.' },
    ],
  },
  {
    id: 'sondagem-nasogastrica-nasoenteral',
    title: 'Sondagem Nasogástrica (SNG) e Nasoenteral (SNE)',
    category: 'eliminacoes',
    categoryLabel: 'Cateterismos & Eliminações',
    duration: '8 min',
    difficulty: 'Intermediário',
    levelBadge: 'Técnica & Confirmação',
    cofenNorm: 'Resolução COFEN nº 627/2020 (SNE privativa do Enfermeiro; SNG com supervisão)',
    videoUrl: 'https://www.youtube.com/embed/PtWrYZCVH0U', // Vídeo real: Aula Prática de Sonda Nasogástrica (Descomplica Enfermagem)
    videoSource: 'Descomplica Enfermagem & Simulação Prática',
    description: 'Medição anatômica correta, lubrificação, inserção atraumática e os métodos mandatórios de confirmação de posicionamento (Raio-X de controle e teste de pH gástrico).',
    materials: [
      { id: 'm1', name: 'Sonda nasogástrica (Levin 14-16 Fr) ou nasoenteral (Dobbhoff com fio-guia)', checked: false },
      { id: 'm2', name: 'Gel lubrificante hidrossolúvel estéril (KY ou lidocaína gel)', checked: false },
      { id: 'm3', name: 'Estetoscópio e fita métrica flexível', checked: false },
      { id: 'm4', name: 'Seringa de 20 mL ou 50 mL tipo bico cateter', checked: false },
      { id: 'm5', name: 'Luvas de procedimento não estéreis e toalha de rosto', checked: false },
      { id: 'm6', name: 'Copo com água e canudo (se paciente consciente e sem disfagia)', checked: false },
      { id: 'm7', name: 'Fita adesiva tipo micropore para fixação nasal em borboleta', checked: false },
      { id: 'm8', name: 'Fita reagente de pH (0 a 14) para teste de acidez gástrica', checked: false },
    ],
    timestamps: [
      { time: '00:00', label: 'Indicação (descompressão gástrica vs nutrição enteral)', seconds: 0 },
      { time: '01:20', label: 'Medição anatômica correta (Nariz - Orelha - Apêndice Xifoide)', seconds: 80 },
      { time: '02:40', label: 'Posicionamento do paciente em Fowler alto (45°-90°)', seconds: 160 },
      { time: '03:50', label: 'Inserção suave acompanhando o reflexo de deglutição', seconds: 230 },
      { time: '05:30', label: 'Confirmação mandatória: Ausculta, pH e Raio-X padrão ouro', seconds: 330 },
      { time: '07:10', label: 'Retirada do fio-guia (apenas após RX) e fixação nasal', seconds: 430 },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Medição correta (Técnica NOX)', desc: 'Medir da ponta do nariz ao lóbulo da orelha e desta até o apêndice xifoide. Para sondagem nasoenteral (pós-pilórica), adicionar de 20 a 25 cm à medição.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Posicionamento em Fowler alto', desc: 'Colocar o paciente sentado ou com cabeceira elevada a 45°-90°, com o pescoço ligeiramente flexionado para facilitar o fechamento da glote.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Lubrificação abundante', desc: 'Lubrificar os primeiros 10 cm da sonda com gel hidrossolúvel para deslizamento sem lesão dos cornetos nasais.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Introdução e comando de deglutição', desc: 'Inserir pelo assoalho da narina. Ao atingir a orofaringe, pedir ao paciente que simule a deglutição (ou tome pequenos goles de água com canudo) enquanto a sonda avança.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Atenção aos sinais de via aérea', desc: 'Se o paciente tossir, engasgar, apresentar cianose ou dificuldade respiratória, RECUAR A SONDA IMEDIATAMENTE. Ela está na traqueia!', checked: false },
      { id: 's6', stepNumber: 6, title: 'Confirmação do posicionamento', desc: 'Aspirar conteúdo gástrico e medir pH (deve ser menor que 5,5). Na SNE com fio-guia, o Raio-X de abdome é OBRIGATÓRIO antes de iniciar dieta.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'NUNCA administre dieta ou água sem o Raio-X confirmatório da SNE', text: 'A ausculta com ar no estômago pode ser audível mesmo se a sonda estiver alojada no brônquio principal. A infusão de dieta no pulmão é causa imediata de morte por pneumonite química!' },
      { type: 'danger', title: 'Contraindicação em fratura de base de crânio', text: 'Em pacientes com traumatismo cranioencefálico grave (TCE), epistaxe traumática ou sinal do guaxinim, a via nasal é PROIBIDA (risco de penetração intracraniana da sonda). Usar via orogástrica.' },
    ],
  },
  {
    id: 'injecao-intramuscular-z',
    title: 'Administração de Medicamentos por Via Intramuscular (Técnica em Z)',
    category: 'medicamentos',
    categoryLabel: 'Terapia Medicamentosa',
    duration: '5 min',
    difficulty: 'Fundamental',
    levelBadge: 'Semiotécnica Prática',
    cofenNorm: 'Pareceres COFEN sobre vias de administração e volumes máximos',
    videoUrl: 'https://www.youtube.com/embed/J0qNV8BtgeE', // Vídeo real: Técnica em Z para injeção intramuscular (Papo de Enfermagem)
    videoSource: 'Papo de Enfermagem & Farmacologia Prática',
    description: 'Escolha correta dos sítios de aplicação (ventroglúteo de Hochstetter, vasto lateral da coxa, dorsoglúteo e deltoide), limites de volume e a técnica em Z para vedação do trajeto.',
    materials: [
      { id: 'm1', name: 'Seringa de 3 mL ou 5 mL com graduação nítida', checked: false },
      { id: 'm2', name: 'Agulha para aspiração (40x12 mm - rosa) e para aplicação (30x7 ou 25x7 mm)', checked: false },
      { id: 'm3', name: 'Medicação prescrita conferida na regra dos 9 certos', checked: false },
      { id: 'm4', name: 'Algodão seco e algodão com álcool a 70%', checked: false },
      { id: 'm5', name: 'Luvas de procedimento', checked: false },
    ],
    timestamps: [
      { time: '00:00', label: 'Regra dos 9 Certos & Cálculo de volume', seconds: 0 },
      { time: '01:00', label: 'Delimitação anatômica dos sítios seguros (Ventroglúteo e Deltoide)', seconds: 60 },
      { time: '02:20', label: 'A técnica em Z (tração lateral da pele para vedação)', seconds: 140 },
      { time: '03:15', label: 'Ângulo de 90° e aspiração do êmbolo por 5 a 10s', seconds: 195 },
      { time: '04:10', label: 'Infusão lenta (1 mL a cada 10 segundos) e descarte seguro', seconds: 250 },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Delimitação do Ventroglúteo (Hochstetter)', desc: 'Colocar o indicador sobre a espinha ilíaca anterossuperior e abrir o dedo médio formando um V na crista ilíaca. Aplicar no centro do V (sítio mais seguro, livre de grandes vasos e nervo ciático).', checked: false },
      { id: 's2', stepNumber: 2, title: 'Tração em Z', desc: 'Com a mão não dominante, tracionar a pele e o tecido subcutâneo lateralmente cerca de 2,5 cm antes de introduzir a agulha.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Inserção a 90 graus', desc: 'Introduzir a agulha em movimento firme e rápido em ângulo perpendicular de 90° com a pele.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Aspiração obrigatória', desc: 'Aspirar o êmbolo suavemente por 5 segundos. Se refluir sangue, retirar a agulha, desprezar todo o material e reiniciar o preparo com nova seringa e medicação.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Injeção lenta e retirada', desc: 'Injetar a medicação lentamente na velocidade de 1 mL a cada 10 segundos para reduzir a dor. Aguardar 10 segundos antes de retirar a agulha para permitir acomodação tecidual.', checked: false },
      { id: 's6', stepNumber: 6, title: 'Soltar a tração em Z', desc: 'Retirar a agulha e soltar a pele em seguida. O tecido subcutâneo retorna à posição original, selando o trajeto e impedindo refluxo de medicamentos cáusticos (ex: ferro, penicilinas).', checked: false },
    ],
    safetyAlerts: [
      { type: 'warning', title: 'Volume máximo no deltoide é de 2 a 3 mL', text: 'No músculo deltoide de adultos normais, o volume máximo recomendado é de 2 mL (máximo 3 mL). Volumes maiores geram necrose muscular e compressão do nervo radial.' },
      { type: 'danger', title: 'NUNCA massageie o sítio após injeção com técnica em Z', text: 'Massagear empurra o medicamento de volta para o tecido subcutâneo, causando manchas na pele, queimação e nódulos inflamatórios dolorosos.' },
    ],
  },
  {
    id: 'aspiracao-vias-aereas',
    title: 'Aspiração de Vias Aéreas (Tubo Orotraqueal e Traqueostomia)',
    category: 'respiratorio',
    categoryLabel: 'Vias Aéreas & Ventilação',
    duration: '7 min',
    difficulty: 'Avançado',
    levelBadge: 'Terapia Intensiva',
    cofenNorm: 'Resolução COFEN nº 557/2017 (Procedimento privativo de Enfermagem em pacientes críticos)',
    videoUrl: 'https://www.youtube.com/embed/KiLr6qCs8bk', // Vídeo real: Aspiração Traqueal (Prática Enfermagem)
    videoSource: 'Prática Enfermagem & UTI Respiratória',
    description: 'Remoção segura de secreções traqueobrônquicas em pacientes intubados ou traqueostomizados com técnica estéril, controle rigoroso de vácuo e hiperoxigenação prévia.',
    materials: [
      { id: 'm1', name: 'Sonda de aspiração traqueal estéril com válvula de alívio (calibre 12 a 14 Fr)', checked: false },
      { id: 'm2', name: 'Sistema de aspiração a vácuo com manômetro regulado (80 a 120 mmHg)', checked: false },
      { id: 'm3', name: 'Luvas estéreis de procedimento para técnica aberta (ou sistema de aspiração fechado - Trach Care)', checked: false },
      { id: 'm4', name: 'Ampola de água destilada ou soro fisiológico estéril para lavagem do circuito', checked: false },
      { id: 'm5', name: 'Óculos de proteção, máscara cirúrgica ou N95 e avental', checked: false },
      { id: 'm6', name: 'Estetoscópio e oxímetro de pulso para monitorização contínua', checked: false },
    ],
    timestamps: [
      { time: '00:00', label: 'Indicações de aspiração: roncos à ausculta e dessaturação', seconds: 0 },
      { time: '01:10', label: 'Hiperoxigenação prévia com FiO2 a 100% por 1 a 2 minutos', seconds: 70 },
      { time: '02:30', label: 'Técnica de inserção da sonda SEM sucção ativa', seconds: 150 },
      { time: '03:45', label: 'Aspiração intermitente em movimentos giratórios (< 10-15s)', seconds: 225 },
      { time: '05:00', label: 'Reconexão ao ventilador, ausculta pulmonar e limpeza do circuito', seconds: 300 },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Hiperoxigenar o paciente', desc: 'Ofertar FiO2 a 100% por pelo menos 1 a 2 minutos antes do procedimento para prevenir hipoxemia severa induzida pela retirada de volume pulmonar.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Regular pressão de vácuo', desc: 'Ajustar o manômetro entre 80 e 120 mmHg em adultos (máximo 150 mmHg). Pressões excessivas causam atelectasias e desnudamento da mucosa brônquica.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Inserir a sonda sem vácuo', desc: 'Introduzir a sonda no tubo orotraqueal suavemente com o orifício de alívio ABERTO (sem sucção), até sentir leve resistência (carina) e recuar 1 a 2 cm.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Sucção intermitente e rotatória', desc: 'Ocluir a válvula e retirar a sonda com movimentos giratórios contínuos. O tempo total de sucção NUNCA deve ultrapassar 10 a 15 segundos.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Reoxigenação e monitorização', desc: 'Reconectar o paciente ao respirador, aguardar normalização da frequência cardíaca e SpO2 antes de uma eventual segunda aspiração (máximo 3 passadas).', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'Risco de bradicardia e parada por reflexo vagal', text: 'Estimular a carina repetidamente ou prolongar a aspiração além de 15 segundos provoca estimulação parassimpática vagal intensa com bradicardia súbita e assistolia.' },
      { type: 'warning', title: 'NUNCA instile soro fisiológico rotineiramente no tubo', text: 'Instilar soro fisiológico para "amolecer secreções" dispersa biofilmes bacterianos para as vias aéreas inferiores, aumentando drasticamente o risco de Pneumonia Associada à Ventilação Mecânica (PAV).' },
    ],
  },
  {
    id: 'curativo-lesao-pressao',
    title: 'Curativo & Desbridamento de Lesão por Pressão (LPP Estágios 1 a 4)',
    category: 'curativos',
    categoryLabel: 'Curativos & Lesões',
    duration: '8 min',
    difficulty: 'Intermediário',
    levelBadge: 'Estomaterapia & Pele',
    cofenNorm: 'Resolução COFEN nº 567/2018 (Atuação da equipe de enfermagem no cuidado a feridas)',
    videoUrl: 'https://www.youtube.com/embed/12BeFVs5F2M', // Vídeo real: QUAL O CURATIVO PERFEITO PARA TRATAR LPP (Descomplica Enfermagem)
    videoSource: 'Descomplica Enfermagem & Estomaterapia',
    description: 'Estadiamento de lesão por pressão, limpeza com jatos de soro fisiológico a 0,9%, avaliação de tecido (granulação vs esfacelo/necrose) e escolha da cobertura ideal (hidrogel, alginato de cálcio, filme e espuma).',
    materials: [
      { id: 'm1', name: 'Pacote de curativo estéril (pinça anatômica, pinça dente de rato e hemostática)', checked: false },
      { id: 'm2', name: 'Frasco de Soro Fisiológico 0,9% morno (ou PHMB para feridas infectadas)', checked: false },
      { id: 'm3', name: 'Agulha 40x12 mm acoplada ao frasco de SF para gerar pressão de irrigação de 8 a 15 psi', checked: false },
      { id: 'm4', name: 'Cobertura primária prescrita (Hidrogel, Alginato de cálcio, Espuma de poliuretano ou Prata)', checked: false },
      { id: 'm5', name: 'Gaze estéril e cobertura secundária de proteção', checked: false },
      { id: 'm6', name: 'Fita métrica de papel descartável para medição de diâmetro e profundidade', checked: false },
    ],
    timestamps: [
      { time: '00:00', label: 'Estadiamento da LPP (Escala NPUAP/EPUAP)', seconds: 0 },
      { time: '01:30', label: 'Irrigação em jatos com SF 0,9% para desbridamento autolítico', seconds: 90 },
      { time: '03:00', label: 'Avaliação de tecido no leito: necrose, esfacelo e granulação', seconds: 180 },
      { time: '04:30', label: 'Aplicação da cobertura interativa segundo o exsudato', seconds: 270 },
      { time: '06:30', label: 'Proteção das bordas perilesionais com filme barreira', seconds: 390 },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Limpeza sem esfregar o leito', desc: 'Irrigar o leito da lesão com SF 0,9% morno em jatos contínuos utilizando agulha 40x12. Nunca esfregar com gaze o tecido de granulação vermelho vivo para não destruir neoangiogênese.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Secagem exclusiva da pele perilesional', desc: 'Secar delicadamente apenas a borda saudável da pele ao redor da ferida, mantendo o leito limpo e úmido.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Escolha da cobertura segundo o exsudato', desc: 'Ferida com necrose seca: Hidrogel para umidificar e promover desbridamento autolítico. Ferida muito exsudativa: Alginato de cálcio ou hidrocelular com espuma para reter secreções.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Proteção da borda com spray barreira', desc: 'Aplicar película protetora sem álcool nas bordas da ferida para evitar maceração por excesso de exsudato.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Registro de evolução', desc: 'Fotografar (com consentimento) ou anotar dimensões em cm, aspecto do leito, odor, tipo de exsudato e cobertura aplicada.', checked: false },
    ],
    safetyAlerts: [
      { type: 'warning', title: 'Uso de soluções citotóxicas no leito da lesão', text: 'É formalmente contraindicado o uso de PVPI tópico, éter, água oxigenada ou clorexidina degermante dentro da ferida. Essas substâncias são citotóxicas e matam os fibroblastos em proliferação.' },
    ],
  },
  {
    id: 'rcp-suporte-basico-vida',
    title: 'Parada Cardiorrespiratória & Suporte Básico de Vida (BLS/RCP no Adulto)',
    category: 'urgencia',
    categoryLabel: 'Urgência & Emergência',
    duration: '10 min',
    difficulty: 'Essencial',
    levelBadge: 'Protocolo AHA / SBC',
    cofenNorm: 'Diretrizes de Ressuscitação Cardiopulmonar AHA / SBC e Atuação da Enfermagem',
    videoUrl: 'https://www.youtube.com/embed/LquiiQVKqKE', // Vídeo real: Massagem Cardíaca e RCP (Einstein Hospital Israelita)
    videoSource: 'Hospital Israelita Albert Einstein & Simulação Realística',
    description: 'Reconhecimento imediato de PCR (ausência de pulso central e respiração/gasping), chamada de socorro, compressões torácicas de alta qualidade (100 a 120/min) e uso precoce do DEA.',
    materials: [
      { id: 'm1', name: 'Desfibrilador Externo Automático (DEA) com pás adesivas adulto', checked: false },
      { id: 'm2', name: 'Dispositivo bolsa-válvula-máscara (Ambu) conectado à fonte de oxigênio a 15 L/min', checked: false },
      { id: 'm3', name: 'Prancha rígida posicionada sob o tórax do paciente', checked: false },
      { id: 'm4', name: 'Cânula orofaríngea (Guedel) de tamanho adequado', checked: false },
      { id: 'm5', name: 'Luvas, máscara facial com proteção ocular e avental de emergência', checked: false },
    ],
    timestamps: [
      { time: '00:00', label: 'Segurança da cena e checagem de responsividade', seconds: 0 },
      { time: '00:45', label: 'Checagem simultânea de pulso carotídeo e respiração (máx 10s)', seconds: 45 },
      { time: '01:30', label: 'Chamada de ajuda e solicitação do carrinho de emergência e DEA', seconds: 90 },
      { time: '02:15', label: 'Compressões torácicas de alta qualidade (5 a 6 cm de profundidade)', seconds: 135 },
      { time: '04:00', label: 'Instalação das pás do DEA e análise de ritmo sem tocar no paciente', seconds: 240 },
      { time: '05:30', label: 'Disparo do choque e reinício imediato das compressões (2 minutos)', seconds: 330 },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Reconhecer PCR em até 10 segundos', desc: 'Chamar pelo paciente nos ombros. Checar pulso carotídeo e movimentos respiratórios SIMULTANEAMENTE em no máximo 10 segundos. Se sem pulso ou apenas gasping: É PCR!', checked: false },
      { id: 's2', stepNumber: 2, title: 'Pedir ajuda clara e pedir o DEA', desc: 'Apontar para alguém específico: "Você, ligue para o código amarelo/azul e traga o carrinho de emergência com o DEA agora!".', checked: false },
      { id: 's3', stepNumber: 3, title: 'Posicionamento e compressões de alta qualidade', desc: 'Ajoelhar-se ao lado do paciente, posicionar a região tenar da mão no terço inferior do esterno e comprimir com profundidade de 5 a 6 cm na frequência de 100 a 120 compressões por minuto.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Permitir o retorno total do tórax', desc: 'Não apoiar o peso sobre o tórax entre as compressões para permitir o enchimento diastólico das artérias coronárias.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Ciclos de 30:2 com via aérea básica', desc: 'Realizar 30 compressões seguidas de 2 ventilações de 1 segundo cada com o Ambu (técnica C-E para vedação).', checked: false },
      { id: 's6', stepNumber: 6, title: 'Chegada do DEA', desc: 'Ligar o DEA imediatamente, colar as pás (infraclavicular direita e ápice cardíaco esquerdo) e afastar todos durante a análise e choque.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'NÃO interrompa as compressões por mais de 10 segundos', text: 'Cada segundo sem massagem derruba a pressão de perfusão coronariana a zero. São necessários quase 2 minutos de compressão contínua para restabelecer a perfusão cerebral!' },
      { type: 'danger', title: 'Certifique-se de que NINGUÉM encosta no paciente ao disparar o choque', text: 'Olhar da cabeça aos pés e comandar em voz alta: "Afastem-se todos!". O choque transmitido a um profissional pode gerar fibrilação ventricular na equipe.' },
    ],
  },
];

export const procedureService = {
  /**
   * Lista todos os procedimentos (pré-carregados + criados pelo usuário).
   */
  list() {
    try {
      const customRaw = localStorage.getItem(STORAGE_KEY);
      const customList = customRaw ? JSON.parse(customRaw) : [];
      return [...MASTER_PROCEDURES, ...customList];
    } catch {
      return MASTER_PROCEDURES;
    }
  },

  /**
   * Busca um procedimento específico por ID.
   */
  getById(id) {
    const all = this.list();
    return all.find((p) => p.id === id) || null;
  },

  /**
   * Salva um novo procedimento customizado criado pelo professor ou aluno.
   */
  saveCustom(procedureData) {
    try {
      const customRaw = localStorage.getItem(STORAGE_KEY);
      const customList = customRaw ? JSON.parse(customRaw) : [];
      const newProc = {
        ...procedureData,
        id: procedureData.id || `custom-${Date.now()}`,
        isCustom: true,
        createdAt: new Date().toISOString(),
      };
      customList.unshift(newProc);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customList));
      return newProc;
    } catch (e) {
      console.warn('Erro ao salvar procedimento personalizado:', e);
      return null;
    }
  },

  /**
   * Conclui o treinamento de um procedimento, atribuindo XP e alimentando streak e conquistas.
   */
  completeProcedure(procedureId) {
    // Registra na gamificação
    const res = clinicalGamificationService.recordActivity('case_solved', 30);
    return {
      success: true,
      earnedXp: 30,
      state: res.state,
    };
  },

  /**
   * Gera um Procedimento Operacional Padrão (POP) completo de Enfermagem com Inteligência Artificial (Google Gemini).
   */
  async generateProcedureWithAI(promptTopic) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error('Configure sua chave do Google Gemini em Minha Conta para gerar procedimentos automáticos com IA.');
    }

    const systemPrompt = `Você é um Enfermeiro Especialista em Educação em Saúde, Semiotécnica e Normativas do COFEN nº 736/2024.
Sua missão: Gerar um Procedimento Operacional Padrão (POP) e guia de habilidades clínicas de altíssima precisão e rigor asséptico para o procedimento solicitado.
Gere um JSON rigoroso e estrito sem blocos markdown externos (apenas o JSON puro), com a seguinte estrutura:

{
  "title": "Nome formal do procedimento",
  "category": "vasculares" | "eliminacoes" | "medicamentos" | "respiratorio" | "curativos" | "urgencia",
  "categoryLabel": "Nome legível da categoria",
  "duration": "Ex: 7 min",
  "difficulty": "Fundamental" | "Intermediário" | "Avançado",
  "levelBadge": "Ex: Privativo do Enfermeiro ou Semiotécnica",
  "cofenNorm": "Legislação aplicável (COFEN/ANVISA)",
  "videoUrl": "https://www.youtube.com/embed/6cxkjHMU__E",
  "videoSource": "Simulação Didática com Goti AI",
  "description": "Indicação clínica, finalidade e justificativa científica",
  "materials": [
    { "id": "m1", "name": "Nome do material estéril ou de suporte", "checked": false }
  ],
  "timestamps": [
    { "time": "00:00", "label": "Nome da etapa", "seconds": 0 }
  ],
  "steps": [
    { "id": "s1", "stepNumber": 1, "title": "Título do passo", "desc": "Instrução técnica detalhada e precisa", "checked": false }
  ],
  "safetyAlerts": [
    { "type": "danger" | "warning" | "tip", "title": "Alerta de Iatrogenia ou Pegadinha", "text": "Explicação do risco e como prevenir" }
  ]
}`;

    const userPrompt = `Gere o POP e roteiro didático de procedimento completo para: "${promptTopic}". Seja minucioso nos materiais, na técnica asséptica e nas complicações a evitar.`;

    const activeModel = localStorage.getItem('enfermeiro_gemini_model') || 'gemini-2.0-flash';

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: userPrompt },
              ],
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || 'Falha ao comunicar com a IA do Google Gemini.');
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(cleanJson);
    parsed.id = `ai-proc-${Date.now()}`;
    parsed.isGeneratedByAI = true;

    return this.saveCustom(parsed);
  },

  /**
   * Responde dúvidas clínicas pontuais sobre o procedimento em execução (Goti AI).
   */
  async askGotiAI(procedure, userQuestion) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      // Resposta pré-computada offline caso não haja chave Gemini
      return `Como preceptor clínico de enfermagem (Goti), informo que durante o procedimento de ${procedure.title}, a prioridade é sempre manter a técnica asséptica estrita e observar as queixas do paciente. Se houver resistência anatômica ou dúvida, pause o procedimento e reavalie a anatomia do sítio antes de prosseguir.`;
    }

    const activeModel = localStorage.getItem('enfermeiro_gemini_model') || 'gemini-2.0-flash';

    const prompt = `Você é o Preceptor Goti AI, a gota inteligente e tutor especialista em procedimentos de enfermagem da plataforma Enfere.
O estudante está assistindo e treinando o procedimento: "${procedure.title}".
Descrição do procedimento: ${procedure.description}.
Normativa COFEN: ${procedure.cofenNorm}.
Dúvida do estudante: "${userQuestion}".

Responda em 1 a 2 parágrafos curtos, diretos e objetivos, com alto rigor científico, fundamentação anatômica e foco na segurança do paciente. Enfatize condutas práticas de beira-leito com o tom encorajador do Goti.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!res.ok) {
      return 'Não foi possível conectar com o Preceptor Goti no momento. Consulte o POP do procedimento acima.';
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta disponível.';
  },

  // Alias retrocompatível
  async askFlorenceAI(procedure, userQuestion) {
    return this.askGotiAI(procedure, userQuestion);
  },
};
