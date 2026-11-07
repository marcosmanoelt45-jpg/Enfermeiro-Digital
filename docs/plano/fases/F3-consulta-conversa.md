# F3 — Consulta ao Vivo: montar o paciente e conversar

**Branch:** `feat/cenas-f3-consulta` · **Depende de:** F2 · **Risco:** alto (comportamento de IA, custo) · **Tamanho:** grande. Faça em duas sessões: 3.1–3.4 (servidor) e 3.5–3.7 (interface e bateria).
**Objetivo:** o aluno escolhe tema, paciente e personalidade e conversa por voz ou texto com um paciente coerente, que esconde e revela informações por regras.

## Ler
- `00-contexto.md`, `ESTADO.md`, este arquivo
- `01-contratos.md` §C5, C6, C7, C8, C9 · `03-design.md` §3, §5 e §7 (Consulta)
- `ia/ficha.md` e `ia/paciente.md` (prompts **prontos**: implemente como estão)
- `src/data/randomClinicalScenarios.js` linhas 1–40 e 270–325 (formato do arquétipo e `generateProceduralClinicalCase`)
- `src/data/simuladorTopicos.js` (45 linhas)
- `src/lib/nandaCatalog.js` linhas 700–760 (`findNandaByCode`)
- `src/features/cena/CenaAoVivo.jsx` (API) e `src/features/cena/servidor.js`

## Não ler
`CaseStudio.jsx`, `Videochamada.jsx`, `simuladorCasosData.js`.

## Etapas

### 3.1 Dados compartilhados entre cliente e servidor
Para não duplicar, as personalidades e o mapa de temas ficam em **JS puro** em `supabase/functions/_shared/dados/`, importado pelo servidor (Deno lê `.js`) e pelo cliente (via `src/features/consulta/dados/index.js`, que reexporta por caminho relativo). **Antes de decidir, confirme que o Vite resolve o import de fora de `src/`.** Se não resolver, crie o script `scripts/sincronizar-dados.mjs`, que copia os arquivos e falha no `npm test` se as cópias divergirem.
- `personalidades.js` (§C6, 8 itens)
- `temas.js`: `{ id, rotulo, arquetipos: ['sc_icc', ...] }`, cruzando `simuladorTopicos` com os `specialty` dos arquétipos
- `arquetipos.js`: cópia **enxuta** dos 20 arquétipos (só os campos usados na ficha), mais `nandaCandidatos` (até 12 `{codigo, nome}` via `getNandaContextualSuggestions(disease)`), gerada por `scripts/consulta/exportar-arquetipos.mjs` a partir de `randomClinicalScenarios.js` e `nandaCatalog.js`. Um teste confere que os ids batem.
- `nomes.js`: lista enxuta de nomes de `src/lib/sampleNames.js` + `bloqueioNomes.js` (ver `ia/ficha.md`).
- `examesPorEspecialidade.js`: o mapa de `ia/ficha.md`.
- `nanda-codigos.js`: só a lista de códigos válidos (para o servidor validar sem carregar o catálogo inteiro)

### 3.2 Migration `011_consultas.sql`
Exatamente §C9 (tabelas + RLS). No branch do Supabase, teste com o usuário de teste:
- SELECT da própria sessão funciona;
- SELECT de `consulta_fichas` retorna 0 linhas;
- INSERT direto pelo cliente falha.

### 3.3 Lógica do servidor (JS puro, testável no Node)
Em `supabase/functions/_shared/logica/` (com testes `*.test.mjs` que o `run-tests` já encontra):
- `validarFicha.js`: os invariantes de §C7. Retorna `{ ok, erros[] }`.
- `fichaDeTemplate.js`: ficha **sem IA** a partir do arquétipo (reserva quando a IA falhar duas vezes). Os fatos são derivados dos campos `anamnesis`, `medicalHistory`, `medications`, `allergies`, `notes`, e as regras de revelação são distribuídas pela dificuldade.
- `regras.js`:
  - `estadoDosFatos(ficha, { confianca, contagemTemas })` → para cada fato: `liberado` (o texto verdadeiro vai no prompt) ou `bloqueado` (só o tema e a versão falsa ou o "não lembra"), seguindo a tabela de `ia/paciente.md`. `livre` e `pergunta_direta` ficam sempre liberados (o prompt manda contar só se perguntarem). `confianca` é liberado quando `confianca ≥ confiancaMin`. `esquecido` é liberado quando `contagemTemas[tema] ≥ 2`.
  - `montarEstadoDoTurno(...)` → o texto do bloco ESTADO DO TURNO (testado por snapshot de string).
  - `aplicarResposta(estado, respostaIA)`:
    - limita `delta_confianca` a −10..+10;
    - **descarta** de `revelados` os ids não liberados;
    - soma `temas_do_aluno` em `contagemTemas`;
    - atualiza a confiança (0–100);
    - devolve o novo estado e as listas para salvar.
- `rapport.js`: `<40` baixo, `40–69` médio, `≥70` alto.
- `memoria.js`: monta o bloco "Memória" do prompt (fatos já revelados + notas curtas devolvidas pela IA, no máximo 12) e escolhe os **últimos 10 turnos** para o histórico enviado.
- `sintomasLeigos.js`: sinais vitais → frase leiga (`ia/paciente.md` §2).
- **A sessão guarda** `contagem_temas` e `notas_memoria` (colunas já previstas em §C9).

**Testes mínimos:**
- o fato `confianca` não passa com confiança abaixo do mínimo, mesmo que a IA o marque, e o texto verdadeiro **não aparece** no ESTADO DO TURNO;
- o `esquecido` só é liberado na 2ª pergunta do tema;
- a confiança nunca sai de 0–100;
- a ficha de template passa no `validarFicha` para os 20 arquétipos × 3 dificuldades.

### 3.4 Edge Function `cena-ia` (roteador por `acao`)
`supabase/functions/cena-ia/index.ts` → `acoes/criarConsulta.ts` e `acoes/turnoConsulta.ts` (as próximas fases acrescentam ações).
- **`criar_consulta`:**
  1. `exigirUsuario` → `consumirCota('consulta', 5)`;
  2. escolhe o arquétipo (pedido, sorteio pelo tema ou `generateProceduralClinicalCase` equivalente);
  3. resolve `surpresa` → personalidade real;
  4. chama o LLM com o prompt de `ia/ficha.md` (JSON, `temperature 0.7`, `maxTokens 1800`, timeout 25 s);
  5. `extrairJson` → `validarFicha`. Se falhar, **uma** nova tentativa enviando os erros; se falhar de novo, usa `fichaDeTemplate`;
  6. insere a sessão e a ficha com o service role e devolve `{ sessaoId, briefing, personagemId }`. O briefing é só o que a equipe sabe: nome, idade, setor, queixa e sinais vitais.
- **`turno_consulta`:**
  1. valida a entrada com zod (`texto` de 1 a 600 caracteres, `turnoId` uuid);
  2. se o `turnoId` já existe, devolve a resposta salva (`TURNO_DUPLICADO`, 200);
  3. carrega a sessão: `encerrada` → `SESSAO_ENCERRADA`; `turnos_aluno ≥ 40` → `COTA_EXCEDIDA`;
  4. `sanitizeClinicalText(texto)` (o da função atual, movido para `_shared/dlp.ts`);
  5. monta as 5 mensagens exatamente como em `ia/paciente.md`: `system` fixo **primeiro**, igual para todas as sessões, para o cache de prefixo do provedor funcionar; depois a ficha, a personalidade e a memória; por fim o histórico e o turno atual;
  6. LLM com JSON, `temperature 0.8`, `maxTokens 220` e timeout de 12 s. Se o JSON vier inválido, faz uma tentativa de reparo com a mensagem "Responda apenas o JSON no formato pedido". Se falhar de novo, `IA_INDISPONIVEL`;
  7. `aplicarResposta` → salva os 2 turnos (aluno e paciente) numa única operação, atualiza a sessão (`turnos_aluno`, `confianca`, `contagem_temas`, `notas_memoria`) e devolve `{ fala, emocao, rapport, turnosRestantes }`;
  8. `logEvento('turno', { sessaoId, ordem, modelo, ms, tokens })`.
- **Filtro de saída** (`_shared/logica/filtroFala.js`, testado). Se a fala:
  - contiver "sou uma IA", "modelo de linguagem", "assistente virtual", códigos NANDA ou nomes de diagnóstico de enfermagem, ou "diagnóstico é", troca por uma fala de reserva no personagem ("Desculpa, me perdi… o que você perguntou?") e registra no log;
  - tiver mais de 3 frases, corta na 3ª.

### 3.5 Interface da montagem (`src/features/consulta/`)
`ConsultaPage.jsx` (rota `/consulta`, flag `consulta`, registro de módulos atualizado) com 3 passos e `AnimatedProgress`:
1. **Quem é o paciente:** tema (chips; "Aleatório" é o padrão) · faixa etária e sexo · personagem (cards filtrados por faixa e sexo em `personagens.js`; se só houver um, já vem escolhido).
2. **Como ele é:** personalidades em cards (ícone, nome, descrição, "Surpresa" em destaque) · dificuldade (3 opções segmentadas).
3. **Briefing:** Panel "O que a equipe já sabe" + `Button size="xl"` "Começar consulta". **Esse toque chama `desbloquear()`** (F2) antes de navegar para a cena.

Estados: carregando a ficha (Goti `thinking` + "Preparando seu paciente…", até 25 s), erro (nova tentativa), bloqueio (demo ou cota, §C5).

### 3.6 Cena da consulta
`ConsultaCena.jsx` usa o `CenaAoVivo`:
- `falasIniciais`: fala fixa de abertura conforme a personalidade (`src/data/falas/consulta-abertura-<personagem>.json`, 2 variações por personalidade). Exemplos: colaborativo, "Bom dia… é você que vai me atender?"; desconfiado, "…Oi."
- `onEnviar` → `servidor.consulta.turno` → `[{ texto: fala, emocao, origem: 'aovivo' }]`.
- `slotTopo`: `<Rapport nivel>` (3 pontos, sem número, 03 §3).
- Progresso: turnos usados de 40. Com 5 restantes, um aviso discreto: "Faltam 5 falas: hora de ir fechando".
- Ação "Encerrar consulta" leva à tela de registro (F4; até lá, um placeholder "Em breve: relatório").
- Rascunho no localStorage (`enfere_consulta_rascunho_<userId>`) guarda só o `sessaoId`, para retomar se a página recarregar. **A conversa vem do servidor** quando a sessão é retomada: crie a ação `retomar_consulta`, que devolve os turnos (sem ficha) se a sessão estiver ativa.

### 3.7 Bateria de comportamento (antes do PR)
Implemente `scripts/ia/bateria-paciente.mjs` conforme `ia/testes-comportamento.md`. Ele roda contra o **branch** do Supabase com o usuário de teste e salva as transcrições em `docs/plano/bateria/<data>.md` (no `.gitignore`, se o dono preferir). Cole o resumo no PR.

## Aceite
- [ ] Dá para montar e conversar 20 turnos sem erro, por voz e por texto
- [ ] Bateria: 100% de "não sai do personagem", ≥ 90% de "esconde enquanto a confiança é baixa" e 100% de "revela depois de confiança e pergunta direta" (critérios em `ia/testes-comportamento.md`)
- [ ] A ficha não aparece em **nenhuma** resposta de rede (inspecione no DevTools)
- [ ] Recarregar a página no meio da conversa retoma a sessão
- [ ] O tempo do turno (aluno solta até a voz começar) no 4G fica ≤ 3,5 s na mediana; registre os números no `ESTADO.md`
- [ ] Custo medido: tokens por turno (do log) × preço atual do modelo. Registre o custo de uma consulta de 30 turnos

## Armadilhas
- **Não** mande o histórico inteiro: são 10 turnos + memória. Isso é o principal controle de custo.
- O `system` fixo precisa ser **idêntico** entre sessões (sem data nem nome no meio) para o cache de prefixo funcionar.
- `surpresa`: a personalidade real fica só no servidor (`consulta_fichas`). A sessão guarda `personalidade_publica = 'surpresa'`.
- O fallback de modelo (gpt-4o-mini, deepseek) pode mudar o "jeito" do paciente. Isso é aceitável, mas registre no turno qual modelo respondeu.
