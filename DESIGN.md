---
name: Clinical Intelligence Core - Enfermeiro Digital
colors:
  surface: '#ffffff'
  surface-dim: '#f8fafc'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f5f9'
  surface-container: '#e2e8f0'
  surface-container-high: '#cbd5e1'
  surface-container-highest: '#94a3b8'
  on-surface: '#0f172a'
  on-surface-variant: '#475569'
  outline: '#cbd5e1'
  outline-variant: '#e2e8f0'
  primary: '#0d9488'
  on-primary: '#ffffff'
  primary-container: '#ccfbf1'
  on-primary-container: '#115e59'
  secondary: '#0284c7'
  on-secondary: '#ffffff'
  secondary-container: '#e0f2fe'
  on-secondary-container: '#0369a1'
  tertiary: '#8b5cf6'
  on-tertiary: '#ffffff'
  tertiary-container: '#ede9fe'
  on-tertiary-container: '#6d28d9'
  error: '#e11d48'
  on-error: '#ffffff'
  error-container: '#ffe4e6'
  on-error-container: '#9f1239'
  warning: '#f59e0b'
  warning-container: '#fef3c7'
  on-warning-container: '#b45309'
  background: '#f8fafc'
  on-background: '#0f172a'
typography:
  font-family-sans: Inter, system-ui, -apple-system, sans-serif
  font-family-mono: 'JetBrains Mono', monospace
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    textTransform: uppercase
---

# Design System: Clinical Intelligence Core (Enfermeiro Digital)

Sistema de design construído para suporte à decisão clínica de enfermagem com alta legibilidade, foco ergonômico à beira-leito e integração direta com o Google Stitch.

## Paleta de Cores
- **Primária (Teal Clínico - #0D9488):** Tom representativo da enfermagem moderna e saúde, transmitindo confiança, precisão e estabilidade.
- **Secundária (Sky/Ciano - #0284C7):** Identificação de métricas respiratórias, infusões e procedimentos.
- **Alerta / Bradem / CAM (#F59E0B):** Níveis de atenção moderada e risco clínico intermediário.
- **Crítico / Dor / SAK (#E11D48):** Destaque visual imediato para escores críticos, níveis severos de dor e emergências.

## Padrões de Interface
1. **Cards Modulares Touch-Friendly:** Sliders amplos com botões táteis de incremento/decremento (+/-) para uso em tablets e dispositivos móveis à beira-leito.
2. **Classificação Tripla de Risco:** Badges com status `estavel`, `alerta` e `critico` calculados nativamente por regras NANDA-I / NIC / NOC e algoritmos clínicos.
3. **Glassmorphism & Superfícies Limpas:** Fundo neutro suave (`#F8FAFC`) com bordas sutis (`#E2E8F0`) para reduzir fadiga visual em plantões prolongados.
