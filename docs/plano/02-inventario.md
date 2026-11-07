# 02 — Inventário: o que já existe, o que falta e o que reaproveitar

Levantado em `main` @ `027f623`. As fases citam as seções deste arquivo (ex.: "ver 02 §3.2"). **Não leia o arquivo inteiro numa fase: leia só a seção citada.**

---

## 1. Stack e ferramentas
| Item | Estado |
|---|---|
| Frontend | React 18 + Vite 8, JS/JSX (só `EnfereSplash.tsx` é TS), Tailwind 3, Radix, Framer Motion 11, lucide-react, TanStack Query, react-router 6 |
| Backend | Supabase (auth, Postgres com RLS, 1 Edge Function `clinical-ai-sanitize`). O Base44 ainda é usado em `src/api/base44Client.js` e nas abas de prontuário (`PatientProfileTab`, `DiagnosesTab`, `MedicationsTab`, `DischargeTab`, `PreviousAnamnesisTab`, `NandaSearchBar`) e nas páginas `Patients`, `PatientDetail`, `TurmaDetail` |
| IA | OpenRouter na Edge Function (modelos em ordem: `google/gemini-2.5-flash`, `openai/gpt-4o-mini`, `deepseek/deepseek-chat`). Cliente: `src/services/aiCoreService.js → callResilientAI()` (chave pessoal Gemini/OpenRouter do aluno → Edge Function → `null`) |
| Transcrição | AssemblyAI por **arquivo** (upload, transcript, espera), em `src/lib/assemblyai.js`. **A chave fica no localStorage** (`enfermeiro_assemblyai_api_key`), usada em `audioTranscriptionService.js` e direto em `CaseStudio.jsx`. Reserva Gemini multimodal. |
| Voz | `src/services/simuladorVozService.js → falar(texto, pacienteKey, {onStart, onWordIndex, onEnd, customAudioFile})`: toca o mp3 se houver, senão `speechSynthesis` pt-BR com pitch e rate. Já tem **karaokê por palavra** (`onWordIndex`) e o contador `falaGen`. |
| VoiceBox | Roda no PC do dono: `C:\Program Files\Voicebox\voicebox-server.exe --port 17493`. Scripts existentes: `scripts/gerar-voz-goti.js` (API REST + conversor WAV→MP3 com `@breezystack/lamejs`), `scripts/gerar-vozes-simulador.py` (lote a partir de `scripts/falas_pacientes.json`), `scripts/test-voicebox-mcp.js` (`voicebox-mcp.exe`) |
| Testes | Não há test runner. Existem ~25 scripts `scripts/test-*.js` avulsos (`node scripts/x.js`, com `assert` manual e mocks de localStorage) e scripts de screenshot com Puppeteer |
| Lint | `eslint.config.js` cobre **só** `src/components/**`, `src/pages/**` e `src/App.jsx`. `src/lib/**` e `src/components/ui/**` são ignorados |
| Typecheck | `tsc -p jsconfig.json` com `checkJs: false` (checagem fraca). `include` cobre components, pages, services, `App.jsx`, `main.jsx` |
| Deploy | Push na `main` = deploy na Vercel (`enfere.vercel.app`). `vercel.json`: headers de segurança, CSP em **Report-Only**, `Permissions-Policy` com `microphone=(self)` |

> ⚠️ **Lacuna importante:** uma pasta nova (`src/features/**`) **não seria checada** por lint nem typecheck. A F0 resolve isso.

## 2. Documentação e memória do projeto
| Arquivo | Estado | Ação |
|---|---|---|
| `CLAUDE.md` | Atual, canônico (módulos, design, motion, segurança) | Manter. A F0 acrescenta a seção "Plano Cenas ao Vivo" (5 linhas) e a F8 atualiza os módulos |
| `AGENTS.md` | **Conflita** com o `CLAUDE.md`: diz que o app é Base44, manda usar `base44 dev` e aponta `src/data/medicationCatalog.js` (o real é `src/lib/`) | F0: reduzir a um ponteiro para o `CLAUDE.md`, mantendo só a regra de OAuth pre-flight |
| `README.md` | Modelo do Base44 | F8: reescrever |
| `DESIGN.md` | Desatualizado (Inter, `#0D9488`) | F8: atualizar a partir de `03-design.md` |
| `docs/auditoria/*.md` | Achados por área (alguns verificados) | As fases citam os achados relevantes (§6) |
| `GUIA_MIGRACAO_CLAUDE_CODE.md` | Guia antigo de instalação | Não mexer |

## 3. O que reaproveitar (mapa)

### 3.1 Interface e design
| Peça | Arquivo | Uso no plano |
|---|---|---|
| Botão 3D | `src/components/ui/button.jsx` (variantes `primary/success/danger/warning/info/outline/locked/secondary/ghost/link`; tamanhos `sm/default/lg/xl/icon`; `loading`) | Todos os botões |
| Superfícies | `src/components/ui/surface.jsx` (`Panel`, `Inset`, `Tile`, `Chip` com tons `brand/warning/danger/info/neutral/success`) | Todas as caixas |
| Progresso | `ui/animated-progress.jsx`, `ui/animated-number.jsx` | Passos, placares |
| Motion | `src/lib/motion.js` (`ease`, `duration`, `spring.snappy/sheet/glide/pop/fill`, `fadeUp`, `listStagger`, `popIn`, `sheetVariants`, `scrimVariants`, `shake`, `vibrate()`, `prefersReducedMotion()`) | Todas as animações |
| Celebração | `src/lib/celebrate.js` | Só em momentos raros |
| Toast | `@/components/ui/use-toast` | Erros e avisos |
| Esqueleto de página | Padrão de `src/pages/ProcedimentosLab.jsx:139-145`: `div.min-h-screen bg-[#0B131D] text-[#EAF2F8] pb-28 md:pb-8 flex flex-col` → `StudentHeader` só no desktop → `main.mx-auto max-w-xl md:max-w-4xl w-full px-4 sm:px-6 py-4 space-y-5` → `MobileBottomDock` | F0 extrai para `PageShell` |
| Palco do paciente | `src/components/simulador/PacienteVideoStage.jsx` (vídeos empilhados, flags de iOS, webm/mp4, camada anti-PiP, tempo-limite de 6 s no clipe de reação) | **Base** do `PersonagemStage` (F2) |
| Legenda | `src/components/simulador/FalaLegendaBubble.jsx` (70 linhas) | Base da `LegendaFala` (F2) |
| Goti | `src/components/mascot/GotiAnimated.jsx` (vídeo + canvas, webm, poster) | Preceptor nas Técnicas |
| Gravação | `src/hooks/useAudioRecorder.js` + `src/components/audio/RecorderPanel.jsx` | Reserva "gravar e enviar" (F2) |
| Briefing de módulo | `src/components/navigation/ModuleBriefingModal.jsx` | Intro dos módulos novos |

### 3.2 Dados clínicos prontos (economizam IA e reduzem erro clínico)
| Dado | Arquivo | Uso no plano |
|---|---|---|
| 20 arquétipos clínicos coerentes (doença, anamnese, histórico, medicações, alergias, notas, faixa etária, sexo, sinais vitais) + `generateProceduralClinicalCase()` | `src/data/randomClinicalScenarios.js` | **Semente da ficha da Consulta**: a IA só "humaniza" o arquétipo em fatos e falas e não inventa clínica (F3) |
| 20 cenários SBAR com `goldenSbar` e `educationalPointers` | `src/data/sbarHandoffScenarios.js` | Base do Plantão (F7) |
| 10 achados semiológicos por lacuna (`tiragem`, `aspecto_secrecao`, `glasgow`, `forca_motora`, `turgencia_jugular`, `tec`, `glicemia`, `alergias`, `pulsos`, `braden`), com 4 alternativas e feedback | `src/data/semiologyFindings.js` + `src/components/ClinicalGapRadar.jsx` | **Reserva** das lacunas do Plantão que ainda não têm minijogo (F7) |
| 20 problemas de dose + 6 geradores (macrogotas h/min, microgotas, BIC, penicilina cristalina, rediluição pediátrica) | `src/data/dosageProblems.js`, `src/services/proceduralDosageGenerator.js`, `src/services/simuladorFormulaService.js` (`evaluateFormula`, `validateCalculoAnswer`) | Banco do Cálculo (F6) |
| ~20 procedimentos com passos (`steps[{stepNumber,title,desc}]`) e alertas | `src/services/procedureService.js` (1.022 linhas) | Minijogos do tipo **ordenar** gerados automaticamente a partir dos passos (F5), sem custo de conteúdo |
| Catálogo NANDA (277) + busca | `src/lib/nandaCatalog.js` (`findNandaByCode`, `searchNandaCatalog`), `src/components/NandaSearchBar.jsx` | Diagnósticos na Consulta (F4) |
| Parser de sinais vitais | `src/lib/vitalsParser.js` (`parseVitalsFromTranscript`, `getMissingVitals`) | Plantão (F7), **depois de testado e corrigido** |
| Temas | `src/data/simuladorTopicos.js` | Escolha de tema na Consulta |
| Banco de questões da Videochamada | `src/data/simuladorCasosData.js` (`CASOS_SIMULADOR`, `embaralharQuestao`) | Quiz opcional no fim da Consulta (D7) |
| Sanitização LGPD | `src/lib/dlpSanitizer.js` (`sanitizeTextForLGPD`) + `sanitizeClinicalText` na Edge Function | Texto do aluno antes do LLM |

### 3.3 Serviços de progresso (ficam no localStorage, não no Supabase)
- `clinicalHistoryService` (`MODULE_TYPES`, `submitActivity({id, moduleType, title, patientInfo, durationSeconds, score, evaluation, formData, userId})`, `saveVideochamadaSession`, `getQuestoesRevisao`): **F4/F6/F7 registram aqui**, com os novos `moduleType` `consulta`, `calculo_medico`, `plantao_vivo` e `tecnica`.
- `clinicalGamificationService` (`recordActivity(type, customXp, userId, {activityId})`): pontos e ofensiva.
- **Risco:** o histórico é local, então trocar de aparelho perde o histórico. Fica fora do escopo e vai na lista de "depois" (`ESTADO.md`).

### 3.4 Assets
- `public/pacientes/{marcus,teresinha}/`: `fala`, `acerto`, `erro` (`.webm` VP9 com alfa + `.mp4` com fundo `#16222E`, 560x424, 24 fps) + `fala.mp3` + `passo_0..21.mp3`. O manifesto está em `public/pacientes/manifest.json`.
- `public/goti/`: 7 clipes (`idle`, `wave`, `thinking`, `pointing`, `jumping`, `angry`) em webm e webp + poses png.
- **Faltam:** médico, enfermeira, outros pacientes, emoções novas, objetos de minijogo e sons de ausculta.

## 4. Acoplamentos da Videochamada (precisam de tratamento na F8)
`grep -rn "videochamada\|Videochamada\|atendimento-voz" src`:
- `src/App.jsx:40,187-188` (rotas)
- `src/components/StudentHeader.jsx:54` (`navLinks`)
- `src/components/mobile/MobileBottomDock.jsx:~100-111` (item "Atendimento por voz" da gaveta)
- `src/components/mobile/EnfereVivoTrail.jsx:52-63` (destaque no Início)
- `src/components/profile/HistoricoAtividadesTab.jsx:86,93` (botões "revisar")
- `src/components/mascot/GotiChatDrawer.jsx:22` (sugestão de pergunta)
- `src/services/clinicalHistoryService.js:40,50,258,357` (`MODULE_TYPES.VIDEOCHAMADA`, `saveVideochamadaSession`, chave `enfermeiro_historico_videochamadas`)
- `src/services/clinicalGamificationService.js:451`
- `src/services/gotiPreceptorService.js:49,84-98,193,415-429` (o Goti lê o histórico da videochamada)

**Navegação duplicada em três lugares** (`StudentHeader.navLinks`, `MobileBottomDock.navItems` + `caseDrawerOptions`, `EnfereVivoTrail`) é fonte de bug. A F0 cria um registro único.

## 5. O que não existe (será criado)
- Motor de cena reutilizável (personagem por emoção, fila de falas, interrupção, STT em streaming)
- Edge Functions: `cena-ia`, `voz`, `stt-token`, `transcrever` e o código comum `_shared/`
- Tabelas: `ai_uso_diario` (cota), `consulta_sessoes`, `consulta_fichas`, `consulta_turnos`
- Motor de minijogos e minijogos
- Prontuário desenhado (componente)
- Pipeline de assets (Flow → ffmpeg → `public/personagens/`) e de vozes fixas (VoiceBox → `public/vozes/`)
- Test runner (`npm test` com `node --test`)
- Registro único de módulos, `PageShell` e feature flags

## 6. Bugs conhecidos que afetam o plano (de `docs/auditoria/`)
| Id | Arquivo | Problema | Onde tratar |
|---|---|---|---|
| `dosage-1` (verificado) | `MedicationDosageLab.jsx:472` | A unidade da resposta é sempre "gotas/min", mesmo quando o pedido é mL/h, mcg/min ou ampolas | F0 (`answerUnit`) |
| `sbar-audio-1` | `src/lib/sbarSpeechMatcher.js:192` | Usa `includes()` com tokens de 1–2 letras, então quase qualquer texto passa | F7 (substituir) |
| `perf-1` (verificado) | `vercel.json:40` | `no-store` em tudo fora de `/assets/`, então os vídeos (2,6–3,4 MB cada) são baixados de novo a cada visita | F0 |
| `procedures-1` | `EnfereClinicalPlayer.jsx:251` | O progresso do YouTube é inventado por um `setInterval` | F5 |
| — | Edge Function, "Cenário B" | Qualquer usuário logado manda qualquer `systemPrompt`, ou seja, um proxy aberto para a chave paga | F1 (cota) e, depois, lista de tarefas permitidas |
| — | Edge Function, `callOpenRouterBackend` | Em truncamento (`finish_reason=length`), **anexa texto ao conteúdo**, o que **quebra o JSON**. Não tem timeout por modelo. Só aceita uma mensagem `user`. | F1 (`_shared/llm.ts`) |
| — | Edge Function, `checkRateLimit` | Contador em memória, que zera a cada instância | F1 (cota no banco) |
| `voice-sim-1` | `Videochamada.jsx:313` | Contagem dupla de acertos | Some na F8 (não corrigir) |
