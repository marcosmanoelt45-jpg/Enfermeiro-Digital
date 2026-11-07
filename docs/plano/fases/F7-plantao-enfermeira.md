# F7 — Plantão com a Enfermeira

**Branch:** `feat/cenas-f7-plantao` · **Depende de:** F2 e F5 · **Risco:** médio · **Tamanho:** grande. Faça em duas sessões: 7.1–7.3 (dados e prontuário) e 7.4–7.7 (cena e avaliação).
**Objetivo:** a enfermeira do próximo turno faz perguntas em ordem SBAR. O aluno responde consultando um prontuário desenhado e completa as lacunas com minijogos.

## Ler
- `00-contexto.md`, `ESTADO.md`, este arquivo · `01-contratos.md` §C11 e §C13 · `03-design.md` §3, §7 e §8
- `ia/avaliador-plantao.md` (prompt pronto)
- `src/data/sbarHandoffScenarios.js` linhas 1–60 (um cenário completo) + `Grep` por `id: "` (lista de ids)
- `src/lib/vitalsParser.js` (inteiro, cerca de 280 linhas) · `docs/auditoria/sbar-audio.md`: achados `sbar-audio-1` e os de `vitalsParser`
- `src/components/ClinicalGapRadar.jsx` (reserva das lacunas)
- `src/features/minijogos/dados/index.js` (exames disponíveis)

## Não ler
`SbarHandoffLab.jsx` (a página nova é independente; a antiga continua até a F8).

## Etapas

### 7.1 Parser de sinais vitais testado e corrigido
Antes de usar, escreva `src/lib/vitalsParser.test.mjs` (se o arquivo usar `@/`, troque por import relativo) com pelo menos 40 casos reais de fala:
- "PA doze por oito" → 120/80
- "pressão cento e trinta por noventa" → 130/90
- "12x8" → 120/80
- "FC 98", "frequência cardíaca de noventa e oito", "pulso 98"
- "saturando 92", "sat 92% em ar ambiente", "SpO2 de 89 com cateter a 2 litros"
- "FR 24", "respirando 24 por minuto"
- "temperatura 38 e meio", "Tax 37,8"
- "dor 6 de 10", "EVA 6"
- **negativos:** "paciente", "palpação" e "administrado" não geram valores

Corrija o parser até passar, sem mudar a assinatura pública: `parseVitalsFromTranscript` é usado em outros lugares.

### 7.2 Dados dos cenários (§C13)
- Acrescente `lacunas` e `perguntas` aos 20 cenários **sem** remover campos.
- **Como fazer:**
  - **5 cenários completos primeiro,** escritos pelo modelo principal com cuidado clínico: `pos_op`, `icc` e mais 3 de setores diferentes;
  - depois, **subagente sonnet** para os outros 15, seguindo os 5 como modelo;
  - por fim, revisão do modelo principal.
- **Regras de conteúdo:**
  - **Perguntas:** 6–9 por cenário, cobrindo S, B, A e R, curtas e naturais ("Ele tá com dreno? Quanto saiu?"). Cada uma tem `espera.tipo` (`numero` com `campos`, ou `texto`).
  - **Lacunas:** 2–3 por cenário. Use minijogos existentes (`ausculta-pulmonar`, `contar-fr`, `bandeja`…) e, quando não houver, o `gapKey` da semiologia. Cada lacuna precisa ter **pelo menos uma pergunta** que dependa dela.
  - O `valorEsperado` da lacuna precisa ser coerente com o `goldenSbar`.
  - `elementosChave` por letra (3–6 itens curtos), extraídos do `goldenSbar` e usados pelo avaliador (`ia/avaliador-plantao.md`). Perguntas que dependem de lacuna levam `dependeDe: <campo>`.
- Falas da enfermeira em `src/data/falas/enfermeira-ana.json`:
  - `plt.<cenario>.<pergunta>`;
  - reações comuns: `plt.r.ok.1..6`, `plt.r.faltou_numero.1..3` ("E a pressão, quanto tava?"), `plt.r.nao_avaliou.1..3` ("Ué, não auscultou ele?"), `plt.r.encerrar.1..2`;
  - abertura: `plt.abertura.1..3`.
- **Teste** `sbarCenarios.test.mjs`:
  - todo cenário com `lacunas` tem pelo menos uma pergunta com `dependeDe` apontando para cada lacuna;
  - todo cenário tem `elementosChave` com 3–6 itens em cada letra;
  - todo `minijogo` existe no registro e todo `gapKey` existe na semiologia;
  - ids únicos.

### 7.3 Prontuário (`src/features/plantao/componentes/Prontuario.jsx`)
- O componente segue o 03 §8 e é montado a partir do cenário: o cabeçalho e os sinais vitais vêm dos `vitals`; o balanço, os dispositivos e a evolução vêm do `clinicalSummary` + `goldenSbar.assessment` (texto); a prescrição, da recomendação.
- Os campos das `lacunas` aparecem como chip "?" até serem preenchidos. Tocar abre o `MinijogoRunner modo="plantao"` numa folha, ou o `ClinicalGapRadar` quando for `gapKey`. O `achado` preenche o campo.
- No celular, fica numa folha inferior aberta pela ação "Prontuário" da cena (com um badge contando as lacunas abertas). No desktop (≥ lg), é a 3ª coluna.

### 7.4 Cena (`PlantaoPage.jsx`, flag `plantaoVivo`)
- Escolha do cenário: cards com setor, leito, diagnóstico e o selo da dificuldade (por número de lacunas).
- `CenaAoVivo` com `enfermeira-ana`: `falasIniciais` = abertura. A ação "Prontuário" fica no slot de ações.
- **Ciclo por pergunta**, numa máquina pequena em `plantao/logica/roteiro.js`, testada:
  1. a enfermeira faz a pergunta (fala fixa);
  2. o aluno responde (voz ou texto);
  3. se `espera.tipo === 'numero'`, o código confere os campos com `vitalsParser` contra o cenário (tolerância: PA ±5, FC ±5, FR ±2, SpO2 ±1, Tax ±0,2);
  4. se a pergunta depende de lacuna **não preenchida**, a reação é `nao_avaliou` e a resposta é marcada "sem avaliação";
  5. se faltar número, a reação é `faltou_numero` e há **uma** chance de complementar;
  6. a resposta de texto é guardada para a avaliação final;
  7. segue para a próxima pergunta.
- **Sem IA por turno.** A resposta do aluno fica registrada e a enfermeira só usa falas fixas.

### 7.5 Ação `avaliar_plantao` (em `cena-ia`)
- `consumirCota('avaliacao', 10)`. Entrada: `cenarioId` + as respostas `[{perguntaId, letra, texto, conferenciaNumerica}]`. O servidor carrega o cenário de `_shared/dados/sbar.js`, uma cópia enxuta gerada por `scripts/plantao/exportar-cenarios.mjs`, com um teste que confere se está sincronizada com o original.
- LLM com o prompt `ia/avaliador-plantao.md`: JSON, `temperature 0.2`, `maxTokens 1000`. As citações são validadas como na F4.
- **A nota numérica de cada letra combina** 50% de código (números e lacunas) e 50% de IA (texto). Se a IA falhar, a nota sai só por código, com aviso.

### 7.6 Relatório SBAR
4 cartões (S, B, A, R), cada um com a nota (`AnimatedProgress`), o que foi bem, o que faltou (com o trecho do `goldenSbar` correspondente) e a dica de `educationalPointers`. Depois, as lacunas: preenchidas ou não, e o resultado dos minijogos. Confete com nota ≥ 70.

### 7.7 Histórico e pontos
`moduleType: 'plantao_vivo'`.

## Aceite
- [ ] Os 40 ou mais casos do `vitalsParser` passam; "paciente" não gera sinal vital
- [ ] Plantão completo só por texto e só por voz
- [ ] Lacuna não preenchida provoca a reação certa; preenchida pelo minijogo, aparece no prontuário
- [ ] Sem IA, o relatório sai só por código
- [ ] Os testes de cenários passam nos 20

## Armadilhas
- O `sbarSpeechMatcher` **não** é usado na página nova (é o `sbar-audio-1`). A página antiga não é tocada.
- Os cenários são usados também pela página antiga: só **acrescente** campos.
