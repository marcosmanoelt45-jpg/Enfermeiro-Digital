# CLAUDE.md — Enfermeiro Digital (Memória Canônica do Projeto)

## Visão Geral do Projeto
O **Enfermeiro Digital** (plataforma **Enfere**) é uma aplicação educacional de simulação clínica de enfermagem mobile-first.
- **Produção**: https://enfere.vercel.app
- **Repositório**: https://github.com/marcosmanoelt45-jpg/Enfermeiro-Digital.git (branch: `main`)
- **Backend & Auth**: Supabase (`https://xwqgyvqofxdqdbhltdzf.supabase.co`) + Base44 SDK

---

## Pilares Essenciais Ativos (Os 6 Módulos Oficiais)
1. **Hub do Estudante**: `src/pages/StudentDashboard.jsx` + `src/components/mobile/MobileBottomDock.jsx` + `src/components/mobile/EnfereVivoTrail.jsx`.
2. **Goti Preceptor & IA Socrática**: `src/components/mascot/GotiAnimated.jsx` + `src/components/mascot/GotiChatDrawer.jsx` + `src/services/gotiPreceptorService.js` + `src/services/socraticTutorService.js`.
3. **Simulador de Casos Clínicos**: `src/pages/CaseStudySimulator.jsx` + `src/pages/CaseStudio.jsx` + `src/pages/CaseLibrary.jsx` (NANDA-I, NIC, NOC, raciocínio diagnóstico e evolução da SAE).
4. **Plantão SBAR**: `src/pages/SbarHandoffLab.jsx` + `src/services/sbarTutorService.js` (passagem de plantão, gravação de áudio e transcrição).
5. **Cálculo de Doses & Soluções**: `src/pages/MedicationDosageLab.jsx` + `src/data/medicationCatalog.js` (regras de três, gotejamento macrogotas/microgotas, BIC).
6. **Laboratório de Procedimentos (Skills Lab)**: `src/pages/ProcedimentosLab.jsx` + `src/services/procedureService.js` (POPs, checklists cirúrgicos/clínicos, vídeos UFSM).

---

## Regras de Qualidade e Desenvolvimento
- **Comunicação**: Sempre responder em **Português do Brasil (PT-BR)**.
- **Validação Obrigatória**: Antes de dar uma tarefa por concluída, rode:
  ```bash
  npm run lint
  npm run typecheck
  npm run build
  ```
- **Deploy**: Commits na branch `main` (`git push origin main`) realizam deploy automático na Vercel (`https://enfere.vercel.app`).

---

## Blindagem Visual do Mascote Goti
1. **Logotipo Oficial (`src/assets/goti-icone-oficial.png`)**: É o ícone aproximado do rosto do Goti (com chapéu de enfermeiro e cruz verde, fundo verde-água arredondado, 100% transparente sem bordas brancas). Usado no header (`StudentHeader.jsx`) e chat (`GotiChatDrawer.jsx`).
2. **Animações do Goti (`GotiAnimated.jsx` e `EnfereSplash.tsx`)**: Utiliza o motor `<video>` + `<canvas>` com os vídeos sólidos (`public/goti/goti-*.webm`), poster em PNG enquanto o vídeo carrega (`goti-pose-*.png`) e fallbacks em WebP animado (`public/goti/goti-*.webp`).
