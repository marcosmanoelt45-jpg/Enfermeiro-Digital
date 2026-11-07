# 00 — Contexto (lido em todas as fases)

## O que estamos construindo
Quatro áreas "ao vivo", em que o aluno conversa com personagens animados que falam (voz e legenda) e reagem:

| Área | Personagem | Núcleo | IA por turno? |
|---|---|---|---|
| **Consulta ao Vivo** (substitui a Videochamada e o Montar Caso) | Paciente criado pelo aluno, com personalidade | Conversa livre por voz ou texto. O paciente pode mentir, esquecer e se confundir conforme a personalidade e a confiança. Depois: registro, avaliação e relatório. | **Sim** |
| **Cálculo com o Médico** (substitui a tela do `MedicationDosageLab`) | Médico | O médico dita a prescrição e o aluno calcula. Há um modo em que a prescrição vem errada e o aluno precisa questionar. | Não. A conta é feita por código e as falas são fixas. |
| **Plantão com a Enfermeira** (substitui a tela do `SbarHandoffLab`) | Enfermeira do próximo turno | Ela pergunta em ordem SBAR. O aluno consulta o prontuário desenhado e completa as lacunas com minijogos. | Só na avaliação final |
| **Técnicas** (substitui a aba Vídeos/`ProcedimentosLab`) | Goti como preceptor (opcional) | Minijogos (bandeja, ausculta, ordenar passos…), POPs e vídeos. | Não |

## Decisões (padrão = recomendado; troque aqui se quiser)
Se uma decisão continuar no padrão, o Claude Code usa o padrão **sem perguntar**.

| # | Decisão | Padrão |
|---|---|---|
| D1 | Nome da área de conversa | **Consulta ao Vivo** (rota `/consulta`) |
| D2 | Dock inferior | **Início · Prática · Cálculo · Técnicas · Perfil.** "Prática" abre a gaveta que hoje é "Casos", com Consulta ao Vivo, Plantão, Casos Clínicos e "Continuar". Isso mantém o Perfil acessível no celular, onde o `StudentHeader` não aparece. |
| D3 | Voz das falas fixas | VoiceBox, gerada em lote no seu PC (`producao/voicebox.md`) |
| D4 | Voz ao vivo da Consulta | **MVP com a voz do navegador.** A Edge Function `voz` já fica pronta para um VoiceBox hospedado (secrets `VOZ_AO_VIVO_URL`/`VOZ_AO_VIVO_TOKEN`). |
| D5 | Transcrição | AssemblyAI com a chave **só no servidor**: streaming na conversa, arquivo nas gravações longas e `SpeechRecognition` do navegador como reserva |
| D6 | Cotas por aluno por dia | `consulta`: 5 sessões · `turno`: 40 falas por sessão · `stt`: 20 min · `llm` (geral): 60 chamadas |
| D7 | Banco de questões da Videochamada | **Reaproveitar** como quiz opcional de 3 questões no fim da Consulta (por tema) |
| D8 | MCP do Flow | **`gflow-cli`** (`producao/flow.md`) |
| D9 | Usuários em sessão demo (`isLocalDemoSession()`) | Recursos com IA ficam **bloqueados** com uma mensagem amigável e convite para criar conta. Cálculo e Técnicas funcionam normalmente. |

## Princípios que não se negociam
1. **A IA nunca faz conta, nunca dá gabarito numérico e nunca decide pontuação objetiva.** Números, cobertura de anamnese, acertos de minijogo e conferência de sinais vitais são feitos por **código testado**.
2. **Prompts das IAs e a "verdade" do caso vivem no servidor.** O cliente envia só o id da sessão e o texto do aluno, nunca o `systemPrompt`.
3. **Segredos só nos secrets do Supabase.** Nada de `VITE_*` com chave e nada de chave no localStorage (regra do `CLAUDE.md`).
4. **Tudo funciona só com texto.** Microfone e som são melhorias: sem permissão, sem rede de voz ou com `prefers-reduced-motion`, o fluxo continua.
5. **Conteúdo é dado, não JSX.** Personagens, falas, personalidades, minijogos e cenários ficam em `src/data/**` ou `src/features/**/dados/`. Criar conteúdo novo não exige componente novo.
6. **Nada quebra o que já existe até a F8.** Rotas antigas continuam vivas, módulos novos entram atrás de flag e o histórico antigo (`videochamada`) continua legível.

## Convenções de código
- **Pasta nova:** `src/features/<area>/` com `componentes/`, `logica/` (JS puro, sem React), `dados/` e `use*.js` (hooks). Páginas em `src/features/<area>/<Area>Page.jsx` e rotas no `App.jsx`, com `lazy()` como as demais.
- **`logica/` é pura e testável:** imports **relativos** (sem o alias `@/`, que o Node não resolve), sem `window` e sem `localStorage`. Testes em `src/features/**/logica/*.test.mjs` com `node:test` + `node:assert` (zero dependências), rodados por `npm test` (criado na F0).
- **Estado de tela complexo usa `useReducer`** com o reducer em `logica/` (testável). Isso evita a corrida entre áudio, microfone e rede.
- **Recursos de mídia:** todo `<audio>`, `MediaStream`, `WebSocket`, `setTimeout` e `AbortController` é fechado no cleanup do efeito. Use o padrão `falaGen` (contador que invalida callbacks antigos) de `src/services/simuladorVozService.js`.
- **localStorage:** a chave sempre leva o id do usuário (regra do `CLAUDE.md`) e todo acesso fica em `try/catch`.
- **IA no cliente:** os módulos novos **não** usam `callResilientAI` (que tenta chaves pessoais primeiro). Eles chamam as Edge Functions próprias por `src/features/cena/servidor.js` (F2).
- **Edge Functions:** TypeScript (Deno), código comum em `supabase/functions/_shared/` e validação de entrada e saída com `npm:zod@3`.
- **Migrations:** `supabase/migrations/0NN_nome.sql`, numeradas a partir de **010**. Testadas num **branch do Supabase** antes de produção.
- **Branches:** `feat/cenas-f<N>-<nome>`. PR por fase. **Nunca** faça push na `main` (é deploy em produção).

## Validação de cada fase
```bash
npm run lint && npm run typecheck && npm test   # a cada etapa
npm run build                                   # no fim da fase
```
Para as Edge Functions: `deno check supabase/functions/<nome>/index.ts` (se o Deno estiver instalado) e teste manual no branch do Supabase descrito na fase.

## Glossário
- **Cena:** tela com personagem, legenda, controles de fala e chat (motor da F2).
- **Fala fixa:** texto conhecido antes, com mp3 gerado no VoiceBox. **Fala ao vivo:** texto criado pela IA na hora.
- **Ficha verdade:** dados ocultos do paciente da Consulta (fatos e regras de revelação), guardados só no servidor.
- **Lacuna:** campo faltando no prontuário do Plantão, preenchido por um minijogo.
- **Cota:** limite diário por aluno e por tipo (`consumir_cota`, F1).
