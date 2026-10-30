/**
 * procedurePreviews.js
 * Gerador de miniaturas visuais exclusivas para cada procedimento clínico.
 * Utiliza ilustrações vetoriais limpas em formato SVG Data URI (resolução infinita, 16:9),
 * eliminando a necessidade de buscar miniaturas externas do YouTube.
 */

// Helper para converter string SVG em data URI segura
function svgToDataUri(svgString) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

// Gerador modular de card SVG 16:9 para procedimentos do LabEnf UFSM
function createLabEnfSvg({ bgStart, bgEnd, glowColor, badgeBg, badgeStroke, badgeText, badgeLabel = 'LABENF • UFSM & COFEN', title, subtitle, iconSvg }) {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bgStart}"/>
          <stop offset="100%" stop-color="${bgEnd}"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#bgGrad)"/>
      <circle cx="320" cy="170" r="135" fill="${glowColor}" fill-opacity="0.14" filter="blur(22px)"/>
      <g transform="translate(320, 160)">
        ${iconSvg}
      </g>
      <rect x="30" y="30" width="250" height="34" rx="17" fill="${badgeBg}" fill-opacity="0.45" stroke="${badgeStroke}" stroke-width="1.5"/>
      <text x="48" y="52" fill="${badgeText}" font-family="sans-serif" font-size="13" font-weight="bold">${badgeLabel}</text>
      <text x="30" y="322" fill="#f8fafc" font-family="sans-serif" font-size="19" font-weight="900">${title}</text>
      <text x="30" y="344" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="500">${subtitle}</text>
    </svg>
  `);
}

export const PROCEDURE_PREVIEWS = {
  // 1. RCP & Suporte Básico de Vida
  'rcp-suporte-basico-vida': createLabEnfSvg({
    bgStart: '#022c22',
    bgEnd: '#0f172a',
    glowColor: '#0d9488',
    badgeBg: '#0f766e',
    badgeStroke: '#14b8a6',
    badgeText: '#5eead4',
    badgeLabel: 'BLS / RCP • ALBERT EINSTEIN',
    title: 'Suporte Básico de Vida no Adulto (BLS/RCP)',
    subtitle: 'Compressões de alta qualidade (100-120/min) & DEA precoce',
    iconSvg: `
      <path d="M-260 15 L-90 15 L-70 -35 L-50 65 L-30 -60 L-10 45 L10 15 L260 15" stroke="#2dd4bf" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.35"/>
      <path d="M0 -35 C-38 -80, -100 -40, -100 25 C-100 72, -28 118, 0 145 C28 118, 100 72, 100 25 C100 -40, 38 -80, 0 -35 Z" fill="#e11d48"/>
      <path d="M-45 30 L-18 30 L-5 -5 L14 60 L28 15 L42 30 L60 30" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    `
  }),

  // 2. Cateterismo Urinário de Demora Feminino (UFSM LabEnf)
  'sondagem-vesical-demora': createLabEnfSvg({
    bgStart: '#082f49',
    bgEnd: '#020617',
    glowColor: '#0284c7',
    badgeBg: '#0369a1',
    badgeStroke: '#38bdf8',
    badgeText: '#7dd3fc',
    title: 'Cateterismo Urinário de Demora Feminino',
    subtitle: 'LabEnf UFSM • Técnica estéril, antissepsia vulvar e sistema fechado',
    iconSvg: `
      <path d="M-140 60 C-60 60, -20 -20, 40 -20 L120 -20" stroke="#f59e0b" stroke-width="14" stroke-linecap="round" fill="none"/>
      <path d="M-140 90 C-80 90, -40 20, 20 -20" stroke="#f59e0b" stroke-width="10" stroke-linecap="round" fill="none"/>
      <circle cx="95" cy="-20" r="32" fill="#38bdf8" fill-opacity="0.75" stroke="#bae6fd" stroke-width="3"/>
      <circle cx="105" cy="-28" r="8" fill="#ffffff" fill-opacity="0.6"/>
      <path d="M120 -20 L150 -20" stroke="#d97706" stroke-width="14" stroke-linecap="round"/>
    `
  }),

  // 3. Cateterismo Urinário de Demora Masculino (UFSM LabEnf)
  'cateterismo-urinario-demora-masculino': createLabEnfSvg({
    bgStart: '#0c4a6e',
    bgEnd: '#020617',
    glowColor: '#0ea5e9',
    badgeBg: '#0369a1',
    badgeStroke: '#38bdf8',
    badgeText: '#7dd3fc',
    title: 'Cateterismo Urinário de Demora Masculino',
    subtitle: 'LabEnf UFSM • Anestesia uretral em gel, inserção até a bifurcação e AD',
    iconSvg: `
      <path d="M-150 55 C-55 55, -15 -15, 45 -15 L125 -15" stroke="#fbbf24" stroke-width="14" stroke-linecap="round" fill="none"/>
      <path d="M-150 85 C-75 85, -35 15, 25 -15" stroke="#fbbf24" stroke-width="10" stroke-linecap="round" fill="none"/>
      <circle cx="95" cy="-15" r="34" fill="#0ea5e9" fill-opacity="0.8" stroke="#e0f2fe" stroke-width="3"/>
      <rect x="-40" y="-65" width="75" height="24" rx="6" fill="#e0f2fe" stroke="#38bdf8" stroke-width="2"/>
      <path d="M35 -53 L65 -53" stroke="#7dd3fc" stroke-width="6" stroke-linecap="round"/>
    `
  }),

  // 4. Cateterismo Entérico (SNG / SNE - UFSM LabEnf)
  'sondagem-nasogastrica-nasoenteral': createLabEnfSvg({
    bgStart: '#1e1b4b',
    bgEnd: '#020617',
    glowColor: '#6366f1',
    badgeBg: '#312e81',
    badgeStroke: '#818cf8',
    badgeText: '#c7d2fe',
    title: 'Cateterismo Entérico (Sondagem Nasoenteral)',
    subtitle: 'LabEnf UFSM • Mensuração cefalocaudal, fio-guia e confirmação por Raio-X',
    iconSvg: `
      <path d="M-150 -50 C-40 -50, 40 40, 150 40" stroke="#a5b4fc" stroke-width="10" stroke-linecap="round" fill="none"/>
      <circle cx="-50" cy="-45" r="5" fill="#4f46e5"/>
      <circle cx="0" cy="-10" r="5" fill="#4f46e5"/>
      <circle cx="60" cy="35" r="5" fill="#4f46e5"/>
      <rect x="145" y="32" width="24" height="16" rx="6" fill="#312e81" stroke="#818cf8" stroke-width="2"/>
    `
  }),

  // 5. Verificação de Sinais Vitais (UFSM LabEnf)
  'verificacao-sinais-vitais': createLabEnfSvg({
    bgStart: '#064e3b',
    bgEnd: '#020617',
    glowColor: '#10b981',
    badgeBg: '#065f46',
    badgeStroke: '#34d399',
    badgeText: '#a7f3d0',
    title: 'Verificação de Sinais Vitais (PA, FC, FR, T e Dor)',
    subtitle: 'LabEnf UFSM • Semiotécnica de aferição arterial, pulsos, respiração e temperatura',
    iconSvg: `
      <rect x="-110" y="-45" width="220" height="95" rx="16" fill="#0f172a" stroke="#34d399" stroke-width="3"/>
      <path d="M-85 5 L-45 5 L-30 -25 L-10 30 L10 -15 L25 15 L40 5 L85 5" stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <text x="-85" y="-18" fill="#6ee7b7" font-family="sans-serif" font-size="13" font-weight="bold">120/80 mmHg • 72 bpm</text>
    `
  }),

  // 6. Colocação e Remoção de Luvas Estéreis (UFSM LabEnf)
  'colocacao-remocao-luvas-estereis': createLabEnfSvg({
    bgStart: '#0f172a',
    bgEnd: '#020617',
    glowColor: '#2dd4bf',
    badgeBg: '#115e59',
    badgeStroke: '#2dd4bf',
    badgeText: '#99f6e4',
    title: 'Colocação e Remoção de Luvas Estéreis',
    subtitle: 'LabEnf UFSM • Técnica asséptica estéril (estéril com estéril / limpo com limpo)',
    iconSvg: `
      <rect x="-95" y="-50" width="80" height="100" rx="22" fill="#ccfbf1" fill-opacity="0.85" stroke="#2dd4bf" stroke-width="3"/>
      <rect x="15" y="-50" width="80" height="100" rx="22" fill="#ccfbf1" fill-opacity="0.85" stroke="#2dd4bf" stroke-width="3"/>
      <path d="M-55 -20 L-55 20 M-75 0 L-35 0" stroke="#0d9488" stroke-width="5" stroke-linecap="round"/>
      <path d="M55 -20 L55 20 M35 0 L75 0" stroke="#0d9488" stroke-width="5" stroke-linecap="round"/>
    `
  }),

  // 7. Curativo em Cateter Venoso Central (UFSM LabEnf)
  'curativo-cateter-venoso-central': createLabEnfSvg({
    bgStart: '#1e293b',
    bgEnd: '#020617',
    glowColor: '#38bdf8',
    badgeBg: '#075985',
    badgeStroke: '#38bdf8',
    badgeText: '#bae6fd',
    title: 'Curativo em Cateter Venoso Central (CVC)',
    subtitle: 'LabEnf UFSM • Antissepsia com clorexidina alcoólica e filme transparente estéril',
    iconSvg: `
      <rect x="-75" y="-45" width="150" height="90" rx="14" fill="#e0f2fe" fill-opacity="0.25" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="6 4"/>
      <path d="M-120 -15 L-10 -15 M-120 15 L-10 15" stroke="#38bdf8" stroke-width="6" stroke-linecap="round"/>
      <path d="M-10 -15 L25 0 L-10 15 Z" fill="#0284c7"/>
      <circle cx="35" cy="0" r="10" fill="#ef4444" fill-opacity="0.7" stroke="#fca5a5" stroke-width="2"/>
    `
  }),

  // 8. Curativo em Ferida Cirúrgica (UFSM LabEnf)
  'curativo-ferida-cirurgica': createLabEnfSvg({
    bgStart: '#14532d',
    bgEnd: '#020617',
    glowColor: '#4ade80',
    badgeBg: '#166534',
    badgeStroke: '#4ade80',
    badgeText: '#bbf7d0',
    title: 'Curativo em Ferida Cirúrgica',
    subtitle: 'LabEnf UFSM • Higiene asséptica em incisão com bordas aproximadas (1ª intenção)',
    iconSvg: `
      <rect x="-110" y="-45" width="220" height="90" rx="16" fill="#dcfce7" fill-opacity="0.85" stroke="#4ade80" stroke-width="3"/>
      <line x1="-70" y1="0" x2="70" y2="0" stroke="#15803d" stroke-width="4" stroke-linecap="round"/>
      <line x1="-45" y1="-15" x2="-45" y2="15" stroke="#166534" stroke-width="3" stroke-linecap="round"/>
      <line x1="-15" y1="-15" x2="-15" y2="15" stroke="#166534" stroke-width="3" stroke-linecap="round"/>
      <line x1="15" y1="-15" x2="15" y2="15" stroke="#166534" stroke-width="3" stroke-linecap="round"/>
      <line x1="45" y1="-15" x2="45" y2="15" stroke="#166534" stroke-width="3" stroke-linecap="round"/>
    `
  }),

  // 9. Retirada de Pontos (UFSM LabEnf)
  'retirada-de-pontos': createLabEnfSvg({
    bgStart: '#312e81',
    bgEnd: '#020617',
    glowColor: '#818cf8',
    badgeBg: '#3730a3',
    badgeStroke: '#818cf8',
    badgeText: '#e0e7ff',
    title: 'Retirada de Pontos (Remoção de Suturas)',
    subtitle: 'LabEnf UFSM • Secção do fio rente à pele sem tracionar segmento externo contaminado',
    iconSvg: `
      <line x1="-90" y1="15" x2="90" y2="15" stroke="#a5b4fc" stroke-width="4" stroke-linecap="round"/>
      <path d="M-40 15 C-40 -25, 40 -25, 40 15" stroke="#e0e7ff" stroke-width="3.5" fill="none"/>
      <circle cx="0" cy="-22" r="7" fill="#6366f1" stroke="#e0e7ff" stroke-width="2"/>
      <path d="M-25 -45 L0 -22 L25 -45" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" fill="none"/>
    `
  }),

  // 10. Curativo e Troca de Cadarço de Traqueostomia (UFSM LabEnf)
  'curativo-cadarco-traqueostomia': createLabEnfSvg({
    bgStart: '#134e4a',
    bgEnd: '#020617',
    glowColor: '#14b8a6',
    badgeBg: '#115e59',
    badgeStroke: '#2dd4bf',
    badgeText: '#99f6e4',
    title: 'Curativo e Troca de Cadarço de Traqueostomia',
    subtitle: 'LabEnf UFSM • Limpeza periostomal, gaze fenestrada e fixação segura com 1 dedo de folga',
    iconSvg: `
      <rect x="-85" y="-30" width="170" height="60" rx="20" fill="#ccfbf1" fill-opacity="0.8" stroke="#2dd4bf" stroke-width="3"/>
      <circle cx="0" cy="0" r="22" fill="#0f766e" stroke="#99f6e4" stroke-width="4"/>
      <circle cx="-60" cy="0" r="6" fill="#0d9488"/>
      <circle cx="60" cy="0" r="6" fill="#0d9488"/>
    `
  }),

  // 11. Limpeza da Endocânula de Traqueostomia (UFSM LabEnf)
  'limpeza-endocanula-traqueostomia': createLabEnfSvg({
    bgStart: '#0f766e',
    bgEnd: '#020617',
    glowColor: '#2dd4bf',
    badgeBg: '#134e4a',
    badgeStroke: '#5eead4',
    badgeText: '#ccfbf1',
    title: 'Limpeza da Endocânula de Traqueostomia',
    subtitle: 'LabEnf UFSM • Remoção de rolhas e secreções para permeabilidade da via aérea',
    iconSvg: `
      <path d="M-70 -40 C-10 -40, 50 10, 50 65" stroke="#99f6e4" stroke-width="24" stroke-linecap="round" fill="none"/>
      <path d="M-70 -40 C-10 -40, 50 10, 50 65" stroke="#0f766e" stroke-width="14" stroke-linecap="round" fill="none"/>
      <rect x="-88" y="-62" width="22" height="44" rx="5" fill="#5eead4"/>
    `
  }),

  // 12. Higiene Oral e Troca de Cadarço em Paciente Entubado (UFSM LabEnf)
  'higiene-oral-cadarco-entubado': createLabEnfSvg({
    bgStart: '#1e3a8a',
    bgEnd: '#020617',
    glowColor: '#60a5fa',
    badgeBg: '#1d4ed8',
    badgeStroke: '#60a5fa',
    badgeText: '#dbeafe',
    title: 'Higiene Oral e Troca de Cadarço em Paciente Entubado',
    subtitle: 'LabEnf UFSM • Prevenção de PAV com clorexidina 0,12%, checagem da rima labial e cuff',
    iconSvg: `
      <path d="M-110 20 C-40 20, 20 -35, 95 -35" stroke="#93c5fd" stroke-width="14" stroke-linecap="round" fill="none"/>
      <ellipse cx="-85" cy="20" rx="22" ry="14" fill="#3b82f6" fill-opacity="0.7" stroke="#dbeafe" stroke-width="2.5"/>
      <rect x="85" y="-47" width="24" height="24" rx="4" fill="#1d4ed8" stroke="#93c5fd" stroke-width="2"/>
    `
  }),

  // 13. Troca de Solução do Frasco de Drenagem Torácica em Selo D'Água (UFSM LabEnf)
  'troca-selo-dagua-drenagem-toracica': createLabEnfSvg({
    bgStart: '#0c4a6e',
    bgEnd: '#020617',
    glowColor: '#38bdf8',
    badgeBg: '#0369a1',
    badgeStroke: '#38bdf8',
    badgeText: '#bae6fd',
    title: 'Troca de Solução de Drenagem Torácica em Selo D’Água',
    subtitle: 'LabEnf UFSM • Pinçamento transitório, imersão da haste em 2 cm e prevenção de pneumotórax',
    iconSvg: `
      <rect x="-55" y="-60" width="110" height="130" rx="14" fill="#0f172a" stroke="#7dd3fc" stroke-width="3"/>
      <rect x="-52" y="20" width="104" height="47" rx="10" fill="#0284c7" fill-opacity="0.75"/>
      <line x1="-15" y1="-80" x2="-15" y2="45" stroke="#e0f2fe" stroke-width="6" stroke-linecap="round"/>
      <line x1="20" y1="-80" x2="20" y2="-35" stroke="#94a3b8" stroke-width="6" stroke-linecap="round"/>
    `
  }),

  // 14. Higiene da Bolsa de Colostomia e Ileostomia (UFSM LabEnf)
  'higiene-bolsa-colostomia-ileostomia': createLabEnfSvg({
    bgStart: '#3f2e1e',
    bgEnd: '#020617',
    glowColor: '#f59e0b',
    badgeBg: '#78350f',
    badgeStroke: '#fbbf24',
    badgeText: '#fef3c7',
    title: 'Higiene da Bolsa de Colostomia e Ileostomia',
    subtitle: 'LabEnf UFSM • Esvaziamento higiênico, proteção da pele periestomal e estímulo ao autocuidado',
    iconSvg: `
      <circle cx="0" cy="-25" r="36" fill="#fde68a" fill-opacity="0.3" stroke="#fbbf24" stroke-width="3"/>
      <circle cx="0" cy="-25" r="14" fill="#ef4444" stroke="#fca5a5" stroke-width="2"/>
      <path d="M-32 -5 L-42 55 C-42 72, 42 72, 42 55 L32 -5 Z" fill="#fef3c7" fill-opacity="0.75" stroke="#fbbf24" stroke-width="2.5"/>
    `
  }),

  // 15. Troca de Bolsa de Colostomia e Ileostomia (UFSM LabEnf)
  'troca-bolsa-colostomia-ileostomia': createLabEnfSvg({
    bgStart: '#451a03',
    bgEnd: '#020617',
    glowColor: '#fb923c',
    badgeBg: '#9a3412',
    badgeStroke: '#fb923c',
    badgeText: '#ffedd5',
    title: 'Troca de Bolsa de Colostomia e Ileostomia',
    subtitle: 'LabEnf UFSM • Mensuração com guia de estoma, recorte sob medida e aderência da placa',
    iconSvg: `
      <circle cx="-45" cy="0" r="42" fill="#fed7aa" fill-opacity="0.35" stroke="#fb923c" stroke-width="3" stroke-dasharray="5 4"/>
      <circle cx="-45" cy="0" r="16" fill="#ef4444" stroke="#fca5a5" stroke-width="2"/>
      <path d="M25 -35 L85 -35 L75 45 L35 45 Z" fill="#ffedd5" fill-opacity="0.8" stroke="#fb923c" stroke-width="2.5"/>
    `
  }),

  // 16. Punção Venosa Periférica (UFRGS + UFSM)
  'puncao-venosa': createLabEnfSvg({
    bgStart: '#042f2e',
    bgEnd: '#020617',
    glowColor: '#14b8a6',
    badgeBg: '#0f766e',
    badgeStroke: '#2dd4bf',
    badgeText: '#5eead4',
    badgeLabel: 'UFRGS NAPEAD & LABENF UFSM',
    title: 'Punção Venosa Periférica (Jelco)',
    subtitle: 'Ângulo do bisel, recuo do mandril e infusão segura sem flebite',
    iconSvg: `
      <path d="M-220 50 C-100 40, 100 60, 220 50" stroke="#0ea5e9" stroke-width="24" stroke-linecap="round" fill="none" opacity="0.4"/>
      <g transform="rotate(-18) translate(-60, 0)">
        <rect x="-80" y="-12" width="55" height="24" rx="5" fill="#ec4899" stroke="#db2777" stroke-width="2"/>
        <rect x="-135" y="-9" width="55" height="18" rx="4" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
        <rect x="-133" y="-7" width="30" height="14" rx="2" fill="#be123c"/>
        <path d="M-25 -5 L30 -5 L30 5 L-25 5 Z" fill="#f472b6"/>
        <path d="M30 -2 L60 -2 L50 2 L30 2 Z" fill="#cbd5e1"/>
      </g>
    `
  }),

  // 17. Injeção Intramuscular (Técnica em Z)
  'injecao-intramuscular-z': createLabEnfSvg({
    bgStart: '#450a0a',
    bgEnd: '#020617',
    glowColor: '#ef4444',
    badgeBg: '#7f1d1d',
    badgeStroke: '#f87171',
    badgeText: '#fca5a5',
    badgeLabel: 'FARMACOLOGIA & COFEN',
    title: 'Injeção Intramuscular (Técnica em Z)',
    subtitle: 'Tração tecidual, inserção a 90° no ventroglúteo e vedação contra refluxo',
    iconSvg: `
      <rect x="-140" y="20" width="280" height="55" rx="8" fill="#7f1d1d" opacity="0.65"/>
      <rect x="-115" y="-28" width="280" height="42" rx="6" fill="#78350f" opacity="0.55"/>
      <rect x="10" y="-95" width="20" height="50" rx="3" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <path d="M20 -45 L20 45" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>
    `
  }),

  // 18. Aspiração de Vias Aéreas
  'aspiracao-vias-aereas': createLabEnfSvg({
    bgStart: '#134e4a',
    bgEnd: '#020617',
    glowColor: '#0d9488',
    badgeBg: '#134e4a',
    badgeStroke: '#2dd4bf',
    badgeText: '#99f6e4',
    badgeLabel: 'UTI & VIAS AÉREAS • COFEN',
    title: 'Aspiração de Vias Aéreas (TOT & TQT)',
    subtitle: 'Hiperoxigenação prévia e sucção asséptica intermitente máxima de 10-15s',
    iconSvg: `
      <path d="M-120 40 L40 40 C80 40, 120 20, 140 -20" stroke="#5eead4" stroke-width="8" stroke-linecap="round" fill="none"/>
      <circle cx="140" cy="-20" r="12" fill="#14b8a6" stroke="#99f6e4" stroke-width="2"/>
      <path d="M-120 40 L-140 40" stroke="#042f2e" stroke-width="16" stroke-linecap="round"/>
    `
  }),

  // 19. Curativo de Lesão por Pressão (LPP)
  'curativo-lesao-pressao': createLabEnfSvg({
    bgStart: '#14532d',
    bgEnd: '#020617',
    glowColor: '#22c55e',
    badgeBg: '#14532d',
    badgeStroke: '#4ade80',
    badgeText: '#86efac',
    badgeLabel: 'ESTOMATERAPIA • SOBEST',
    title: 'Curativo em Lesão por Pressão (LPP)',
    subtitle: 'Irrigação com SF 0,9% morno sob pressão e cobertura conforme leito tecidual',
    iconSvg: `
      <rect x="-80" y="-50" width="160" height="100" rx="12" fill="#bbf7d0" stroke="#4ade80" stroke-width="3" fill-opacity="0.8"/>
      <circle cx="0" cy="0" r="28" fill="#f87171" fill-opacity="0.4" stroke="#ef4444" stroke-dasharray="4 4" stroke-width="2"/>
    `
  })
};

/**
 * Retorna a miniatura visual padrão de um procedimento por id.
 */
export function getProcedurePreview(procedureId) {
  if (PROCEDURE_PREVIEWS[procedureId]) {
    return PROCEDURE_PREVIEWS[procedureId];
  }
  return null;
}
