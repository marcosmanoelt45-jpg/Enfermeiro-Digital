# ESTADO do plano (o Claude Code atualiza ao fim de cada fase)

> Curto e factual. A próxima sessão lê este arquivo **em vez de** redescobrir o código. Máximo de cerca de 120 linhas: condense as fases antigas quando crescer.

## Fases
| Fase | Status | PR | Data | Observações |
|---|---|---|---|---|
| F0 Base do repositório | em andamento | — | 06/11/2026 | 0.1 a 0.7 feitas; falta conferir os cabeçalhos de cache no preview da Vercel. Branch `feat/cenas-f0-base`, a partir de `origin/main` @ 027f623 |
| F1 Base do servidor | feita no branch, aguardando PR/produção | — | 06/11/2026 | Branch `feat/cenas-f1-servidor`: `_shared` (1.1), migration 010 da cota (1.2), `clinical-ai-sanitize` sobre o `_shared` (1.3), Edge Function `transcrever` (1.4), cliente sem chave em `src/features/cena/` (1.5). Verificado com Deno + PGlite (`~/.claude/tools/servidor-checks/`), sem Supabase de teste |
| F2 Motor Cena ao Vivo | feita no branch, aguardando teste em aparelho | — | 06/11/2026 | Branch `feat/cenas-f2-motor` (empilhado sobre a F1). 2.1–2.8 feitas e verificadas no desktop (`/dev/cena`: falas, eco, erro, bloqueio); falta o checklist 2.9 em iPhone/Android reais |
| F3 Consulta: conversa | feita no branch, falta a bateria de IA | — | 06/11/2026 | Branch `feat/cenas-f3-consulta` (empilhado sobre a F2). 3.1–3.6 feitas e verificadas; a bateria 3.7 está escrita e testada, mas NÃO rodou (precisa de branch do Supabase, `CENA_IA_DEBUG=1` e usuário de teste). Flag `consulta` desligada |
| F4 Consulta: fechamento | feita no branch (sem quiz D7) | — | 06/11/2026 | Branch `feat/cenas-f4-fechamento` (empilhado sobre a F3). Pontuação por código, ação `finalizar_consulta`, registro, relatório, histórico e XP. IA do avaliador não rodou (sem branch do Supabase) |
| F5 Minijogos + Técnicas | pronta no branch (sem sons) | #12 | 07/11/2026 | Motor, 5 tipos, 3 minijogos à mão + 29 gerados, `/tecnicas` com abas POPs/Vídeos embutidas (`VideotecaConteudo`), `procedures-1` corrigido (tempo e fim vêm das mensagens do YouTube). Falta só: sons da ausculta, que dependem de licença do dono |
| F6 Cálculo com o Médico | pronta no branch (flag desligada) | a abrir | 07/11/2026 | Geradores com semente, banco de 133 itens (28 com erro) verificado por fórmulas independentes, `numerosFalados` (42 casos), página nova atrás da flag `calculoMedico` em `/laboratorio-calculos`. mp3 do Dr. Rui ainda não gerados (voz do navegador) |
| F7 Plantão com a Enfermeira | pronta no branch (flag desligada) | a abrir | 07/11/2026 | Parser de vitais com 45 casos, dados dos 20 cenários, roteiro, ação `avaliar_plantao` (IA não rodou: sem Supabase de teste), prontuário, cena e relatório atrás da flag `plantaoVivo` em `/sbar`. mp3 da Ana não gerados |
| F8 Navegação final | feita no local (branch feat/cenas-f8-final) | — | 07/11/2026 | Dono confirmou D2, manter o SBAR antigo como modo gravação e tirar o Montar Caso. Falta publicar |
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
- **`dosage-1` já estava corrigido (etapa 0.6).** `answerUnit` já existia nos 20 problemas e nos 6 geradores e a página já lia `problem.answerUnit` (PR #3). A 0.6 só tirou o "gotas/min" de reserva da tela, exportou os 6 geradores para testá-los um a um e criou `src/data/dosageProblems.test.mjs`. A F6 pode contar com `answerUnit` em todo problema.
- **`TecladoCalculo` (F6).** O `TecladoCalculo.jsx` antigo, sem uso, foi apagado na auditoria (PR #3). A F6 cria o seu do zero; não há conflito de nome nem o que reaproveitar.
- **`vercel.json` (etapa 0.7, feita).** O arquivo já tinha cabeçalhos de segurança e CSP em modo relatório (só avisa, não bloqueia). A 0.7 estendeu o cache em vez de recriá-lo. Hoje: `no-store` fora de `assets|vozes|goti|pacientes|personagens|minijogos`; `/vozes` imutável por 1 ano; `goti|pacientes|personagens|minijogos` com `max-age=86400, stale-while-revalidate=604800` (eram 7 dias + 1 dia); `/assets` imutável. As pastas `audio/` e `previews/` saíram das regras: não existem mais em `public/` e nada as referencia. **Para a F1/F2:** acrescentem ao `connect-src` da CSP o que usarem de novo (ex.: o websocket do streaming do AssemblyAI).
- **Falas dos pacientes em MP3.** `public/pacientes/*` agora tem `.mp3` mono de 48 kbps no lugar dos `.wav` (PR #3). Vale para a produção de vozes (P2).
- **Sessão e contas.** As contas locais foram removidas e o login exige e-mail confirmado no Supabase. `isLocalDemoSession()` (`supabaseClient.js`) continua válida para a D9: só o modo demonstrativo (id `aluno-demo-session`) fica sem sessão do Supabase.
- **Rodapé e Ajustes.** A gaveta de bolso do rodapé foi removida; `StudentFooter` renderiza `<MobileBottomDock />` sem props. Os Ajustes agora são um botão no Perfil (`/conta`). O toque (`triggerHaptic`) só vibra, sem bipe.

## Produção (o que está em produção vs. só no branch)
- Edge Functions em produção: `clinical-ai-sanitize` (v5, ativa; conferido em 06/11/2026)
- Migrations em produção: 001–009 (conferido em 06/11/2026)
- Aguardando autorização do dono para produção, nesta ordem: (1) definir o secret `ASSEMBLYAI_API_KEY` no Supabase (só o dono tem a chave); (2) aplicar a migration `010_ai_cota.sql`; (3) deploy de `transcrever` e de `clinical-ai-sanitize`; (4) só então mesclar o PR da F1. Para a F2, depois: secret `STT_MODEL` (opcional, padrão universal-3-6-pro), bucket privado `vozes-cache`, e deploy de `stt-token` e `voz` (sem `VOZ_AO_VIVO_URL` a `voz` responde 204 e tudo cai na voz do navegador). Para a F3: migration `011_consultas.sql`, deploy de `cena-ia` (usa `OPENROUTER_API_KEY`), ligar a flag `consulta` só depois da bateria. `CENA_IA_DEBUG=1` só no branch de teste, nunca em produção. Mesclar antes disso quebra a transcrição e deixa a IA sem cota no banco. Migrations futuras: testar com `servidor-checks/banco.mjs` (PGlite) antes de qualquer Supabase.

## Divergências da F2
- **Silêncio do iOS em código.** O desbloqueio usa um WAV mudo montado em `reprodutor.js` (`montarWavSilencioso`), não um `public/vozes/_silencio.mp3`: dispensa arquivo e ffmpeg.
- **Pronúncia em `.js`.** `src/data/falas/pronuncia.js` (não `.json`): o ESLint do projeto não lê `import ... with { type: "json" }`. O conteúdo é o do plano.
- **`voz` devolve WAV.** A função entrega o WAV do VoiceBox sem converter para mp3 no Deno (o navegador toca WAV). Cache no bucket privado `vozes-cache`, que precisa ser criado no Supabase; sem o bucket a função funciona sem cache.
- **Clipes dos pacientes.** `marcus` e `teresinha` só têm `falando`, `acerto` e `erro` (`fala` vira `falando`); sem `parado`/`pensando` o palco mostra o poster. `medico-rui`, `enfermeira-ana` e `goti` são placeholders sem clipe.
- **Scripts do Goti mantidos.** `scripts/gerar-voz-goti.js` e `scripts/gerar-vozes-simulador.py` ficam até existir `src/data/falas/goti.json`.
- **Não verificável aqui:** microfone, AudioWorklet em Safari, WebSocket real da AssemblyAI, voz do navegador e vibração. Só no aparelho (checklist do PR).

## Divergências da F3
- **15 arquétipos, não 20.** `randomClinicalScenarios.js` tem 15; o plano dizia 20. O exportador (`scripts/consulta/exportar-arquetipos.mjs`) gera `arquetipos.js`, `temas.js` e `nanda-codigos.js` e o teste confere com a fonte.
- **Candidatos NANDA por sobreposição de palavras**, não por `getNandaContextualSuggestions` (ele devolve um diagnóstico só). Mínimo de 4 candidatos por arquétipo, completados com diagnósticos gerais (00132, 00030, 00155, 00201). Vale revisar a qualidade clínica dessas listas.
- **Dificuldade manda sobre a personalidade.** O teto de `confianca` de colaborativo/ansioso não vale no difícil, e o mínimo de `esquecido` da personalidade esquecido não vale no fácil. O difícil usa 8 a 12 fatos (com 14, 40% de confianca/esquecido não fecha).
- **Fato `esquecido`** é liberado quando o tema já foi perguntado 2 vezes (`contagemTemas ≥ 2`), ou seja, vale a partir do turno seguinte à 2ª pergunta.
- **`_debug` da bateria** traz também `delta`, `exames` e `fatos` (id, tema, regra, peso, versaoFalsa, sem o texto verdadeiro). Só sai com `CENA_IA_DEBUG=1`.
- **Leitura do cliente por coluna.** A migration 011 esconde `confianca`, `contagem_temas` e `notas_memoria` com GRANT por coluna (a ficha não tem nem GRANT). A conversa de sessão ativa vem de `retomar_consulta`.
- **Mp3 das aberturas não gerados.** `consulta-abertura-<personagem>.json` (16 falas cada) espera o dono rodar `node scripts/voicebox/gerar-falas.mjs`; até lá a voz é a do navegador.
- **Chip "Examinar" não aparece** (os minijogos nascem na F5). O servidor já devolve `exame`.
- **Só 2 personagens de paciente (idosos).** Faixa etária e sexo da montagem se reduzem à escolha do paciente; a idade é sorteada entre 62 e 80.
- **Falha de login no meio da consulta** mostra a mensagem do servidor com "Tentar de novo", sem redirecionar para o login com `returnTo`.
- **Formato da resposta da IA** é validado à mão (sem zod) em `turnoConsulta.ts`; o corpo do pedido usa zod no `index.ts`.

## Divergências da F4
- **Quiz D7 (4.6) não feito.** Depende de decisão do dono (D7) e do card de questões; fica para depois.
- **Registro sem microfone.** O campo "O que você encontrou" é texto puro; o ditado por voz (reuso do `ControleFala`) ficou de fora.
- **"Examinar" fora do registro** (os minijogos nascem na F5).
- **Citações numeradas por turno do aluno** (T1 = 1ª fala do aluno e a resposta dela), não pela `ordem` da mensagem no banco; o validador usa a mesma numeração.
- **Relatório sem IA** renormaliza a nota geral (anamnese 0,35 / segurança 0,2 / raciocínio 0,2, divididos por 0,75) e o raciocínio vale 100% por código.
- **Extra "sem relação"** (−10 cada) é o diagnóstico fora dos candidatos do caso; extras plausíveis não são punidos.
- **Leitura do relatório e dos turnos** é direta nas tabelas (RLS: só do dono e só depois de encerrada), sem ação de servidor. `Rever conversa` depende de a migration 011 estar aplicada.
- **Busca de diagnóstico** usa `searchNandaCatalog` direto (o `NandaSearchBar` depende do Base44).

## Divergências da F5
- Categoria extra `procedimentos` para POPs fora de curativos, semiotécnica e medicamentos.
- Cada região de `tocar-regiao` pode ter `vista` própria (ausculta: 6 anteriores + 6 posteriores).
- Fonte do POP de curativo marcada como "conferir fonte" na bandeja.
- Minijogo gerado de semiologia usa id com hífen (`escolher-aspecto-secrecao`).

## Divergências da F6
- **Banco com 133 itens, não 150.** Os geradores só têm cerca de 110 combinações distintas; com teto por gerador (para balancear os tipos) ficaram 85 gerados + 20 autorais + 28 com erro (21%). Para chegar a 150 é preciso ampliar os casos dos geradores. `scripts/calculo/gerar-banco.mjs` é determinístico (rodar duas vezes gera o mesmo arquivo).
- **Geradores ampliados e com metadados.** `proceduralDosageGenerator.js` agora aceita `rng` (padrão `Math.random`), devolve `tipo`, `prescricao`, `disponivel` e `entrada` (só dados) e tem mais casos (soluções, tempos, insulina na BIC, doses de nitroglicerina em mcg/min até 40). `entrada` alimenta a conferência independente de `verificar.test.mjs`.
- **Tolerância.** Inteiros (gts/min, mcgts/min, ampolas): resposta tem de ser o inteiro; com casa decimal a menos de 0,5 vale "Quase! Arredonde", sem penalidade. Decimais (mL, mL/h, mcg/min): 0,05 absoluto.
- **`CenaAoVivo` ganhou 3 props opcionais:** `slotAbaixoPalco`, `slotControle({enviar, podeEnviar, status})` e `placeholderFala`. Todas as respostas (teclado, voz, texto, "Questionar", "Próxima") passam por `onEnviar`; a página usa uma ref para dizer a ação.
- **Pressa do modo corrido só aparece na tela** (aos 60 s, em texto). O médico não fala sozinho fora de turno: a cena só toca falas devolvidas por `onEnviar`. Se o dono quiser a pressa falada, a cena precisa de uma ação para falas fora de turno.
- **Gênero neutro nas falas.** O Dr. Rui não diz "enfermeira" nem "certa de questionar": o aluno pode ser de qualquer gênero.
- **Não testado:** voz do aluno com o microfone (só desktop com teclado), mp3 do Dr. Rui (rodar `node scripts/voicebox/gerar-falas.mjs` com o perfil "Rui" no VoiceBox) e aparelho real.

## Divergências da F7
- **Dados em arquivo à parte.** `lacunas`, `perguntas` e `elementosChave` ficam em `src/data/sbarPlantaoDados.js` (`PLANTAO_CENARIOS`, `cenarioDoPlantao`), não dentro de `sbarHandoffScenarios.js`: a página antiga não foi tocada e os campos só foram acrescentados (teste confere).
- **Lacunas sem radar.** O `ClinicalGapRadar` e a semiologia têm resultado fixo e genérico (incoerente com cada cenário). Cada lacuna tem então `exame` (múltipla escolha de 4 opções, a correta é o `valorEsperado`) que vira um minijogo `escolher`. `minijogo` só em `icc` (ausculta) e `cetoacidose_pediatrica` (contar-fr, 28 irpm). `gapKey` fica null.
- **Prontuário sem a narrativa da avaliação**, que entregaria os achados das lacunas. Mostra situação, antecedentes, vitais, lacunas e pendências. Alguns elementos-chave de A só podem ser sabidos examinando.
- **Prontuário é sempre folha inferior** (sem 3ª coluna em telas largas).
- **Conferência numérica vem do cliente** e o servidor só valida o formato; só afeta a nota do próprio aluno.
- **Sem tabela nova:** `avaliar_plantao` não grava sessão; o relatório volta direto e o histórico é do cliente.
- **Parser de vitais:** agora lê números por extenso (`src/lib/numerosPorExtenso.js`, também usado no Cálculo) e "12x8". Assinatura pública igual.
- **Achados fora do golden, revisados (07/11/2026):** trauma_cranio, paliativos_terminal, queimado_agudo, hemorragia_digestiva, tep_pos_op e dpoc batem com o golden ou só detalham de forma coerente. Em `delirium` tirei "cama baixa" (não consta). Decidi os dois pontos: `sepse_urinaria` passou a "pele fria e pegajosa, enchimento capilar de 4 s" (coerente com hipotensão e má perfusão) e `queimado_agudo` manteve "edema de face discreto" ("edema de face discreto" não consta no golden, mas é plausível). No `avc_isquemico`, o clinicalSummary diz déficit em MSE e o golden, hemiparesia direita; segui o golden.
- **Bug da F4 achado e corrigido:** o regex dos códigos NANDA em `cena-ia/index.ts` perdeu a barra e recusava todo diagnóstico (commit `fix(servidor)`). Está também no branch da F4.
- **Não testado:** voz com microfone, mp3 da enfermeira Ana (`node scripts/plantao/gerar-falas.mjs` e depois `scripts/voicebox/gerar-falas.mjs`, perfil "Ana"), relatório com IA real.

## Divergências da F8
- **Página antiga do Cálculo removida** (`MedicationDosageLab`): as rotas antigas levam ao Cálculo com o Dr. Rui. O `medicationCatalog` fica (usado por `DrugPicker` e `References`).
- **`CaseStudio.jsx` removido** (sem rota); componentes de prontuário mantidos.
- **Não movi `public/pacientes` para `public/personagens`**: só renomearia arquivos e invalidaria o cache dos vídeos. Os `passo_*.mp3` e `fala.mp3` sem uso foram apagados (1,9 MB).
- **`/revisao`** nova e simples (questões pendentes do atendimento por voz antigo, com o `PlurallQuestionCard`).
- **README e DESIGN.md não foram reescritos** nesta fase.
- **Achado fora do escopo:** RLS de `profiles` com recursão infinita (erro 500 ao ler o perfil, também em produção). Correção em `supabase/migrations/013_profiles_sem_recursao.sql`, aguardando o dono aplicar.
- **DPA e política de privacidade** agora listam Supabase, Google (Gemini), AssemblyAI e OpenRouter, e dizem que o plano gratuito do Gemini pode usar o conteúdo para melhorar produtos do Google (o DPA dizia "retenção zero", o que não vale nesse plano).

## Medições
- Latência do turno da Consulta (mediana 4G): —
- Tokens por turno (entrada/saída): —
- Custo estimado por consulta de 30 turnos: —
- Tamanho de `dist/assets` (antes → depois): —

## Depois (fora do escopo, não esquecer)
- ~~Goti revela o modelo e resume o prompt~~ feito em 07/11: regra no prompt e filtro de saída (`src/services/gotiFiltro.js`)
- Trocar o "Cenário B" (prompt livre) da `clinical-ai-sanitize` por uma lista de tarefas permitidas (hoje qualquer aluno logado manda prompt livre, limitado só pela cota `llm`)
- ~~Apagar o transcript na AssemblyAI~~ feito em 07/11: a `transcrever` faz DELETE ao ler o texto ou o erro
- CSP em modo relatório sem `report-to`: não coleta nada. Precisa de uma Edge Function receptora (depende de autorização)
- ~~Filtro de fala com provedores/modelos e prompt~~ já estava no `filtroFala` (paciente) e agora no Goti
- Histórico e gamificação no Supabase em vez do localStorage (hoje se perde ao trocar de aparelho)
- Voz ao vivo hospedada (D4)
- Minijogos: feitos em 08/11 descarte, higienização das mãos, paramentação, desparamentação, 9 certos, glicemia capilar, flebite e LPP (luva estéril e sondagem já vêm dos POPs). Faltam IM ventroglútea (precisa de imagem do Flow para o tocar-região) e purgar equipo
- ~~Bot diário das vozes Gemini~~ migration 012 aplicada em 08/11 (pg_cron às 08:15 UTC)
- ~~RLS de profiles com recursão e usuários sem perfil~~ migrations 013 e 014 aplicadas em 08/11
