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

export const PROCEDURE_PREVIEWS = {
  // 1. RCP & Suporte Básico de Vida
  'rcp-suporte-basico-vida': svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
      <defs>
        <linearGradient id="bgRcp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#022c22"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f43f5e"/>
          <stop offset="100%" stop-color="#be123c"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#bgRcp)"/>
      <circle cx="320" cy="180" r="140" fill="#0d9488" fill-opacity="0.12" filter="blur(20px)"/>
      
      <!-- Linha de ECG de Fundo -->
      <path d="M0 180 L180 180 L200 130 L220 230 L240 100 L260 210 L280 180 L640 180" 
            stroke="#2dd4bf" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.35"/>
      
      <!-- Coração Central com Compressão -->
      <g transform="translate(320, 155) scale(0.95)">
        <path d="M0 -30 C-40 -80, -110 -40, -110 30 C-110 80, -30 130, 0 160 C30 130, 110 80, 110 30 C110 -40, 40 -80, 0 -30 Z" 
              fill="url(#heartGrad)"/>
        <!-- Pulso de Choque / Compressão -->
        <path d="M-50 40 L-20 40 L-5 0 L15 70 L30 20 L45 40 L65 40" 
              stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
      
      <!-- Badge de Protocolo -->
      <rect x="30" y="30" width="220" height="34" rx="17" fill="#0f766e" fill-opacity="0.4" stroke="#14b8a6" stroke-width="1.5"/>
      <text x="50" y="52" fill="#5eead4" font-family="sans-serif" font-size="13" font-weight="bold">BLS / RCP • ALBERT EINSTEIN</text>
      
      <!-- Título de Destaque -->
      <text x="30" y="325" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="900">Suporte Básico de Vida no Adulto</text>
      <text x="30" y="345" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="500">Compressões de alta qualidade & Desfibrilação Precoce (DEA)</text>
    </svg>
  `),

  // 2. Cateterismo Vesical de Demora
  'sondagem-vesical-demora': svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
      <defs>
        <linearGradient id="bgSvd" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#082f49"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#bgSvd)"/>
      <circle cx="320" cy="170" r="130" fill="#0284c7" fill-opacity="0.12" filter="blur(20px)"/>
      
      <!-- Representação da Sonda Foley e Balão -->
      <g transform="translate(320, 160)">
        <!-- Tubo da Sonda de 2 vias -->
        <path d="M-140 60 C-60 60, -20 -20, 40 -20 L120 -20" stroke="#f59e0b" stroke-width="14" stroke-linecap="round" fill="none"/>
        <path d="M-140 90 C-80 90, -40 20, 20 -20" stroke="#f59e0b" stroke-width="10" stroke-linecap="round" fill="none"/>
        <!-- Balonete Insuflado com Água Destilada -->
        <circle cx="95" cy="-20" r="32" fill="#38bdf8" fill-opacity="0.75" stroke="#bae6fd" stroke-width="3"/>
        <circle cx="105" cy="-28" r="8" fill="#ffffff" fill-opacity="0.6"/>
        <!-- Ponta e orifícios de drenagem -->
        <path d="M120 -20 L150 -20" stroke="#d97706" stroke-width="14" stroke-linecap="round"/>
        <ellipse cx="138" cy="-20" rx="4" ry="2" fill="#78350f"/>
      </g>
      
      <!-- Badge de Protocolo -->
      <rect x="30" y="30" width="220" height="34" rx="17" fill="#0369a1" fill-opacity="0.4" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="50" y="52" fill="#7dd3fc" font-family="sans-serif" font-size="13" font-weight="bold">LABENF • UFSM & COFEN</text>
      
      <text x="30" y="325" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="900">Cateterismo Vesical de Demora (SVD)</text>
      <text x="30" y="345" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="500">Técnica asséptica estéril, balonete com AD e sistema fechado</text>
    </svg>
  `),

  // 3. Punção Venosa Periférica (Cateter sobre Agulha - Jelco)
  'puncao-venosa': svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
      <defs>
        <linearGradient id="bgPv" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#042f2e"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#bgPv)"/>
      <circle cx="320" cy="180" r="140" fill="#14b8a6" fill-opacity="0.12" filter="blur(25px)"/>
      
      <!-- Veia e Cateter Venoso Periférico (Jelco Rosa 20G / Azul 22G) -->
      <g transform="translate(320, 160)">
        <!-- Trajeto da Veia Cefálica/Basílica -->
        <path d="M-220 50 C-100 40, 100 60, 220 50" stroke="#0ea5e9" stroke-width="24" stroke-linecap="round" fill="none" opacity="0.4"/>
        
        <!-- Cateter sobre Agulha em ângulo de 20 graus -->
        <g transform="rotate(-18) translate(-60, 0)">
          <!-- Canhão Rosa Jelco 20G -->
          <rect x="-80" y="-12" width="55" height="24" rx="5" fill="#ec4899" stroke="#db2777" stroke-width="2"/>
          <!-- Câmara de refluxo transparente com sangue -->
          <rect x="-135" y="-9" width="55" height="18" rx="4" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
          <rect x="-133" y="-7" width="30" height="14" rx="2" fill="#be123c"/>
          <!-- Cânula de teflon rosa -->
          <path d="M-25 -5 L30 -5 L30 5 L-25 5 Z" fill="#f472b6"/>
          <!-- Bisel da agulha metálica -->
          <path d="M30 -2 L60 -2 L50 2 L30 2 Z" fill="#cbd5e1"/>
        </g>
      </g>
      
      <!-- Badge de Protocolo UFRGS & COFEN -->
      <rect x="30" y="30" width="260" height="34" rx="17" fill="#0f766e" fill-opacity="0.4" stroke="#2dd4bf" stroke-width="1.5"/>
      <text x="50" y="52" fill="#5eead4" font-family="sans-serif" font-size="13" font-weight="bold">ESCOLA DE ENFERMAGEM UFRGS</text>
      
      <text x="30" y="325" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="900">Punção Venosa Periférica (Jelco)</text>
      <text x="30" y="345" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="500">Ângulo do bisel, recuo do mandril e infusão sem flebite</text>
    </svg>
  `),

  // 4. Sondagem Nasogástrica e Nasoenteral
  'sondagem-nasogastrica-nasoenteral': svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
      <defs>
        <linearGradient id="bgSng" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#bgSng)"/>
      <circle cx="320" cy="170" r="130" fill="#6366f1" fill-opacity="0.12" filter="blur(20px)"/>
      
      <!-- Desenho Esquemático da Sonda Enteral com marcas NOX -->
      <g transform="translate(320, 160)">
        <path d="M-150 -50 C-40 -50, 40 40, 150 40" stroke="#a5b4fc" stroke-width="10" stroke-linecap="round" fill="none"/>
        <!-- Marcações de medição NOX -->
        <circle cx="-50" cy="-45" r="4" fill="#4f46e5"/>
        <circle cx="0" cy="-10" r="4" fill="#4f46e5"/>
        <circle cx="60" cy="35" r="4" fill="#4f46e5"/>
        <!-- Ogiva distal com peso de tungstênio -->
        <rect x="145" y="32" width="24" height="16" rx="6" fill="#312e81" stroke="#818cf8" stroke-width="2"/>
      </g>
      
      <rect x="30" y="30" width="220" height="34" rx="17" fill="#312e81" fill-opacity="0.4" stroke="#818cf8" stroke-width="1.5"/>
      <text x="50" y="52" fill="#c7d2fe" font-family="sans-serif" font-size="13" font-weight="bold">NUTRIÇÃO ENTERAL • ESPEN</text>
      
      <text x="30" y="325" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="900">Sondagem Nasogástrica & Nasoenteral</text>
      <text x="30" y="345" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="500">Mensuração anatômica NOX e Raio-X de controle obrigatório</text>
    </svg>
  `),

  // 5. Injeção Intramuscular (Técnica em Z & Ventroglúteo)
  'injecao-intramuscular-z': svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
      <defs>
        <linearGradient id="bgIm" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#450a0a"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#bgIm)"/>
      <circle cx="320" cy="170" r="130" fill="#ef4444" fill-opacity="0.1" filter="blur(20px)"/>
      
      <!-- Ilustração da Vedação em Z nos Planos Teciduais -->
      <g transform="translate(320, 160)">
        <!-- Camada Muscular -->
        <rect x="-140" y="20" width="280" height="60" rx="8" fill="#7f1d1d" opacity="0.6"/>
        <text x="-130" y="55" fill="#fca5a5" font-family="sans-serif" font-size="11" font-weight="bold">Músculo (Ventroglúteo / Vasto Lateral)</text>
        
        <!-- Camada Subcutânea (Deslocada em Z) -->
        <rect x="-115" y="-30" width="280" height="45" rx="6" fill="#78350f" opacity="0.5"/>
        <text x="-105" y="-3" fill="#fde68a" font-family="sans-serif" font-size="11" font-weight="bold">Subcutâneo (Pele tracionada 2,5 cm)</text>
        
        <!-- Seringa e Agulha a 90 graus -->
        <g transform="translate(20, -110)">
          <rect x="-10" y="0" width="20" height="55" rx="3" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
          <path d="M0 55 L0 120" stroke="#e2e8f0" stroke-width="3" stroke-linecap="round"/>
        </g>
      </g>
      
      <rect x="30" y="30" width="220" height="34" rx="17" fill="#7f1d1d" fill-opacity="0.4" stroke="#f87171" stroke-width="1.5"/>
      <text x="50" y="52" fill="#fca5a5" font-family="sans-serif" font-size="13" font-weight="bold">FARMACOLOGIA & COFEN</text>
      
      <text x="30" y="325" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="900">Injeção Intramuscular (Técnica em Z)</text>
      <text x="30" y="345" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="500">Tração tecidual, inserção a 90° e vedação contra refluxo</text>
    </svg>
  `),

  // 6. Aspiração de Vias Aéreas
  'aspiracao-vias-aereas': svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
      <defs>
        <linearGradient id="bgAsp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#134e4a"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#bgAsp)"/>
      <circle cx="320" cy="170" r="130" fill="#0d9488" fill-opacity="0.12" filter="blur(20px)"/>
      
      <!-- Cânula e Sonda de Aspiração Traqueal -->
      <g transform="translate(320, 160)">
        <path d="M-120 40 L40 40 C80 40, 120 20, 140 -20" stroke="#5eead4" stroke-width="8" stroke-linecap="round" fill="none"/>
        <circle cx="140" cy="-20" r="12" fill="#14b8a6" stroke="#99f6e4" stroke-width="2"/>
        <path d="M-120 40 L-140 40" stroke="#042f2e" stroke-width="16" stroke-linecap="round"/>
      </g>
      
      <rect x="30" y="30" width="220" height="34" rx="17" fill="#134e4a" fill-opacity="0.4" stroke="#2dd4bf" stroke-width="1.5"/>
      <text x="50" y="52" fill="#99f6e4" font-family="sans-serif" font-size="13" font-weight="bold">UTI & VIAS AÉREAS • COFEN</text>
      
      <text x="30" y="325" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="900">Aspiração de Vias Aéreas (TOT & TQT)</text>
      <text x="30" y="345" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="500">Hiperoxigenação prévia, sucção intermitente máxima de 10s</text>
    </svg>
  `),

  // 7. Curativo de Lesão por Pressão (LPP)
  'curativo-lesao-pressao': svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
      <defs>
        <linearGradient id="bgLpp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#14532d"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#bgLpp)"/>
      <circle cx="320" cy="170" r="130" fill="#22c55e" fill-opacity="0.12" filter="blur(20px)"/>
      
      <!-- Placa de Cobertura Estéril (Hidrocoloide / Alginato) -->
      <g transform="translate(320, 160)">
        <rect x="-80" y="-50" width="160" height="100" rx="12" fill="#bbf7d0" stroke="#4ade80" stroke-width="3" fill-opacity="0.8"/>
        <circle cx="0" cy="0" r="28" fill="#f87171" fill-opacity="0.4" stroke="#ef4444" stroke-dasharray="4 4" stroke-width="2"/>
      </g>
      
      <rect x="30" y="30" width="220" height="34" rx="17" fill="#14532d" fill-opacity="0.4" stroke="#4ade80" stroke-width="1.5"/>
      <text x="50" y="52" fill="#86efac" font-family="sans-serif" font-size="13" font-weight="bold">ESTOMATERAPIA • SOBEST</text>
      
      <text x="30" y="325" fill="#f8fafc" font-family="sans-serif" font-size="20" font-weight="900">Curativo em Lesão por Pressão (LPP)</text>
      <text x="30" y="345" fill="#94a3b8" font-family="sans-serif" font-size="13" font-weight="500">Irrigação com SF 0,9% sob pressão e cobertura terapêutica</text>
    </svg>
  `)
};

/**
 * Retorna a miniatura visual padrão de um procedimento por id.
 */
export function getProcedurePreview(procedureId) {
  return PROCEDURE_PREVIEWS[procedureId] || null;
}
