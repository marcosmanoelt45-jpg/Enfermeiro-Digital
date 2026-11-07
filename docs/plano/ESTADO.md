# ESTADO do plano (o Claude Code atualiza ao fim de cada fase)

> Curto e factual. A próxima sessão lê este arquivo **em vez de** redescobrir o código. Máximo de cerca de 120 linhas: condense as fases antigas quando crescer.

## Fases
| Fase | Status | PR | Data | Observações |
|---|---|---|---|---|
| F0 Base do repositório | em andamento | — | 06/11/2026 | 0.1 a 0.5 feitas; 0.6–0.7 pendentes. Branch `feat/cenas-f0-base`, a partir de `origin/main` @ 027f623 |
| F1 Base do servidor | pendente | — | — | — |
| F2 Motor Cena ao Vivo | pendente | — | — | — |
| F3 Consulta: conversa | pendente | — | — | — |
| F4 Consulta: fechamento | pendente | — | — | — |
| F5 Minijogos + Técnicas | pendente | — | — | — |
| F6 Cálculo com o Médico | pendente | — | — | — |
| F7 Plantão com a Enfermeira | pendente | — | — | — |
| F8 Navegação final | pendente | — | — | — |
| P1 Arte (Flow) | pendente | — | — | personagens prontos: marcus, teresinha (parcial) |
| P2 Vozes (VoiceBox) | pendente | — | — | perfis prontos: Marcus, Teresinha, Goti |

## Decisões tomadas (além de 00-contexto)
- **framer-motion:** o `App.jsx` usa `LazyMotion`. Em código novo importe `{ m as motion } from "framer-motion"`; o import direto de `motion` carrega o motor inteiro de novo.
- **Tailwind 3.4:** só classes do Tailwind 3 (`shadow-sm`, `rounded-sm`, `focus:outline-none`). `shadow-xs`, `shadow-2xs`, `rounded-xs`, `outline-hidden`, `blur-xs` e meios-passos como `w-4.5` não geram estilo.
- **Registro de módulos (F0 0.4):** `src/features/navegacao/modulos.js` guarda os módulos com o lugar de cada um no `header`, no `dock` e na `trilha`, mais a lista `GAVETA_PRATICA`. As funções `modulosDoHeader()`, `itensDoDock()`, `opcoesDaGavetaPratica()` e `modulosDaTrilha()` aceitam `ativa` e a lista como parâmetros, para testar sem mexer em flags reais. Para um módulo novo: acrescente a rota em `ROTAS_CONHECIDAS`, o módulo em `MODULOS` com `flag` e, se ele ocupar a gaveta, a opção em `GAVETA_PRATICA`. Ícones por nome em `icones.js`.
- **PageShell (F0 0.5):** `src/components/layout/PageShell.jsx` para as páginas novas (as antigas não migram). `larguraMax="xl"` (padrão) é `max-w-xl` em qualquer tela; `"4xl"` é `max-w-xl md:max-w-4xl`, o padrão de Procedimentos. `semDock` tira o menu de baixo e o espaço dele; para isso o `StudentFooter` ganhou `showDock` (padrão ligado). Como o menu vem dentro do `StudentFooter`, uma página nova **não** renderiza `<MobileBottomDock />` à parte (foi o erro do menu duplicado, PR #6).
- **Referências da IA do paciente (F3):** o dono vai usar prints e vídeos de conversas com IA como referência de tom e de comportamento. Notas em `docs/plano/ia/referencias-paciente.md`.

## Divergências entre plano e código encontradas
- **SBAR dividido em componentes (F7).** O plano foi escrito com `SbarHandoffLab.jsx` de 1.905 linhas. No branch `feat/redesign-estrutural` (commits `40349b6`, `f75cb56` e `39c4a74`, já no GitHub) ele caiu para cerca de 1.447 linhas, e as abas viraram componentes em `src/components/sbar/`: `SbarDebrief`, `SbarConfirm`, `SbarVoiceBoard`, `ElapsedClock` e `QuickSimCountdown`. **Esses commits ainda não estão na `main` e não têm PR.** Antes da F7, confirme se entraram na `main` e leia os componentes atuais, não o arquivo antigo: as contagens de linha do plano estão desatualizadas. A contagem real de 2 minutos da Simulação Rápida (PR #4) já está na `main`.
- **`TecladoCalculo` (F6).** O `TecladoCalculo.jsx` antigo, sem uso, foi apagado na auditoria (PR #3). A F6 cria o seu do zero; não há conflito de nome nem o que reaproveitar.
- **`vercel.json` (etapa 0.7).** Já tem cabeçalhos de segurança, CSP em modo relatório (só avisa, não bloqueia) e cache: `/assets` imutável por 1 ano; `goti|pacientes|audio|previews` com `max-age=604800, stale-while-revalidate=86400`; `no-store` com regex negativa `assets/|goti/|pacientes/|audio/|previews/`. A 0.7 deve **estender** essas regras (`vozes/`, `personagens/`, `minijogos/` e ajuste dos valores), não recriá-las. A F1/F2 devem acrescentar ao `connect-src` da CSP o que usarem de novo (ex.: o websocket do streaming do AssemblyAI).
- **Falas dos pacientes em MP3.** `public/pacientes/*` agora tem `.mp3` mono de 48 kbps no lugar dos `.wav` (PR #3). Vale para a produção de vozes (P2).
- **Sessão e contas.** As contas locais foram removidas e o login exige e-mail confirmado no Supabase. `isLocalDemoSession()` (`supabaseClient.js`) continua válida para a D9: só o modo demonstrativo (id `aluno-demo-session`) fica sem sessão do Supabase.
- **Rodapé e Ajustes.** A gaveta de bolso do rodapé foi removida; `StudentFooter` renderiza `<MobileBottomDock />` sem props. Os Ajustes agora são um botão no Perfil (`/conta`). O toque (`triggerHaptic`) só vibra, sem bipe.

## Produção (o que está em produção vs. só no branch)
- Edge Functions em produção: `clinical-ai-sanitize` (v5, ativa; conferido em 06/11/2026)
- Migrations em produção: 001–009 (conferido em 06/11/2026)
- Aguardando autorização do dono para produção: (vazio)

## Medições
- Latência do turno da Consulta (mediana 4G): —
- Tokens por turno (entrada/saída): —
- Custo estimado por consulta de 30 turnos: —
- Tamanho de `dist/assets` (antes → depois): —

## Depois (fora do escopo, não esquecer)
- Goti em produção revela o modelo (família Gemini/Flash) e resume o prompt, como mostra o print de 06/11. Reforçar a regra do prompt e filtrar a saída (`ia/referencias-paciente.md` §1)
- Trocar o "Cenário B" (prompt livre) da `clinical-ai-sanitize` por uma lista de tarefas permitidas
- Histórico e gamificação no Supabase em vez do localStorage (hoje se perde ao trocar de aparelho)
- Voz ao vivo hospedada (D4)
- Mais minijogos: descarte, higienização das mãos, paramentação, IM ventroglútea, LPP, flebite, purgar equipo, sondagem, luva estéril, 9 certos, glicosímetro
