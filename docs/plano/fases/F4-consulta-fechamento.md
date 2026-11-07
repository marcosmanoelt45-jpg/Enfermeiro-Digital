# F4 — Consulta ao Vivo: registro, avaliação e relatório

**Branch:** `feat/cenas-f4-relatorio` · **Depende de:** F3 (e F5 para o "Examinar", que é opcional) · **Risco:** médio · **Tamanho:** médio
**Objetivo:** fechar a consulta com o registro de enfermagem e devolver um relatório justo: o que foi descoberto, o que o paciente escondeu e como perguntar, comunicação com citações reais e raciocínio.

## Ler
- `00-contexto.md`, `ESTADO.md`, este arquivo · `01-contratos.md` §C7, C8 e C10 · `03-design.md` §5 e §7
- `ia/avaliador-consulta.md` (prompt pronto)
- `src/components/NandaSearchBar.jsx` (inteiro; confira se depende do Base44 e, se depender, use `searchNandaCatalog` direto)
- `src/services/clinicalHistoryService.js` linhas 36–60 e 150–240 · `src/services/clinicalGamificationService.js` linhas 640–700
- `src/data/simuladorCasosData.js`: **só** `Grep` por `export function embaralharQuestao` e a estrutura de **uma** questão (±40 linhas), para o quiz D7
- `src/features/minijogos/dados/index.js` (se a F5 já existir) para saber quais exames estão disponíveis

## Etapas

### 4.1 Pontuação por código
`supabase/functions/_shared/logica/pontuacao.js` com as fórmulas de §C10. Testes:
- 0 fatos revelados → anamnese 0;
- todos revelados → 100;
- pesos respeitados;
- segurança: as 3 combinações;
- `raciocinio` nunca negativo;
- `geral` arredondado.

### 4.2 Ação `finalizar_consulta` (em `cena-ia`)
1. `consumirCota('avaliacao', 10)`; a sessão precisa estar `ativa` e pertencer ao usuário.
2. Valida o `registro` com zod (`achados` ≤ 1500 caracteres, até 6 diagnósticos e 8 intervenções). Os códigos NANDA são validados por `nanda-codigos.js` e os inválidos, descartados.
3. Calcula por código: cobertura, segurança, diagnósticos certos, faltando e extras.
4. LLM avaliador (`ia/avaliador-consulta.md`): JSON, `temperature 0.2`, `maxTokens 1200` e timeout de 25 s. A entrada é a ficha + os turnos numerados + o registro + o que o código já calculou. **Valide as citações:** cada `ordem` precisa existir e o `trecho` precisa estar contido (sem diferenciar maiúsculas de minúsculas, depois de normalizar espaços) no texto daquele turno do **aluno**. Citação inválida é descartada.
5. Se a IA falhar, o relatório sai **sem** a parte de comunicação (`comunicacao: null`) e com o aviso "A avaliação de comunicação ficou indisponível". O resto é por código e sempre sai.
6. Para cada fato não revelado, `porque` é gerado pelo código, a partir da regra e da confiança final. Exemplos: "Precisava de mais confiança (chegou a 45, eram necessários 60)" ou "Você não perguntou sobre medicações".
7. Salva o `relatorio`, marca a sessão como `encerrada` e devolve o relatório.

### 4.3 Tela de registro (`consulta/componentes/RegistroConsulta.jsx`)
- "O que você encontrou": Textarea com microfone (reaproveite o `ControleFala` em modo ditado).
- "Diagnósticos de enfermagem": `NandaSearchBar` (ou a busca direta) em chips removíveis.
- "Intervenções": lista com "+ adicionar" e 3 sugestões rápidas genéricas (não as esperadas, para não dar a resposta).
- "Examinar" (aparece só se houver `examesDisponiveis` com minijogo existente): abre o `MinijogoRunner` (F5) em folha. O resultado entra em `registro.examesFeitos`, e o achado do minijogo é acrescentado aos achados.
- `Button size="xl"` "Ver relatório" (loading de até 25 s com o Goti `thinking`).

### 4.4 Relatório (`consulta/componentes/RelatorioConsulta.jsx`)
De cima para baixo:
1. **Nota geral** (`AnimatedNumber`) e 4 barras (`AnimatedProgress`): Anamnese, Comunicação, Segurança e Raciocínio. Confete se `geral ≥ 70`.
2. **"Quem era o paciente":** personalidade revelada (importante na Surpresa) + gráfico de linha simples da confiança (SVG inline com 2 cores do tema, sem biblioteca nova).
3. **"O que o paciente escondeu":** cartões com o fato, o motivo e um Chip "Pergunta que funcionaria" com `perguntaQueRevela`. Os fatos de peso 3 vêm primeiro, com `tone="danger"`.
4. **"O que você descobriu":** lista compacta.
5. **Comunicação:** pontos fortes e o que melhorar, cada um com a citação ("No turno 4 você disse: '…'") e uma sugestão.
6. **Raciocínio:** diagnósticos certos, faltando e extras, mais o comentário.
7. Ações: "Rever conversa" (folha com o histórico completo, vindo do servidor), "Nova consulta" e "Voltar ao início". Se D7 estiver ativo: "Fixar com 3 questões" abre o quiz.

### 4.5 Histórico e pontos
- `MODULE_TYPES.CONSULTA = 'consulta'` e `MODULE_LABELS.consulta = 'Consulta ao Vivo'`.
- `submitActivity({ id: sessaoId, moduleType: 'consulta', title: '<Nome> · <tema>', patientInfo: {nome, idade, personalidade}, durationSeconds, score: geral, evaluation: relatorio.notas, userId })`.
- `clinicalGamificationService.recordActivity('consulta', null, userId, { activityId: sessaoId })`. Se `recordActivity` usa um mapa de XP por tipo, acrescente `consulta: 40`.
- O histórico do Perfil (`HistoricoAtividadesTab`) abre `/consulta/relatorio/:sessaoId` (rota nova, que busca o relatório no servidor).

### 4.6 Quiz opcional (D7)
- `consulta/logica/quizDoTema.js`: escolhe 3 questões de `CASOS_SIMULADOR` pelo tema (por `categoria`/`topico`; confira o campo no Grep) usando `embaralharQuestao`.
- Mostre com o `PlurallQuestionCard` existente **se** ele funcionar isolado (props simples). Senão, crie um card mínimo. **Não importe** `Videochamada.jsx`.

## Aceite
- [ ] Relatório completo em ≤ 25 s; sem IA, o relatório parcial sai mesmo assim
- [ ] Nenhuma citação inventada (teste: altere o texto de um turno no banco do branch e confira se a citação some)
- [ ] O histórico do Perfil mostra a consulta e reabre o relatório
- [ ] "Rever conversa" funciona após encerrar; a ficha nunca vai ao cliente **antes** de encerrar (depois, só os fatos via relatório)
- [ ] Testes de `pontuacao.js` passam

## Armadilhas
- O avaliador recebe a ficha **inteira**. O paciente recebe a ficha **sem** `diagnosticosEsperados`, `intervencoesEsperadas` e `perguntaQueRevela`, para não vazar a resposta na fala. São prompts diferentes: não misture.
- Não dê nota de comunicação por número de turnos; a rubrica está no prompt.
