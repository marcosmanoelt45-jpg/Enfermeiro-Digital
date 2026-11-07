# F6 — Cálculo com o Médico

**Branch:** `feat/cenas-f6-calculo` · **Depende de:** F2 · **Risco:** médio (segurança do paciente na matemática) · **Tamanho:** médio
**Objetivo:** o médico dita a prescrição, o aluno calcula num teclado 3D ou por voz e o médico reage. Toda a matemática é feita e verificada por código, e as falas são fixas (VoiceBox).

## Ler
- `00-contexto.md`, `ESTADO.md`, este arquivo · `01-contratos.md` §C2 e §C12 · `03-design.md` §3 e §7 (Cálculo)
- `docs/auditoria/dosage.md` (inteiro: é verificado, e a matemática é o foco)
- `src/services/proceduralDosageGenerator.js` (312 linhas) · `src/data/dosageProblems.js` linhas 1–80 e um problema completo · `src/services/simuladorFormulaService.js`
- `src/pages/MedicationDosageLab.jsx` linhas 1–60 (fluxo atual) + `Grep` por `answerUnit`

## Etapas

### 6.1 Geradores com semente (sem mudar o comportamento atual)
- `proceduralDosageGenerator.js`: cada gerador aceita `rng = Math.random` opcional. Crie `src/features/calculo/logica/rng.js` com `mulberry32(seed)`.
- **Teste:** com a mesma semente, a saída é idêntica; sem semente, o comportamento é o mesmo de antes (um smoke test de 100 chamadas sem erro).

### 6.2 Banco fechado (`scripts/calculo/gerar-banco.mjs`)
- Gera cerca de 150 itens (§C12): 20 problemas autorais + cerca de 130 dos geradores, por sementes fixas (`1..N`), com tipos balanceados. Grava em `src/data/calculo/banco.json`.
- Marca cerca de 20% como `erroProposital`, de forma determinística e balanceada entre `dose10x`, `via`, `unidade` e `alergia`.
  - **Exemplos:** heparina 50.000 UI SC no lugar de 5.000; KCl 19,1% EV direto, que **nunca** é em bolus; mg trocado por mcg; dipirona para paciente alérgico (a alergia aparece na receita).
  - Para esses itens, o "correto" é **questionar**, nunca calcular. Por isso `resposta` é `null`.
- Escreve as falas do médico em `src/data/falas/medico-rui.json`:
  - `calc.<id>.enunciado`: a prescrição falada, natural ("Enfermeira, faz 750 de ceftriaxona EV de 12 em 12. Tem frasco de 1 g, dilui em 10");
  - **reações** compartilhadas: `calc.r.acerto.1..6`, `calc.r.erro1.1..4` ("Tem certeza? Confere comigo"), `calc.r.erro2.1..3`, `calc.r.questionou_certo.1..4` ("Boa, você tem razão, eu me confundi. Obrigado"), `calc.r.questionou_sem_motivo.1..3` e `calc.r.pressa.1..3` (modo corrido).
  - Use **subagente sonnet** para redigir as variações e **revise** com `stop-slop`/`humanizer`: médico real, direto, sem jargão de livro.
- Rodar o script duas vezes produz o mesmo arquivo (determinístico).

### 6.3 Verificação independente (o coração da fase)
`src/features/calculo/logica/verificar.test.mjs` **recalcula cada item com fórmulas próprias**, escritas do zero a partir da auditoria (não reaproveite o código do gerador):
- macrogotas: gts/min = V(mL) / (T(h) × 3);
- microgotas: mcgts/min = V / T(h);
- BIC: mL/h = V / T(h);
- 1 mL = 20 gts = 60 mcgts;
- regra de três;
- mg↔mcg↔g;
- % = g/100 mL;
- diluição e rediluição;
- UI.

Para cada item: `|calculado − resposta| ≤ tolerancia` e `casas` coerente com a unidade (gts e mcgts são **inteiros**; mL com 1 casa; mL/h com 1 casa). **Qualquer divergência é bug do banco ou do gerador**: corrija a origem e registre no `ESTADO.md`. Também teste os itens com `erroProposital`: a prescrição precisa estar **de fato** errada pela regra descrita.

### 6.4 Leitura de números falados
`calculo/logica/numerosFalados.js`: `"dois vírgula cinco"` → 2.5; `"dois e meio"` → 2.5; `"sete e meio mililitros"` → `{7.5, 'mL'}`; `"vinte e oito gotas"` → `{28, 'gts/min'}`; `"cento e vinte e cinco"` → 125; `"0,5"`/`"0.5"` → 0.5; `"meio"` → 0.5. Pelo menos 30 casos de teste.

### 6.5 Interface (`src/features/calculo/`)
- `CalculoPage.jsx`, com a flag `calculoMedico`. Com a flag ligada, `/laboratorio-calculos` renderiza a página nova; desligada, a antiga.
- **Escolha de modo:**
  - **Rotina:** 10 prescrições, sem tempo;
  - **Plantão corrido:** 8 prescrições, 90 s cada, e o médico apressa aos 60 s;
  - **Prescrição com erro:** 10 prescrições, das quais 3 ou 4 com erro.
- **Cena** (`CenaAoVivo` com o personagem `medico-rui`, `falasIniciais` = enunciado). Abaixo do palco, a **Receita** (Inset com aparência de receita: fármaco, dose, via, frequência e "Disponível: …"; a fonte tabular nos números).
- **Resposta:**
  - `TecladoCalculo` (3D: dígitos, vírgula e apagar, com `btn-3d-outline`) + chip de unidade (fixo, de `item.unidade`) + "Conferir";
  - **ou** voz pelo `useFalaAluno` + `numerosFalados`;
  - botão `Button variant="warning"` "Questionar prescrição", que abre uma folha com os motivos (os 4 tipos + "Outro"). Escolher o motivo certo conta como acerto.
- **Fluxo de tentativa:** 1º erro → reação `erro1` + `shake` + nova tentativa. 2º erro → reação `erro2` + memória de cálculo passo a passo (Inset com os passos em sequência e `listStagger`).
  - Questionar uma prescrição correta → reação "Está certa, pode fazer" + 1 erro.
  - Calcular uma prescrição com erro → o médico diz "Espera… você ia fazer isso mesmo?" + explicação + erro **grave** (marcado no resultado).
- **Resultado da rodada:** acertos, de primeira, erros graves (em destaque, `tone="danger"`) e tempo médio. Confete com 5 acertos de primeira seguidos.

### 6.6 Histórico e pontos
`moduleType: 'calculo_medico'`, com `evaluation: { acertos, primeira, graves }`.

## Aceite
- [ ] `verificar.test.mjs` passa nos cerca de 150 itens
- [ ] `numerosFalados` passa nos 30 ou mais casos
- [ ] Nenhuma prescrição com erro aceita cálculo como correto
- [ ] Unidade sempre correta ao lado da resposta
- [ ] Funciona sem os mp3, pela voz do navegador; com o `gerar-falas.mjs` rodado, usa a voz do VoiceBox
- [ ] A página antiga continua acessível com a flag desligada

## Armadilhas
- Vírgula decimal: o teclado **sempre** usa vírgula na tela; converta para ponto só na lógica.
- Arredondamento: compare com tolerância, nunca por igualdade de string.
- Não gere prescrições perigosas **sem** marcar como `erroProposital`: o teste 6.3 garante isso.
