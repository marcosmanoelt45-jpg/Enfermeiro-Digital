/**
 * procedureService.js
 * Serviço de Videoteca Didática & Laboratório de Habilidades Clínicas de Enfermagem (Skills Lab).
 * Integra o acervo oficial do Laboratório de Enfermagem da Universidade Federal de Santa Maria (LabEnf / UFSM)
 * com procedimentos fundamentais e avançados, diretrizes COFEN, checklists assépticos e suporte do Goti IA.
 */

import { clinicalGamificationService } from './clinicalGamificationService';
import { getProcedurePreview } from './procedurePreviews';
import { callResilientAI } from './aiCoreService';

const STORAGE_KEY = 'enfermeiro_digital_custom_procedures';
const WATCHED_STORAGE_KEY = 'enfermeiro_digital_watched_procedures';

export const LABENF_UFSM_URL = 'https://www.ufsm.br/laboratorios/labenf/projetos/videos-de-procedimentos';
export const LABENF_UFSM_EBOOK_URL = 'https://www.ufsm.br/app/uploads/sites/837/2022/10/versao-final-e-book.pdf';
export const LABENF_UFSM_BADGE = 'LabEnf UFSM · Universidade Federal de Santa Maria';
export const LABENF_UFSM_SOURCE =
  'Laboratório de Enfermagem da UFSM (LabEnf / CCS) · Autoras: Alessandra M. Santini, Carla M. Brites, Daiana de Araújo, Dalva C. da Silva, Fernanda L. Buboltz, Jennifer A. L. de Menezes, Priscila de O. B. Bonadiman · Revisão: Prof. Dr. Márcio R. Badke, Profa. Dra. Maria D. Schimith, Profa. Dra. Silvana B. Cogo';

// Catálogo Mestre Pré-Carregado de Procedimentos de Enfermagem (LabEnf UFSM + Acervo Hospitalar/Acadêmico)
export const MASTER_PROCEDURES = [
  // =========================================================================
  // 1. VERIFICAÇÃO DE SINAIS VITAIS (UFSM LabEnf - PqmE1NVdqak)
  // =========================================================================
  {
    id: 'verificacao-sinais-vitais',
    title: 'Verificação de Sinais Vitais (PA, Pulso, Respiração, Temperatura e Dor)',
    category: 'semiotecnica',
    categoryLabel: 'Semiotécnica & Biossegurança',
    duration: '11 min',
    difficulty: 'Fundamental',
    levelBadge: 'Semiotécnica Fundamental',
    institutionalBadge: LABENF_UFSM_BADGE,
    cofenNorm: 'Resolução COFEN nº 736/2024 (Avaliação Inicial de Enfermagem) & Diretrizes Brasileiras de Hipertensão',
    officialGuideUrl: LABENF_UFSM_URL,
    sourceUrl: 'https://www.youtube.com/watch?v=PqmE1NVdqak',
    videoUrl: 'https://www.youtube.com/embed/PqmE1NVdqak',
    videoSource: LABENF_UFSM_SOURCE,
    previewImage: getProcedurePreview('verificacao-sinais-vitais'),
    description: 'Aferição sistematizada e precisa dos sinais vitais (temperatura axilar, frequência cardíaca/pulso radial, frequência respiratória, pressão arterial auscultatória/palpatória e avaliação da dor como 5º sinal vital).',
    materials: [
      { id: 'm1', name: 'Esfigmomanômetro calibrado com manguito adequado à circunferência braquial (largura = 40% e comprimento = 80% do braço)', checked: false },
      { id: 'm2', name: 'Estetoscópio clínico (campânula e diafragma higienizados)', checked: false },
      { id: 'm3', name: 'Termômetro clínico digital', checked: false },
      { id: 'm4', name: 'Relógio com marcador de segundos', checked: false },
      { id: 'm5', name: 'Algodão ou gaze embebidos em álcool a 70% para desinfecção dos artigos', checked: false },
      { id: 'm6', name: 'Bandeja limpa e prontuário/folha de controle para registro imediato', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Higienização das mãos, identificação e repouso prévio', desc: 'Higienizar as mãos, conferir a identidade do paciente e certificar-se de que ele está em repouso por pelo menos 5 minutos, sem ter fumado, ingerido cafeína ou realizado esforço nos últimos 30 minutos.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Verificação da Temperatura Axilar (Tax)', desc: 'Secar a axila caso esteja úmida, posicionar o bulbo do termômetro digital no cavo axilar mantendo o braço aduzido junto ao tórax até o sinal sonoro e registrar em °C.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Avaliação do Pulso Arterial (FC)', desc: 'Com os dedos indicador e médio sobre a artéria radial (canal do pulso), contar os batimentos durante 60 segundos completos avaliando frequência (bpm), ritmo (regular/irregular) e amplitude (cheio/filiforme).', checked: false },
      { id: 's4', stepNumber: 4, title: 'Contagem da Frequência Respiratória (FR)', desc: 'Sem que o paciente perceba que sua respiração está sendo observada (mantendo os dedos no pulso radial), contar as incursões ventilatórias torácicas durante 60 segundos (irpm).', checked: false },
      { id: 's5', stepNumber: 5, title: 'Aferição da Pressão Arterial (Método Palpatório + Auscultatório)', desc: 'Posicionar o manguito 2 a 3 cm acima da fossa antecubital com o braço na altura do coração. Estimar a PAS pelo método palpatório da artéria radial para evitar o hiato auscultatório, aguardar 30s, posicionar o diafragma sobre a artéria braquial, insuflar 20-30 mmHg acima da PAS estimada e desinsuflar a 2 mmHg/s identificando o 1º som de Korotkoff (PAS) e o 5º som (PAD).', checked: false },
      { id: 's6', stepNumber: 6, title: 'Desinfecção dos materiais e registro em prontuário', desc: 'Realizar fricção com álcool a 70% nas olivas, diafragma, termômetro e manguito. Higienizar as mãos e registrar imediatamente os parâmetros e eventuais alterações.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'NUNCA afira a Pressão Arterial em membro com Fístula Arteriovenosa (FAV) ou esvaziamento axilar', text: 'A compressão do manguito em membro com fístula para hemodiálise provoca trombose da FAV; em pacientes pós-mastectomia com linfadenectomia, agrava o risco de linfedema.' },
      { type: 'warning', title: 'Sempre realize a etapa palpatória antes da auscultatória', text: 'Pular a palpação prévia do pulso radial em pacientes idosos ou hipertensos pode subestimar a pressão sistólica devido ao fenômeno do hiato auscultatório.' },
      { type: 'tip', title: 'Não avise o paciente no momento exato em que estiver contando a frequência respiratória', text: 'Quando o paciente sabe que sua respiração está sendo avaliada, ele altera voluntariamente a frequência e a profundidade ventilatória.' },
    ],
  },

  // =========================================================================
  // 2. COLOCAÇÃO E REMOÇÃO DE LUVAS ESTÉREIS (UFSM LabEnf - 95Da3FCoNFo)
  // =========================================================================
  {
    id: 'colocacao-remocao-luvas-estereis',
    title: 'Colocação e Remoção de Luvas Estéreis (Técnica Asséptica)',
    category: 'semiotecnica',
    categoryLabel: 'Semiotécnica & Biossegurança',
    duration: '4 min',
    difficulty: 'Fundamental',
    levelBadge: 'Biossegurança & Assepsia',
    institutionalBadge: LABENF_UFSM_BADGE,
    cofenNorm: 'Diretrizes ANVISA / OMS de Segurança do Paciente e Técnica Asséptica Cirúrgica',
    officialGuideUrl: LABENF_UFSM_URL,
    sourceUrl: 'https://www.youtube.com/watch?v=95Da3FCoNFo',
    videoUrl: 'https://www.youtube.com/embed/95Da3FCoNFo',
    videoSource: LABENF_UFSM_SOURCE,
    previewImage: getProcedurePreview('colocacao-remocao-luvas-estereis'),
    description: 'Técnica padronizada de calçamento e retirada de luvas cirúrgicas estéreis preservando a barreira microbiológica (princípio fundamental: superfície estéril toca apenas superfície estéril; pele toca apenas face interna).',
    materials: [
      { id: 'm1', name: 'Par de luvas cirúrgicas estéreis de numeração adequada ao profissional (ex: 6.5, 7.0, 7.5, 8.0)', checked: false },
      { id: 'm2', name: 'Pia com água e sabonete líquido ou preparação alcoólica a 70% para higienização prévia das mãos', checked: false },
      { id: 'm3', name: 'Superfície plana, limpa, seca e acima do nível da cintura para abertura do invólucro', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Retirada de adornos e higienização rigorosa das mãos', desc: 'Retirar anéis, alianças, relógios e pulseiras (Norma Regulamentadora NR-32). Realizar a higienização das mãos e secá-las completamente antes de tocar na embalagem.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Verificação da integridade e abertura do pacote externo e interno', desc: 'Conferir validade e integridade da embalagem. Abrir o invólucro externo e desdobrar as abas do envelope interno pelas bordas externas sem cruzar os braços sobre a área central estéril.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Calçamento da primeira luva (Mão Dominante)', desc: 'Com o polegar e o indicador da mão não dominante, pinçar a luva da mão dominante EXCLUSIVAMENTE pela dobra do punho (face interna que ficará em contato com a pele) e introduzir a mão dominante.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Calçamento da segunda luva (Mão Não Dominante)', desc: 'Introduzir os quatro dedos enluvados (estéreis) da mão dominante por baixo da dobra externa do punho da segunda luva, mantendo o polegar abduzido (afastado) para não tocar na pele nua, e calçar a segunda mão.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Ajuste dos dedos e punhos (Estéril com Estéril)', desc: 'Com ambas as mãos calçadas, ajustar os dedos e desdobrar os punhos tocando apenas na face externa estéril. Manter as mãos acima da linha da cintura até o início do procedimento.', checked: false },
      { id: 's6', stepNumber: 6, title: 'Remoção segura sem contaminar a pele (Sujo com Sujo / Limpo com Limpo)', desc: 'Puxar a face externa do punho da primeira luva virando-a do avesso e segurá-la na mão ainda enluvada. Deslizar os dedos da mão nua por dentro do punho (face limpa) da segunda luva, envolvendo a primeira em um único invólucro e descartar em lixo infectante.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'Se houver qualquer toque acidental na face externa com a mão nua, descarte o par', text: 'Em procedimentos estéreis (como SVD, aspiração traqueal aberta ou curativo de CVC), qualquer quebra de barreira exige a troca imediata por um novo par estéril.' },
      { type: 'warning', title: 'Mantenha o polegar abduzido (afastado) ao calçar a segunda luva', text: 'O erro mais comum na prática clínica é encostar o polegar já enluvado no dorso ou punho da mão nua enquanto calça a segunda luva.' },
    ],
  },

  // =========================================================================
  // 3. CATETERISMO URINÁRIO DE DEMORA FEMININO (UFSM LabEnf - ZIYJUlpaXds)
  // =========================================================================
  {
    id: 'sondagem-vesical-demora',
    title: 'Cateterismo Urinário de Demora Feminino (SVD)',
    category: 'eliminacoes',
    categoryLabel: 'Cateterismos & Eliminações',
    duration: '22 min',
    difficulty: 'Avançado',
    levelBadge: 'Privativo do Enfermeiro',
    institutionalBadge: LABENF_UFSM_BADGE,
    cofenNorm: 'Resolução COFEN nº 450/2013 (Parecer Normativo para Atuação da Equipe de Enfermagem em Sondagem Vesical)',
    officialGuideUrl: LABENF_UFSM_URL,
    sourceUrl: 'https://www.youtube.com/watch?v=ZIYJUlpaXds',
    videoUrl: 'https://www.youtube.com/embed/ZIYJUlpaXds',
    videoSource: LABENF_UFSM_SOURCE,
    previewImage: getProcedurePreview('sondagem-vesical-demora'),
    description: 'Introdução de cateter estéril (Sonda Foley) através do meato uretral feminino até a bexiga urinária em sistema de drenagem fechado, com rigor asséptico para prevenção de infecção do trato urinário associada a cateter (ITU-AC).',
    materials: [
      { id: 'm1', name: 'Sonda Foley de 2 vias estéril de calibre adequado (12, 14 ou 16 Fr)', checked: false },
      { id: 'm2', name: 'Bolsa coletora de urina sistema fechado estéril com válvula antirrefluxo', checked: false },
      { id: 'm3', name: 'Pacote de cateterismo vesical estéril (cúpula, cuba rim, pinça Cheron, gazes e campo fenestrado)', checked: false },
      { id: 'm4', name: 'Luvas de procedimento (para higiene íntima prévia) e 1 par de luvas estéreis (para a inserção)', checked: false },
      { id: 'm5', name: 'Ampolas de água destilada estéril (10 a 20 mL) — NUNCA utilizar soro fisiológico no balonete!', checked: false },
      { id: 'm6', name: 'Seringa de 10 mL ou 20 mL e agulha 40x12 mm para aspiração da água destilada', checked: false },
      { id: 'm7', name: 'Gel lubrificante hidrossolúvel / lidocaína gel a 2% estéril', checked: false },
      { id: 'm8', name: 'Solução antisséptica aquosa (Clorexidina aquosa 0,2% ou PVPI tópico aquoso)', checked: false },
      { id: 'm9', name: 'Fita adesiva hipoalergênica / micropore para fixação na face interna da coxa', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Explicação, privacidade e higiene perineal prévia', desc: 'Colocar biombos, posicionar a paciente em posição ginecológica (decúbito dorsal com joelhos flexionados e coxas abduzidas) e realizar higiene íntima prévia com água e sabão utilizando luvas de procedimento.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Abertura do campo estéril e conexão prévia do sistema fechado', desc: 'Higienizar as mãos, abrir o pacote estéril, dispor os materiais, calçar as luvas estéreis, testar o balonete da sonda Foley e conectar previamente a sonda ao coletor de urina sistema fechado (assegurando que o clamp de drenagem da bolsa esteja fechado).', checked: false },
      { id: 's3', stepNumber: 3, title: 'Antissepsia vulvar unidirecional (Sentido anteroposterior)', desc: 'Com a pinça Cheron e gazes embebidas em clorexidina aquosa, realizar antissepsia dos grandes lábios (mais distante, depois mais próximo), afastar pequenos lábios com a mão não dominante (que passa a ficar não estéril) e higienizar pequenos lábios e meato uretral de cima para baixo (clitóris → ânus), trocando a gaze a cada movimento.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Posicionamento do campo fenestrado e lubrificação da sonda', desc: 'Sem soltar o afastamento dos pequenos lábios com a mão não dominante, lubrificar os primeiros 5 a 7 cm da ponta da sonda Foley com gel hidrossolúvel estéril.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Introdução atraumática no meato uretral e retorno urinário', desc: 'Visualizar o meato uretral (abaixo do clitóris e acima do introito vaginal), introduzir a sonda delicadamente por 5 a 8 cm até observar o refluxo de urina no intermediário e avançar mais 2 a 3 cm por segurança.', checked: false },
      { id: 's6', stepNumber: 6, title: 'Insuflação do balonete com Água Destilada e tração suave', desc: 'Insuflar o balonete com o volume de água destilada indicado pelo fabricante (geralmente 10 mL) e tracionar delicadamente a sonda até sentir o ancoramento no colo vesical.', checked: false },
      { id: 's7', stepNumber: 7, title: 'Fixação na face interna da coxa e posicionamento da bolsa', desc: 'Retirar o campo fenestrado, fixar o cateter na face anterointerna da coxa sem tração, pendurar a bolsa coletora abaixo do nível da bexiga (sem encostar no chão) e identificar com data, hora, calibre e nome do enfermeiro.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'Se a sonda entrar acidentalmente no canal vaginal, NÃO a retire imediatamente', text: 'Mantenha a sonda contaminada na vagina como ponto de referência anatômico visual enquanto insere uma NOVA sonda estéril no meato uretral logo acima; só depois retire a primeira.' },
      { type: 'danger', title: 'JAMAIS utilize Soro Fisiológico 0,9% para insuflar o balonete', text: 'O cloreto de sódio cristaliza no interior da via do balonete, obstruindo a válvula e impedindo o esvaziamento posterior na retirada da sonda.' },
    ],
  },

  // =========================================================================
  // 4. CATETERISMO URINÁRIO DE DEMORA MASCULINO (UFSM LabEnf - DcHCjKABfrk)
  // =========================================================================
  {
    id: 'cateterismo-urinario-demora-masculino',
    title: 'Cateterismo Urinário de Demora Masculino (SVD)',
    category: 'eliminacoes',
    categoryLabel: 'Cateterismos & Eliminações',
    duration: '23 min',
    difficulty: 'Avançado',
    levelBadge: 'Privativo do Enfermeiro',
    institutionalBadge: LABENF_UFSM_BADGE,
    cofenNorm: 'Resolução COFEN nº 450/2013 (Atividade Privativa do Enfermeiro na Equipe de Enfermagem)',
    officialGuideUrl: LABENF_UFSM_URL,
    sourceUrl: 'https://www.youtube.com/watch?v=DcHCjKABfrk',
    videoUrl: 'https://www.youtube.com/embed/DcHCjKABfrk',
    videoSource: LABENF_UFSM_SOURCE,
    previewImage: getProcedurePreview('cateterismo-urinario-demora-masculino'),
    description: 'Técnica asséptica estéril de cateterismo vesical de demora na anatomia masculina (uretra de 18 a 22 cm), com anestesia/lubrificação intrauretral com seringa de lidocaína gel, retificação peniana a 90° e inserção obrigatória até a bifurcação ("Y") da sonda Foley.',
    materials: [
      { id: 'm1', name: 'Sonda Foley de 2 vias estéril (calibre 14, 16 ou 18 Fr)', checked: false },
      { id: 'm2', name: 'Bolsa coletora de urina em sistema fechado estéril', checked: false },
      { id: 'm3', name: 'Kit de cateterismo vesical estéril (cúpula, cuba rim, pinça Cheron, gazes e campo fenestrado)', checked: false },
      { id: 'm4', name: 'Luvas de procedimento e 1 par de luvas cirúrgicas estéreis', checked: false },
      { id: 'm5', name: 'Seringa estéril de 10 mL ou 20 mL para instilação uretral de lidocaína gel a 2% (10 a 15 mL)', checked: false },
      { id: 'm6', name: 'Seringa de 10 a 20 mL com água destilada estéril para o balonete', checked: false },
      { id: 'm7', name: 'Antisséptico aquoso (Clorexidina aquosa 0,2%)', checked: false },
      { id: 'm8', name: 'Fita adesiva hipoalergênica para fixação supra-púbica ou inguinal', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Higiene íntima prévia e posicionamento em decúbito dorsal', desc: 'Garantir privacidade com biombos, posicionar o paciente em decúbito dorsal com membros inferiores estendidos e levemente abduzidos, e realizar higiene peniana e escrotal prévia com água e sabão.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Paramentação estéril, teste do balão e montagem em sistema fechado', desc: 'Abrir o material com técnica asséptica, calçar luvas estéreis, aspirar a água destilada, preparar a seringa com 10 a 15 mL de lidocaína gel estéril, testar o balonete e conectar previamente a sonda Foley à bolsa coletora sistema fechado.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Antissepsia do meato, glande e corpo do pênis', desc: 'Com a mão não dominante (protegida por gaze), segurar o corpo do pênis perpendicularmente ao abdome (90°) retraindo o prepúcio. Com a pinça Cheron na mão dominante, realizar antissepsia circular do meato uretral para a base da glande.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Anestesia e lubrificação intrauretral com seringa', desc: 'Acoplar o bico da seringa estéril contendo 10 a 15 mL de lidocaína gel a 2% diretamente no meato uretral, injetar suavemente para distender e lubrificar toda a uretra masculina e comprimir levemente a glande por 2 a 3 minutos.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Inserção com pênis a 90° e avanço ATÉ A BIFURCAÇÃO ("Y")', desc: 'Mantendo o pênis tracionado a 90° (retificando a curvatura subpúbica), introduzir a sonda Foley suavemente (inclinando a 60° ao passar pelo bulbo/próstata) ATÉ A BIFURCAÇÃO ("Y") DA SONDA e aguardar o retorno de urina.', checked: false },
      { id: 's6', stepNumber: 6, title: 'Insuflação do balonete, tração e reposicionamento do prepúcio', desc: 'Insuflar o balonete com água destilada somente com a sonda inserida até o "Y", tracionar suavemente até o colo vesical e OBRIGATORIAMENTE retornar o prepúcio à posição anatômica normal (prevenindo parafimose).', checked: false },
      { id: 's7', stepNumber: 7, title: 'Fixação na região hipogástrica/inguinal e registro', desc: 'Fixar o cateter na região supra-púbica ou anterossuperior da coxa (eliminando a angulação penoescrotal e prevenindo fístula uretral), posicionar a bolsa abaixo da bexiga e registrar volume e aspecto urinário.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'NUNCA insufle o balonete no homem antes de inserir a sonda até a bifurcação ("Y")', text: 'Mesmo que apareça retorno de urina antes, o balonete ainda pode estar na uretra prostática. Insuflá-lo ali causa ruptura uretral aguda e hemorragia grave!' },
      { type: 'danger', title: 'SEMPRE retorne o prepúcio ao final do procedimento', text: 'Esquecer o prepúcio retraído atrás da glande após a sondagem causa edema estrangulante (parafimose) e risco de isquemia e necrose da glande.' },
    ],
  },

  // =========================================================================
  // 5. CATETERISMO ENTÉRICO (UFSM LabEnf - LrJdUS1DyEs)
  // =========================================================================
  {
    id: 'sondagem-nasogastrica-nasoenteral',
    title: 'Cateterismo Entérico (Sondagem Nasoenteral e Nasogástrica)',
    category: 'eliminacoes',
    categoryLabel: 'Cateterismos & Eliminações',
    duration: '12 min',
    difficulty: 'Avançado',
    levelBadge: 'Privativo do Enfermeiro (SNE)',
    institutionalBadge: LABENF_UFSM_BADGE,
    cofenNorm: 'Resolução COFEN nº 619/2019 (Atuação da Equipe de Enfermagem na Sondagem Oro/Nasogástrica e Nasoentérica)',
    officialGuideUrl: LABENF_UFSM_URL,
    sourceUrl: 'https://www.youtube.com/watch?v=LrJdUS1DyEs',
    videoUrl: 'https://www.youtube.com/embed/LrJdUS1DyEs',
    videoSource: LABENF_UFSM_SOURCE,
    previewImage: getProcedurePreview('sondagem-nasogastrica-nasoenteral'),
    description: 'Inserção de sonda enteral radiopaca com fio-guia (ou sonda gástrica) pelo orifício nasal ou oral até o estômago/intestino delgado para suporte nutricional enteral, hidratação ou drenagem, seguindo o protocolo oficial do LabEnf UFSM.',
    materials: [
      { id: 'm1', name: 'Sonda nasoentérica radiopaca com mandril/fio-guia (Dobbhoff) ou sonda de Levin', checked: false },
      { id: 'm2', name: 'Gel lubrificante hidrossolúvel / lidocaína gel a 2%', checked: false },
      { id: 'm3', name: 'Seringa de 20 mL bico cateter e estetoscópio', checked: false },
      { id: 'm4', name: 'Gaze não estéril, fita métrica ou marcador e fita adesiva hipoalergênica para fixação', checked: false },
      { id: 'm5', name: 'Luvas de procedimento, máscara, óculos de proteção e toalha/compressa sobre o tórax', checked: false },
      { id: 'm6', name: 'Fita reagente de pH gástrico e solicitação de Radiografia (Raio-X) abdominal de controle', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Posicionamento em Fowler (45° a 90°) e inspeção das narinas', desc: 'Orientar o paciente, elevar a cabeceira do leito em posição de Fowler, inspecionar a permeabilidade das narinas e higienizar a pele do dorso nasal para garantir aderência da fixação.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Mensuração anatômica (Ponta do Nariz → Lóbulo da Orelha → Apêndice Xifoide + 15 a 20 cm)', desc: 'Medir da ponta do nariz ao lóbulo da orelha e deste até o apêndice xifoide (posição gástrica). Para posição entérica pós-pilórica, acrescentar de 15 a 20 cm (até a cicatriz umbilical) e demarcar com fita adesiva.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Lubrificação da extremidade distal e ativação do lubrificante interno', desc: 'Lubrificar os primeiros 10 cm da sonda com gel hidrossolúvel e verificar a mobilidade do fio-guia.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Introdução pelo assoalho nasal com flexão cervical e deglutição', desc: 'Introduzir a sonda pela narina em direção à orelha. Ao passar pela nasofaringe, fletir levemente a cabeça do paciente para frente (fechando a via aérea) e solicitar que degluta enquanto avança a sonda até a marcação.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Testes clínicos de beira-leito e retirada cuidadosa do fio-guia', desc: 'Aspirar conteúdo com a seringa de 20 mL (avaliando aspecto e pH ácido ≤ 5,5). Retirar o fio-guia com suavidade apenas após a sonda estar na marcação correta (e guardar o fio-guia identificado caso seja necessário reposicionamento pelo enfermeiro, sem jamais reintroduzi-lo com a sonda no paciente).', checked: false },
      { id: 's6', stepNumber: 6, title: 'Fixação segura sem comprimir a asa do nariz e Raio-X confirmatório obrigatório', desc: 'Fixar a sonda no dorso nasal e na face sem tracionar a cartilagem alar (evitando lesão por pressão nasal) e encaminhar para Radiografia Simples de Abdome/Tórax antes de liberar qualquer infusão enteral.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'NUNCA libere dieta enteral na SNE antes do laudo/visualização do Raio-X de controle', text: 'A ausculta epigástrica isolada não diferencia posicionamento gástrico de posicionamento brônquico. Infundir dieta nos pulmões leva a pneumonite química e óbito!' },
      { type: 'danger', title: 'JAMAIS reintroduza o fio-guia (mandril metálico) enquanto a sonda estiver dentro do paciente', text: 'Reintroduzir o fio-guia com a sonda já posicionada pode perfurar a parede lateral da sonda e causar perfuração esofágica ou gástrica.' },
    ],
  },

  // =========================================================================
  // 6. CURATIVO EM CATETER VENOSO CENTRAL (UFSM LabEnf - A-VjSAHCvE0)
  // =========================================================================
  {
    id: 'curativo-cateter-venoso-central',
    title: 'Curativo em Cateter Venoso Central (CVC)',
    category: 'vasculares',
    categoryLabel: 'Acessos Vasculares',
    duration: '8 min',
    difficulty: 'Avançado',
    levelBadge: 'Prevenção de IPCS / UTI',
    institutionalBadge: LABENF_UFSM_BADGE,
    cofenNorm: 'Diretrizes ANVISA (Medidas de Prevenção de Infecção de Corrente Sanguínea Associada a Cateter Central)',
    officialGuideUrl: LABENF_UFSM_URL,
    sourceUrl: 'https://www.youtube.com/watch?v=A-VjSAHCvE0',
    videoUrl: 'https://www.youtube.com/embed/A-VjSAHCvE0',
    videoSource: LABENF_UFSM_SOURCE,
    previewImage: getProcedurePreview('curativo-cateter-venoso-central'),
    description: 'Realização de curativo estéril no óstio de inserção do Cateter Venoso Central (subclávia, jugular interna ou femoral) para prevenção de Infecção Primária de Corrente Sanguínea (IPCS), com avaliação de sinais flogísticos e troca de cobertura.',
    materials: [
      { id: 'm1', name: 'Pacote de curativo estéril (pinças anatômica, dente de rato e Kocher/Kelly) ou luvas estéreis', checked: false },
      { id: 'm2', name: 'Solução de Clorexidina Alcoólica a 0,5% (padrão-ouro ANVISA) e Soro Fisiológico 0,9%', checked: false },
      { id: 'm3', name: 'Gaze estéril e película transparente semipermeável estéril', checked: false },
      { id: 'm4', name: 'Luvas de procedimento (para remoção do curativo anterior) e máscaras cirúrgicas (profissional + paciente)', checked: false },
      { id: 'm5', name: 'Fita para identificação (data da troca, tipo de cobertura e assinatura)', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Posicionamento com cabeça lateralizada e uso de máscara', desc: 'Posicionar o paciente em decúbito dorsal com a face voltada para o lado OPOSTO ao cateter (evitando contaminação por gotículas da fala/respiração). Calçar luvas de procedimento.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Remoção cuidadosa do curativo anterior e inspeção do óstio', desc: 'Estabilizar o canhão do cateter e remover a película ou fita no sentido da inserção (para nunca tracionar o cateter para fora). Inspecionar o óstio quanto a hiperemia, edema, calor, exsudato purulento e integridade dos pontos de fixação.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Limpeza de crostas hemáticas e antissepsia do óstio (Do centro para a periferia)', desc: 'Com pacote de curativo estéril (ou luva estéril), remover eventuais crostas de sangue com SF 0,9% e realizar antissepsia do ponto de inserção em movimentos circulares ou unidirecionais do centro (óstio) para a periferia usando Clorexidina Alcoólica 0,5%.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Higienização da extensão externa do cateter ("borboleta" e lúmens)', desc: 'Com nova gaze estéril embebida em clorexidina alcoólica 0,5%, limpar toda a extensão visível do cateter, da base de fixação em direção às extremidades distais dos lúmens.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Secagem espontânea e aplicação da cobertura estéril', desc: 'Aguardar a secagem completa da clorexidina alcoólica. Aplicar filme transparente estéril (troca a cada 7 dias) ou curativo com gaze estéril (troca a cada 48 horas ou sempre que úmido, solto ou sujo, ou nas primeiras 24h se houver sangramento).', checked: false },
      { id: 's6', stepNumber: 6, title: 'Identificação externa e registro de enfermagem', desc: 'Identificar na borda lateral do curativo (sem cobrir a visualização do óstio) com data, hora e responsável. Registrar no prontuário as condições do sítio de inserção.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'NUNCA trccione o cateter ao retirar a película adesiva antiga', text: 'O deslocamento acidental de centímetros do CVC retira a ponta da junção cavoatrial, gerando risco de extravasamento de drogas vasoativas ou trombose venosa.' },
      { type: 'warning', title: 'Prazos rigorosos de validade do curativo de CVC (ANVISA)', text: 'Curativo com gaze estéril e fita deve ser trocado a cada 48 horas; curativo com filme transparente semipermeável estéril deve ser trocado a cada 7 dias (ou imediatamente se sujo, úmido ou descolado).' },
    ],
  },

  // =========================================================================
  // 7. CURATIVO EM FERIDA CIRÚRGICA (UFSM LabEnf - HdOh96Y_XUg)
  // =========================================================================
  {
    id: 'curativo-ferida-cirurgica',
    title: 'Curativo em Ferida Cirúrgica (Incisão com Bordas Aproximadas)',
    category: 'curativos',
    categoryLabel: 'Curativos & Lesões',
    duration: '10 min',
    difficulty: 'Fundamental',
    levelBadge: 'Enfermagem Cirúrgica',
    institutionalBadge: LABENF_UFSM_BADGE,
    cofenNorm: 'Resolução COFEN nº 567/2018 (Regulamenta a atuação da Equipe de Enfermagem no Cuidado aos Pacientes com Feridas)',
    officialGuideUrl: LABENF_UFSM_URL,
    sourceUrl: 'https://www.youtube.com/watch?v=HdOh96Y_XUg',
    videoUrl: 'https://www.youtube.com/embed/HdOh96Y_XUg',
    videoSource: LABENF_UFSM_SOURCE,
    previewImage: getProcedurePreview('curativo-ferida-cirurgica'),
    description: 'Técnica asséptica de limpeza e proteção de ferida operatória limpa com bordas aproximadas por sutura ou grampos (cicatrização por primeira intenção), respeitando o princípio do meio menos contaminado para o mais contaminado.',
    materials: [
      { id: 'm1', name: 'Pacote de curativo estéril (pinça anatômica, dente de rato e Kelly/Kocher)', checked: false },
      { id: 'm2', name: 'Soro Fisiológico a 0,9% morno / em temperatura ambiente', checked: false },
      { id: 'm3', name: 'Gazes estéreis e fita microporosa hipoalergênica', checked: false },
      { id: 'm4', name: 'Luvas de procedimento para retirada do curativo anterior', checked: false },
      { id: 'm5', name: 'Saco plástico para descarte de resíduos infectantes', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Exposição apenas da área operatória e retirada do curativo anterior', desc: 'Higienizar as mãos, calçar luvas de procedimento, umedecer o adesivo com SF 0,9% se estiver aderido e remover o curativo anterior avaliando aspecto e volume do exsudato.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Montagem das trouxinhas de gaze com as pinças estéreis', desc: 'Abrir o pacote de curativo com técnica asséptica, manusear as pinças mantendo as pontas voltadas para baixo e dobrar as gazes em trouxinhas embebidas em SF 0,9%.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Limpeza da linha de incisão (Do menos contaminado para o mais contaminado)', desc: 'Em ferida cirúrgica limpa e fechada, a linha de sutura é considerada a área MENOS contaminada: limpar primeiro a linha de incisão em movimento único unidirecional (de cima para baixo), trocando a gaze a cada passada.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Limpeza e secagem da pele perilesional adjacente', desc: 'Em seguida, limpar as laterais da incisão (pele adjacente) sem retornar a gaze para a linha de sutura, e secar com gaze estéril seca seguindo a mesma ordem.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Oclusão ou manutenção aberta conforme tempo pós-operatório', desc: 'Manter a ferida operatória ocluída com gaze estéril nas primeiras 24 a 48 horas pós-operatórias (ou se houver drenagem). Após epitelização da linha de sutura seca, avaliar manutenção aberta conforme protocolo.', checked: false },
      { id: 's6', stepNumber: 6, title: 'Identificação e evolução de enfermagem', desc: 'Identificar o curativo com data, hora e nome, e registrar aspecto das bordas (coaptadas, íntegras, sinais de deiscência ou infecção de sítio cirúrgico).', checked: false },
    ],
    safetyAlerts: [
      { type: 'warning', title: 'Ferida Fechada Limpa vs. Ferida Aberta Infectada (Sentido da Limpeza)', text: 'Na ferida cirúrgica FECHADA limpa, limpa-se de DENTRO para FORA (incisão → bordas). Já nas feridas ABERTAS ou infectadas, limpa-se de FORA para DENTRO (pele íntegra → leito da ferida).' },
      { type: 'danger', title: 'Atenção aos sinais precoces de Deiscência ou Infecção de Sítio Cirúrgico (ISC)', text: 'Presença de hiperemia progressiva, calor local intenso, abaulamento flutuante ou saída de secreção purulenta entre os pontos deve ser comunicada e registrada imediatamente.' },
    ],
  },

  // =========================================================================
  // 8. RETIRADA DE PONTOS (UFSM LabEnf - LRmg-muaapY)
  // =========================================================================
  {
    id: 'retirada-de-pontos',
    title: 'Retirada de Pontos (Remoção Asséptica de Fios Cirúrgicos)',
    category: 'curativos',
    categoryLabel: 'Curativos & Lesões',
    duration: '9 min',
    difficulty: 'Intermediário',
    levelBadge: 'Técnica Asséptica',
    institutionalBadge: LABENF_UFSM_BADGE,
    cofenNorm: 'Resolução COFEN nº 567/2018 & Protocolos de Enfermagem Cirúrgica / Atenção Primária',
    officialGuideUrl: LABENF_UFSM_URL,
    sourceUrl: 'https://www.youtube.com/watch?v=LRmg-muaapY',
    videoUrl: 'https://www.youtube.com/embed/LRmg-muaapY',
    videoSource: LABENF_UFSM_SOURCE,
    previewImage: getProcedurePreview('retirada-de-pontos'),
    description: 'Remoção segura e asséptica de suturas cutâneas não absorvíveis após completa cicatrização e coaptação das bordas da incisão, impedindo que a porção externa contaminada do fio atravesse o tecido subcutâneo.',
    materials: [
      { id: 'm1', name: 'Kit estéril de retirada de pontos (pinça anatômica de dissecção e tesoura de Íris/Spencer ou lâmina de bisturi estéril)', checked: false },
      { id: 'm2', name: 'Soro Fisiológico a 0,9% e gazes estéreis', checked: false },
      { id: 'm3', name: 'Luvas de procedimento não estéreis', checked: false },
      { id: 'm4', name: 'Caixa coletora de perfurocortantes (se uso de lâmina de bisturi)', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Avaliação criteriosa da integridade e coaptação cicatricial', desc: 'Antes de cortar qualquer fio, inspecionar toda a extensão da ferida operatória. Verificar se as bordas estão perfeitamente unidas (coaptadas), sem sinais de deiscência, infecção ativa ou drenagem.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Antissepsia / limpeza da linha de sutura com SF 0,9%', desc: 'Limpar a incisão e os pontos com gaze estéril umedecida em Soro Fisiológico 0,9%, removendo crostas que dificultem a visualização do nó.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Preensão do nó com a pinça anatômica e leve tração superior', desc: 'Com a mão não dominante segurando a pinça anatômica, apreender o nó cirúrgico e elevá-lo suavemente por 2 a 3 mm para expor o segmento de fio limpo logo abaixo da epiderme.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Secção do fio RENTE À PELE em apenas um dos lados abaixo do nó', desc: 'Com a ponta curva da tesoura de Íris (ou lâmina de bisturi), cortar o fio o mais rente possível à pele em um único lado (nunca cortar dos dois lados do nó).', checked: false },
      { id: 's5', stepNumber: 5, title: 'Tração do fio em direção à linha de incisão e depósito sobre gaze', desc: 'Puxar o fio pelo nó cruzando sobre a linha da cicatriz (nunca puxar afastando as bordas da ferida, para não abrir a incisão) e depositar cada ponto removido sobre uma gaze para conferência.', checked: false },
      { id: 's6', stepNumber: 6, title: 'Remoção alternada se indicado, limpeza final e orientações', desc: 'Em incisões extensas ou com tensão, iniciar retirando pontos alternados (intercalados) para testar a firmeza das bordas. Se houver ameaça de deiscência, interromper imediatamente e aplicar fita aproximadora (Steri-Strip).', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'JAMAIS faça a parte externa (visível) do fio passar por dentro da pele ao puxar', text: 'O segmento do fio que ficou exposto ao meio externo está colonizado por bactérias. Cortar longe da pele ou cortar em dois pontos faz o fio contaminado atravessar o subcutâneo ou ficar retido!' },
      { type: 'warning', title: 'Sempre trccione o ponto em direção à cicatriz, nunca no sentido oposto', text: 'Tracionar o ponto para fora da linha de sutura exerce força de abertura sobre a cicatriz recente e pode causar deiscência.' },
    ],
  },

  // =========================================================================
  // 9. CURATIVO E TROCA DE CADARÇO DE TRAQUEOSTOMIA (UFSM LabEnf - fgGvd1Jx7-0)
  // =========================================================================
  {
    id: 'curativo-cadarco-traqueostomia',
    title: 'Curativo e Troca de Cadarço de Traqueostomia',
    category: 'respiratorio',
    categoryLabel: 'Vias Aéreas & Ventilação',
    duration: '16 min',
    difficulty: 'Avançado',
    levelBadge: 'Via Aérea Artificial',
    institutionalBadge: LABENF_UFSM_BADGE,
    cofenNorm: 'Diretrizes COFEN de Assistência de Enfermagem ao Paciente Traqueostomizado',
    officialGuideUrl: LABENF_UFSM_URL,
    sourceUrl: 'https://www.youtube.com/watch?v=fgGvd1Jx7-0',
    videoUrl: 'https://www.youtube.com/embed/fgGvd1Jx7-0',
    videoSource: LABENF_UFSM_SOURCE,
    previewImage: getProcedurePreview('curativo-cadarco-traqueostomia'),
    description: 'Higienização asséptica do estoma traqueal, aplicação de compressa de gaze protetora periostomal e substituição segura do cadarço de fixação da cânula de traqueostomia prevenindo decanulação acidental e lesões por pressão cervical.',
    materials: [
      { id: 'm1', name: 'Pacote de curativo estéril ou luvas estéreis e gazes estéreis', checked: false },
      { id: 'm2', name: 'Soro Fisiológico a 0,9%', checked: false },
      { id: 'm3', name: 'Cadarço de algodão próprio ou fixador acolchoado para traqueostomia', checked: false },
      { id: 'm4', name: 'EPIs: Máscara, óculos de proteção, avental e luvas de procedimento', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Avaliação respiratória prévia e posicionamento em Fowler (30° a 45°)', desc: 'Verificar necessidade de aspiração traqueal e limpeza da endocânula ANTES de iniciar o curativo externo. Posicionar o paciente em semi-Fowler.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Remoção da gaze suja periostomal mantendo a cânula estabilizada', desc: 'Com luvas de procedimento e auxílio de pinça, retirar a gaze antiga ao redor do estoma segurando firmemente a flange (asa) da cânula para evitar tosse e deslocamento.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Limpeza do estoma traqueal e da pele cervical (Do estoma para fora)', desc: 'Com técnica asséptica e gaze umedecida em SF 0,9%, limpar ao redor do óstio da traqueostomia em movimentos semicirculares de dentro para fora, e secar cuidadosamente a pele periestomal.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Colocação da gaze estéril dobrada (NUNCA cortar a gaze com tesoura!)', desc: 'Posicionar gaze estéril dobrada ao redor da cânula (ou gaze industrialmente fenestrada) para absorver secreções e proteger a pele contra o atrito da asa da cânula.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Passagem e amarração do NOVO cadarço antes de remover o antigo', desc: 'Passar o novo cadarço pelos orifícios laterais da cânula e contornar o pescoço. Amarrar na lateral do pescoço (nunca na nuca!) deixando folga de 1 dedo entre o cadarço e a pele, e SÓ ENTÃO cortar e remover o cadarço sujo antigo (preferencialmente a 4 mãos).', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'PROIBIDO cortar a gaze com tesoura para fazer "calça" periostomal', text: 'Cortar a gaze comum solta microfilamentos de algodão que são aspirados diretamente pelo estoma traqueal para dentro dos brônquios, provocando granulomas e broncoespasmo. Dobre a gaze ou use compressa industrialmente fenestrada!' },
      { type: 'danger', title: 'NUNCA solte o cadarço antigo sem que a cânula esteja contida ou o novo já passado', text: 'Um reflexo súbito de tosse com a cânula solta provoca decanulação acidental imediata e perda da via aérea!' },
      { type: 'warning', title: 'Jamais dê o nó do cadarço na parte posterior do pescoço (nuca)', text: 'O nó na nuca comprime a pele contra o travesseiro em pacientes acamados, gerando Lesão por Pressão occipital/cervical. Amarre sempre na lateral do pescoço.' },
    ],
  },

  // =========================================================================
  // 10. LIMPEZA DA ENDOCÂNULA DE TRAQUEOSTOMIA (UFSM LabEnf - X2ugGIu6mgU)
  // =========================================================================
  {
    id: 'limpeza-endocanula-traqueostomia',
    title: 'Limpeza da Endocânula de Traqueostomia',
    category: 'respiratorio',
    categoryLabel: 'Vias Aéreas & Ventilação',
    duration: '12 min',
    difficulty: 'Intermediário',
    levelBadge: 'Permeabilidade de Via Aérea',
    institutionalBadge: LABENF_UFSM_BADGE,
    cofenNorm: 'Resolução COFEN nº 557/2017 & Protocolos de Cuidados com Vias Aéreas Artificiais',
    officialGuideUrl: LABENF_UFSM_URL,
    sourceUrl: 'https://www.youtube.com/watch?v=X2ugGIu6mgU',
    videoUrl: 'https://www.youtube.com/embed/X2ugGIu6mgU',
    videoSource: LABENF_UFSM_SOURCE,
    previewImage: getProcedurePreview('limpeza-endocanula-traqueostomia'),
    description: 'Remoção temporária, desobstrução mecânica e higienização asséptica da endocânula (cânula interna) de traqueostomia metálica ou plástica para prevenir a formação de rolhas de secreção que obstruem a ventilação do paciente.',
    materials: [
      { id: 'm1', name: 'Pacote de curativo estéril ou cúpula/cuba rim estéril e pinças', checked: false },
      { id: 'm2', name: 'Soro Fisiológico a 0,9% estéril', checked: false },
      { id: 'm3', name: 'Gazes estéreis ou escova cilíndrica estéril própria para luz de endocânula', checked: false },
      { id: 'm4', name: 'Luvas estéreis e luvas de procedimento', checked: false },
      { id: 'm5', name: 'EPIs completos: Óculos de proteção, máscara cirúrgica e avental (risco de jato de secreção por tosse)', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Paramentação com EPIs (óculos e máscara) e preparação do campo estéril', desc: 'Higienizar as mãos, colocar óculos de proteção e máscara, posicionar o paciente em semi-Fowler e abrir o material estéril preenchendo a cúpula/cuba rim com SF 0,9%.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Destravamento e remoção delicada da endocânula', desc: 'Com luvas de procedimento, segurar firmemente a flange da cânula externa com a mão não dominante, destravar a trava giratória da endocânula com a mão dominante e retirá-la acompanhando sua curvatura anatômica.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Imersão em Soro Fisiológico 0,9% para fluidificar crostas', desc: 'Colocar a endocânula imersa no SF 0,9% dentro da cuba estéril por alguns instantes para amolecer secreções ressecadas aderidas ao lúmen.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Limpeza mecânica interna e externa com técnica estéril', desc: 'Calçar luvas estéreis (ou usar as pinças do pacote), atravessar gaze estéril umedecida em SF 0,9% (ou escova estéril) por todo o interior da endocânula até remover 100% das crostas e muco, enxaguando com jato de SF 0,9%.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Secagem, reintrodução imediata e travamento de segurança', desc: 'Secar a face externa e sacudir o excesso de líquido sem deixar fiapos. Reintroduzir a endocânula acompanhando a curvatura da cânula externa e GIRAR A TRAVA até confirmar o encaixe firme.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'NUNCA deixe o paciente sem a endocânula por tempo prolongado', text: 'Se a endocânula ficar fora da traqueostomia por muito tempo, as secreções passam a incrustar diretamente na parede da cânula EXTERNA — que não pode ser retirada facilmente caso obstrua!' },
      { type: 'warning', title: 'Sempre confirme o travamento da endocânula após recolocá-la', text: 'Uma endocânula destravada pode ser ejetada violentamente durante um acesso de tosse do paciente.' },
    ],
  },

  // =========================================================================
  // 11. HIGIENE ORAL E TROCA DE CADARÇO EM PACIENTE ENTUBADO (UFSM LabEnf - Vqm1NFcs9yg)
  // =========================================================================
  {
    id: 'higiene-oral-cadarco-entubado',
    title: 'Higiene Oral e Troca de Cadarço em Paciente Entubado (TOT)',
    category: 'respiratorio',
    categoryLabel: 'Vias Aéreas & Ventilação',
    duration: '10 min',
    difficulty: 'Avançado',
    levelBadge: 'Bundle de Prevenção de PAV',
    institutionalBadge: LABENF_UFSM_BADGE,
    cofenNorm: 'Diretrizes ANVISA de Prevenção de Pneumonia Associada à Ventilação Mecânica (PAV)',
    officialGuideUrl: LABENF_UFSM_URL,
    sourceUrl: 'https://www.youtube.com/watch?v=Vqm1NFcs9yg',
    videoUrl: 'https://www.youtube.com/embed/Vqm1NFcs9yg',
    videoSource: LABENF_UFSM_SOURCE,
    previewImage: getProcedurePreview('higiene-oral-cadarco-entubado'),
    description: 'Realização de higiene bucal antisséptica (clorexidina aquosa a 0,12%), alternância de posição labial do Tubo Orotraqueal (TOT), conferência da marcação em centímetros na rima labial e troca segura do cadarço de fixação.',
    materials: [
      { id: 'm1', name: 'Solução oral de Digluconato de Clorexidina a 0,12% (aquosa, sem álcool)', checked: false },
      { id: 'm2', name: 'Pacote de curativo (pinça Kelly/Pean) ou espátulas envoltas em gaze estéril (bonecas)', checked: false },
      { id: 'm3', name: 'Cadarço de algodão para fixação do Tubo Orotraqueal (TOT)', checked: false },
      { id: 'm4', name: 'Sistema de aspiração montado e cânula de Guedel (se indicada)', checked: false },
      { id: 'm5', name: 'Cuffômetro (manômetro de pressão do balonete: manter entre 20 e 30 cmH2O)', checked: false },
      { id: 'm6', name: 'EPIs: Luvas de procedimento, máscara cirúrgica e óculos de proteção', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Verificação da cabeceira elevada (30° a 45°) e pressão do Cuff', desc: 'Antes de manipular a cavidade oral, confirmar que a cabeceira está elevada entre 30° e 45° e que a pressão do balonete (cuff) do TOT está entre 20 e 30 cmH2O (impedindo a microaspiração de conteúdo supraglótico para o pulmão).', checked: false },
      { id: 's2', stepNumber: 2, title: 'Conferência da numeração do TOT na rima labial e aspiração oral prévia', desc: 'Checar e memorizar a marcação numérica do tubo na altura dos dentes/rima labial (ex: 22 cm). Aspirar a cavidade oral se houver acúmulo de saliva.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Higiene da cavidade oral no sentido posteroanterior (Fundo → Frente)', desc: 'Com gaze firmemente presa na pinça (ou boneca de espátula) embebida em clorexidina 0,12%, higienizar bochechas, palato duro, gengivas, dentes, língua e a parede externa do tubo, sempre do fundo para a frente.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Rodízio do TOT na comissura labial e proteção da pele', desc: 'Com um profissional segurando firmemente o TOT na numeração exata da rima labial, reposicionar o tubo para o outro canto da boca (prevenindo lesão por pressão em lábio e língua).', checked: false },
      { id: 's5', stepNumber: 5, title: 'Fixação do novo cadarço (Técnica do Nó / Bailarina) e retirada do antigo', desc: 'Aplicar o novo cadarço envolvendo o TOT na altura exata da marcação da rima labial, passando acima das orelhas (protegendo o pavilhão auricular com gaze se necessário) e amarrando na lateral antes de remover o cadarço sujo.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'Risco altíssimo de Extubação Acidental durante a troca do cadarço', text: 'A troca de cadarço em paciente intubado deve ser realizada preferencialmente por DOIS profissionais: enquanto um segura exclusivamente o tubo na marcação da rima labial, o outro realiza a higiene e a amarração.' },
      { type: 'danger', title: 'Verifique a pressão do Cuff (20 a 30 cmH2O) ANTES da higiene oral', text: 'Realizar higiene oral com o cuff desinsuflado (< 20 cmH2O) faz o líquido colonizado da orofaringe escorrer pela traqueia, causando Pneumonia Associada à Ventilação Mecânica (PAV).' },
    ],
  },

  // =========================================================================
  // 12. TROCA DE SOLUÇÃO DO FRASCO DE DRENAGEM TORÁCICA EM SELO D'ÁGUA (UFSM LabEnf - YAZjFfpj0hU)
  // =========================================================================
  {
    id: 'troca-selo-dagua-drenagem-toracica',
    title: 'Troca de Solução do Frasco de Drenagem Torácica em Selo D’Água',
    category: 'respiratorio',
    categoryLabel: 'Vias Aéreas & Ventilação',
    duration: '11 min',
    difficulty: 'Avançado',
    levelBadge: 'Drenos & Terapia Intensiva',
    institutionalBadge: LABENF_UFSM_BADGE,
    cofenNorm: 'Parecer COREN/COFEN sobre Cuidados de Enfermagem com Sistemas de Drenagem Torácica Fechada',
    officialGuideUrl: LABENF_UFSM_URL,
    sourceUrl: 'https://www.youtube.com/watch?v=YAZjFfpj0hU',
    videoUrl: 'https://www.youtube.com/embed/YAZjFfpj0hU',
    videoSource: LABENF_UFSM_SOURCE,
    previewImage: getProcedurePreview('troca-selo-dagua-drenagem-toracica'),
    description: 'Substituição asséptica da solução estéril do selo d’água do sistema fechado de drenagem pleural/mediastinal para mensuração rigorosa do débito drenado, avaliação do aspecto (seroso, hemático, purulento) e manutenção da pressão negativa intrapleural.',
    materials: [
      { id: 'm1', name: 'Frasco de Água Destilada Estéril ou Soro Fisiológico a 0,9% estéril (conforme volume do fabricante, geralmente 250 mL a 500 mL)', checked: false },
      { id: 'm2', name: 'Pinça hemostática forte sem dentes (ou clamp próprio da extensão do dreno)', checked: false },
      { id: 'm3', name: 'Cálice graduado ou recipiente coletor para descarte e medição', checked: false },
      { id: 'm4', name: 'Luvas estéreis / de procedimento, álcool a 70%, gazes estéreis e fita adesiva para escala volumétrica', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Avaliação da oscilação da coluna líquida e borbulhamento antes da troca', desc: 'Com o frasco SEMPRE abaixo do nível do tórax, observar se há oscilação da coluna líquida na haste longa com a respiração e anotar o volume total acumulado na fita graduada do frasco.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Pinçamento (Clampeamento) transitório do dreno torácico', desc: 'Pinçar a extensão do dreno de tórax (ou usar o clamp plástico próprio) APENAS pelo tempo estritamente necessário (segundos) para abrir a tampa do frasco coletor, impedindo a entrada de ar atmosférico no espaço pleural.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Abertura asséptica do frasco sem contaminar a haste longa submersa', desc: 'Desrosquear a tampa do frasco coletor mantendo a haste longa estéril sem tocar em nenhuma superfície não estéril. Desprezar o conteúdo antigo medindo e observando seu aspecto.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Preenchimento do novo Selo D’Água (Haste submersa em 2 cm)', desc: 'Preencher o frasco com Água Destilada ou SF 0,9% estéril (ex: 500 mL) até a marca do nível do selo d’água, garantindo que a extremidade inferior da haste longa fique submersa em exatamente 2 cm de líquido.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Fechamento hermético e DESPINÇAMENTO IMEDIATO do dreno', desc: 'Rosquear firmemente a tampa do frasco, confirmar que a haste está submersa 2 cm no selo d’água e DESPINÇAR (abrir o clamp) IMEDIATAMENTE a extensão do dreno.', checked: false },
      { id: 's6', stepNumber: 6, title: 'Demarcação do nível zero na fita externa e registro do balanço', desc: 'Colar fita adesiva vertical na lateral do frasco marcando o nível inicial da solução ("Selo d’água = 500 mL", data, hora e responsável). No cálculo do débito drenado posterior, subtrair sempre o volume inicial do selo d’água.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'JAMAIS esqueça o dreno de tórax pinçado após a troca ou no leito!', text: 'Manter um dreno torácico pinçado impede a saída de ar do espaço pleural, podendo desencadear em poucos minutos um PNEUMOTÓRAX HIPERTENSIVO fatal com choque obstrutivo!' },
      { type: 'danger', title: 'NUNCA eleve o frasco coletor acima do nível de inserção no tórax', text: 'Elevar o frasco sem pinçar faz o líquido contaminado do frasco refluir por gravidade para dentro da cavidade pleural (empiema pleural grave).' },
    ],
  },

  // =========================================================================
  // 13. HIGIENE DA BOLSA DE COLOSTOMIA E ILEOSTOMIA (UFSM LabEnf - -GAlkLL2Htk)
  // =========================================================================
  {
    id: 'higiene-bolsa-colostomia-ileostomia',
    title: 'Higiene e Esvaziamento da Bolsa de Colostomia e Ileostomia',
    category: 'eliminacoes',
    categoryLabel: 'Cateterismos & Eliminações',
    duration: '9 min',
    difficulty: 'Fundamental',
    levelBadge: 'Estomaterapia & Autocuidado',
    institutionalBadge: LABENF_UFSM_BADGE,
    cofenNorm: 'Diretrizes SOBEST & Resolução COFEN nº 567/2018 (Cuidados com Estomias de Eliminação)',
    officialGuideUrl: LABENF_UFSM_URL,
    sourceUrl: 'https://www.youtube.com/watch?v=-GAlkLL2Htk',
    videoUrl: 'https://www.youtube.com/embed/-GAlkLL2Htk',
    videoSource: LABENF_UFSM_SOURCE,
    previewImage: getProcedurePreview('higiene-bolsa-colostomia-ileostomia'),
    description: 'Esvaziamento e higienização interna da extremidade inferior drenável da bolsa de colostomia ou ileostomia sempre que atingir 1/3 a 1/2 da capacidade, preservando a aderência da placa periestomal e promovendo conforto e educação para o autocuidado.',
    materials: [
      { id: 'm1', name: 'Cuba rim, comadre ou cálice graduado para coleta do efluente fecal', checked: false },
      { id: 'm2', name: 'Frasco/pisseta com água morna ou Soro Fisiológico 0,9% para lavagem da borda inferior', checked: false },
      { id: 'm3', name: 'Papel higiênico macio, gazes ou compressas não estéreis', checked: false },
      { id: 'm4', name: 'Impermeável/forro protetor para o leito e luvas de procedimento', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Avaliação do enchimento da bolsa (Esvaziar com 1/3 da capacidade)', desc: 'Verificar o volume de efluente ou gases na bolsa. O esvaziamento deve ocorrer quando a bolsa atingir 1/3 (no máximo metade) da sua capacidade, evitando que o peso descole a placa adesiva da pele.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Proteção do leito e abertura do clamp/velcro inferior com a ponta voltada para cima', desc: 'Posicionar o impermeável e a cuba rim na lateral do abdome. Dobrar a extremidade de drenagem da bolsa para cima antes de soltar o clamp/fecho, evitando respingos.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Drenagem completa do efluente e ordenha suave', desc: 'Direcionar a abertura para dentro da cuba rim e deslizar os dedos suavemente pela face externa da bolsa para esvaziar completamente o conteúdo, observando cor, consistência e volume.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Higiene da borda interna e externa do colo de drenagem', desc: 'Limpar os últimos 5 cm internos da abertura inferior da bolsa com papel macio/gaze e água (evitando jatos fortes de água até o estoma que possam amolecer a resina hidrocoloide da placa).', checked: false },
      { id: 's5', stepNumber: 5, title: 'Secagem, fechamento seguro do clamp e orientação de autocuidado', desc: 'Secar a extremidade, dobrar o colo da bolsa e travar o clamp/velcro com segurança, envolvendo o paciente e familiar no aprendizado gradual do autocuidado.', checked: false },
    ],
    safetyAlerts: [
      { type: 'warning', title: 'Não espere a bolsa encher totalmente para esvaziá-la', text: 'Quando a bolsa ultrapassa 1/3 a 1/2 do volume, o peso traciona a placa hidrocoloide, provocando infiltração de fezes líquidas (especialmente na ileostomia, rica em enzimas proteolíticas) e dermatite química severa.' },
      { type: 'danger', title: 'NUNCA fure a bolsa coletora com agulha para "sair o gás"', text: 'Perfurar o plástico da bolsa destrói a barreira antiodor e provoca vazamento contínuo. Para eliminar gases, abra apenas o fecho inferior com a ponta voltada para cima.' },
    ],
  },

  // =========================================================================
  // 14. TROCA DE BOLSA DE COLOSTOMIA E ILEOSTOMIA (UFSM LabEnf - I1ND9MuSupQ)
  // =========================================================================
  {
    id: 'troca-bolsa-colostomia-ileostomia',
    title: 'Troca de Bolsa de Colostomia e Ileostomia',
    category: 'eliminacoes',
    categoryLabel: 'Cateterismos & Eliminações',
    duration: '10 min',
    difficulty: 'Intermediário',
    levelBadge: 'Estomaterapia & Pele Periestomal',
    institutionalBadge: LABENF_UFSM_BADGE,
    cofenNorm: 'Resolução COFEN nº 567/2018 & Consenso Brasileiro de Cuidado às Pessoas Adultas com Estomias de Eliminação (SOBEST)',
    officialGuideUrl: LABENF_UFSM_URL,
    sourceUrl: 'https://www.youtube.com/watch?v=I1ND9MuSupQ',
    videoUrl: 'https://www.youtube.com/embed/I1ND9MuSupQ',
    videoSource: LABENF_UFSM_SOURCE,
    previewImage: getProcedurePreview('troca-bolsa-colostomia-ileostomia'),
    description: 'Substituição completa do equipamento coletor (placa de barreira protetora de resina sintética e bolsa de 1 ou 2 peças), com avaliação semiológica do estoma intestinal, mensuração milimétrica com guia de estoma e recorte anatômico para proteção da pele periestomal.',
    materials: [
      { id: 'm1', name: 'Nova bolsa coletora de estomia (1 ou 2 peças) com barreira de resina hidrocoloide e clamp', checked: false },
      { id: 'm2', name: 'Guia medidor de estomas (régua milimetrada circular) e tesoura de ponta curva', checked: false },
      { id: 'm3', name: 'Água morna / Soro Fisiológico 0,9%, sabonete neutro e compressas macias / gazes', checked: false },
      { id: 'm4', name: 'Adjuvantes de estomaterapia se indicados (pó para estomia, pasta hidrocoloide ou spray barreira sem álcool)', checked: false },
      { id: 'm5', name: 'Luvas de procedimento, cuba rim e saco de descarte', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Esvaziamento prévio e remoção atraumática da placa antiga', desc: 'Esvaziar o conteúdo da bolsa antiga na cuba rim. Descolar a placa adesiva de cima para baixo, pressionando suavemente a pele periestomal com uma gaze úmida na mão oposta para não lesar a epiderme.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Higiene delicada do estoma e da pele periestomal e avaliação clínica', desc: 'Limpar o estoma e a pele ao redor com água morna/SF 0,9% e secar sem friccionar. Avaliar a mucosa do estoma: deve ser vermelho-vivo ou rósea brilhante, úmida e sem sinais de isquemia/necrose (cor pálida, arroxeada ou preta).', checked: false },
      { id: 's3', stepNumber: 3, title: 'Mensuração do diâmetro do estoma e recorte sob medida da nova placa', desc: 'Utilizar o guia medidor de estomas para aferir o diâmetro exato em milímetros (ou desenhar o molde se oval). Recortar a placa hidrocoloide com tesoura curva deixando margem de apenas 1 a 2 mm ao redor do estoma.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Alisamento da borda interna recortada e aquecimento manual da resina', desc: 'Passar o dedo na borda interna recortada da placa para deixá-la lisa (sem pontas cortantes que machuquem o estoma) e aquecer a placa entre as mãos por 30 segundos para ativar a adesividade da resina.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Aplicação da placa de baixo para cima e fechamento do clamp', desc: 'Com a pele periestomal 100% seca, retirar o filme protetor e colar a placa centrada no estoma pressionando do centro para as bordas por 1 minuto. Fechar o clamp inferior e verificar a vedação.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'Estoma pálido, cianótico ou enegrecido (preto) é Emergência Cirúrgica!', text: 'A mucosa intestinal sadia é ricamente vascularizada (vermelho-vivo). Coloração escura/preta indica isquemia e necrose da alça exteriorizada — comunique a equipe cirúrgica imediatamente!' },
      { type: 'warning', title: 'Recorte do orifício da placa: nem grande demais, nem apertado demais', text: 'Se o orifício for recortado muito maior que o estoma (> 2 mm), o efluente fecal queima a pele exposta; se for menor que o estoma, a borda da placa estrangula e lacera a mucosa.' },
    ],
  },

  // =========================================================================
  // 15. PARADA CARDIORRESPIRATÓRIA & SUPORTE BÁSICO DE VIDA (Albert Einstein - LquiiQVKqKE)
  // =========================================================================
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
    videoUrl: 'https://www.youtube.com/embed/LquiiQVKqKE',
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
      { id: 's4', stepNumber: 4, title: 'Retorno completo do tórax', desc: 'Permitir a descompressão torácica total entre as compressões para possibilitar o enchimento diastólico das artérias coronárias.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Ciclos de 30:2 com via aérea básica', desc: 'Realizar 30 compressões seguidas de 2 ventilações de 1 segundo cada com o Ambu (técnica C-E para vedação hermética).', checked: false },
      { id: 's6', stepNumber: 6, title: 'Chegada do DEA e choque precoce', desc: 'Ligar o DEA imediatamente, colar as pás adesivas (infraclavicular direita e ápice cardíaco esquerdo) e comandar afastamento total da equipe durante a análise e o disparo.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'NÃO interrompa as compressões por mais de 10 segundos', text: 'Cada segundo sem massagem derruba a pressão de perfusão coronariana a zero. São necessários quase 2 minutos de compressão ininterrupta para restabelecer a perfusão cerebral mínima.' },
      { type: 'danger', title: 'Certifique-se de que NINGUÉM encosta no paciente ao disparar o choque', text: 'Olhar da cabeça aos pés e comandar em voz alta: "Afastem-se todos!". A corrente do choque transmitida a um membro da equipe pode deflagrar fibrilação ventricular.' },
      { type: 'warning', title: 'Evite hiperventilar o paciente', text: 'Ventilar com força excessiva ou frequência maior que 1 ventilação a cada 6 segundos aumenta a pressão intratorácica e impede o retorno venoso ao coração.' },
    ],
  },

  // =========================================================================
  // 16. PUNÇÃO VENOSA PERIFÉRICA (UFRGS NAPEAD MP4 HD + Diretrizes E-book LabEnf UFSM Cap. 13)
  // =========================================================================
  {
    id: 'puncao-venosa',
    title: 'Punção Venosa Periférica (Cateter sobre Agulha - Jelco)',
    category: 'vasculares',
    categoryLabel: 'Acessos Vasculares',
    duration: '6 min',
    difficulty: 'Fundamental',
    levelBadge: 'Iniciante ao Avançado',
    institutionalBadge: 'Escola de Enfermagem UFRGS & LabEnf UFSM',
    cofenNorm: 'Diretrizes ANVISA de Terapia Infusional & Guia Prático LabEnf UFSM (Cap. 13)',
    officialGuideUrl: LABENF_UFSM_EBOOK_URL,
    sourceUrl: 'https://videos.ufrgs.br/sead/napead/puncao-venosa-periferica-com-cateter/view',
    videoUrl: 'http://videos-transcoder.ufrgs.br:8888/transcoded/https/videos.ufrgs.br/sead/napead/puncao-venosa-periferica-com-cateter/video_file/mp4-high/puncao-venosa-periferica-com-cateter-mp4.mp4',
    videoSource: 'Escola de Enfermagem UFRGS (SEAD / NAPEAD) & Guia Prático LabEnf UFSM',
    mediaType: 'mp4',
    previewImage: getProcedurePreview('puncao-venosa'),
    description: 'Técnica asséptica de cateterização venosa periférica para infusão de fármacos, hidratação venosa e hemocomponentes, com escolha correta de calibre e prevenção de flebite.',
    materials: [
      { id: 'm1', name: 'Cateter periférico sobre agulha de calibre adequado (18G, 20G, 22G ou 24G)', checked: false },
      { id: 'm2', name: 'Garrote descartável de silicone ou látex', checked: false },
      { id: 'm3', name: 'Algodão ou gaze estéril com álcool a 70% ou clorexidina alcoólica 0,5%', checked: false },
      { id: 'm4', name: 'Luvas de procedimento não estéreis', checked: false },
      { id: 'm5', name: 'Extensor multivias (polifix) preenchido com SF 0,9% e seringa de 10 mL para flush', checked: false },
      { id: 'm6', name: 'Curativo estéril transparente com borda reforçada', checked: false },
      { id: 'm7', name: 'Etiqueta de identificação legível (data, hora, calibre do cateter e profissional)', checked: false },
      { id: 'm8', name: 'Caixa coletora para perfurocortantes (Descarpack)', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Identificação e orientação ao paciente', desc: 'Confirmar os 2 identificadores do paciente (nome completo e data de nascimento) e explicar a finalidade do acesso venoso.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Seleção do sítio venoso', desc: 'Priorizar veias distais do membro superior não dominante (cefálica, basílica ou intermediária do antebraço). Evitar articulações de flexão e membros com FAV ou esvaziamento axilar.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Garroteamento correto (10 cm acima do sítio)', desc: 'Aplicar o garrote cerca de 10 cm acima do local escolhido por no máximo 1 minuto para facilitar a visualização e palpação da veia.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Antissepsia asséptica da pele', desc: 'Friccionar clorexidina alcoólica a 0,5% ou álcool a 70% em movimento unidirecional/espiral e aguardar secagem espontânea completa (nunca voltar a palpar o local após a antissepsia).', checked: false },
      { id: 's5', stepNumber: 5, title: 'Punção com bisel voltado para cima (15° a 30°)', desc: 'Tracionar a pele distalmente para estabilizar a veia e introduzir o cateter com bisel para cima em ângulo de 15° a 30° até visualizar o refluxo sanguíneo na câmara.', checked: false },
      { id: 's6', stepNumber: 6, title: 'Avanço da cânula flexível e recuo do mandril', desc: 'Diminuir o ângulo paralelo à pele, avançar apenas o cateter plástico na luz da veia enquanto traciona a agulha metálica (mandril).', checked: false },
      { id: 's7', stepNumber: 7, title: 'Soltar garrote, conexão e teste de permeabilidade (Flush)', desc: 'Retirar o garrote, comprimir suavemente a veia acima da ponta do cateter, retirar o mandril descartando-o no coletor, conectar o extensor salinizado e testar o fluxo.', checked: false },
      { id: 's8', stepNumber: 8, title: 'Fixação estéril e identificação padronizada', desc: 'Estabilizar com película transparente estéril permitindo visualização do óstio e identificar com data, hora, calibre e rubrica/COREN.', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'NUNCA reintroduza o mandril metálico na cânula plástica', text: 'Se o cateter sair da veia ou falhar, jamais reintroduza a agulha de volta. Risco grave de seccionar a ponta plástica e causar embolia por corpo estranho!' },
      { type: 'warning', title: 'Aguarde a secagem completa do álcool/clorexidina', text: 'Puncionar com a pele úmida provoca ardência intensa e reduz a eficácia antimicrobiana do antisséptico.' },
    ],
  },

  // =========================================================================
  // 17. ADMINISTRAÇÃO POR VIA INTRAMUSCULAR EM Z (M3c-itxeI3M)
  // =========================================================================
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
    sourceUrl: 'https://www.youtube.com/watch?v=M3c-itxeI3M',
    videoUrl: 'https://www.youtube.com/embed/M3c-itxeI3M',
    videoSource: 'Professor Emerson Marques · Aula Prática e Demonstração da Técnica em Z',
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
      { id: 's6', stepNumber: 6, title: 'Soltar a pele e vedar o trajeto', desc: 'Retirar a agulha e soltar a pele em seguida. Os planos teciduais se desalinham, vedando o canal e impedindo o refluxo para o subcutâneo.', checked: false },
    ],
    safetyAlerts: [
      { type: 'warning', title: 'Volume máximo no músculo deltoide é de 2 mL', text: 'No músculo deltoide de adultos, o volume máximo recomendado é de 2 mL. Volumes maiores geram risco de lesão do nervo radial e circunflexo.' },
      { type: 'danger', title: 'NUNCA massageie o sítio após injeção com técnica em Z', text: 'Massagear após a aplicação empurra o medicamento de volta para o tecido celular subcutâneo, anulando o efeito do bloqueio em Z.' },
    ],
  },

  // =========================================================================
  // 18. ASPIRAÇÃO DE VIAS AÉREAS (KiLr6qCs8bk)
  // =========================================================================
  {
    id: 'aspiracao-vias-aereas',
    title: 'Aspiração de Vias Aéreas (Tubo Orotraqueal e Traqueostomia)',
    category: 'respiratorio',
    categoryLabel: 'Vias Aéreas & Ventilação',
    duration: '7 min',
    difficulty: 'Avançado',
    levelBadge: 'Terapia Intensiva',
    institutionalBadge: 'Protocolo de UTI Respiratória & Prevenção de PAV',
    cofenNorm: 'Resolução COFEN nº 557/2017 (Procedimento privativo do Enfermeiro em pacientes graves)',
    officialGuideUrl: 'https://cofen.gov.br/resolucao-cofen-no-0557-2017/',
    sourceUrl: 'https://www.youtube.com/watch?v=KiLr6qCs8bk',
    videoUrl: 'https://www.youtube.com/embed/KiLr6qCs8bk',
    videoSource: 'Prática Enfermagem · Cuidados Críticos em Terapia Intensiva',
    previewImage: getProcedurePreview('aspiracao-vias-aereas'),
    description: 'Remoção segura de secreções traqueobrônquicas em pacientes intubados ou traqueostomizados com técnica estéril, controle rigoroso de vácuo e hiperoxigenação prévia.',
    materials: [
      { id: 'm1', name: 'Sonda de aspiração traqueal estéril com válvula de alívio (calibre 12 a 14 Fr)', checked: false },
      { id: 'm2', name: 'Sistema de aspiração a vácuo com manômetro regulado (80 a 120 mmHg)', checked: false },
      { id: 'm3', name: 'Luvas estéreis de procedimento para técnica aberta (ou circuito fechado Trach Care)', checked: false },
      { id: 'm4', name: 'Ampola de água destilada ou SF 0,9% estéril para lavagem da extensão de látex', checked: false },
      { id: 'm5', name: 'EPIs: Óculos de proteção, máscara cirúrgica ou N95 e avental', checked: false },
      { id: 'm6', name: 'Estetoscópio e oxímetro de pulso para monitorização contínua', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Hiperoxigenar o paciente previamente', desc: 'Ofertar FiO2 a 100% por pelo menos 1 minuto antes do procedimento para prevenir hipoxemia severa decorrente da aspiração.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Regular pressão de sucção no manômetro', desc: 'Ajustar a pressão de vácuo entre 80 e 120 mmHg em adultos (máximo 150 mmHg). Pressões elevadas causam atelectasias e trauma de mucosa traqueal.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Inserir a sonda SEM vácuo', desc: 'Introduzir a sonda no tubo com a válvula de alívio ABERTA (sem sucção ativa), até sentir leve resistência (carina) e recuar 1 a 2 cm antes de aspirar.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Sucção intermitente e rotatória (< 10-15s)', desc: 'Ocluir a válvula e retirar a sonda com movimentos giratórios contínuos. O tempo total de sucção NUNCA deve ultrapassar 10 a 15 segundos.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Reoxigenação e sequência Traqueia → Nariz → Boca', desc: 'Reconectar ao ventilador, aguardar estabilização da SpO2 e só depois aspirar vias aéreas superiores (nasofaringe e por último cavidade oral, jamais voltando a sonda da boca para a traqueia).', checked: false },
    ],
    safetyAlerts: [
      { type: 'danger', title: 'Risco de bradicardia severa e parada por reflexo vagal', text: 'Estimular a carina repetidamente ou prolongar a aspiração além de 15 segundos provoca descarga vagal súbita com bradicardia e risco de assistolia.' },
      { type: 'warning', title: 'NUNCA instile soro fisiológico rotineiramente no tubo', text: 'Instilar soro fisiológico para "fluidificar secreções" desloca o biofilme bacteriano do tubo para os alvéolos, aumentando a incidência de PAV.' },
    ],
  },

  // =========================================================================
  // 19. CURATIVO EM LESÃO POR PRESSÃO (12BeFVs5F2M)
  // =========================================================================
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
    videoUrl: 'https://www.youtube.com/embed/12BeFVs5F2M',
    videoSource: 'Descomplica Enfermagem · Estomaterapia & Cicatrização',
    previewImage: getProcedurePreview('curativo-lesao-pressao'),
    description: 'Estadiamento de lesão por pressão, limpeza com jatos de soro fisiológico a 0,9% morno, avaliação tecidual (granulação, esfacelo e necrose) e escolha da cobertura ideal.',
    materials: [
      { id: 'm1', name: 'Pacote de curativo estéril (pinça anatômica, pinça dente de rato e pinça hemostática)', checked: false },
      { id: 'm2', name: 'Frasco de Soro Fisiológico 0,9% morno (ou solução de PHMB)', checked: false },
      { id: 'm3', name: 'Agulha 40x12 mm para perfurar o frasco e produzir jato com pressão controlada', checked: false },
      { id: 'm4', name: 'Cobertura primária prescrita (Hidrogel, Alginato de cálcio, Hidrofibra, Espuma ou Papaína)', checked: false },
      { id: 'm5', name: 'Gaze estéril e cobertura secundária de proteção', checked: false },
      { id: 'm6', name: 'Régua descartável em centímetros para mensuração periódica da lesão', checked: false },
    ],
    steps: [
      { id: 's1', stepNumber: 1, title: 'Limpeza em jatos contínuos sem esfregar o tecido de granulação', desc: 'Irrigar o leito da lesão com SF 0,9% morno em jatos com agulha 40x12. Nunca esfregar com gaze o tecido de granulação vermelho-vivo para não destruir os brotos capilares.', checked: false },
      { id: 's2', stepNumber: 2, title: 'Secagem exclusiva da borda perilesional', desc: 'Secar delicadamente apenas a pele íntegra ao redor da ferida, mantendo o leito limpo e fisiologicamente úmido.', checked: false },
      { id: 's3', stepNumber: 3, title: 'Escolha da cobertura de acordo com o tecido e exsudato (TIME)', desc: 'Necrose seca/esfacelo: Hidrogel para desbridamento autolítico. Leito muito exsudativo: Alginato de cálcio ou hidrofibra. Proteção e granulação: Espuma de poliuretano.', checked: false },
      { id: 's4', stepNumber: 4, title: 'Proteção da borda com creme ou spray barreira', desc: 'Aplicar película protetora sem álcool nas bordas para prevenir maceração pelo exsudato.', checked: false },
      { id: 's5', stepNumber: 5, title: 'Registro e evolução de enfermagem', desc: 'Registrar estadiamento (Estágios 1, 2, 3, 4 ou Não Classificável), dimensões (C x L x P), tipo de tecido, exsudato e cobertura utilizada.', checked: false },
    ],
    safetyAlerts: [
      { type: 'warning', title: 'Soluções antissépticas citotóxicas no leito da lesão são contraindicadas', text: 'Evite o uso rotineiro de PVPI degermante, água oxigenada ou hipoclorito no tecido de granulação, pois são citotóxicos aos fibroblastos e retardam a cicatrização.' },
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
   * Obtém a lista de IDs de procedimentos/vídeos já assistidos pelo usuário.
   */
  getWatchedList() {
    try {
      const raw = localStorage.getItem(WATCHED_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Verifica se um procedimento específico já foi assistido.
   */
  isWatched(id) {
    if (!id) return false;
    const list = this.getWatchedList();
    return list.includes(id);
  },

  /**
   * Marca um procedimento/vídeo como assistido no localStorage.
   */
  markWatched(id) {
    if (!id) return false;
    try {
      const list = this.getWatchedList();
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(new Event('storage'));
      }
      return true;
    } catch (e) {
      console.warn('Erro ao marcar procedimento como visto:', e);
      return false;
    }
  },

  /**
   * Alterna o status de assistido (marcar/desmarcar) de um procedimento/vídeo.
   */
  toggleWatched(id) {
    if (!id) return false;
    try {
      let list = this.getWatchedList();
      const alreadyWatched = list.includes(id);
      if (alreadyWatched) {
        list = list.filter((item) => item !== id);
      } else {
        list.push(id);
      }
      localStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
      return !alreadyWatched;
    } catch (e) {
      console.warn('Erro ao alternar status de assistido:', e);
      return false;
    }
  },

  /**
   * Gera um POP completo com IA (Google Gemini).
   */
  async generateProcedureWithAI(promptTopic) {
    const systemPrompt = `Você é um Enfermeiro Especialista em Educação em Saúde, Semiotécnica e Normativas do COFEN nº 736/2024.
Sua missão: Gerar um Procedimento Operacional Padrão (POP) e guia de habilidades clínicas de altíssima precisão e rigor asséptico para o procedimento solicitado.
Gere um JSON rigoroso e estrito sem blocos markdown externos (apenas o JSON puro), com a seguinte estrutura:

{
  "title": "Nome formal do procedimento",
  "category": "semiotecnica" | "vasculares" | "eliminacoes" | "medicamentos" | "respiratorio" | "curativos" | "urgencia",
  "categoryLabel": "Nome legível da categoria",
  "duration": "Ex: 7 min",
  "difficulty": "Fundamental" | "Intermediário" | "Avançado",
  "levelBadge": "Ex: Privativo do Enfermeiro ou Semiotécnica",
  "institutionalBadge": "Fonte Acadêmica ou Hospitalar de Referência",
  "cofenNorm": "Legislação aplicável (COFEN/ANVISA)",
  "videoUrl": "https://www.youtube.com/embed/PqmE1NVdqak",
  "videoSource": "Simulação Didática com Goti IA & LabEnf UFSM",
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

    const result = await callResilientAI(systemPrompt, userPrompt, {
      maxTokens: 2000,
      temperature: 0.3,
      responseMimeType: 'application/json',
    });

    if (!result?.text) {
      throw new Error('Não foi possível gerar o procedimento com a IA no momento.');
    }

    const cleanJson = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    parsed.id = `ai-proc-${Date.now()}`;
    parsed.isGeneratedByAI = true;

    return this.saveCustom(parsed);
  },

  /**
   * Responde dúvidas clínicas pontuais sobre o procedimento em execução (Goti IA).
   */
  async askPreceptorAI(procedure, userQuestion) {
    const systemPrompt = `Você é o Goti IA, especialista em procedimentos e práticas de enfermagem da plataforma Enfere.
A plataforma Enfere foi criada e desenvolvida por Marcos Manoel Tavares Neumann, detentor exclusivo de todos os direitos autorais.
O estudante está assistindo e treinando o procedimento: "${procedure?.title || 'Procedimento Clínico'}".
Categoria: ${procedure?.categoryLabel || procedure?.category || 'Geral'}.
Descrição: ${procedure?.description || ''}.
Normativa COFEN: ${procedure?.cofenNorm || 'Diretrizes COFEN e Segurança do Paciente'}.

DIRETRIZES DE RESPOSTA:
1. Se o aluno perguntar sobre os criadores/autores da plataforma, informe expressamente que a plataforma Enfere foi criada e desenvolvida por Marcos Manoel Tavares Neumann, detentor de todos os direitos autorais.
2. Se o aluno perguntar sobre os vídeos da UFSM / LabEnf, informe que são vídeos didáticos oficiais do Laboratório de Enfermagem da Universidade Federal de Santa Maria (LabEnf / UFSM), utilizados com finalidade estritamente educacional e atribuição integral às autoras e docentes revisores.
3. Se a pergunta for sobre procedimentos clínicos, variações anatômicas, complicações ou condutas, responda com alto rigor técnico, linguagem acolhedora, fundamentação anatômica e ênfase na técnica asséptica e segurança do paciente.
4. Mantenha respostas concisas, diretas e práticas em 1 a 2 parágrafos.`;

    const userPrompt = `Dúvida do estudante de enfermagem: "${userQuestion}"`;

    try {
      const result = await callResilientAI(systemPrompt, userPrompt, { maxTokens: 800, temperature: 0.3 });
      if (result && result.text) {
        return result.text;
      }
    } catch (e) {
      console.warn('[procedureService] Conexão externa à IA falhou, ativando motor local:', e);
    }

    return this.generateProcedureFallback(procedure, userQuestion);
  },

  /**
   * Resposta clínica e institucional estruturada de fallback quando as APIs externas estiverem indisponíveis.
   */
  generateProcedureFallback(procedure, userQuestion) {
    const q = (userQuestion || '').toLowerCase();
    const title = procedure?.title || 'Procedimento de Enfermagem';

    if (
      q.includes('criador') ||
      q.includes('quem criou') ||
      q.includes('autor') ||
      q.includes('desenvolveu') ||
      q.includes('dono') ||
      q.includes('proprietario') ||
      q.includes('marcos') ||
      q.includes('neumann')
    ) {
      return (
        'A plataforma **Enfere** (Enfermeiro Digital) foi idealizada, concebida e desenvolvida por **Marcos Manoel Tavares Neumann**, ' +
        'detentor exclusivo de todos os direitos autorais e da propriedade intelectual do sistema.\n\n' +
        'Na Videoteca de Procedimentos, integramos também com atribuição acadêmica oficial o acervo didático público do **Laboratório de Enfermagem da Universidade Federal de Santa Maria (LabEnf / UFSM)**.'
      );
    }

    if (q.includes('resistencia') || q.includes('resistência') || q.includes('travou') || q.includes('nao entra') || q.includes('não entra')) {
      return (
        `⚕️ **Conduta Imediata orientada pelo Goti:** Se houver resistência mecânica durante **${title}**, **nunca force**. ` +
        'A resistência indica obstáculo anatômico (ex.: estenose uretral, hiperplasia prostática no cateterismo masculino, desvio de septo/cornetos no cateterismo entérico ou válvula venosa na punção). ' +
        'Interrompa a progressão imediatamente, reavalie a angulação, a lubrificação e o posicionamento do paciente, e comunique a equipe se persistir.'
      );
    }

    if (q.includes('ansioso') || q.includes('medo') || q.includes('dor') || q.includes('nervoso') || q.includes('choro')) {
      return (
        '⚕️ **Comunicação Terapêutica & Acolhimento:** Antes de iniciar, estabeleça contato visual, garanta a privacidade com biombos, chame o paciente pelo nome e explique cada etapa do procedimento em linguagem clara e acessível. ' +
        'Oriente respirações lentas e profundas durante o momento crítico da técnica para relaxar a musculatura e reduzir o desconforto.'
      );
    }

    if (q.includes('erro') || q.includes('falha') || q.includes('comum')) {
      const alertsText = (procedure?.safetyAlerts || [])
        .map((a, idx) => `${idx + 1}. **${a.title}:** ${a.text}`)
        .join('\n');

      if (alertsText) {
        return `⚕️ **Erros Críticos a Evitar em ${title}:**\n\n${alertsText}`;
      }
      return (
        `⚕️ **Principais Alvos de Segurança em ${title}:**\n\n` +
        '1. **Quebra de Técnica Asséptica:** Contaminação acidental de luvas estéreis, cateteres ou campo cirúrgico.\n' +
        '2. **Falha na Identificação:** Não conferir os dois identificadores do paciente antes de iniciar.\n' +
        '3. **Omissão de Registro:** Deixar de checar no prontuário o horário, calibre, volume/aspecto drenado e resposta do paciente.'
      );
    }

    return (
      `Como **Goti**, seu preceptor clínico para **${title}**, destaco que os pontos essenciais deste POP são o preparo completo dos materiais na bandeja, ` +
      'a manutenção rigorosa da técnica asséptica e a conferência das etapas críticas no checklist acima antes da conclusão.'
    );
  },

  async askGotiAI(procedure, userQuestion) {
    return this.askPreceptorAI(procedure, userQuestion);
  },

  async askFlorenceAI(procedure, userQuestion) {
    return this.askPreceptorAI(procedure, userQuestion);
  },
};
