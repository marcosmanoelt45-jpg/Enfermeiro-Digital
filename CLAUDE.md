# CLAUDE.md — Enfermeiro Digital (Memória Canônica do Projeto)

## Visão Geral do Projeto
O **Enfermeiro Digital** (plataforma **Enfere**) é uma aplicação educacional de simulação clínica de enfermagem mobile-first.
- **Produção**: https://enfere.vercel.app
- **Repositório**: https://github.com/marcosmanoelt45-jpg/Enfermeiro-Digital.git (branch: `main`)
- **Backend & Auth**: Supabase (`https://xwqgyvqofxdqdbhltdzf.supabase.co`) + Base44 SDK

---

## Pilares Essenciais Ativos
Navegação num registro só: `src/features/navegacao/modulos.js` (header, dock, gaveta "Prática" e trilha). Dock: Início · Prática · Cálculo · Técnicas · Perfil. Chaves de emergência em `src/features/flags.js`.
1. **Hub do Estudante**: `src/pages/StudentDashboard.jsx` + `src/components/mobile/MobileBottomDock.jsx` + `src/components/mobile/EnfereVivoTrail.jsx`.
2. **Goti Preceptor & IA Socrática**: `src/components/mascot/GotiAnimated.jsx` + `GotiChatDrawer.jsx` + `src/services/gotiPreceptorService.js` (filtro de saída em `gotiFiltro.js`) + `src/services/socraticTutorService.js`.
3. **Consulta ao Vivo** (`/consulta`): `src/features/consulta/` sobre o motor `src/features/cena/` (personagem em vídeo, voz, microfone, anotações, registro e relatório). Servidor: Edge Function `cena-ia`.
4. **Plantão ao Vivo** (`/passagem-plantao`): `src/features/plantao/` (enfermeira Ana). O SBAR antigo segue em `/plantao/gravacao` (`src/pages/SbarHandoffLab.jsx`).
5. **Cálculo com o Dr. Rui** (`/laboratorio-calculos`): `src/features/calculo/` + banco `src/data/calculo/banco.json`.
6. **Técnicas** (`/tecnicas`): `src/features/tecnicas/` + `src/features/minijogos/` (minijogos, POPs, videoteca UFSM).
7. **Casos Clínicos**: `src/pages/CaseStudySimulator.jsx` + `src/pages/CaseLibrary.jsx` (NANDA-I, NIC, NOC e SAE). O Montar Caso saiu do menu (`/montar-caso` leva à Consulta).

## Voz e IA
- IA: Gemini (`GEMINI_API_KEY`, `supabase/functions/_shared/llm.ts`), com OpenRouter de reserva.
- Voz dos personagens: Gemini TTS (`_shared/vozGemini.ts`, função `voz`), cache permanente no bucket `vozes-cache`. Plano gratuito: 10 áudios/dia. O lote diário (`{acao:"lote"}`) gera as falas fixas mais prováveis (`scripts/vozes/exportar-falas-fixas.mjs`); o agendamento é a migration 012 (pg_cron). Reserva: mp3 do VoiceBox e voz do navegador.
- Transcrição: AssemblyAI (`stt-token`, `transcrever`, que apaga o transcript depois de ler).
- Edge Functions: `cena-ia`, `voz`, `stt-token`, `transcrever`, `clinical-ai-sanitize`. Cotas desligadas (`COTAS_ATIVAS`), o app é gratuito.

---

## Regras de Qualidade e Desenvolvimento
- **Comunicação**: Sempre responder em **Português do Brasil (PT-BR)**, de forma curta e direta: resultado primeiro, sem repetir o que já foi dito.
- **Economia de tokens**: não releia arquivos inteiros sem necessidade (use Grep e trechos); reaproveite as auditorias em `docs/auditoria/` em vez de auditar de novo; em workflows, use `model: "sonnet"` para implementação mecânica e reserve o modelo principal para decisões e verificação; trabalho braçal grande vai para o Antigravity via Maestri quando estiver conectado.
- **Validação Obrigatória**: Antes de dar uma tarefa por concluída, rode:
  ```bash
  npm run lint
  npm run typecheck
  npm run build
  ```
- **Deploy**: Commits na branch `main` (`git push origin main`) realizam deploy automático na Vercel (`https://enfere.vercel.app`). Nunca faça push sem pedido explícito do dono: push na `main` é deploy em produção.
- **Banco de dados**: migrations novas vão em `supabase/migrations/NNN_*.sql`. Nunca aplique migration nem faça deploy de Edge Function em produção sem autorização; teste antes num branch do Supabase.
- **Escopo**: não mexa em `enfere-simulador-antigravity/` nem nos protótipos da raiz (`Enfere · Atendimento por voz*`, `*.pdf`). São trabalho em andamento do dono no Antigravity.

---

## Sistema de Design & Motion ("Enfere Vivo", inspirado no Duolingo sem copiar)
- **Tema**: escuro permanente. Fundo `#0B131D`; superfícies `#131F2E`/`#16222E`; linhas `#27394B`; marca `#20D5B5`; acerto `#3DD68C`; erro `#FF6B6B`; alerta e ofensiva `#FFC247`. Fonte Nunito. Detalhes em `DESIGN.md`.
- **Botões**: use sempre o `<Button>` de `src/components/ui/button.jsx`.
  - Variantes: `primary`, `success`, `danger`, `warning`, `info`, `outline`, `locked`, `ghost`, `link`.
  - Tamanhos: `sm`, `default`, `lg`, `xl`, `icon`. Prop `loading` mostra o spinner.
  - Em `<button>` cru, use as classes `btn-3d-teal|emerald|amber|rose|sky|outline`.
  - O lábio 3D é `box-shadow`, não `border-bottom`, então pressionar não desloca o layout.
  - Não sobrescreva a face com `bg-teal-600 text-white`.
- **Motion**: os tokens ficam em `src/lib/motion.js` (springs, `fadeUp`, `listStagger`, `sheetVariants`, `shake`, `vibrate()`) e nas variáveis CSS `--ease-*` e `--dur-*` de `src/index.css`.
  - Só anime `transform` e `opacity`.
  - Interações ficam abaixo de 300 ms.
  - Nunca use `scale(0)`; entradas e saídas usam ease-out.
  - Não anime ações repetidas o dia todo.
  - O app já é envolvido por `MotionConfig reducedMotion="user"`.
- **Feedback de resposta**:
  - Acerto: `vibrate(15)` + pop.
  - Erro: `vibrate([30,40,30])` + `shake`.
  - Sem sons de acerto/erro: foram removidos a pedido do dono. Não reintroduzir.
  - Confete (`src/lib/celebrate.js`) só em momentos raros: acerto de primeira, sessão com 70% ou mais, meta do dia.
- **Progresso**: use `AnimatedProgress` (`ui/animated-progress.jsx`) e `AnimatedNumber` (`ui/animated-number.jsx`) em barras, PE e ofensiva.
- **Transições de página só com opacidade**: um `transform` num ancestral quebra o `position: fixed` do dock e das folhas inferiores.

---

## Segurança (varredura de 02/11/2026, relatório em `CLAUDE-SECURITY-20261102-031142/`)
- Nunca use o prefixo `VITE_` em segredos: toda variável `VITE_*` vai para o JS público. As chaves do projeto (OpenRouter, Gemini) ficam só nos secrets da Edge Function `clinical-ai-sanitize`.
- Nunca leia `import.meta.env[chave]` de forma dinâmica, porque isso embute todas as variáveis no bundle. Acesse `import.meta.env.VITE_X` explicitamente.
- Nunca guarde senha no cliente. Dados de usuário no localStorage sempre levam o id do usuário na chave.
- Valide `returnTo` e qualquer redirecionamento com `new URL(valor, location.origin)`, exigindo a mesma origem (`src/lib/authReturnTo.js`).
- Na RLS, o cliente nunca define `org_id`, `role`, `created_by_id`, `signed_by` nem o hash de assinatura. Isso é papel de trigger ou RPC no banco (ver `008_security_hardening.sql`).

---

## Skills instaladas (`.claude/skills/`, fora do git)
- Design e motion: comece por `impeccable`, `emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `taste-skill`, `ui-ux-pro-max`, `mobile-native` e `motion-framer`.
- Textos da interface: `stop-slop` e `humanizer`, adaptando ao PT-BR.
- Segurança: `/claude-security` e as skills `strix-*`.
- Fontes originais: `C:\Users\mxmin\.claude\skill-sources\`.

---

## Blindagem Visual do Mascote Goti
1. **Logotipo Oficial (`src/assets/goti-icone-oficial.png`)**: É o ícone aproximado do rosto do Goti (com chapéu de enfermeiro e cruz verde, fundo verde-água arredondado, 100% transparente sem bordas brancas). Usado no header (`StudentHeader.jsx`) e chat (`GotiChatDrawer.jsx`).
2. **Animações do Goti (`GotiAnimated.jsx` e `EnfereSplash.tsx`)**: Utiliza o motor `<video>` + `<canvas>` com os vídeos sólidos (`public/goti/goti-*.webm`), poster em PNG enquanto o vídeo carrega (`goti-pose-*.png`) e fallbacks em WebP animado (`public/goti/goti-*.webp`).

---

## Plano Cenas ao Vivo (concluído)
- Histórico em `docs/plano/` (`ESTADO.md` tem as divergências e os pendentes). Código novo continua em `src/features/`.

## Teste no iPhone (WebKit, no Windows)
- O Simulador do iOS só existe em Mac com Xcode. Aqui o teste é o WebKit (motor do Safari) com perfil de iPhone: `node C:/Users/mxmin/.claude/tools/ios-webkit/ios.mjs shot <rota> --out arquivo.png`, de dentro do projeto. Ele sobe o Vite sozinho, entra pela sessão demo e lista erros de console e de rede.
- Para fluxos com toque e digitação, importe `abrir` de `file:///C:/Users/mxmin/.claude/tools/ios-webkit/ios.mjs`. Não cobre microfone, `MediaRecorder`, reconhecimento de fala nem a barra do Safari: isso só num iPhone de verdade.
- Rode o teste de iPhone **só quando o dono pedir** para testar no celular (gasta tokens). Fora disso, valide com lint, typecheck, testes e build.
