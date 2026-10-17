/**
 * procedureService.js
 * Serviço de Videoteca Didática & Laboratório de Habilidades Clínicas de Enfermagem (Skills Lab).
 * Reúne procedimentos fundamentais e avançados com vídeos institucionais de alta definição,
 * diretrizes 'O Que Fazer' e 'O Que NÃO Fazer', checklists assépticos e tutoria com IA (Goti AI).
 */

import { clinicalGamificationService } from './clinicalGamificationService';
import { getProcedurePreview } from './procedurePreviews';

const STORAGE_KEY = 'enfermeiro_digital_custom_procedures';

// Chave da API do Google Gemini
function getGeminiApiKey() {
  if (typeof localStorage !== 'undefined') {
    const key = localStorage.getItem('enfermeiro_gemini_api_key');
    if (key && key.trim()) return key.trim();
  }
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

// Catálogo Mestre Pré-Carregado de Procedimentos de Enfermagem (Padrão Hospitalar & Acadêmico)
export const MASTER_PROCEDURES = [
  {
    id: 'rcp-suporte-basico-vida',
    title: 'Parada Cardiorrespiratória & Suporte Básico de Vida (BLS/RCP no Adulto)',
    category: 'urgencia',
    categoryLabel: 'Urgência & Emergência',
    duration: '10 min',
    difficulty: 'Essencial',
    levelBadge: 'Protocolo AHA / SBC',
    institutionalBadge: 'Hospital Israelita Albert Einstein',
    cofenNorm: 'Diretrizes de Ressuscitação Cardiopulmonar AHA / SBC e Atuação da Enfermagem',
    officialGuideUrl: 'https://cofen.gov.br',
    sourceUrl: 'https://www.youtube.com/watch?v=LquiiQVKqKE',
    videoUrl: 'https://www.youtube.com/embed/LquiiQVKqKE', // Vídeo oficial Albert Einstein
    videoSource: 'Hospital Israelita Albert Einstein · Dr. Rafael Rafaini Lloret',
    previewImage: getProcedurePreview('rcp-suporte-basico-vida'),
    description: 'Reconhecimento imediato de PCR (ausência de pulso central e respiração/gasping), chamada de socorro, compressões torácicas de alta qualidade (100 a 120/min) e uso precoce do DEA.',
    materials: [
      { id: 'm1', name: 'Desfibrilador Externo Automático (DEA) com pás adesivas adulto', checked: false },
      { id: 'm2', name: 'Dispositivo bolsa-válvula-máscara (Ambu) conectado à fonte de oxigênio a 15 L/min', checked: false },
      { id: 'm3', name: 'Prancha rígida posicionada sob o tórax do paciente', checked: false },
      { id: 'm4', name: 'Cânula orofaríngea (Guedel) de tamanho adequado', checked: false },
      { id: 'm5', name: 'EPIs: Máscara cirúrgica/N95, óculos de proteção e luvas', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Reconhecer PCR em até 10 segundos', desc: 'Chamar pelo paciente nos ombros. Checar pulso carotídeo e movimentos respiratórios simultaneamente em no máximo 10 segundos. Se sem pulso ou apenas gasping: É PCR!', checked: false },
      { id: 's2', stepNumber: 2, title: 'Solicitar ajuda e o DEA imediatamente', desc: 'Apontar para alguém específico da equipe: "Ligue para a emergência/código azul e traga o carrinho com o DEA agora!".', checked: false },
      { id: 's3', stepNumber: 3, title: 'Compressões torácicas de alta qualidade', desc: 'Posicionar a região tenar da mão no terço inferior do esterno e comprimir com profundidade de 5 a 6 cm na frequência de 100 a 120 compressões por minuto.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Retorno completo do tórax', desc: 'Permitir o descompressão torácica total entre as compressões para possibilitar o enchimento diastólico das artérias coronárias.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Ciclos de 30:2 com via aérea básica', desc: 'Realizar 30 compressões seguidas de 2 ventilações de 1 segundo cada com o Ambu (técnica C-E para vedação hermética).', checked: false },
      { id: 's6', stepNumber: 6, title: 'Chegada do DEA e choque precoce', desc: 'Ligar o DEA imediatamente, colar as pás adesivas (infraclavicular direita e ápice cardíaco esquerdo) e comandar afastamento total da equipe durante a análise e o disparo.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'NÃO interrompa as compressões por mais de 10 segundos', text: 'Cada segundo sem massagem derruba a pressão de perfusão coronariana a zero. São necessários quase 2 minutos de compressão ininterrupta para restabelecer a perfusão cerebral mínima.' },
      { type: 'danger', title: 'Certifique-se de que NINGUÉM encosta no paciente ao disparar o choque', text: 'Olhar da cabeça aos pés e comandar em voz alta: "Afastem-se todos!". A corrente do choque transmitida a um membro da equipe pode deflagrar fibrilação ventricular.' },
      { type: 'warning', title: 'Evite hiperventilar o paciente', text: 'Ventilar com força excessiva ou frequência maior que 1 ventilação a cada 6 segundos aumenta a pressão intratorácica e impede o retorno venoso ao coração.' },
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
    institutionalBadge: 'LabEnf UFSM · Universidade Federal de Santa Maria',
    cofenNorm: 'Resolução COFEN nº 450/2013 & Parecer COFEN 03/2021 (Atividade Privativa do Enfermeiro)',
    officialGuideUrl: 'https://cofen.gov.br/resolucao-cofen-no-450-2013/',
    sourceUrl: 'https://www.youtube.com/watch?v=YAZjFfpj0hU',
    videoUrl: 'https://www.youtube.com/embed/YAZjFfpj0hU', // Vídeo oficial LabEnf UFSM
    videoSource: 'Laboratório de Enfermagem da UFSM (LabEnf)',
    previewImage: getProcedurePreview('sondagem-vesical-demora'),
    description: 'Inserção de sonda Foley com balão de retenção para drenagem contínua de urina em sistema fechado, com ênfase máxima em assepsia e prevenção de ITU associada a cateter (ITU-AC).',
    materials: [
      { id: 'm1', name: 'Sonda Foley de 2 ou 3 vias (calibre 12, 14 ou 16 Fr)', checked: false },
      { id: 'm2', name: 'Bolsa coletora de sistema fechado com válvula antirrefluxo e torneira de drenagem', checked: false },
      { id: 'm3', name: 'Kit de cateterismo estéril (cúpula, cuba rim, pinça Cheron e gaze estéril)', checked: false },
      { id: 'm4', name: 'Dois pares de luvas estéreis de procedimento cirúrgico', checked: false },
      { id: 'm5', name: 'Ampola de água destilada (10 a 20 mL) - NUNCA use soro fisiológico!', checked: false },
      { id: 'm6', name: 'Seringa de 10 ou 20 mL e agulha 40x12 para aspiração da água destilada', checked: false },
      { id: 'm7', name: 'Gel lubrificante anestésico (Lidocaína gel a 2% em seringa esterilizada)', checked: false },
      { id: 'm8', name: 'Antisséptico aquoso (Clorexidina aquosa a 0,2% ou Povidona aquosa)', checked: false },
      { id: 'm9', name: 'Campo fenestrado estéril e fita adesiva para fixação sem tração', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Privativo do Enfermeiro', desc: 'Conforme Resolução COFEN nº 450/2013, o cateterismo vesical é privativo do enfermeiro devido à complexidade e ao risco de trauma e infecção urinária grave.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Higiene íntima prévia', desc: 'Realizar higiene perineal completa com água e sabão antes da paramentação estéril para reduzir a flora bacteriana genital.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Montagem do campo cirúrgico estéril', desc: 'Calçar luva estéril, dispor o campo fenestrado e testar o balão da sonda Foley com água destilada para verificar a integridade antes da inserção.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Antissepsia criteriosa', desc: 'No homem: retrair o prepúcio e higienizar glande e meato em movimentos espirais. Na mulher: afastar pequenos lábios e limpar no sentido clitóris-ânus (trocar gaze a cada passada).', checked: false },
      { id: 's5', stepNumber: 5, title: 'Instilação de anestésico gel', desc: 'No homem: instilar 10 a 15 mL de lidocaína 2% gel diretamente na uretra e aguardar 3 minutos para anestesia local. Na mulher: lubrificar amplamente a ponta da sonda.', checked: false },
      { id: 's6', stepNumber: 6, title: 'Inserção até a bifurcação e refluxo de urina', desc: 'Introduzir a sonda delicadamente. No homem, tracionar o pênis a 90° e depois a 60°. Inserir ATÉ A BIFURCAÇÃO DA SONDA para garantir que o balonete está integralmente dentro da bexiga.', checked: false },
      { id: 's7', stepNumber: 7, title: 'Insuflação com Água Destilada e fixação', desc: 'Após retorno franco de urina, insuflar o balão com o volume prescrito de água destilada, tracionar suavemente até sentir a resistência do colo vesical e fixar a sonda sem tração.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'JAMAIS insufle o balão com Soro Fisiológico (SF 0,9%)', text: 'O cloreto de sódio cristaliza dentro do canalete ao longo dos dias, bloqueando a válvula e impossibilitando o esvaziamento para a retirada do cateter (exige intervenção cirúrgica).' },
      { type: 'danger', title: 'NUNCA insufle o balão antes de ver urina ou na uretra', text: 'Insuflar o balão dentro da uretra prostática causa laceração uretral severa com hemorragia e estenose cicatricial definitiva!' },
      { type: 'warning', title: 'Mantenha a bolsa SEMPRE abaixo do nível da bexiga', text: 'Elevar a bolsa coletora acima do paciente provoca refluxo de urina colonizada para a bexiga, sendo a principal causa de choque séptico hospitalar por ITU.' },
    ],
  },
  {
    id: 'puncao-venosa',
    title: 'Punção Venosa Periférica (Cateter sobre Agulha - Jelco)',
    category: 'vasculares',
    categoryLabel: 'Acessos Vasculares',
    duration: '6 min',
    difficulty: 'Fundamental',
    levelBadge: 'Iniciante ao Avançado',
    institutionalBadge: 'Escola de Enfermagem UFRGS & Diretrizes COFEN',
    cofenNorm: 'Resolução COFEN nº 736/2024 e Diretrizes de Terapia Infusional INS Brasil',
    officialGuideUrl: 'https://videos.ufrgs.br',
    sourceUrl: 'https://www.youtube.com/watch?v=p80bpqyOyEc',
    videoUrl: 'https://www.youtube.com/embed/p80bpqyOyEc', // Aula prática horizontal 16:9
    videoSource: 'Escola de Enfermagem UFRGS (SEAD) · Prof. Emerson Marques',
    previewImage: getProcedurePreview('puncao-venosa'),
    description: 'Técnica asséptica de cateterização venosa periférica para infusão de fármacos, hidratação venosa e hemocomponentes, com escolha correta de calibre e prevenção de flebite.',
    materials: [
      { id: 'm1', name: 'Cateter periférico de calibre adequado (18G, 20G ou 22G)', checked: false },
      { id: 'm2', name: 'Garrote descartável de silicone ou látex', checked: false },
      { id: 'm3', name: 'Algodão ou gaze estéril com álcool a 70% ou clorexidina alcoólica', checked: false },
      { id: 'm4', name: 'Luvas de procedimento não estéreis', checked: false },
      { id: 'm5', name: 'Extensor multivias com clamp e seringa com SF 0,9% para flush', checked: false },
      { id: 'm6', name: 'Curativo estéril transparente com borda reforçada', checked: false },
      { id: 'm7', name: 'Fita adesiva hipoalergênica para identificação legível (data, hora, calibre e profissional)', checked: false },
      { id: 'm8', name: 'Caixa coletora para perfurocortantes (Descarpack)', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Identificação e orientação ao paciente', desc: 'Confirmar os 2 identificadores do paciente (nome completo e data de nascimento) e explicar a finalidade do acesso venoso.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Seleção do sítio venoso', desc: 'Priorizar veias distais do membro superior não dominante (cefálica, basílica ou intermediária do antebraço). Evitar articulações de flexão e membros com FAV ou mastectomia.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Garroteamento correto', desc: 'Aplicar o garrote 10 a 15 cm acima do local escolhido por no máximo 1 minuto para não gerar hemoconcentração ou hematoma.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Antissepsia asséptica da pele', desc: 'Friccionar clorexidina alcoólica a 0,5% ou álcool a 70% por 30 segundos com movimentos unidirecionais ou circulares e aguardar secagem espontânea.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Punção com bisel voltado para cima', desc: 'Tracionar a pele distalmente e introduzir o cateter em ângulo de 15 a 30 graus até observar o refluxo imediato de sangue na câmara de refluxo.', checked: false },
      { id: 's6', stepNumber: 6, title: 'Avanço da cânula plástica e recuo do mandril', desc: 'Abaixar o ângulo rente à pele, avançar a cânula de teflon/poliuretano na veia enquanto recua o mandril metálico com firmeza.', checked: false },
      { id: 's7', stepNumber: 7, title: 'Soltar garrote, conexão e flush salino', desc: 'Desgarrotear, ocluir suavemente o vaso distal à ponta da cânula, acoplar o extensor salinizado e testar fluxo e refluxo sem dor.', checked: false },
      { id: 's8', stepNumber: 8, title: 'Fixação transparente e identificação', desc: 'Cobrir o sítio com película transparente estéril. Identificar com data, hora, calibre do cateter e COREN do profissional.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'NUNCA reintroduza o mandril metálico na cânula', text: 'Se o cateter sair da veia ou falhar, jamais reintroduza a agulha de volta. Risco grave de cisalhamento da ponta plástica e embolia por corpo estranho na circulação!' },
      { type: 'warning', title: 'Aguarde a secagem completa do antisséptico', text: 'Puncionar com a pele úmida de álcool provoca dor em queimação intensa ao paciente e anula a ação germicida residual do antisséptico.' },
      { type: 'tip', title: 'Cuidado redobrado em pacientes idosos', text: 'Em idosos com fragilidade capilar, evite garrotear com muita pressão para não estourar a veia; prefira garroteamento suave e tração delicada da pele.' },
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
    institutionalBadge: 'Protocolo de Nutrição Enteral · COFEN & ESPEN',
    cofenNorm: 'Resolução COFEN nº 627/2020 (SNE privativa do Enfermeiro; SNG com supervisão)',
    officialGuideUrl: 'https://cofen.gov.br/resolucao-cofen-no-627-2020/',
    sourceUrl: 'https://www.youtube.com/watch?v=PtWrYZCVH0U',
    videoUrl: 'https://www.youtube.com/embed/PtWrYZCVH0U', // Aula técnica com manequim e mensuração anatômica
    videoSource: 'Descomplica Enfermagem · Simulação e POP Hospitalar',
    previewImage: getProcedurePreview('sondagem-nasogastrica-nasoenteral'),
    description: 'Medição anatômica correta, lubrificação, inserção atraumática e métodos mandatórios de confirmação de posicionamento (Raio-X de controle e teste de pH gástrico).',
    materials: [
      { id: 'm1', name: 'Sonda nasogástrica (Levin 14-16 Fr) ou nasoenteral (Dobbhoff com fio-guia)', checked: false },
      { id: 'm2', name: 'Gel lubrificante hidrossolúvel estéril', checked: false },
      { id: 'm3', name: 'Estetoscópio e fita métrica flexível', checked: false },
      { id: 'm4', name: 'Seringa de 20 mL ou 50 mL tipo bico cateter', checked: false },
      { id: 'm5', name: 'Luvas de procedimento não estéreis e toalha protetora', checked: false },
      { id: 'm6', name: 'Copo com água e canudo (se paciente consciente e sem disfagia)', checked: false },
      { id: 'm7', name: 'Fita adesiva tipo micropore para fixação nasal em borboleta', checked: false },
      { id: 'm8', name: 'Fita reagente de pH (0 a 14) para teste de acidez gástrica', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Medição correta (Técnica NOX)', desc: 'Medir da ponta do nariz ao lóbulo da orelha e desta até o apêndice xifoide. Para sondagem nasoenteral pós-pilórica, adicionar de 20 a 25 cm à mensuração.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Posicionamento em Fowler alto', desc: 'Elevar a cabeceira a 45°-90°, com o pescoço ligeiramente flexionado para anteriorizar a epiglote e facilitar a passagem esofágica.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Lubrificação abundante', desc: 'Lubrificar os primeiros 10 cm da sonda com gel hidrossolúvel para deslizamento suave sem sangramento de cornetos nasais.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Introdução com comando de deglutição', desc: 'Inserir pelo assoalho da narina. Ao atingir a orofaringe, pedir para o paciente engolir (ou dar pequenos goles de água) enquanto a sonda avança com suavidade.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Atenção aos sinais respiratórios', desc: 'Se o paciente tossir, engasgar, apresentar cianose ou dessaturação, RECUAR A SONDA IMEDIATAMENTE. Ela está na via aérea traqueal!', checked: false },
      { id: 's6', stepNumber: 6, title: 'Confirmação mandatória antes do uso', desc: 'Aspirar secreção e medir pH (< 5,5 no estômago). Na sonda nasoenteral com fio-guia, o Raio-X de controle é OBRIGATÓRIO antes de iniciar a dieta.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'NUNCA administre dieta ou água sem o Raio-X confirmatório da SNE', text: 'O teste de ausculta com ar pode ser enganoso se a sonda estiver alojada no brônquio. A infusão de dieta no pulmão é causa direta de choque e morte por pneumonite química severa!' },
      { type: 'danger', title: 'Contraindicação formal em fratura de base de crânio', text: 'Em pacientes com traumatismo cranioencefálico grave (TCE), epistaxe traumática ou sinal do guaxinim, a via nasal é formalmente PROIBIDA (risco de penetração intracraniana). Utilizar via orogástrica.' },
    ],
  },
  {
    id: 'injecao-intramuscular-z',
    title: 'Administração de Medicamentos por Via Intramuscular (Técnica em Z)',
    category: 'medicamentos',
    categoryLabel: 'Terapia Medicamentosa',
    duration: '8 min',
    difficulty: 'Fundamental',
    levelBadge: 'Semiotécnica Prática',
    institutionalBadge: 'Farmacologia & Enfermagem Baseada em Evidências',
    cofenNorm: 'Pareceres COFEN sobre vias de administração, delimitação de sítios e volumes máximos',
    officialGuideUrl: 'https://cofen.gov.br',
    sourceUrl: 'https://www.youtube.com/watch?v=QdMri9FJktg',
    videoUrl: 'https://www.youtube.com/embed/QdMri9FJktg', // Aula completa horizontal 16:9 (sem shorts)
    videoSource: 'Laboratório de Semiotécnica & Farmacologia Prática',
    previewImage: getProcedurePreview('injecao-intramuscular-z'),
    description: 'Escolha correta dos sítios de aplicação (ventroglúteo de Hochstetter, vasto lateral da coxa e deltoide), limites de volume e técnica em Z para vedação do trajeto medicamentoso.',
    materials: [
      { id: 'm1', name: 'Seringa de 3 mL ou 5 mL com graduação nítida', checked: false },
      { id: 'm2', name: 'Agulha para aspiração (40x12 mm) e agulha para aplicação (30x7 ou 25x7 mm)', checked: false },
      { id: 'm3', name: 'Medicação prescrita conferida rigorosamente na regra dos 9 certos', checked: false },
      { id: 'm4', name: 'Algodão seco e algodão embebido em álcool a 70%', checked: false },
      { id: 'm5', name: 'Luvas de procedimento', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Delimitação anatômica do Ventroglúteo (Hochstetter)', desc: 'Colocar o indicador sobre a espinha ilíaca anterossuperior e abrir o dedo médio formando um V na crista ilíaca. O centro do V é o sítio mais seguro do corpo, livre de grandes vasos e nervos.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Tração da pele em Z', desc: 'Com a mão não dominante, tracionar a pele e o tecido subcutâneo lateralmente cerca de 2,5 cm antes de introduzir a agulha.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Inserção a 90 graus', desc: 'Introduzir a agulha com movimento firme e perpendicular de 90° em relação à superfície da pele.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Aspiração obrigatória por 5 segundos', desc: 'Aspirar o êmbolo suavemente. Se houver retorno de sangue, retirar imediatamente, desprezar todo o material e reiniciar o preparo com nova medicação.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Injeção lenta e retirada', desc: 'Injetar lentamente na velocidade de 1 mL a cada 10 segundos. Aguardar 10 segundos antes de retirar a agulha para permitir a acomodação no músculo.', checked: false },
      { id: 's6', stepNumber: 6, title: 'Soltar a pele e vedar o trajeto', desc: 'Retirar a agulha e soltar a pele em seguida. Os planos teciduais se desalinharem, vedando o canal e impedindo o refluxo de substâncias cáusticas para o subcutâneo.', checked: false },
    ],
    safetyAlerts: [
      { type: 'warning', title: 'Volume máximo no músculo deltoide é de 2 a 3 mL', text: 'No músculo deltoide de adultos, o volume máximo recomendado é de 2 mL (máximo absoluto 3 mL). Volumes maiores geram necrose e compressão do nervo radial.' },
      { type: 'danger', title: 'NUNCA massageie o sítio após injeção com técnica em Z', text: 'Massagear após a aplicação empurra o medicamento de volta para o tecido celular subcutâneo, causando manchas permanentes na pele e abscessos inflamatórios dolorosos.' },
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
    institutionalBadge: 'Protocolo de UTI Respiratória & Prevenção de PAV',
    cofenNorm: 'Resolução COFEN nº 557/2017 (Procedimento privativo de Enfermagem em pacientes críticos)',
    officialGuideUrl: 'https://cofen.gov.br/resolucao-cofen-no-0557-2017/',
    sourceUrl: 'https://www.youtube.com/watch?v=KiLr6qCs8bk',
    videoUrl: 'https://www.youtube.com/embed/KiLr6qCs8bk', // Vídeo técnico em UTI
    videoSource: 'Prática Enfermagem · Cuidados Críticos em Terapia Intensiva',
    previewImage: getProcedurePreview('aspiracao-vias-aereas'),
    description: 'Remoção segura de secreções traqueobrônquicas em pacientes intubados ou traqueostomizados com técnica estéril, controle rigoroso de vácuo e hiperoxigenação prévia.',
    materials: [
      { id: 'm1', name: 'Sonda de aspiração traqueal estéril com válvula de alívio (calibre 12 a 14 Fr)', checked: false },
      { id: 'm2', name: 'Sistema de aspiração a vácuo com manômetro regulado (80 a 120 mmHg)', checked: false },
      { id: 'm3', name: 'Luvas estéreis de procedimento para técnica aberta (ou circuito fechado Trach Care)', checked: false },
      { id: 'm4', name: 'Ampola de água destilada ou SF 0,9% estéril para lavagem do circuito coletor', checked: false },
      { id: 'm5', name: 'EPIs: Óculos de proteção, máscara cirúrgica ou N95 e avental', checked: false },
      { id: 'm6', name: 'Estetoscópio e oxímetro de pulso para monitorização contínua', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Hiperoxigenar o paciente previamente', desc: 'Ofertar FiO2 a 100% por pelo menos 1 a 2 minutos antes do procedimento para prevenir hipoxemia severa decorrente da aspiração de volume pulmonar.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Regular pressão de sucção no manômetro', desc: 'Ajustar a pressão de vácuo entre 80 e 120 mmHg em adultos (máximo 150 mmHg). Pressões elevadas causam atelectasias e hemorragia na mucosa traqueal.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Inserir a sonda SEM vácuo', desc: 'Introduzir a sonda no tubo com a válvula de alívio ABERTA (sem sucção ativa), até sentir leve resistência (carina) e recuar 1 a 2 cm antes de aspirar.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Sucção intermitente e rotatória (< 10-15s)', desc: 'Ocluir a válvula e retirar a sonda com movimentos giratórios contínuos. O tempo total de sucção NUNCA deve ultrapassar 10 a 15 segundos.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Reoxigenação e ausculta pulmonar', desc: 'Reconectar ao ventilador, aguardar estabilização dos sinais vitais antes de uma nova passada (máximo 3 aspirações por sessão).', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'Risco de bradicardia severa e parada por reflexo vagal', text: 'Bater na carina repetidamente ou prolongar a aspiração além de 15 segundos provoca estimulação parassimpática vagal súbita com bradicardia e risco de assistolia.' },
      { type: 'warning', title: 'NUNCA instile soro fisiológico rotineiramente no tubo', text: 'Instilar soro fisiológico para "amolecer secreções" carreia biofilmes bacterianos para as vias aéreas distais, aumentando o risco de Pneumonia Associada à Ventilação Mecânica (PAV).' },
    ],
  },
  {
    id: 'curativo-lesao-pressao',
    title: 'Curativo & Tratamento de Lesão por Pressão (LPP Estágios 1 a 4)',
    category: 'curativos',
    categoryLabel: 'Curativos & Lesões',
    duration: '8 min',
    difficulty: 'Intermediário',
    levelBadge: 'Estomaterapia & Pele',
    institutionalBadge: 'Protocolo de Feridas & Estomaterapia · SOBEST',
    cofenNorm: 'Resolução COFEN nº 567/2018 (Atuação da equipe de enfermagem no cuidado a feridas)',
    officialGuideUrl: 'https://cofen.gov.br/resolucao-cofen-no-567-2018/',
    sourceUrl: 'https://www.youtube.com/watch?v=12BeFVs5F2M',
    videoUrl: 'https://www.youtube.com/embed/12BeFVs5F2M', // Demonstração técnica de curativos para LPP
    videoSource: 'Descomplica Enfermagem · Estomaterapia & Cicatrização',
    previewImage: getProcedurePreview('curativo-lesao-pressao'),
    description: 'Estadiamento de lesão por pressão, limpeza com jatos de soro fisiológico a 0,9% morno, avaliação tecidual (granulação vs esfacelo) e escolha da cobertura ideal (hidrogel, alginato de cálcio, espuma).',
    materials: [
      { id: 'm1', name: 'Pacote de curativo estéril (pinça anatômica, pinça dente de rato e pinça hemostática)', checked: false },
      { id: 'm2', name: 'Frasco de Soro Fisiológico 0,9% morno (ou PHMB para feridas colonizadas/infectadas)', checked: false },
      { id: 'm3', name: 'Agulha 40x12 mm para perfurar o frasco e produzir jato com pressão de 8 a 15 psi', checked: false },
      { id: 'm4', name: 'Cobertura primária prescrita (Hidrogel, Alginato de cálcio, Espuma de poliuretano ou Prata)', checked: false },
      { id: 'm5', name: 'Gaze estéril e cobertura secundária de proteção', checked: false },
      { id: 'm6', name: 'Fita métrica de papel descartável para registro de evolução em centímetros', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Limpeza em jatos contínuos sem esfregar', desc: 'Irrigar o leito da lesão com SF 0,9% morno em jatos contínuos com agulha 40x12. Nunca esfregar com gaze o tecido de granulação vermelho vivo para não lesar a neoangiogênese.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Secagem exclusiva da borda perilesional', desc: 'Secar delicadamente apenas a pele íntegra ao redor da ferida, preservando o leito limpo e fisiologicamente úmido.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Escolha da cobertura de acordo com o exsudato', desc: 'Leito com necrose seca: Hidrogel para desbridamento autolítico. Leito exsudativo: Alginato de cálcio ou hidrocelular com espuma para absorção controlada.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Proteção da borda com película barreira', desc: 'Aplicar spray protetor sem álcool nas bordas para evitar a maceração da pele pelo exsudato.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Registro e evolução de enfermagem', desc: 'Anotar dimensões em centímetros, aspecto do leito tecidual, odor, drenagem e a cobertura aplicada.', checked: false },
    ],
    safetyAlerts: [
      { type: 'warning', title: 'Soluções citotóxicas no leito da lesão são proibidas', text: 'É formalmente contraindicado o uso de PVPI tópico, éter, água oxigenada ou clorexidina degermante no leito da ferida. Essas substâncias são citotóxicas e matam os fibroblastos em proliferação.' },
    ],
  },
];

export const procedureService = {
  /**
   * Lista todos os procedimentos (pré-carregados + customizados).
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
   * Salva um novo procedimento customizado.
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
   * Conclui o treinamento de um procedimento, atribuindo XP e progresso na carreira.
   */
  completeProcedure() {
    const res = clinicalGamificationService.recordActivity('case_solved', 30);
    return {
      success: true,
      earnedXp: 30,
      state: res.state,
    };
  },

  /**
   * Gera um POP completo com IA (Google Gemini).
   */
  async generateProcedureWithAI(promptTopic) {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error('Configure sua chave do Google Gemini em Minha Conta para gerar procedimentos com IA.');
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
  "institutionalBadge": "Fonte Acadêmica ou Hospitalar de Referência",
  "cofenNorm": "Legislação aplicável (COFEN/ANVISA)",
  "videoUrl": "https://www.youtube.com/embed/6cxkjHMU__E",
  "videoSource": "Simulação Didática com Goti AI",
  "description": "Indicação clínica, finalidade e justificativa científica",
  "materials": [
    { "id": "m1", "name": "Nome do material estéril ou de suporte", "checked": false }
  ],
  "steps": [
    { "id": "s1", "stepNumber": 1, "title": "Título do passo", "desc": "Instrução técnica detalhada e precisa", "checked": false }
  ],
  "safetyAlerts": [
    { "type": "danger" | "warning" | "tip", "title": "Alerta de Iatrogenia ou Erro Crítico", "text": "Explicação do risco e como prevenir" }
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

  async askFlorenceAI(procedure, userQuestion) {
    return this.askGotiAI(procedure, userQuestion);
  },
};
