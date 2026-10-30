# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `base44 dev` as the default local development command when you need the local Base44 backend. It can run the backend and frontend together.
- When docs or code mention the frontend being started automatically, that usually means the Base44 project config includes `site.serveCommand`, for example `"serveCommand": "npm run dev"` in `base44/config.jsonc`.
- Use `npm run dev` only for frontend-only work against the hosted Base44 backend.
- Prefer the existing Base44 CLI workflow over adding new npm scripts for Base44-specific tasks.
- Reuse the existing SDK client and Vite plugin patterns before adding new Base44 integration paths.
- Run the relevant checks from `package.json` before finishing code changes.

## Supabase OAuth Pre-Flight Protection

Sempre que implementar login ou cadastro social via OAuth (Google, GitHub, etc.) com Supabase:
1. NUNCA redirecione o usuário diretamente com `window.location.href = data.url` sem antes verificar o status do provedor no backend.
2. Não tente fazer `fetch(data.url)` na rota `/auth/v1/authorize`, pois o Supabase não envia cabeçalhos CORS para origens locais nessa rota.
3. Consulte o endpoint oficial `${supabaseUrl}/auth/v1/settings` com o cabeçalho `apikey: ${supabaseAnonKey}`.
4. Se `settings.external[provider] !== true`, cancele o redirecionamento, lance o erro com código `PROVIDER_DISABLED` e apresente um modal na interface com instruções de configuração e a Redirect URI autorizada (`${supabaseUrl}/auth/v1/callback`).

## Golden Architecture Context & Memory Manifesto (Memória Canônica)

Este manifesto é a **Fonte Única da Verdade (SSOT)** do projeto Enfermeiro Digital para todos os agentes. Ele define o que é essencial, o que está ativo e o que foi descontinuado:

### 1. Pilares Essenciais Ativos (Os 6 Módulos Oficiais)
1. **Hub do Estudante**: `src/pages/StudentDashboard.jsx` + `src/components/mobile/MobileBottomDock.jsx` + `src/components/mobile/EnfereVivoTrail.jsx`.
2. **Goti Preceptor & IA Socrática**: `src/components/mascot/GotiAnimated.jsx` + `src/components/mascot/GotiChatDrawer.jsx` + `src/services/gotiPreceptorService.js` + `src/services/socraticTutorService.js` + áudios clínicos em `public/`.
3. **Simulador de Casos Clínicos**: `src/pages/CaseStudySimulator.jsx` + `src/pages/CaseStudio.jsx` + `src/pages/CaseLibrary.jsx` (NANDA, NIC, NOC, raciocínio diagnóstico e evolução).
4. **Plantão SBAR**: `src/pages/SbarHandoffLab.jsx` + `src/services/sbarTutorService.js` (comunicação interprofissional, gravação de áudio e transcrição).
5. **Cálculo de Doses & Soluções**: `src/pages/MedicationDosageLab.jsx` + `src/data/medicationCatalog.js` (regras de três, gotejamento macrogotas/microgotas, diluições críticas).
6. **Laboratório de Procedimentos (Skills Lab)**: `src/pages/ProcedimentosLab.jsx` + `src/services/procedureService.js` + `src/services/procedurePreviews.js` (checklists operacionais, POPs e validação de passos).

### 2. Infraestrutura & Serviços Canônicos
- **Frontend**: React 18 + Vite + TailwindCSS v3 + Radix UI + Lucide React + Framer Motion.
- **Autenticação & Perfis**: Supabase (`src/services/supabaseClient.js`, `src/services/authService.js`, `src/lib/AuthContext.jsx`).
- **Backend & Plataforma**: Base44 (`src/api/base44Client.js`, CLI `base44 dev`).
- **Serviços de IA**: Usar sempre `src/services/aiCoreService.js` e os tutores especializados (`gotiPreceptorService.js`, `sbarTutorService.js`). Evitar acoplar novas features ao monólito legado `aiService.js`.

### 3. Módulos & Ativos Descontinuados (NÃO reutilizar ou sugerir)
- `/sistemas-organicos` e `SystemsAssessmentLab.jsx`: Descontinuado (redirecionado para `/`).
- `/turmas`, `Turmas.jsx`, `TurmaDetail.jsx`: Rotas educacionais legadas redirecionadas para `/`.
### 4. Diretrizes de Qualidade Sênior
- **Zero Linter Warnings/Errors**: Toda modificação de código DEVE passar por `npm run lint` e `npm run typecheck` sem falhas.
- **Respostas em Português do Brasil**: Manter sempre comunicação e interfaces em PT-BR.
- **Mobile-First Tátil**: Preservar a experiência responsiva e feedback tátil (haptic, botões 3D que afundam, dock inferior no mobile).
- **Cache-Busting de Assets (Imports com Hash do Vite)**: Novos ícones, avatares ou logotipos oficiais devem ser armazenados em `src/assets/` e importados diretamente nos componentes React (`import logo from "@/assets/logo.png"`). Evitar confiar exclusivamente em URLs estáticas em `public/`, garantindo que o bundle do Vite gere hashes à prova de cache.
- **Blindagem Visual do Mascote e Logotipo Goti**:
  1. **Logotipo Oficial (`src/assets/goti-icone-oficial.png`)**: Deve ser EXCLUSIVAMENTE o ícone aproximado do rosto do Goti (chapéu de enfermeiro com cruz verde, fundo verde-água arredondado com a pontinha da gota azul no topo, recortado em `669x669` com **100% de transparência externa e sem nenhuma borda branca**). Tanto o cabeçalho superior esquerdo (`StudentHeader.jsx`) quanto o cabeçalho/mensagens do chat (`GotiChatDrawer.jsx`) devem importar este mesmo arquivo via `@/assets/goti-icone-oficial.png` em tamanho grande (`w-14 h-14 sm:w-16 sm:h-16` com `object-contain`).
  2. **Animações do Mascote Goti (`GotiAnimated.jsx` e `EnfereSplash.tsx`)**: Usar o motor `<video>` + `<canvas>` com os vídeos `.webm` 100% sólidos (`public/goti/goti-*.webm`) e poster instantâneo em PNG (`goti-pose-*.png`) até o primeiro quadro do vídeo estar pronto (`video.readyState >= 2`), **sem** `safetyTimeout` curto de 350ms que interrompa o carregamento do vídeo. Manter os fallbacks `.webp` em `public/goti/goti-*.webp` codificados com quadros RGBA completos (`disposal=2`).
- **Sincronização e Deploy Pré-Entrega**: Sempre que uma alteração envolver feedback visual do usuário que valida em produção (Vercel), a entrega requer `npm run build`, sincronização remota via `git push origin main` e confirmação dos assets compilados.

### 5. Ecossistema Multi-Agente (Padrão Claude Code / Hub-and-Spoke)

O desenvolvimento e a manutenção do Enfermeiro Digital operam através de uma arquitetura multi-agente hierárquica baseada no padrão Orchestrator-Worker da Anthropic / Claude Code:
- **Agente Global (Orquestrador Lead)**: Ponto único de contato com o desenvolvedor. Responsável pelo plano de controle, decomposição atômica de tarefas, seleção e despacho de subagentes especialistas, sem poluir a janela de contexto principal com ruído operacional. Subagentes **nunca se comunicam diretamente entre si**, passando todo dado e resultado pelo Orquestrador.
- **Suíte de 8 Subagentes Especialistas** (definidos em `.agents/plugins/enfermeiro-digital-subagents/agents/`):
  1. `subagent-goti-ai`: Preceptor Clínico Goti, IA socrática, estados do mascote e áudios clínicos.
  2. `subagent-clinical-cases`: Simulador de Casos Clínicos, NANDA-I, NIC, NOC, raciocínio diagnóstico e evolução da SAE.
  3. `subagent-sbar-handoff`: Passagem de plantão SBAR, gravação/transcrição de áudio e comunicação interprofissional.
  4. `subagent-dosage-calc`: Cálculo de doses, soluções, fórmulas de gotejamento, BIC e farmacologia clínica.
  5. `subagent-skills-lab`: Procedimentos Operacionais Padrão (POPs), checklists cirúrgicos/clínicos e biossegurança.
  6. `subagent-student-hub`: Dashboard do Estudante, UI Mobile-First, navegação inferior tátil (dock) e acessibilidade WCAG.
  7. `subagent-infra-backend`: Supabase Auth (OAuth Pre-Flight Protection), Base44 SDK e variáveis de ambiente.
  8. `subagent-qa-guardian`: Auditoria de qualidade, execução mandatória de `npm run lint` e `npm run typecheck`, prevenindo bugs antes da entrega.
- **Workflows e Regras**:
  - Regra de orquestração: `.agents/rules/subagent-orchestrator.md`
  - Workflow de invocação: `.agents/workflows/orquestrador.md` e `/agente`
